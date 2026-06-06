-- Phase 1 document center foundation: document metadata, storage keys, and related entity links.

CREATE TYPE "DocumentStatus" AS ENUM ('ACTIVE', 'NEEDS_REVIEW', 'MISSING_STORAGE', 'ARCHIVED');
CREATE TYPE "DocumentSource" AS ENUM ('MANUAL_UPLOAD', 'SYSTEM_GENERATED', 'PUBLIC_AUDIT', 'EXTERNAL_URL');
CREATE TYPE "DocumentExtractionStatus" AS ENUM ('NOT_REQUESTED', 'PENDING', 'COMPLETED', 'FAILED');

ALTER TABLE "Document"
  ADD COLUMN "quoteRequestId" TEXT,
  ADD COLUMN "carrierId" TEXT,
  ADD COLUMN "uploadedByUserId" TEXT,
  ADD COLUMN "status" "DocumentStatus" NOT NULL DEFAULT 'ACTIVE',
  ADD COLUMN "source" "DocumentSource" NOT NULL DEFAULT 'MANUAL_UPLOAD',
  ADD COLUMN "extractionStatus" "DocumentExtractionStatus" NOT NULL DEFAULT 'NOT_REQUESTED',
  ADD COLUMN "storageKey" TEXT,
  ADD COLUMN "mimeType" TEXT,
  ADD COLUMN "fileSize" INTEGER,
  ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "Document"
  ADD CONSTRAINT "Document_quoteRequestId_fkey"
  FOREIGN KEY ("quoteRequestId") REFERENCES "QuoteRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Document"
  ADD CONSTRAINT "Document_carrierId_fkey"
  FOREIGN KEY ("carrierId") REFERENCES "Carrier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Document"
  ADD CONSTRAINT "Document_uploadedByUserId_fkey"
  FOREIGN KEY ("uploadedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "Document_quoteRequestId_idx" ON "Document"("quoteRequestId");
CREATE INDEX "Document_carrierId_idx" ON "Document"("carrierId");
CREATE INDEX "Document_uploadedByUserId_idx" ON "Document"("uploadedByUserId");
CREATE INDEX "Document_type_idx" ON "Document"("type");
CREATE INDEX "Document_status_idx" ON "Document"("status");
CREATE INDEX "Document_createdAt_idx" ON "Document"("createdAt");
