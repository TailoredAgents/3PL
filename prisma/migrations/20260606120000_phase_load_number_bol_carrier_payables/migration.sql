-- Phase: Load number, BOL document type, carrier payables

-- Add BOL to DocumentType enum
ALTER TYPE "DocumentType" ADD VALUE 'BOL';

-- Add auto-incrementing load number to Load
ALTER TABLE "Load" ADD COLUMN "loadNumber" INTEGER;
CREATE SEQUENCE "Load_loadNumber_seq";
ALTER TABLE "Load" ALTER COLUMN "loadNumber" SET DEFAULT nextval('"Load_loadNumber_seq"');
ALTER SEQUENCE "Load_loadNumber_seq" OWNED BY "Load"."loadNumber";
UPDATE "Load" SET "loadNumber" = nextval('"Load_loadNumber_seq"');
ALTER TABLE "Load" ALTER COLUMN "loadNumber" SET NOT NULL;
CREATE UNIQUE INDEX "Load_loadNumber_key" ON "Load"("loadNumber");

-- Add carrier payable tracking columns to Load
ALTER TABLE "Load" ADD COLUMN "carrierInvoiceNumber" TEXT;
ALTER TABLE "Load" ADD COLUMN "carrierPaymentDue" TIMESTAMP(3);
ALTER TABLE "Load" ADD COLUMN "carrierPaidAt" TIMESTAMP(3);
