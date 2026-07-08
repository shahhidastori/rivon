import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Router } from "express";
import multer from "multer";
import { BookingStatus, PaymentMethod, PaymentStatus, Prisma } from "@prisma/client";
import { prisma } from "../db.js";
import { recordAnalyticsEvent } from "../analytics.js";
import { buildAnalyticsReport } from "../analytics-report.js";
import { uploadLimiter } from "../security.js";
import {
  assertSafeUploadedFile,
  imageUploadMimeTypes,
  isAllowedUploadMime,
  safeUploadFilename
} from "../uploads.js";
import {
  activeBookingStatuses,
  calculateNights,
  generateUniqueReference,
  normalizePaymentStatus,
  normalizeStatus,
  parseDate,
  parseMetadata,
  serializeBooking,
  serializeRoom,
  slugify
} from "../utils.js";
import {
  adminBookingSchema,
  analyticsQuerySchema,
  bookingStatusSchema,
  cmsPageSchema,
  cmsSectionSchema,
  roomSchema
} from "../validators.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.resolve(__dirname, "../../uploads");

fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    try {
      cb(null, safeUploadFilename(imageUploadMimeTypes, file.mimetype, "image"));
    } catch (error) {
      cb(error instanceof Error ? error : new Error("Unsupported image upload type."), "");
    }
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024, files: 1, fields: 0, parts: 2 },
  fileFilter: (_req, file, cb) => {
    if (!isAllowedUploadMime(imageUploadMimeTypes, file.mimetype)) {
      cb(new Error("Only image uploads are allowed."));
      return;
    }
    cb(null, true);
  }
});

export const adminRouter = Router();

const roomInclude = {
  images: true,
  amenities: { include: { amenity: true } }
} as const;

const bookingInclude = {
  customer: true,
  room: { include: roomInclude },
  payments: true
} as const;

async function syncRoomRelations(
  tx: Prisma.TransactionClient,
  roomId: string,
  amenities: string[],
  images: Array<{ url: string; alt?: string; isPrimary?: boolean; sortOrder?: number }>
) {
  await tx.roomAmenity.deleteMany({ where: { roomId } });

  for (const name of amenities) {
    const trimmed = name.trim();
    if (!trimmed) continue;
    const amenity = await tx.amenity.upsert({
      where: { name: trimmed },
      update: {},
      create: { name: trimmed }
    });
    await tx.roomAmenity.create({
      data: { roomId, amenityId: amenity.id }
    });
  }

  await tx.roomImage.deleteMany({ where: { roomId } });
  if (images.length > 0) {
    await tx.roomImage.createMany({
      data: images.map((image, index) => ({
        roomId,
        url: image.url,
        alt: image.alt || "",
        isPrimary: image.isPrimary ?? index === 0,
        sortOrder: image.sortOrder ?? index
      }))
    });
  }
}

async function ensureUniqueSlug(name: string, existingRoomId?: string) {
  const base = slugify(name);
  let slug = base;
  let suffix = 2;

  while (true) {
    const match = await prisma.room.findUnique({ where: { slug } });
    if (!match || match.id === existingRoomId) return slug;
    slug = `${base}-${suffix}`;
    suffix += 1;
  }
}

