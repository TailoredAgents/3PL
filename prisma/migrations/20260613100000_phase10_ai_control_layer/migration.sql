-- Phase 10.1: AI control layer, approval metadata, and prompt version history.

ALTER TYPE "AiAgentStatus" ADD VALUE IF NOT EXISTS 'REJECTED';

ALTER TABLE "AiAgentRun"
  ADD COLUMN "automationMode" TEXT,
  ADD COLUMN "riskLevel" TEXT,
  ADD COLUMN "approvalRequired" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "actionSummary" TEXT,
  ADD COLUMN "promptVersion" INTEGER,
  ADD COLUMN "promptSnapshot" JSONB,
  ADD COLUMN "controlJson" JSONB,
  ADD COLUMN "approvedAt" TIMESTAMP(3),
  ADD COLUMN "approvedByUserId" TEXT,
  ADD COLUMN "rejectedAt" TIMESTAMP(3),
  ADD COLUMN "rejectedByUserId" TEXT,
  ADD COLUMN "reviewNotes" TEXT,
  ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

UPDATE "AiAgentRun"
SET
  "automationMode" = CASE
    WHEN "status" = 'COMPLETED' THEN 'autonomous'
    ELSE 'approve_first'
  END,
  "riskLevel" = CASE
    WHEN "agentName" = 'Conversation Notes Agent' THEN 'low'
    WHEN "agentName" IN ('Quote Pricing Agent', 'Billing Readiness Agent', 'Carrier Compliance Agent') THEN 'high'
    ELSE 'medium'
  END,
  "approvalRequired" = CASE
    WHEN "agentName" = 'Conversation Notes Agent' THEN false
    ELSE true
  END,
  "actionSummary" = 'Historical agent run before Phase 10.1 control metadata.',
  "updatedAt" = "createdAt"
WHERE "automationMode" IS NULL;

ALTER TABLE "AiAgentRun"
  ADD CONSTRAINT "AiAgentRun_approvedByUserId_fkey"
  FOREIGN KEY ("approvedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "AiAgentRun"
  ADD CONSTRAINT "AiAgentRun_rejectedByUserId_fkey"
  FOREIGN KEY ("rejectedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "AgentPromptVersion" (
  "id" TEXT NOT NULL,
  "agentName" TEXT NOT NULL,
  "version" INTEGER NOT NULL,
  "systemPrompt" TEXT NOT NULL,
  "task" TEXT NOT NULL,
  "placeholderNextAction" TEXT NOT NULL,
  "changeReason" TEXT,
  "changedByUserId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "AgentPromptVersion_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "AgentPromptVersion"
  ADD CONSTRAINT "AgentPromptVersion_changedByUserId_fkey"
  FOREIGN KEY ("changedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE UNIQUE INDEX "AgentPromptVersion_agentName_version_key"
  ON "AgentPromptVersion"("agentName", "version");
CREATE INDEX "AgentPromptVersion_agentName_idx" ON "AgentPromptVersion"("agentName");
CREATE INDEX "AgentPromptVersion_changedByUserId_idx" ON "AgentPromptVersion"("changedByUserId");
CREATE INDEX "AgentPromptVersion_createdAt_idx" ON "AgentPromptVersion"("createdAt");

CREATE INDEX "AiAgentRun_status_idx" ON "AiAgentRun"("status");
CREATE INDEX "AiAgentRun_approvedByUserId_idx" ON "AiAgentRun"("approvedByUserId");
CREATE INDEX "AiAgentRun_rejectedByUserId_idx" ON "AiAgentRun"("rejectedByUserId");
