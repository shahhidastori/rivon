import { BookingStatus, PaymentMethod, PaymentStatus, RoomStatus } from "@prisma/client";
import { z } from "zod";

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
  receiptUrl: z.string().optional().default("")
});

export const bookingLookupSchema = z.object({
  reference: z.string().min(3),
  email: z.string().email()
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