async function createBooking(payload: ReturnType<typeof adminBookingSchema.parse>) {
  const checkIn = parseDate(payload.checkIn, "Check-in");
  const checkOut = parseDate(payload.checkOut, "Check-out");
  const nights = calculateNights(checkIn, checkOut);

  const room = await prisma.room.findUnique({
    where: { id: payload.roomId },
    include: roomInclude
  });

  if (!room) throw new Error("Selected room does not exist.");
  if (payload.guests > room.capacity) throw new Error("Guest count exceeds room capacity.");

  const conflicts = await prisma.booking.count({
    where: {
      roomId: room.id,
      status: { in: activeBookingStatuses },
      checkIn: { lt: checkOut },
      checkOut: { gt: checkIn }
    }
  });

  if (conflicts > 0) throw new Error("The selected room is not available for those dates.");

  const totalAmount = nights * room.pricePerNight;

  return prisma.$transaction(async (tx) => {
    const reference = await generateUniqueReference(async (candidate) => {
      const match = await tx.booking.findUnique({ where: { reference: candidate }, select: { id: true } });
      return Boolean(match);
    });

    const customer = await tx.customer.create({
      data: {
        firstName: payload.customer.firstName,
        lastName: payload.customer.lastName,
        email: payload.customer.email.toLowerCase(),
        phone: payload.customer.phone,
        country: payload.customer.country
      }
    });

    return tx.booking.create({
      data: {
        reference,
        customerId: customer.id,
        roomId: room.id,
        checkIn,
        checkOut,
        guests: payload.guests,
        status: payload.status,
        paymentStatus: payload.paymentStatus,
        source: payload.source,
        totalAmount,
        specialRequests: payload.specialRequests,
        payments: {
          create: {
            method: payload.paymentMethod,
            amount: payload.paymentStatus === PaymentStatus.PAID ? totalAmount : 0,
            status: payload.paymentStatus === PaymentStatus.PAID ? "CAPTURED" : "PENDING",
            paidAt: payload.paymentStatus === PaymentStatus.PAID ? new Date() : null,
            notes: payload.paymentMethod === PaymentMethod.CASH ? "Manual cash booking." : "Manual booking."
          }
        }
      },
      include: bookingInclude
    });
  });
}

adminRouter.post("/uploads", uploadLimiter, upload.single("image"), async (req, res, next) => {
  try {
    await assertSafeUploadedFile(req.file, imageUploadMimeTypes, "Image");
    res.status(201).json({
      url: `/uploads/${req.file!.filename}`,
      filename: req.file!.filename
    });
  } catch (error) {
    next(error);
  }
});

adminRouter.get("/dashboard", async (_req, res, next) => {
  try {
    const [totalBookings, pendingBookings, confirmedBookings, availableRooms, rooms, recentBookings] =
      await Promise.all([
        prisma.booking.count(),
        prisma.booking.count({ where: { status: "PENDING" } }),
        prisma.booking.count({ where: { status: "CONFIRMED" } }),
        prisma.room.count({ where: { status: "AVAILABLE" } }),
        prisma.room.count(),
        prisma.booking.findMany({
          include: bookingInclude,
          orderBy: { createdAt: "desc" },
          take: 6
        })
      ]);

    const activeBookings = await prisma.booking.count({
      where: { status: { in: ["CONFIRMED", "CHECKED_IN"] } }
    });

    const paid = await prisma.payment.aggregate({
      where: { status: "CAPTURED" },
      _sum: { amount: true }
    });

    const expected = await prisma.booking.aggregate({
      where: { status: { not: "CANCELLED" } },
      _sum: { totalAmount: true }
    });

    res.json({
      totalBookings,
      pendingBookings,
      confirmedBookings,
      availableRooms,
      occupancyRate: rooms === 0 ? 0 : Math.round((activeBookings / rooms) * 100),
      revenue: {
        paid: paid._sum.amount ?? 0,
        expected: expected._sum.totalAmount ?? 0
      },
      recentBookings: recentBookings.map(serializeBooking)
    });
  } catch (error) {
    next(error);
  }
});

adminRouter.get("/analytics", async (req, res, next) => {
  try {
    const query = analyticsQuerySchema.parse(req.query);
    const analytics = await buildAnalyticsReport(query);
    res.json(analytics);
  } catch (error) {
    next(error);
  }
});

adminRouter.get("/rooms", async (req, res, next) => {
  try {
    const status = normalizeStatus(String(req.query.status || ""));
    const search = String(req.query.search || "").trim();

    const rooms = await prisma.room.findMany({
      where: {
        ...(status ? { status } : {}),
        ...(search
          ? {
              OR: [
                { name: { contains: search } },
                { type: { contains: search } },
                { description: { contains: search } }
              ]
            }
          : {})
      },
      include: roomInclude,
      orderBy: { createdAt: "desc" }
    });

    res.json({ rooms: rooms.map(serializeRoom) });
  } catch (error) {
    next(error);
  }
});

