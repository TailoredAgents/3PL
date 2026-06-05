ALTER TABLE "Activity"
ADD COLUMN "externalProvider" TEXT,
ADD COLUMN "externalMessageId" TEXT,
ADD COLUMN "externalEventId" TEXT;

CREATE UNIQUE INDEX "Activity_externalEventId_key" ON "Activity"("externalEventId");
CREATE INDEX "Activity_externalProvider_idx" ON "Activity"("externalProvider");
CREATE INDEX "Activity_externalMessageId_idx" ON "Activity"("externalMessageId");
