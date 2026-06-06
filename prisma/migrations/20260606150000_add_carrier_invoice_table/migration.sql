-- Add CarrierInvoiceStatus enum
CREATE TYPE "CarrierInvoiceStatus" AS ENUM ('RECEIVED', 'MATCHED', 'APPROVED', 'PAID', 'DISPUTED');

-- Add PaymentMethod enum
CREATE TYPE "PaymentMethod" AS ENUM ('CHECK', 'ACH', 'QUICKPAY', 'WIRE');

-- Create CarrierInvoice table
CREATE TABLE "CarrierInvoice" (
    "id" TEXT NOT NULL,
    "loadId" TEXT NOT NULL,
    "carrierId" TEXT NOT NULL,
    "invoiceNumber" TEXT,
    "amount" DECIMAL(12,2) NOT NULL,
    "agreedRate" DECIMAL(12,2),
    "status" "CarrierInvoiceStatus" NOT NULL DEFAULT 'RECEIVED',
    "paymentMethod" "PaymentMethod",
    "dueDate" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CarrierInvoice_pkey" PRIMARY KEY ("id")
);

-- Unique constraint: one carrier invoice per load
CREATE UNIQUE INDEX "CarrierInvoice_loadId_key" ON "CarrierInvoice"("loadId");

-- Indexes
CREATE INDEX "CarrierInvoice_status_idx" ON "CarrierInvoice"("status");
CREATE INDEX "CarrierInvoice_dueDate_idx" ON "CarrierInvoice"("dueDate");
CREATE INDEX "CarrierInvoice_carrierId_idx" ON "CarrierInvoice"("carrierId");

-- Foreign keys
ALTER TABLE "CarrierInvoice" ADD CONSTRAINT "CarrierInvoice_loadId_fkey"
    FOREIGN KEY ("loadId") REFERENCES "Load"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CarrierInvoice" ADD CONSTRAINT "CarrierInvoice_carrierId_fkey"
    FOREIGN KEY ("carrierId") REFERENCES "Carrier"("id") ON DELETE CASCADE ON UPDATE CASCADE;
