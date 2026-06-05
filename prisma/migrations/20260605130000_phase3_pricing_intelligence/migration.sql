-- Phase 3 pricing intelligence: benchmark rates and quote pricing recommendations.

CREATE TYPE "RateBenchmarkSource" AS ENUM (
  'MANUAL',
  'INTERNAL_HISTORY',
  'DAT',
  'TRUCKSTOP',
  'CARRIER_QUOTE',
  'CUSTOMER_HISTORY',
  'OTHER'
);

CREATE TYPE "PricingRecommendationSource" AS ENUM (
  'MANUAL',
  'AI',
  'SYSTEM'
);

CREATE TABLE "RateBenchmark" (
  "id" TEXT NOT NULL,
  "quoteRequestId" TEXT NOT NULL,
  "source" "RateBenchmarkSource" NOT NULL DEFAULT 'MANUAL',
  "sourceLabel" TEXT,
  "lowRate" DECIMAL(12,2),
  "highRate" DECIMAL(12,2),
  "averageRate" DECIMAL(12,2) NOT NULL,
  "confidence" DECIMAL(5,2),
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "RateBenchmark_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PricingRecommendation" (
  "id" TEXT NOT NULL,
  "quoteRequestId" TEXT NOT NULL,
  "source" "PricingRecommendationSource" NOT NULL DEFAULT 'SYSTEM',
  "recommendedCarrierCost" DECIMAL(12,2) NOT NULL,
  "recommendedCustomerRate" DECIMAL(12,2) NOT NULL,
  "projectedGrossProfit" DECIMAL(12,2) NOT NULL,
  "marginPercent" DECIMAL(5,2) NOT NULL,
  "targetMarginPercent" DECIMAL(5,2),
  "riskLevel" TEXT,
  "validForHours" INTEGER,
  "summary" TEXT,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "PricingRecommendation_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "RateBenchmark_quoteRequestId_idx" ON "RateBenchmark"("quoteRequestId");
CREATE INDEX "RateBenchmark_source_idx" ON "RateBenchmark"("source");
CREATE INDEX "RateBenchmark_createdAt_idx" ON "RateBenchmark"("createdAt");

CREATE INDEX "PricingRecommendation_quoteRequestId_idx" ON "PricingRecommendation"("quoteRequestId");
CREATE INDEX "PricingRecommendation_source_idx" ON "PricingRecommendation"("source");
CREATE INDEX "PricingRecommendation_createdAt_idx" ON "PricingRecommendation"("createdAt");

ALTER TABLE "RateBenchmark" ADD CONSTRAINT "RateBenchmark_quoteRequestId_fkey" FOREIGN KEY ("quoteRequestId") REFERENCES "QuoteRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PricingRecommendation" ADD CONSTRAINT "PricingRecommendation_quoteRequestId_fkey" FOREIGN KEY ("quoteRequestId") REFERENCES "QuoteRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
