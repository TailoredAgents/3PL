-- Phase 5.2: Persistent exception ownership and resolution model for tracking.

CREATE TYPE "LoadExceptionStatus" AS ENUM ('OPEN', 'ASSIGNED', 'RESOLVED');

CREATE TABLE "LoadException" (
    "id" TEXT NOT NULL,
    "loadId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" "LoadExceptionStatus" NOT NULL DEFAULT 'OPEN',
    "ownerUserId" TEXT,
    "notes" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LoadException_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "LoadException_loadId_idx" ON "LoadException"("loadId");

CREATE INDEX "LoadException_status_idx" ON "LoadException"("status");

ALTER TABLE "LoadException" ADD CONSTRAINT "LoadException_loadId_fkey" FOREIGN KEY ("loadId") REFERENCES "Load"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "LoadException" ADD CONSTRAINT "LoadException_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;