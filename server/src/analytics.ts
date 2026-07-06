import type { Request } from "express";
import { prisma } from "./db.js";

const BOT_USER_AGENT_PATTERN =
  /bot|crawl|spider|slurp|bingpreview|facebookexternalhit|whatsapp|telegrambot|headless|monitor|uptime|curl|wget/i;

type AnalyticsInput = {
  eventType: string;
  pageUrl?: string;
  pageName?: string;
  sessionId?: string;
  visitorId?: string;
  userId?: string;
  bookingId?: string;
  roomId?: string;
  deviceType?: string;
  browser?: string;
  referrer?: string;
  metadata?: Record<string, unknown>;
};

function limit(value?: string, maxLength = 500) {
  if (!value) return null;
  return value.length > maxLength ? value.slice(0, maxLength) : value;
}

export function isBotUserAgent(userAgent = "") {
  return BOT_USER_AGENT_PATTERN.test(userAgent);
}

export function detectDeviceType(userAgent = "") {
  if (/ipad|tablet|kindle|silk/i.test(userAgent)) return "tablet";
  if (/mobi|iphone|android/i.test(userAgent)) return "mobile";
  return "desktop";
}

export function detectBrowser(userAgent = "") {
  if (/edg\//i.test(userAgent)) return "Edge";
  if (/opr\//i.test(userAgent)) return "Opera";
  if (/chrome|crios/i.test(userAgent)) return "Chrome";
  if (/firefox|fxios/i.test(userAgent)) return "Firefox";
  if (/safari/i.test(userAgent) && !/chrome|crios/i.test(userAgent)) return "Safari";
  return "Unknown";
}

function stringifyMetadata(metadata?: Record<string, unknown>) {
  if (!metadata || Object.keys(metadata).length === 0) return null;

  try {
    const raw = JSON.stringify(metadata);
    if (raw.length <= 5000) return raw;
    return JSON.stringify({
      truncated: true,
      preview: raw.slice(0, 4800)
    });
  } catch {
    return JSON.stringify({ unavailable: true });
  }
}

export async function recordAnalyticsEvent(input: AnalyticsInput, req?: Request) {
  const userAgent = String(req?.headers["user-agent"] || "");
  if (isBotUserAgent(userAgent)) return null;

  const referrer = input.referrer || String(req?.headers.referer || "");

  return prisma.analyticsEvent.create({
    data: {
      eventType: input.eventType,
      pageUrl: limit(input.pageUrl),
      pageName: limit(input.pageName, 120),
      sessionId: limit(input.sessionId, 120),
      visitorId: limit(input.visitorId, 120),
      userId: limit(input.userId, 120),
      bookingId: limit(input.bookingId, 120),
      roomId: limit(input.roomId, 120),
      deviceType: limit(input.deviceType || detectDeviceType(userAgent), 40),
      browser: limit(input.browser || detectBrowser(userAgent), 80),
      referrer: limit(referrer),
      metadataJson: stringifyMetadata(input.metadata)
    }
  });
}