adminRouter.post("/rooms", async (req, res, next) => {
  try {
    const payload = roomSchema.parse(req.body);
    const slug = await ensureUniqueSlug(payload.name);

    const room = await prisma.$transaction(async (tx) => {
      const created = await tx.room.create({
        data: {
          name: payload.name,
          slug,
          type: payload.type,
          description: payload.description,
          pricePerNight: payload.pricePerNight,
          beds: payload.beds,
          capacity: payload.capacity,
          sizeSqm: payload.sizeSqm ?? null,
          status: payload.status,
          featured: payload.featured,
          hideFromWebsite: payload.hideFromWebsite
        }
      });
      await syncRoomRelations(tx, created.id, payload.amenities, payload.images);
      return tx.room.findUniqueOrThrow({ where: { id: created.id }, include: roomInclude });
    });

    res.status(201).json({ room: serializeRoom(room) });
  } catch (error) {
    next(error);
  }
});

adminRouter.patch("/rooms/:id", async (req, res, next) => {
  try {
    const payload = roomSchema.parse(req.body);
    const slug = await ensureUniqueSlug(payload.name, req.params.id);

    const room = await prisma.$transaction(async (tx) => {
      const updated = await tx.room.update({
        where: { id: req.params.id },
        data: {
          name: payload.name,
          slug,
          type: payload.type,
          description: payload.description,
          pricePerNight: payload.pricePerNight,
          beds: payload.beds,
          capacity: payload.capacity,
          sizeSqm: payload.sizeSqm ?? null,
          status: payload.status,
          featured: payload.featured,
          hideFromWebsite: payload.hideFromWebsite
        }
      });
      await syncRoomRelations(tx, updated.id, payload.amenities, payload.images);
      return tx.room.findUniqueOrThrow({ where: { id: updated.id }, include: roomInclude });
    });

    res.json({ room: serializeRoom(room) });
  } catch (error) {
    next(error);
  }
});

adminRouter.delete("/rooms/:id", async (req, res, next) => {
  try {
    const bookingCount = await prisma.booking.count({ where: { roomId: req.params.id } });
    if (bookingCount > 0) {
      const room = await prisma.room.update({
        where: { id: req.params.id },
        data: { status: "UNAVAILABLE" },
        include: roomInclude
      });
      return res.json({
        room: serializeRoom(room),
        message: "Room has booking history, so it was marked unavailable instead of permanently deleted."
      });
    }

    await prisma.room.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

adminRouter.get("/bookings", async (req, res, next) => {
  try {
    const search = String(req.query.search || "").trim();
    const status = String(req.query.status || "").toUpperCase() as BookingStatus;
    const paymentStatus = normalizePaymentStatus(String(req.query.paymentStatus || ""));
    const roomId = String(req.query.roomId || "");
    const date = String(req.query.date || "");

    const where: Prisma.BookingWhereInput = {
      ...(Object.values(BookingStatus).includes(status) ? { status } : {}),
      ...(paymentStatus ? { paymentStatus } : {}),
      ...(roomId ? { roomId } : {}),
      ...(date
        ? {
            checkIn: { lte: parseDate(date, "Date") },
            checkOut: { gt: parseDate(date, "Date") }
          }
        : {}),
      ...(search
        ? {
            OR: [
              { reference: { contains: search } },
              { customer: { firstName: { contains: search } } },
              { customer: { lastName: { contains: search } } },
              { customer: { email: { contains: search } } },
              { room: { name: { contains: search } } }
            ]
          }
        : {})
    };

    const bookings = await prisma.booking.findMany({
      where,
      include: bookingInclude,
      orderBy: { createdAt: "desc" }
    });

    res.json({ bookings: bookings.map(serializeBooking) });
  } catch (error) {
    next(error);
  }
});

adminRouter.post("/bookings", async (req, res, next) => {
  try {
    const payload = adminBookingSchema.parse(req.body);
    const booking = await createBooking(payload);
    void recordAnalyticsEvent(
      {
        eventType: "booking_completed",
        bookingId: booking.id,
        roomId: booking.roomId,
        pageName: "Admin Manual Booking",
        metadata: {
          reference: booking.reference,
          roomName: booking.room.name,
          roomType: booking.room.type,
          checkIn: booking.checkIn.toISOString(),
          checkOut: booking.checkOut.toISOString(),
          guests: booking.guests,
          source: booking.source,
          totalAmount: booking.totalAmount
        }
      },
      req
    ).catch(() => undefined);
    res.status(201).json({ booking: serializeBooking(booking) });
  } catch (error) {
    next(error);
  }
});

adminRouter.get("/bookings/:id", async (req, res, next) => {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: req.params.id },
      include: bookingInclude
    });
    if (!booking) return res.status(404).json({ message: "Booking not found." });
    res.json({ booking: serializeBooking(booking) });
  } catch (error) {
    next(error);
  }
});

