-- Add direct load lane fields for manually-created brokerage loads.
ALTER TABLE "Load" ADD COLUMN "originCity" TEXT NOT NULL DEFAULT 'Unknown';
ALTER TABLE "Load" ADD COLUMN "originState" TEXT NOT NULL DEFAULT 'NA';
ALTER TABLE "Load" ADD COLUMN "destinationCity" TEXT NOT NULL DEFAULT 'Unknown';
ALTER TABLE "Load" ADD COLUMN "destinationState" TEXT NOT NULL DEFAULT 'NA';
ALTER TABLE "Load" ADD COLUMN "equipmentType" TEXT NOT NULL DEFAULT 'Dry van';
ALTER TABLE "Load" ADD COLUMN "commodity" TEXT;
ALTER TABLE "Load" ADD COLUMN "weight" INTEGER;
