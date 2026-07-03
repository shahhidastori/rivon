-- Add room visibility control for public website surfaces.
ALTER TABLE "Room" ADD COLUMN "hideFromWebsite" BOOLEAN NOT NULL DEFAULT false;
