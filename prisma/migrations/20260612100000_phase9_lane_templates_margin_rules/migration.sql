-- Phase 9.2: saved lane quote templates and margin rules

CREATE TABLE "LaneQuoteTemplate" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "shipperId" TEXT,
  "originCity" TEXT NOT NULL,
  "originState" TEXT NOT NULL,
  "destinationCity" TEXT NOT NULL,
  "destinationState" TEXT NOT NULL,
  "equipmentType" TEXT NOT NULL,
  "targetCarrierCost" DECIMAL(12,2),
  "customerRate" DECIMAL(12,2),
  "targetMarginPercent" DECIMAL(5,2),
  "commodity" TEXT,
  "pickupWindow" TEXT,
  "deliveryWindow" TEXT,
  "accessorials" TEXT,
  "notes" TEXT,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "LaneQuoteTemplate_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "LaneMarginRule" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "shipperId" TEXT,
  "originCity" TEXT,
  "originState" TEXT,
  "destinationCity" TEXT,
  "destinationState" TEXT,
  "equipmentType" TEXT,
  "urgency" TEXT,
  "targetMarginPercent" DECIMAL(5,2) NOT NULL,
  "minimumMarginPercent" DECIMAL(5,2),
  "priority" INTEGER NOT NULL DEFAULT 3,
  "notes" TEXT,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "LaneMarginRule_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "LaneQuoteTemplate_shipperId_idx" ON "LaneQuoteTemplate"("shipperId");
CREATE INDEX "LaneQuoteTemplate_originCity_originState_destinationCity_destinationState_idx" ON "LaneQuoteTemplate"("originCity", "originState", "destinationCity", "destinationState");
CREATE INDEX "LaneQuoteTemplate_equipmentType_idx" ON "LaneQuoteTemplate"("equipmentType");
CREATE INDEX "LaneQuoteTemplate_active_idx" ON "LaneQuoteTemplate"("active");

CREATE INDEX "LaneMarginRule_shipperId_idx" ON "LaneMarginRule"("shipperId");
CREATE INDEX "LaneMarginRule_originCity_originState_destinationCity_destinationState_idx" ON "LaneMarginRule"("originCity", "originState", "destinationCity", "destinationState");
CREATE INDEX "LaneMarginRule_equipmentType_idx" ON "LaneMarginRule"("equipmentType");
CREATE INDEX "LaneMarginRule_urgency_idx" ON "LaneMarginRule"("urgency");
CREATE INDEX "LaneMarginRule_active_priority_idx" ON "LaneMarginRule"("active", "priority");

ALTER TABLE "LaneQuoteTemplate"
  ADD CONSTRAINT "LaneQuoteTemplate_shipperId_fkey"
  FOREIGN KEY ("shipperId") REFERENCES "Shipper"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "LaneMarginRule"
  ADD CONSTRAINT "LaneMarginRule_shipperId_fkey"
  FOREIGN KEY ("shipperId") REFERENCES "Shipper"("id") ON DELETE CASCADE ON UPDATE CASCADE;
