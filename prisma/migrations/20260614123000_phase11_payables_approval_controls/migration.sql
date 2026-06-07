-- Phase 11.3: carrier payable approval/payment attribution.

ALTER TABLE "CarrierInvoice"
ADD COLUMN "approvedByUserId" TEXT,
ADD COLUMN "paidByUserId" TEXT;

CREATE INDEX "CarrierInvoice_approvedByUserId_idx" ON "CarrierInvoice"("approvedByUserId");
CREATE INDEX "CarrierInvoice_paidByUserId_idx" ON "CarrierInvoice"("paidByUserId");

ALTER TABLE "CarrierInvoice"
ADD CONSTRAINT "CarrierInvoice_approvedByUserId_fkey"
FOREIGN KEY ("approvedByUserId") REFERENCES "User"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "CarrierInvoice"
ADD CONSTRAINT "CarrierInvoice_paidByUserId_fkey"
FOREIGN KEY ("paidByUserId") REFERENCES "User"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
