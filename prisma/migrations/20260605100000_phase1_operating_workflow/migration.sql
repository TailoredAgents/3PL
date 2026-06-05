-- Phase 1 operating workflow: richer quote/load intake, compliance checks,
-- rate confirmation state, customer update state, and app settings.

CREATE TYPE "CustomerUpdateStatus" AS ENUM ('NOT_NEEDED', 'NEEDED', 'SENT');
CREATE TYPE "RateConfirmationStatus" AS ENUM ('NOT_STARTED', 'DRAFTED', 'SENT', 'SIGNED');

ALTER TABLE "QuoteRequest" ADD COLUMN "originAddress" TEXT;
ALTER TABLE "QuoteRequest" ADD COLUMN "destinationAddress" TEXT;
ALTER TABLE "QuoteRequest" ADD COLUMN "pickupWindow" TEXT;
ALTER TABLE "QuoteRequest" ADD COLUMN "deliveryWindow" TEXT;
ALTER TABLE "QuoteRequest" ADD COLUMN "palletCount" INTEGER;
ALTER TABLE "QuoteRequest" ADD COLUMN "pieceCount" INTEGER;
ALTER TABLE "QuoteRequest" ADD COLUMN "dimensions" TEXT;
ALTER TABLE "QuoteRequest" ADD COLUMN "hazmat" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "QuoteRequest" ADD COLUMN "temperatureRequirement" TEXT;
ALTER TABLE "QuoteRequest" ADD COLUMN "appointmentRequired" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "QuoteRequest" ADD COLUMN "accessorials" TEXT;
ALTER TABLE "QuoteRequest" ADD COLUMN "customerReference" TEXT;
ALTER TABLE "QuoteRequest" ADD COLUMN "urgency" TEXT;
ALTER TABLE "QuoteRequest" ADD COLUMN "intakeChannel" TEXT NOT NULL DEFAULT 'PHONE';
ALTER TABLE "QuoteRequest" ADD COLUMN "quotedByPhone" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "QuoteRequest" ADD COLUMN "targetMarginPercent" DECIMAL(5,2);
ALTER TABLE "QuoteRequest" ADD COLUMN "pricingNotes" TEXT;

ALTER TABLE "Load" ADD COLUMN "originAddress" TEXT;
ALTER TABLE "Load" ADD COLUMN "destinationAddress" TEXT;
ALTER TABLE "Load" ADD COLUMN "palletCount" INTEGER;
ALTER TABLE "Load" ADD COLUMN "pieceCount" INTEGER;
ALTER TABLE "Load" ADD COLUMN "dimensions" TEXT;
ALTER TABLE "Load" ADD COLUMN "hazmat" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Load" ADD COLUMN "temperatureRequirement" TEXT;
ALTER TABLE "Load" ADD COLUMN "appointmentRequired" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Load" ADD COLUMN "accessorials" TEXT;
ALTER TABLE "Load" ADD COLUMN "customerReference" TEXT;
ALTER TABLE "Load" ADD COLUMN "pickupWindow" TEXT;
ALTER TABLE "Load" ADD COLUMN "deliveryWindow" TEXT;
ALTER TABLE "Load" ADD COLUMN "customerUpdateStatus" "CustomerUpdateStatus" NOT NULL DEFAULT 'NOT_NEEDED';
ALTER TABLE "Load" ADD COLUMN "lastCustomerUpdateAt" TIMESTAMP(3);
ALTER TABLE "Load" ADD COLUMN "rateConfirmationStatus" "RateConfirmationStatus" NOT NULL DEFAULT 'NOT_STARTED';
ALTER TABLE "Load" ADD COLUMN "rateConfirmationSentAt" TIMESTAMP(3);
ALTER TABLE "Load" ADD COLUMN "rateConfirmationSignedAt" TIMESTAMP(3);

ALTER TABLE "Carrier" ADD COLUMN "authorityStatus" TEXT;
ALTER TABLE "Carrier" ADD COLUMN "insuranceStatus" TEXT;
ALTER TABLE "Carrier" ADD COLUMN "safetyRating" TEXT;
ALTER TABLE "Carrier" ADD COLUMN "fraudRiskLevel" TEXT;
ALTER TABLE "Carrier" ADD COLUMN "lastVettedAt" TIMESTAMP(3);
ALTER TABLE "Carrier" ADD COLUMN "approvedBy" TEXT;
ALTER TABLE "Carrier" ADD COLUMN "complianceNotes" TEXT;

CREATE TABLE "AppSetting" (
  "id" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "value" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "AppSetting_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AppSetting_key_key" ON "AppSetting"("key");
CREATE INDEX "AppSetting_key_idx" ON "AppSetting"("key");
