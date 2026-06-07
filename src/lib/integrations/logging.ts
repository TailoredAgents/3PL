import { hasDatabaseUrl, prisma } from "@/lib/prisma";

export type IntegrationLogInput = {
  provider: string; // will match IntegrationProvider enum values after migration
  action: string; // will match IntegrationAction enum values
  status: "SKIPPED" | "SUCCESS" | "FAILED";
  loadId?: string | null;
  quoteRequestId?: string | null;
  requestJson?: unknown;
  responseJson?: unknown;
  externalId?: string | null;
  message?: string | null;
  error?: string | null;
};

/**
 * Central helper to write IntegrationLog entries.
 * Safe no-op when DB is not configured.
 * Reuses the same shape as the marketplace DAT/Truckstop log data builders
 * so we can consolidate later without duplication.
 */
export async function logIntegration(input: IntegrationLogInput): Promise<void> {
  if (!hasDatabaseUrl() || !prisma) {
    return;
  }

  try {
    await prisma.integrationLog.create({
      data: {
        // Casts are safe: values must match the DB enum after the explicit migration.
        // Using any here mirrors patterns used elsewhere for IntegrationLog writes.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        provider: input.provider as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        action: input.action as any,
        status: input.status,
        loadId: input.loadId ?? null,
        quoteRequestId: input.quoteRequestId ?? null,
        requestJson: input.requestJson ? (JSON.parse(JSON.stringify(input.requestJson)) as any) : undefined,
        responseJson: input.responseJson ? (JSON.parse(JSON.stringify(input.responseJson)) as any) : undefined,
        externalId: input.externalId ?? null,
        message: input.message ?? null,
        error: input.error ?? null,
      },
    });
  } catch {
    // Never let logging break the main flow
  }
}
