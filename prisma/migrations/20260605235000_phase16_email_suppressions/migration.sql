CREATE TYPE "EmailSuppressionReason" AS ENUM ('BOUNCED', 'COMPLAINED');

CREATE TABLE "EmailSuppression" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "reason" "EmailSuppressionReason" NOT NULL,
    "sourceProvider" TEXT NOT NULL DEFAULT 'RESEND',
    "sourceEventId" TEXT,
    "messageId" TEXT,
    "notes" TEXT,
    "lastEventAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailSuppression_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "EmailSuppression_email_key" ON "EmailSuppression"("email");
CREATE INDEX "EmailSuppression_reason_idx" ON "EmailSuppression"("reason");
CREATE INDEX "EmailSuppression_sourceProvider_idx" ON "EmailSuppression"("sourceProvider");
CREATE INDEX "EmailSuppression_lastEventAt_idx" ON "EmailSuppression"("lastEventAt");
