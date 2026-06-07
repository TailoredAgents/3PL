import type { Prisma } from "@prisma/client";

import type { InternalUserView } from "@/lib/current-user";
import { hasDatabaseUrl, prisma } from "@/lib/prisma";

export async function logAudit(input: {
  action: string;
  entityType: string;
  entityId?: string | null;
  summary: string;
  user?: InternalUserView | null;
  beforeJson?: unknown;
  afterJson?: unknown;
  metadata?: unknown;
}) {
  if (!hasDatabaseUrl() || !prisma) {
    return;
  }

  await prisma.auditLog.create({
    data: {
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId ?? null,
      summary: input.summary,
      userId: input.user?.id ?? null,
      beforeJson: toJson(input.beforeJson),
      afterJson: toJson(input.afterJson),
      metadata: toJson(input.metadata),
    },
  });
}

function toJson(value: unknown): Prisma.InputJsonValue | undefined {
  if (value === undefined) {
    return undefined;
  }

  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}
