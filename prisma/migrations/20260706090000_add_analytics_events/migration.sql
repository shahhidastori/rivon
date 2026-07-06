CREATE TABLE "AnalyticsEvent" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "eventType" TEXT NOT NULL,
  "pageUrl" TEXT,
  "pageName" TEXT,
  "sessionId" TEXT,
  "visitorId" TEXT,
  "userId" TEXT,
  "bookingId" TEXT,
  "roomId" TEXT,
  "deviceType" TEXT,
  "browser" TEXT,
  "referrer" TEXT,
  "metadataJson" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "AnalyticsEvent_eventType_idx" ON "AnalyticsEvent"("eventType");
CREATE INDEX "AnalyticsEvent_createdAt_idx" ON "AnalyticsEvent"("createdAt");
CREATE INDEX "AnalyticsEvent_sessionId_idx" ON "AnalyticsEvent"("sessionId");
CREATE INDEX "AnalyticsEvent_visitorId_idx" ON "AnalyticsEvent"("visitorId");
CREATE INDEX "AnalyticsEvent_bookingId_idx" ON "AnalyticsEvent"("bookingId");
CREATE INDEX "AnalyticsEvent_roomId_idx" ON "AnalyticsEvent"("roomId");
CREATE INDEX "AnalyticsEvent_eventType_createdAt_idx" ON "AnalyticsEvent"("eventType", "createdAt");
