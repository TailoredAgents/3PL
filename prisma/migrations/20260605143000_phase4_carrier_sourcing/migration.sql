-- Phase 4 carrier sourcing: candidate coverage pipeline before carrier offers.

CREATE TYPE "CarrierSourcingSource" AS ENUM (
  'MANUAL',
  'INTERNAL_HISTORY',
  'DAT',
  'TRUCKSTOP',
  'CARRIER_NETWORK',
  'OTHER'
);

CREATE TYPE "CarrierSourcingStatus" AS ENUM (
  'NEW',
  'CONTACTED',
  'QUOTE_REQUESTED',
  'OFFER_RECEIVED',
  'REJECTED',
  'CONVERTED'
);

CREATE TABLE "CarrierSourcingCandidate" (
  "id" TEXT NOT NULL,
  "loadId" TEXT NOT NULL,
  "carrierId" TEXT,
  "source" "CarrierSourcingSource" NOT NULL DEFAULT 'MANUAL',
  "status" "CarrierSourcingStatus" NOT NULL DEFAULT 'NEW',
  "companyName" TEXT NOT NULL,
  "contactName" TEXT,
  "phone" TEXT,
  "email" TEXT,
  "mcNumber" TEXT,
  "dotNumber" TEXT,
  "suggestedRate" DECIMAL(12,2),
  "matchScore" DECIMAL(5,2),
  "complianceSnapshot" TEXT,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "CarrierSourcingCandidate_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CarrierSourcingCandidate_loadId_idx" ON "CarrierSourcingCandidate"("loadId");
CREATE INDEX "CarrierSourcingCandidate_carrierId_idx" ON "CarrierSourcingCandidate"("carrierId");
CREATE INDEX "CarrierSourcingCandidate_source_idx" ON "CarrierSourcingCandidate"("source");
CREATE INDEX "CarrierSourcingCandidate_status_idx" ON "CarrierSourcingCandidate"("status");

ALTER TABLE "CarrierSourcingCandidate" ADD CONSTRAINT "CarrierSourcingCandidate_loadId_fkey" FOREIGN KEY ("loadId") REFERENCES "Load"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CarrierSourcingCandidate" ADD CONSTRAINT "CarrierSourcingCandidate_carrierId_fkey" FOREIGN KEY ("carrierId") REFERENCES "Carrier"("id") ON DELETE SET NULL ON UPDATE CASCADE;
