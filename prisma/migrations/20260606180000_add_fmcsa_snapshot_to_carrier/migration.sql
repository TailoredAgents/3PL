-- Add FMCSA snapshot cache fields to Carrier
ALTER TABLE "Carrier" ADD COLUMN "fmcsaSnapshot" JSONB;
ALTER TABLE "Carrier" ADD COLUMN "fmcsaSnapshotAt" TIMESTAMP(3);
