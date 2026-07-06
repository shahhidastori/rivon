import type { AnalyticsEvent } from "@prisma/client";
import { prisma } from "./db.js";
import { parseMetadata } from "./utils.js";

const VIEW_EVENT_TYPES = new Set([
  "page_view",
  "landing_page_view",
  "room_listing_view",
  "room_detail_view",
  "booking_preview_view",
  "guest_details_view",
  "payment_step_view"
]);

const FUNNEL_STAGES = [
  ["landing_page_view", "Landing Page visited"],
  ["room_listing_view", "Room Listing opened"],
  ["room_detail_view", "Room Detail opened"],
  ["booking_started", "Booking started"],
  ["booking_preview_view", "Booking Preview opened"],
  ["guest_details_view", "Guest Details opened"],
  ["payment_step_view", "Payment step opened"],
  ["booking_completed", "Booking completed"],
  ["booking_cancelled", "Booking cancelled"],
  ["booking_abandoned", "Booking abandoned"]
] as const;

type AnalyticsRange = "today" | "7d" | "30d" | "month" | "custom";

type AnalyticsQuery = {
  range: AnalyticsRange;
  startDate?: string;
  endDate?: string;
};

function startOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function endOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(23, 59, 59, 999);
  return next;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function dateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function dayLabel(date: Date) {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(date);
}

