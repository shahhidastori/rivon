import type { BookingStatus, PaymentStatus, Prisma, RoomStatus } from "@prisma/client";
import { addDays, differenceInCalendarDays, isBefore, parseISO } from "date-fns";

export const activeBookingStatuses: BookingStatus[] = ["PENDING", "CONFIRMED", "CHECKED_IN"];

export function parseDate(value: string, label: string) {
  const parsed = parseISO(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`${label} is not a valid date`);
  }
  return parsed;
}

export function calculateNights(checkIn: Date, checkOut: Date) {
  const nights = differenceInCalendarDays(checkOut, checkIn);
  if (nights < 1) {
    throw new Error("Check-out must be after check-in");
  }
  return nights;
}

export function canCancelBooking(status: BookingStatus, checkIn: Date) {
  if (!["PENDING", "CONFIRMED"].includes(status)) return false;
  return isBefore(addDays(new Date(), 1), checkIn);
}

export function generateReference() {
  const stamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `RVN-${stamp}-${random}`;
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

export function parseMetadata<T>(value?: string | null, fallback?: T): T | undefined {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

type RoomWithRelations = Prisma.RoomGetPayload<{
  include: {
    images: true;
    amenities: { include: { amenity: true } };
  };
}>;

export function serializeRoom(room: RoomWithRelations) {
  return {
    ...room,
    amenities: room.amenities.map((item) => item.amenity),
    images: [...room.images].sort((a, b) => a.sortOrder - b.sortOrder)
  };
}

export function serializeBooking(
  booking: Prisma.BookingGetPayload<{
    include: {
      customer: true;
      room: { include: { images: true; amenities: { include: { amenity: true } } } };
      payments: true;
    };
  }>
) {
  return {
    ...booking,
    canCancel: canCancelBooking(booking.status, booking.checkIn),
    room: serializeRoom(booking.room)
  };
}

export function normalizeStatus(value?: string): RoomStatus | undefined {
  if (!value) return undefined;
  const upper = value.toUpperCase() as RoomStatus;
  return ["AVAILABLE", "OCCUPIED", "MAINTENANCE", "UNAVAILABLE"].includes(upper) ? upper : undefined;
}

export function normalizePaymentStatus(value?: string): PaymentStatus | undefined {
  if (!value) return undefined;
  const upper = value.toUpperCase() as PaymentStatus;
  return ["UNPAID", "PAID", "PARTIALLY_PAID", "REFUNDED"].includes(upper) ? upper : undefined;
}
