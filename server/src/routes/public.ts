import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Request, Response, Router } from "express";
import multer from "multer";
import { BookingStatus, PaymentMethod, PaymentStatus } from "@prisma/client";
import { prisma } from "../db.js";
import {
  activeBookingStatuses,
  calculateNights,
  generateReference,
  parseDate,
  parseMetadata,
  serializeBooking,
  serializeRoom
} from "../utils.js";
import { bookingLookupSchema, publicBookingSchema } from "../validators.js";

export const publicRouter = Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const receiptUploadDir = path.resolve(__dirname, "../../uploads/receipts");

fs.mkdirSync(receiptUploadDir, { recursive: true });

const receiptStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, receiptUploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const base = path
      .basename(file.originalname, ext)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");
    cb(null, `${Date.now()}-${base || "receipt"}${ext}`);
  }
});

const receiptUpload = multer({
  storage: receiptStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith("image/") && file.mimetype !== "application/pdf") {
      cb(new Error("Only image or PDF receipts are allowed."));
      return;
    }
    cb(null, true);
  }
});

const roomInclude = {
  images: true,
  amenities: { include: { amenity: true } }
} as const;

const bookingInclude = {
  customer: true,
  room: { include: roomInclude },
  payments: true
} as const;

function sendCachedJson(req: Request, res: Response, payload: unknown) {
  const body = JSON.stringify(payload);
  const etag = `"${crypto.createHash("sha256").update(body).digest("hex")}"`;
  const clientEtags = String(req.headers["if-none-match"] || "")
    .split(",")
    .map((value) => value.trim());

  res.setHeader("Cache-Control", "public, max-age=0, must-revalidate");
  res.setHeader("ETag", etag);
  res.setHeader("Vary", "Accept-Encoding");

  if (clientEtags.includes(etag)) {
    return res.status(304).end();
  }

  return res.type("application/json").send(body);
}

publicRouter.post("/booking-receipts", receiptUpload.single("receipt"), (req, res) => {
  if (!req.file) return res.status(400).json({ message: "Receipt file is required." });
  res.status(201).json({
    url: `/uploads/receipts/${req.file.filename}`,
    filename: req.file.filename
  });
});

publicRouter.get("/cms", async (req, res, next) => {
  try {
    const [sections, pages] = await Promise.all([
      prisma.cmsSection.findMany({ orderBy: { key: "asc" } }),
      prisma.cmsPage.findMany({ orderBy: { key: "asc" } })
    ]);

    sendCachedJson(req, res, {
      sections: Object.fromEntries(
        sections.map((section) => [
          section.key,
          {
            ...section,
            metadata: parseMetadata(section.metadataJson)
          }
        ])
      ),
      pages: Object.fromEntries(
        pages.map((page) => [
          page.key,
          {
            ...page,
            metadata: parseMetadata(page.metadataJson)
          }
        ])
      )
    });
  } catch (error) {
    next(error);
  }
});

publicRouter.get("/rooms", async (req, res, next) => {
  try {
    const { type, guests, minPrice, maxPrice, checkIn, checkOut, featured } = req.query;
    const where: Record<string, unknown> = { hideFromWebsite: false };

    if (type && String(type) !== "all") where.type = String(type);
    if (guests) where.capacity = { gte: Number(guests) };
    if (minPrice || maxPrice) {
      where.pricePerNight = {
        ...(minPrice ? { gte: Number(minPrice) } : {}),
        ...(maxPrice ? { lte: Number(maxPrice) } : {})
      };
    }
    if (featured === "true") where.featured = true;

    if (checkIn && checkOut) {
      const start = parseDate(String(checkIn), "Check-in");
      const end = parseDate(String(checkOut), "Check-out");
      calculateNights(start, end);
      where.bookings = {
        none: {
          status: { in: activeBookingStatuses },
          checkIn: { lt: end },
          checkOut: { gt: start }
        }
      };
    }

    const rooms = await prisma.room.findMany({
      where,
      include: roomInclude,
      orderBy: [{ featured: "desc" }, { pricePerNight: "asc" }]
    });

    const types = await prisma.room.findMany({
      where: { hideFromWebsite: false },
      distinct: ["type"],
      select: { type: true },
      orderBy: { type: "asc" }
    });

    sendCachedJson(req, res, {
      rooms: rooms.map(serializeRoom),
      filters: { types: types.map((item) => item.type) }
    });
  } catch (error) {
    next(error);
  }
});

