-- Phase 3.1: Carrier compliance model extension + DocumentType for compliance docs.
-- Adds fields for W-9, COI, agreements, expirations, payment, callbacks, blocks, additional contacts.
-- Extends DocumentType for linking compliance paperwork.

ALTER TYPE "DocumentType" ADD VALUE 'W9';
ALTER TYPE "DocumentType" ADD VALUE 'CERTIFICATE_OF_INSURANCE';
ALTER TYPE "DocumentType" ADD VALUE 'BROKER_CARRIER_AGREEMENT';

ALTER TABLE "Carrier"
  ADD COLUMN "insuranceExpiration" TIMESTAMP(3),
  ADD COLUMN "w9ReceivedAt" TIMESTAMP(3),
  ADD COLUMN "agreementSignedAt" TIMESTAMP(3),
  ADD COLUMN "paymentSetup" TEXT,
  ADD COLUMN "callbackVerifiedAt" TIMESTAMP(3),
  ADD COLUMN "blockedReason" TEXT,
  ADD COLUMN "additionalContacts" JSONB;