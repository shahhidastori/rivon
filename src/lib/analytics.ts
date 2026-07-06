import type { AnalyticsContext, AnalyticsEventType } from "../types";

const VISITOR_ID_KEY = "rivon:analytics-visitor-id";
const SESSION_ID_KEY = "rivon:analytics-session-id";

let fallbackVisitorId = "";
let fallbackSessionId = "";

function createId(prefix: string) {
  const value =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
  return `${prefix}-${value}`;
}

function readStorage(storage: Storage | undefined, key: string) {
  try {
    return storage?.getItem(key) || "";
  } catch {
    return "";
  }
}

function writeStorage(storage: Storage | undefined, key: string, value: string) {
  try {
    storage?.setItem(key, value);
  } catch {
    // Tracking must never interrupt the guest experience.
  }
}

function getVisitorId() {
  const existing = readStorage(typeof localStorage === "undefined" ? undefined : localStorage, VISITOR_ID_KEY);
  if (existing) return { id: existing, isNewVisitor: false };

  const id = fallbackVisitorId || createId("visitor");
  fallbackVisitorId = id;
  writeStorage(typeof localStorage === "undefined" ? undefined : localStorage, VISITOR_ID_KEY, id);
  return { id, isNewVisitor: true };
}

function getSessionId() {
  const existing = readStorage(typeof sessionStorage === "undefined" ? undefined : sessionStorage, SESSION_ID_KEY);
  if (existing) return existing;

  const id = fallbackSessionId || createId("session");
  fallbackSessionId = id;
  writeStorage(typeof sessionStorage === "undefined" ? undefined : sessionStorage, SESSION_ID_KEY, id);
  return id;
}

function detectDeviceType() {
  const userAgent = navigator.userAgent || "";
  if (/ipad|tablet|kindle|silk/i.test(userAgent)) return "tablet";
  if (/mobi|iphone|android/i.test(userAgent)) return "mobile";
  return "desktop";
}

function detectBrowser() {
  const userAgent = navigator.userAgent || "";
  if (/edg\//i.test(userAgent)) return "Edge";
  if (/opr\//i.test(userAgent)) return "Opera";
  if (/chrome|crios/i.test(userAgent)) return "Chrome";
  if (/firefox|fxios/i.test(userAgent)) return "Firefox";
  if (/safari/i.test(userAgent) && !/chrome|crios/i.test(userAgent)) return "Safari";
  return "Unknown";
}

export function getAnalyticsContext(context: AnalyticsContext = {}): AnalyticsContext {
  const visitor = getVisitorId();
  const metadata = {
    isNewVisitor: visitor.isNewVisitor,
    ...context.metadata
  };

  return {
    pageUrl: `${window.location.pathname}${window.location.search}${window.location.hash}`,
    pageName: context.pageName || document.title || "Rivon",
    sessionId: getSessionId(),
    visitorId: visitor.id,
    deviceType: context.deviceType || detectDeviceType(),
    browser: context.browser || detectBrowser(),
    referrer: context.referrer || document.referrer || "",
    ...context,
    metadata
  };
}

export function trackAnalyticsEvent(eventType: AnalyticsEventType, context: AnalyticsContext = {}) {
  if (typeof window === "undefined") return;
  if (window.location.pathname.startsWith("/admin")) return;

  const payload = JSON.stringify({
    ...getAnalyticsContext(context),
    eventType
  });

  try {
    if ("sendBeacon" in navigator) {
      const body = new Blob([payload], { type: "application/json" });
      if (navigator.sendBeacon("/api/public/analytics/events", body)) return;
    }

    void fetch("/api/public/analytics/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload,
      keepalive: true
    }).catch(() => undefined);
  } catch {
    // Analytics is best-effort by design.
  }
}
