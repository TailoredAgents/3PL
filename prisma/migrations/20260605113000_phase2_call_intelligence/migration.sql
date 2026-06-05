-- Phase 2 call intelligence: Twilio call records, recordings, transcripts,
-- AI extraction state, and quote-request linking.

CREATE TYPE "BrokerageCallDirection" AS ENUM ('INBOUND', 'OUTBOUND');
CREATE TYPE "BrokerageCallStatus" AS ENUM ('RECEIVED', 'IN_PROGRESS', 'COMPLETED', 'FAILED');
CREATE TYPE "CallRecordingStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'FAILED', 'ABSENT');
CREATE TYPE "CallTranscriptStatus" AS ENUM ('NOT_REQUESTED', 'PENDING', 'COMPLETED', 'FAILED');
CREATE TYPE "CallExtractionStatus" AS ENUM ('NOT_STARTED', 'NEEDS_REVIEW', 'APPROVED', 'FAILED');

CREATE TABLE "BrokerageCall" (
  "id" TEXT NOT NULL,
  "direction" "BrokerageCallDirection" NOT NULL DEFAULT 'INBOUND',
  "status" "BrokerageCallStatus" NOT NULL DEFAULT 'RECEIVED',
  "twilioCallSid" TEXT,
  "fromPhone" TEXT,
  "toPhone" TEXT,
  "callerName" TEXT,
  "shipperId" TEXT,
  "contactId" TEXT,
  "quoteRequestId" TEXT,
  "recordingSid" TEXT,
  "recordingUrl" TEXT,
  "recordingDuration" INTEGER,
  "recordingStatus" "CallRecordingStatus" NOT NULL DEFAULT 'NOT_STARTED',
  "transcriptText" TEXT,
  "transcriptStatus" "CallTranscriptStatus" NOT NULL DEFAULT 'NOT_REQUESTED',
  "aiSummary" TEXT,
  "aiExtractedJson" JSONB,
  "missingQuestions" JSONB,
  "extractionStatus" "CallExtractionStatus" NOT NULL DEFAULT 'NOT_STARTED',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "BrokerageCall_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "BrokerageCall_twilioCallSid_key" ON "BrokerageCall"("twilioCallSid");
CREATE INDEX "BrokerageCall_twilioCallSid_idx" ON "BrokerageCall"("twilioCallSid");
CREATE INDEX "BrokerageCall_fromPhone_idx" ON "BrokerageCall"("fromPhone");
CREATE INDEX "BrokerageCall_shipperId_idx" ON "BrokerageCall"("shipperId");
CREATE INDEX "BrokerageCall_contactId_idx" ON "BrokerageCall"("contactId");
CREATE INDEX "BrokerageCall_quoteRequestId_idx" ON "BrokerageCall"("quoteRequestId");
CREATE INDEX "BrokerageCall_createdAt_idx" ON "BrokerageCall"("createdAt");

ALTER TABLE "BrokerageCall" ADD CONSTRAINT "BrokerageCall_shipperId_fkey" FOREIGN KEY ("shipperId") REFERENCES "Shipper"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "BrokerageCall" ADD CONSTRAINT "BrokerageCall_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "BrokerageCall" ADD CONSTRAINT "BrokerageCall_quoteRequestId_fkey" FOREIGN KEY ("quoteRequestId") REFERENCES "QuoteRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;
