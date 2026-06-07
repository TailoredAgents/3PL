-- Phase 11.2: Clerk invitation and webhook sync fields.

ALTER TABLE "User"
ADD COLUMN "clerkInvitationId" TEXT,
ADD COLUMN "invitationStatus" TEXT,
ADD COLUMN "invitationSentAt" TIMESTAMP(3),
ADD COLUMN "lastClerkSyncedAt" TIMESTAMP(3),
ADD COLUMN "deactivatedAt" TIMESTAMP(3);

CREATE UNIQUE INDEX "User_clerkInvitationId_key" ON "User"("clerkInvitationId");
CREATE INDEX "User_invitationStatus_idx" ON "User"("invitationStatus");
CREATE INDEX "User_deactivatedAt_idx" ON "User"("deactivatedAt");
