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
    firstName: z.string().min(2),
    lastName: z.string().min(2),
    email: z.string().email(),
    phone: z.string().min(6),
    country: z.string().optional().default("")
  }),
  paymentMethod: z.nativeEnum(PaymentMethod),
  specialRequests: z.string().optional().default(""),
  receiptUrl: z.string().optional().default(""),
  analytics: analyticsContextSchema.optional()
});

export const bookingLookupSchema = z.object({
  reference: z.string().min(3),
  email: z.string().email(),
  analytics: analyticsContextSchema.optional()
});

export const roomSchema = z.object({
  name: z.string().min(2),
  type: z.string().min(2),
  description: z.string().min(10),
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
        url: z.string().min(1),
        alt: z.string().optional().default(""),
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

export const cmsSectionSchema = z.object({
  title: z.string().min(1),
  subtitle: z.string().optional().nullable(),
  body: z.string().optional().nullable(),
  imageUrl: z.string().optional().nullable(),
  metadataJson: z.string().optional().nullable()
});

export const cmsPageSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
  metadataJson: z.string().optional().nullable()
});
