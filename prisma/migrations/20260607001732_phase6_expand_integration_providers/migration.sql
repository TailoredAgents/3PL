-- Phase 6.2: Expand IntegrationProvider and IntegrationAction enums
-- to support logging for Twilio, Resend, xAI/Grok, FMCSA, HERE, EIA, CarrierOk,
-- plus new action types for agent runs, document extraction, health checks, and webhooks.
-- This enables richer data in the /integrations admin page and future instrumentation
-- without using the catch-all "OTHER".

-- AlterEnum
ALTER TYPE "IntegrationProvider" ADD VALUE 'TWILIO';
ALTER TYPE "IntegrationProvider" ADD VALUE 'RESEND';
ALTER TYPE "IntegrationProvider" ADD VALUE 'XAI';
ALTER TYPE "IntegrationProvider" ADD VALUE 'FMCSA';
ALTER TYPE "IntegrationProvider" ADD VALUE 'HERE';
ALTER TYPE "IntegrationProvider" ADD VALUE 'EIA';
ALTER TYPE "IntegrationProvider" ADD VALUE 'CARRIEROK';

-- AlterEnum
ALTER TYPE "IntegrationAction" ADD VALUE 'AGENT_RUN';
ALTER TYPE "IntegrationAction" ADD VALUE 'DOCUMENT_EXTRACTION';
ALTER TYPE "IntegrationAction" ADD VALUE 'HEALTH_CHECK';
ALTER TYPE "IntegrationAction" ADD VALUE 'WEBHOOK_RECEIVED';
