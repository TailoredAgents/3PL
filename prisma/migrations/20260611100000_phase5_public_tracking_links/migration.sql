-- Phase 5.3: Public tracking link foundation (secure tokens, expiration, scoped data).

CREATE TABLE "PublicTrackingLink" (
    "id" TEXT NOT NULL,
    "loadId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revoked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PublicTrackingLink_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PublicTrackingLink_token_key" ON "PublicTrackingLink"("token");

CREATE INDEX "PublicTrackingLink_loadId_idx" ON "PublicTrackingLink"("loadId");

CREATE INDEX "PublicTrackingLink_token_idx" ON "PublicTrackingLink"("token");

ALTER TABLE "PublicTrackingLink" ADD CONSTRAINT "PublicTrackingLink_loadId_fkey" FOREIGN KEY ("loadId") REFERENCES "Load"("id") ON DELETE CASCADE ON UPDATE CASCADE;