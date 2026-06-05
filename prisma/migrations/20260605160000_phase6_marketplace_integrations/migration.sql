-- Phase 6 marketplace integrations: DAT/Truckstop action audit log.

CREATE TYPE "IntegrationProvider" AS ENUM (
  'DAT',
  'TRUCKSTOP',
  'OTHER'
);

CREATE TYPE "IntegrationAction" AS ENUM (
  'RATE_LOOKUP',
  'CAPACITY_SEARCH',
  'LOAD_POST',
  'CARRIER_RESPONSE_SYNC'
);

CREATE TYPE "IntegrationStatus" AS ENUM (
  'SKIPPED',
  'SUCCESS',
  'FAILED'
);

CREATE TABLE "IntegrationLog" (
  "id" TEXT NOT NULL,
  "provider" "IntegrationProvider" NOT NULL,
  "action" "IntegrationAction" NOT NULL,
  "status" "IntegrationStatus" NOT NULL,
  "loadId" TEXT,
  "quoteRequestId" TEXT,
  "requestJson" JSONB,
  "responseJson" JSONB,
  "externalId" TEXT,
  "message" TEXT,
  "error" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "IntegrationLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "IntegrationLog_provider_idx" ON "IntegrationLog"("provider");
CREATE INDEX "IntegrationLog_action_idx" ON "IntegrationLog"("action");
CREATE INDEX "IntegrationLog_status_idx" ON "IntegrationLog"("status");
CREATE INDEX "IntegrationLog_loadId_idx" ON "IntegrationLog"("loadId");
CREATE INDEX "IntegrationLog_quoteRequestId_idx" ON "IntegrationLog"("quoteRequestId");
CREATE INDEX "IntegrationLog_createdAt_idx" ON "IntegrationLog"("createdAt");

ALTER TABLE "IntegrationLog" ADD CONSTRAINT "IntegrationLog_loadId_fkey" FOREIGN KEY ("loadId") REFERENCES "Load"("id") ON DELETE SET NULL ON UPDATE CASCADE;
