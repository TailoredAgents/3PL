-- Phase 2.2: Add extractedFields (JSONB) to Document for structured OCR/parsing results.
-- This enables storing reviewed BOL/POD/rate confirmation/carrier invoice data without auto-applying to operational records.

ALTER TABLE "Document"
  ADD COLUMN "extractedFields" JSONB;