adminRouter.patch("/bookings/:id", async (req, res, next) => {
  try {
    const payload = bookingStatusSchema.parse(req.body);
    const previous = await prisma.booking.findUnique({
      where: { id: req.params.id },
      include: bookingInclude
    });
    const booking = await prisma.booking.update({
      where: { id: req.params.id },
      data: {
        ...(payload.status ? { status: payload.status } : {}),
        ...(payload.paymentStatus ? { paymentStatus: payload.paymentStatus } : {})
      },
      include: bookingInclude
    });
    if (payload.status === "CANCELLED" && previous?.status !== "CANCELLED") {
      void recordAnalyticsEvent(
        {
          eventType: "booking_cancelled",
          bookingId: booking.id,
          roomId: booking.roomId,
          pageName: "Admin Booking Management",
          metadata: {
            reference: booking.reference,
            roomName: booking.room.name,
            roomType: booking.room.type,
            status: booking.status,
            source: "admin"
          }
        },
        req
      ).catch(() => undefined);
    }
    res.json({ booking: serializeBooking(booking) });
  } catch (error) {
    next(error);
  }
});

adminRouter.get("/customers", async (req, res, next) => {
  try {
    const search = String(req.query.search || "").trim();
    const customers = await prisma.customer.findMany({
      where: search
        ? {
            OR: [
              { firstName: { contains: search } },
              { lastName: { contains: search } },
              { email: { contains: search } },
              { phone: { contains: search } }
            ]
          }
        : undefined,
      include: {
        bookings: {
          include: {
            room: { include: roomInclude },
            payments: true,
            customer: true
          },
          orderBy: { createdAt: "desc" }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    res.json({
      customers: customers.map((customer) => ({
        ...customer,
        bookings: customer.bookings.map((booking) => ({
          ...booking,
          room: serializeRoom(booking.room)
        }))
      }))
    });
  } catch (error) {
    next(error);
  }
});

adminRouter.get("/customers/:id", async (req, res, next) => {
  try {
    const customer = await prisma.customer.findUnique({
      where: { id: req.params.id },
      include: {
        bookings: {
          include: bookingInclude,
          orderBy: { createdAt: "desc" }
        }
      }
    });

    if (!customer) return res.status(404).json({ message: "Customer not found." });

    res.json({
      customer: {
        ...customer,
        bookings: customer.bookings.map(serializeBooking)
      }
    });
  } catch (error) {
    next(error);
  }
});

adminRouter.get("/cms", async (_req, res, next) => {
  try {
    const [sections, pages] = await Promise.all([
      prisma.cmsSection.findMany({ orderBy: { key: "asc" } }),
      prisma.cmsPage.findMany({ orderBy: { key: "asc" } })
    ]);
    res.json({
      sections: sections.map((section) => ({
        ...section,
        metadata: parseMetadata(section.metadataJson)
      })),
      pages: pages.map((page) => ({
        ...page,
        metadata: parseMetadata(page.metadataJson)
      }))
    });
  } catch (error) {
    next(error);
  }
});

adminRouter.patch("/cms/sections/:key", async (req, res, next) => {
  try {
    const payload = cmsSectionSchema.parse(req.body);
    const section = await prisma.cmsSection.upsert({
      where: { key: req.params.key },
      update: payload,
      create: {
        key: req.params.key,
        title: payload.title,
        subtitle: payload.subtitle,
        body: payload.body,
        imageUrl: payload.imageUrl,
        metadataJson: payload.metadataJson
      }
    });
    res.json({ section: { ...section, metadata: parseMetadata(section.metadataJson) } });
  } catch (error) {
    next(error);
  }
});

adminRouter.patch("/cms/pages/:key", async (req, res, next) => {
  try {
    const payload = cmsPageSchema.parse(req.body);
    const page = await prisma.cmsPage.upsert({
      where: { key: req.params.key },
      update: payload,
      create: {
        key: req.params.key,
        title: payload.title,
        content: payload.content,
        metadataJson: payload.metadataJson
      }
    });
    res.json({ page: { ...page, metadata: parseMetadata(page.metadataJson) } });
  } catch (error) {
    next(error);
  }
});
