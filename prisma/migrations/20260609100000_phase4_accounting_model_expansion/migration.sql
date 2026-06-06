-- Phase 4.1: Expand Invoice, CarrierInvoice, and Shipper for AR/AP details, credit, and richer status tracking.

ALTER TABLE "Invoice"
  ADD COLUMN "invoiceNumber" TEXT,
  ADD COLUMN "balance" DECIMAL(12,2),
  ADD COLUMN "terms" TEXT,
  ADD COLUMN "sentAt" TIMESTAMP(3);

ALTER TABLE "CarrierInvoice"
  ADD COLUMN "disputeReason" TEXT,
  ADD COLUMN "approvalOwner" TEXT,
  ADD COLUMN "paymentBatch" TEXT,
  ADD COLUMN "remittanceNotes" TEXT,
  ADD COLUMN "quickPayMetadata" TEXT;

ALTER TABLE "Shipper"
  ADD COLUMN "creditTerms" TEXT,
  ADD COLUMN "creditLimit" DECIMAL(12,2);