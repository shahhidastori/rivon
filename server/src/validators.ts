import { BookingStatus, PaymentMethod, PaymentStatus, RoomStatus } from "@prisma/client";
import { z } from "zod";

export const analyticsEventTypes = [
  "page_view",
  "landing_page_view",
  "room_listing_view",
  "room_detail_view",
  "booking_started",
  "booking_preview_view",
  "guest_details_view",
  "payment_step_view",
  "booking_completed",
  "booking_cancelled",
  "booking_abandoned"
] as const;

const analyticsMetadataSchema = z.record(z.unknown()).optional().default({});
const receiptUrlSchema = z
  .string()
  .trim()
  .max(500)
  .refine((value) => !value || /^\/uploads\/receipts\/[a-z0-9-]+\.(jpe?g|png|webp|gif|pdf)$/i.test(value), {
    message: "Receipt URL is invalid."
  })
  .optional()
  .default("");

const urlSchema = z
  .string()
  .trim()
  .min(1)
  .max(2000)
  .refine(
    (value) =>
      !value ||
      value.startsWith("/") ||
      /^data:image\/(png|jpe?g|webp|gif);base64,/i.test(value) ||
      value.startsWith("https://") ||
      (process.env.NODE_ENV !== "production" && value.startsWith("http://")),
    { message: "URL must be relative, HTTPS, or an allowed image data URL." }
  );

const optionalUrlSchema = urlSchema.optional().nullable();

export const analyticsContextSchema = z.object({
  pageUrl: z.string().max(500).optional().default(""),
  pageName: z.string().max(120).optional().default(""),
  sessionId: z.string().max(120).optional().default(""),
  visitorId: z.string().max(120).optional().default(""),
  userId: z.string().max(120).optional().default(""),
  roomId: z.string().max(120).optional().default(""),
  deviceType: z.string().max(40).optional().default(""),
  browser: z.string().max(80).optional().default(""),
  referrer: z.string().max(500).optional().default(""),
  metadata: analyticsMetadataSchema
});

export const analyticsEventSchema = analyticsContextSchema.extend({
  eventType: z.enum(analyticsEventTypes),
  bookingId: z.string().max(120).optional().default("")
});

export const analyticsQuerySchema = z.object({
  range: z.enum(["today", "7d", "30d", "month", "custom"]).optional().default("7d"),
  startDate: z.string().optional().default(""),
  endDate: z.string().optional().default("")
});

export const publicBookingSchema = z.object({
  roomId: z.string().min(1),
  checkIn: z.string().min(1),
  checkOut: z.string().min(1),
  guests: z.coerce.number().int().min(1).max(12),
  customer: z.object({
    firstName: z.string().trim().min(2).max(60),
    lastName: z.string().trim().min(2).max(60),
    email: z.string().email(),
    phone: z.string().trim().min(6).max(30),
    country: z.string().trim().max(80).optional().default("")
  }),
  paymentMethod: z.nativeEnum(PaymentMethod),
  specialRequests: z.string().trim().max(1000).optional().default(""),
  receiptUrl: receiptUrlSchema,
  analytics: analyticsContextSchema.optional()
});

export const bookingLookupSchema = z.object({
  reference: z.string().trim().min(3).max(60),
  email: z.string().email(),
  analytics: analyticsContextSchema.optional()
});

export const roomSchema = z.object({
  name: z.string().trim().min(2).max(120),
  type: z.string().trim().min(2).max(80),
  description: z.string().trim().min(10).max(5000),
  pricePerNight: z.coerce.number().int().min(1),
  beds: z.coerce.number().int().min(1),
  capacity: z.coerce.number().int().min(1),
  sizeSqm: z.coerce.number().int().min(1).optional().nullable(),
  status: z.nativeEnum(RoomStatus).default("AVAILABLE"),
  featured: z.coerce.boolean().default(false),
  hideFromWebsite: z.coerce.boolean().default(false),
  amenities: z.array(z.string().min(2)).default([]),
  images: z
    .array(
      z.object({
        id: z.string().optional(),
        url: urlSchema,
        alt: z.string().trim().max(180).optional().default(""),
        isPrimary: z.boolean().default(false),
        sortOrder: z.number().int().default(0)
      })
    )
    .default([])
});

export const adminBookingSchema = publicBookingSchema.extend({
  status: z.nativeEnum(BookingStatus).default("PENDING"),
  paymentStatus: z.nativeEnum(PaymentStatus).default("UNPAID"),
  source: z.string().default("admin")
});

export const bookingStatusSchema = z.object({
  status: z.nativeEnum(BookingStatus).optional(),
  paymentStatus: z.nativeEnum(PaymentStatus).optional()
});

const optionalPasswordField = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  z.string().optional()
);

export const adminProfileSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(120),
  currentPassword: optionalPasswordField,
  newPassword: optionalPasswordField.refine((value) => !value || value.length >= 8, {
    message: "New password must be at least 8 characters."
  })
});

export const cmsSectionSchema = z.object({
  title: z.string().trim().min(1).max(160),
  subtitle: z.string().trim().max(240).optional().nullable(),
  body: z.string().max(20000).optional().nullable(),
  imageUrl: optionalUrlSchema,
  metadataJson: z.string().max(30000).optional().nullable()
});

export const cmsPageSchema = z.object({
  title: z.string().trim().min(1).max(160),
  content: z.string().min(1).max(30000),
  metadataJson: z.string().max(30000).optional().nullable()
});
