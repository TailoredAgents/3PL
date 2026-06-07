-- Phase 11: admin controls, audit logs, and commission attribution foundation.

ALTER TABLE "Shipper"
ADD COLUMN "acquisitionOwnerUserId" TEXT;

ALTER TABLE "Load"
ADD COLUMN "managingUserId" TEXT,
ADD COLUMN "customerOwnerUserId" TEXT;

CREATE TABLE "CommissionPlan" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'Standard gross profit split',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "managingUserPercent" DECIMAL(5,2) NOT NULL DEFAULT 35.00,
    "customerOwnerPercent" DECIMAL(5,2) NOT NULL DEFAULT 15.00,
    "houseOwnerPercent" DECIMAL(5,2) NOT NULL DEFAULT 20.00,
    "companyPercent" DECIMAL(5,2) NOT NULL DEFAULT 30.00,
    "houseOwnerUserId" TEXT,
    "effectiveFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommissionPlan_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "summary" TEXT NOT NULL,
    "userId" TEXT,
    "beforeJson" JSONB,
    "afterJson" JSONB,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Shipper_acquisitionOwnerUserId_idx" ON "Shipper"("acquisitionOwnerUserId");
CREATE INDEX "Load_managingUserId_idx" ON "Load"("managingUserId");
CREATE INDEX "Load_customerOwnerUserId_idx" ON "Load"("customerOwnerUserId");
CREATE INDEX "CommissionPlan_active_idx" ON "CommissionPlan"("active");
CREATE INDEX "CommissionPlan_houseOwnerUserId_idx" ON "CommissionPlan"("houseOwnerUserId");
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

ALTER TABLE "Shipper"
ADD CONSTRAINT "Shipper_acquisitionOwnerUserId_fkey"
FOREIGN KEY ("acquisitionOwnerUserId") REFERENCES "User"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Load"
ADD CONSTRAINT "Load_managingUserId_fkey"
FOREIGN KEY ("managingUserId") REFERENCES "User"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Load"
ADD CONSTRAINT "Load_customerOwnerUserId_fkey"
FOREIGN KEY ("customerOwnerUserId") REFERENCES "User"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "CommissionPlan"
ADD CONSTRAINT "CommissionPlan_houseOwnerUserId_fkey"
FOREIGN KEY ("houseOwnerUserId") REFERENCES "User"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "AuditLog"
ADD CONSTRAINT "AuditLog_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

INSERT INTO "CommissionPlan" (
    "id",
    "name",
    "active",
    "managingUserPercent",
    "customerOwnerPercent",
    "houseOwnerPercent",
    "companyPercent",
    "houseOwnerUserId",
    "notes",
    "updatedAt"
)
VALUES (
    'phase11-standard-commission-plan',
    'DAO standard gross profit split',
    true,
    35.00,
    15.00,
    20.00,
    30.00,
    (
      SELECT "id"
      FROM "User"
      WHERE lower("name") LIKE '%austin%'
      ORDER BY "createdAt" ASC
      LIMIT 1
    ),
    'Manager 35%, lifetime client converter 15%, Austin/house owner 20%, company 30%. Forecast only until payout workflow is built.',
    CURRENT_TIMESTAMP
);