publicRouter.get("/rooms/:slug", async (req, res, next) => {
  try {
    const room = await prisma.room.findUnique({
      where: { slug: req.params.slug },
      include: roomInclude
    });

    if (!room || room.hideFromWebsite) return res.status(404).json({ message: "Room not found." });

    sendCachedJson(req, res, { room: serializeRoom(room) });
  } catch (error) {
    next(error);
  }
});

publicRouter.post("/bookings", async (req, res, next) => {
  try {
    const payload = publicBookingSchema.parse(req.body);
    const checkIn = parseDate(payload.checkIn, "Check-in");
    const checkOut = parseDate(payload.checkOut, "Check-out");
    const nights = calculateNights(checkIn, checkOut);

    const room = await prisma.room.findUnique({
      where: { id: payload.roomId },
      include: roomInclude
    });

    if (!room || room.hideFromWebsite || room.status !== "AVAILABLE") {
      return res.status(404).json({ message: "Selected room is not available." });
    }

    if (payload.guests > room.capacity) {
      return res.status(400).json({ message: "Guest count exceeds room capacity." });
    }

    const conflicts = await prisma.booking.count({
      where: {
        roomId: room.id,
        status: { in: activeBookingStatuses },
        checkIn: { lt: checkOut },
        checkOut: { gt: checkIn }
      }
    });

    if (conflicts > 0) {
      return res.status(409).json({ message: "The selected dates are no longer available." });
    }

    const totalAmount = nights * room.pricePerNight;
    const paymentStatus =
      payload.paymentMethod === PaymentMethod.CARD ? PaymentStatus.PAID : PaymentStatus.UNPAID;

    const booking = await prisma.$transaction(async (tx) => {
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
          reference: generateReference(),
          customerId: customer.id,
          roomId: room.id,
          checkIn,
          checkOut,
          guests: payload.guests,
          status: BookingStatus.PENDING,
          paymentStatus,
          totalAmount,
          specialRequests: payload.specialRequests,
          payments: {
            create: {
              method: payload.paymentMethod,
              amount: payload.paymentMethod === PaymentMethod.CARD ? totalAmount : 0,
              status: payload.paymentMethod === PaymentMethod.CARD ? "CAPTURED" : "PENDING",
              paidAt: payload.paymentMethod === PaymentMethod.CARD ? new Date() : null,
              notes:
                payload.paymentMethod === PaymentMethod.BANK_TRANSFER
                  ? [
                      "Guest selected bank transfer; awaiting payment confirmation.",
                      payload.receiptUrl ? `Receipt: ${payload.receiptUrl}` : ""
                    ]
                      .filter(Boolean)
                      .join(" ")
                  : payload.paymentMethod === PaymentMethod.CASH
                    ? "Guest will pay at the property."
                    : "Demo card payment captured."
            }
          }
        },
        include: bookingInclude
      });
    });

    res.status(201).json({ booking: serializeBooking(booking) });
  } catch (error) {
    next(error);
  }
});

publicRouter.post("/bookings/lookup", async (req, res, next) => {
  try {
    const payload = bookingLookupSchema.parse(req.body);
    const booking = await prisma.booking.findFirst({
      where: {
        reference: payload.reference.trim(),
        customer: { email: payload.email.toLowerCase() }
      },
      include: bookingInclude
    });

    if (!booking) return res.status(404).json({ message: "No booking matched those details." });

    res.json({ booking: serializeBooking(booking) });
  } catch (error) {
    next(error);
  }
});

publicRouter.patch("/bookings/:reference/cancel", async (req, res, next) => {
  try {
    const payload = bookingLookupSchema.parse({
      reference: req.params.reference,
      email: req.body.email
    });

    const booking = await prisma.booking.findFirst({
      where: {
        reference: payload.reference,
        customer: { email: payload.email.toLowerCase() }
      },
      include: bookingInclude
    });

    if (!booking) return res.status(404).json({ message: "Booking not found." });
    if (!["PENDING", "CONFIRMED"].includes(booking.status) || booking.checkIn <= new Date(Date.now() + 86400000)) {
      return res.status(400).json({ message: "This booking can no longer be cancelled online." });
    }

    const cancelled = await prisma.booking.update({
      where: { id: booking.id },
      data: { status: "CANCELLED" },
      include: bookingInclude
    });

    res.json({ booking: serializeBooking(cancelled) });
  } catch (error) {
    next(error);
  }
});