function parseDateOnly(value?: string) {
  if (!value) return null;
  const parsed = new Date(`${value}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function resolveRange(query: AnalyticsQuery) {
  const now = new Date();
  const range = query.range || "7d";

  if (range === "today") {
    return { range, start: startOfDay(now), end: endOfDay(now) };
  }

  if (range === "30d") {
    return { range, start: startOfDay(addDays(now, -29)), end: endOfDay(now) };
  }

  if (range === "month") {
    return { range, start: new Date(now.getFullYear(), now.getMonth(), 1), end: endOfDay(now) };
  }

  if (range === "custom") {
    const customStart = parseDateOnly(query.startDate);
    const customEnd = parseDateOnly(query.endDate);
    if (customStart && customEnd && customEnd >= customStart) {
      return { range, start: startOfDay(customStart), end: endOfDay(customEnd) };
    }
  }

  return { range: "7d" as const, start: startOfDay(addDays(now, -6)), end: endOfDay(now) };
}

function eventMetadata(event: AnalyticsEvent) {
  return parseMetadata<Record<string, unknown>>(event.metadataJson, {}) || {};
}

function eventCount(events: AnalyticsEvent[], eventType: string) {
  return events.filter((event) => event.eventType === eventType).length;
}

function percent(numerator: number, denominator: number) {
  if (!denominator) return 0;
  return Math.round((numerator / denominator) * 1000) / 10;
}

function countBy<T extends string>(values: T[]) {
  return values.reduce<Record<string, number>>((accumulator, value) => {
    if (!value) return accumulator;
    accumulator[value] = (accumulator[value] || 0) + 1;
    return accumulator;
  }, {});
}

function toSortedRows(groups: Record<string, number>, limit = 10) {
  return Object.entries(groups)
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

function buildDailySeries(events: AnalyticsEvent[], start: Date, end: Date, eventType: string) {
  const counts = countBy(
    events.filter((event) => event.eventType === eventType).map((event) => dateKey(event.createdAt))
  );
  const series: Array<{ date: string; label: string; count: number; amount?: number }> = [];
  let cursor = startOfDay(start);

  while (cursor <= end) {
    const key = dateKey(cursor);
    series.push({ date: key, label: dayLabel(cursor), count: counts[key] || 0 });
    cursor = addDays(cursor, 1);
  }

  return series;
}

function buildMoneyTrend(events: AnalyticsEvent[], start: Date, end: Date, eventType: string) {
  const buckets = new Map<string, { count: number; amount: number }>();

  for (const event of events.filter((item) => item.eventType === eventType)) {
    const key = dateKey(event.createdAt);
    const metadata = eventMetadata(event);
    const amount = Number(metadata.totalAmount || 0);
    const current = buckets.get(key) || { count: 0, amount: 0 };
    buckets.set(key, { count: current.count + 1, amount: current.amount + (Number.isFinite(amount) ? amount : 0) });
  }

  const series: Array<{ date: string; label: string; count: number; amount: number }> = [];
  let cursor = startOfDay(start);

  while (cursor <= end) {
    const key = dateKey(cursor);
    const bucket = buckets.get(key) || { count: 0, amount: 0 };
    series.push({ date: key, label: dayLabel(cursor), count: bucket.count, amount: bucket.amount });
    cursor = addDays(cursor, 1);
  }

  return series;
}

function getRoomLabel(event: AnalyticsEvent) {
  const metadata = eventMetadata(event);
  return String(metadata.roomName || metadata.roomType || event.pageName || event.roomId || "Unknown room");
}

function buildRoomRows(events: AnalyticsEvent[], eventType: string) {
  const groups = new Map<string, { roomId: string; roomName: string; count: number; amount: number }>();

  for (const event of events.filter((item) => item.eventType === eventType)) {
    const roomId = event.roomId || getRoomLabel(event);
    const metadata = eventMetadata(event);
    const current = groups.get(roomId) || {
      roomId,
      roomName: getRoomLabel(event),
      count: 0,
      amount: 0
    };
    current.count += 1;
    current.amount += Number(metadata.totalAmount || 0);
    groups.set(roomId, current);
  }

  return Array.from(groups.values()).sort((a, b) => b.count - a.count).slice(0, 10);
}

function buildHighViewLowBookingRows(viewRows: ReturnType<typeof buildRoomRows>, bookingRows: ReturnType<typeof buildRoomRows>) {
  const bookingsByRoom = new Map(bookingRows.map((row) => [row.roomId, row.count]));

  return viewRows
    .map((row) => {
      const bookings = bookingsByRoom.get(row.roomId) || 0;
      return {
        roomId: row.roomId,
        roomName: row.roomName,
        views: row.count,
        bookings,
        conversionRate: percent(bookings, row.count)
      };
    })
    .filter((row) => row.views > row.bookings)
    .sort((a, b) => b.views - b.bookings - (a.views - a.bookings))
    .slice(0, 8);
}

function countAbandonedBookings(events: AnalyticsEvent[]) {
  const cutoff = new Date(Date.now() - 30 * 60 * 1000);
  const terminalSessions = new Set(
    events
      .filter((event) => ["booking_completed", "booking_cancelled"].includes(event.eventType) && event.sessionId)
      .map((event) => event.sessionId as string)
  );

  return events.filter((event) => {
    if (event.eventType !== "booking_started") return false;
    if (event.createdAt > cutoff) return false;
    return !event.sessionId || !terminalSessions.has(event.sessionId);
  }).length;
}

export async function buildAnalyticsReport(query: AnalyticsQuery) {
  const { range, start, end } = resolveRange(query);
  const [events, lastSevenLandingEvents] = await Promise.all([
    prisma.analyticsEvent.findMany({
      where: { createdAt: { gte: start, lte: end } },
      orderBy: { createdAt: "asc" }
    }),
    prisma.analyticsEvent.findMany({
      where: {
        eventType: "landing_page_view",
        createdAt: { gte: startOfDay(addDays(new Date(), -6)), lte: endOfDay(new Date()) }
      },
      orderBy: { createdAt: "asc" }
    })
  ]);

  const visitorIds = Array.from(new Set(events.map((event) => event.visitorId).filter((value): value is string => Boolean(value))));
  const priorVisitors =
    visitorIds.length === 0
      ? []
      : await prisma.analyticsEvent.findMany({
          where: { visitorId: { in: visitorIds }, createdAt: { lt: start } },
          select: { visitorId: true },
          distinct: ["visitorId"]
        });
  const priorVisitorIds = new Set(priorVisitors.map((visitor) => visitor.visitorId).filter(Boolean));

  const pageEvents = events.filter((event) => VIEW_EVENT_TYPES.has(event.eventType));
  const totalVisits = pageEvents.length;
  const uniqueVisitors = visitorIds.length;
  const bookingStarted = eventCount(events, "booking_started");
  const bookingCompleted = eventCount(events, "booking_completed");
  const bookingCancelled = eventCount(events, "booking_cancelled");
  const explicitAbandoned = eventCount(events, "booking_abandoned");
  const abandonedBookings = Math.max(explicitAbandoned, countAbandonedBookings(events));

  const topVisitedRooms = buildRoomRows(events, "room_detail_view");
  const mostBookedRooms = buildRoomRows(events, "booking_completed");

  return {
    range: {
      key: range,
      startDate: dateKey(start),
      endDate: dateKey(end)
    },
    summary: {
      totalVisits,
      uniqueVisitors,
      newVisitors: visitorIds.filter((visitorId) => !priorVisitorIds.has(visitorId)).length,
      returningVisitors: visitorIds.filter((visitorId) => priorVisitorIds.has(visitorId)).length,
      bookingStarted,
      bookingCompleted,
      bookingCancelled,
      abandonedBookings,
      visitToBookingConversionRate: percent(bookingCompleted, uniqueVisitors || totalVisits),
      bookingCompletionRate: percent(bookingCompleted, bookingStarted),
      bookingAbandonmentRate: percent(abandonedBookings, bookingStarted),
      cancellationRate: percent(bookingCancelled, bookingCompleted + bookingCancelled)
    },
    trends: {
      landingVisitsLast7Days: buildDailySeries(
        lastSevenLandingEvents,
        startOfDay(addDays(new Date(), -6)),
        endOfDay(new Date()),
        "landing_page_view"
      ),
      completedBookings: buildMoneyTrend(events, start, end, "booking_completed"),
      cancelledBookings: buildDailySeries(events, start, end, "booking_cancelled")
    },
    charts: {
      pageVisits: toSortedRows(
        countBy(pageEvents.map((event) => event.pageName || event.pageUrl || event.eventType)),
        12
      ),
      funnel: FUNNEL_STAGES.map(([eventType, label]) => ({
        eventType,
        label,
        count: eventType === "booking_abandoned" ? abandonedBookings : eventCount(events, eventType)
      })),
      deviceUsage: toSortedRows(countBy(events.map((event) => event.deviceType || "Unknown")), 8),
      browserUsage: toSortedRows(countBy(events.map((event) => event.browser || "Unknown")), 8),
      topReferrers: toSortedRows(countBy(events.map((event) => event.referrer || "Direct")), 8)
    },
    tables: {
      topVisitedRooms,
      mostBookedRooms,
      highViewLowBookingRooms: buildHighViewLowBookingRows(topVisitedRooms, mostBookedRooms)
    }
  };
}
