import { revalidatePath } from "next/cache";

import { runBrokerageAgent } from "@/lib/grok";
import { hasDatabaseUrl, prisma } from "@/lib/prisma";
import {
  getCarrierDetailView,
  getLeadDetailView,
  getLoadDetailView,
  getQuoteRequestDetailView,
} from "@/lib/crm";
import { formValue } from "@/lib/server-utils";
import { aiAgentRunRequestSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const formData = await request.formData();
  const parsed = aiAgentRunRequestSchema.safeParse({
    agentName: formValue(formData, "agentName"),
    relatedEntityType: formValue(formData, "relatedEntityType"),
    relatedEntityId: formValue(formData, "relatedEntityId"),
  });

  if (!parsed.success) {
    return Response.json(
      { error: "Choose an AI agent and a valid record." },
      { status: 400 },
    );
  }

  const input = parsed.data;
  const context = await getEntityContext(
    input.relatedEntityType,
    input.relatedEntityId,
  );

  if (!context) {
    return Response.json({ error: "Record not found." }, { status: 404 });
  }

  const startedAt = new Date();

  try {
    const agentResult = await runBrokerageAgent({
      agentName: input.agentName,
      relatedEntityType: input.relatedEntityType,
      context,
    });

    if (hasDatabaseUrl() && prisma) {
      await prisma.aiAgentRun.create({
        data: {
          agentName: input.agentName,
          relatedEntityType: input.relatedEntityType,
          relatedEntityId: input.relatedEntityId,
          status: "COMPLETED",
          prompt: `Template: ${input.agentName}`,
          inputJson: {
            requestedAt: startedAt.toISOString(),
            context,
          },
          outputJson: agentResult,
          confidence: agentResult.confidence,
        },
      });

      await maybeCreateActivity(input, agentResult);
    }

    revalidateEntityPaths(input.relatedEntityType, input.relatedEntityId);

    return Response.json({
      message: `${input.agentName} completed.`,
      agentResult,
    });
  } catch (error) {
    if (hasDatabaseUrl() && prisma) {
      await prisma.aiAgentRun.create({
        data: {
          agentName: input.agentName,
          relatedEntityType: input.relatedEntityType,
          relatedEntityId: input.relatedEntityId,
          status: "FAILED",
          prompt: `Template: ${input.agentName}`,
          inputJson: {
            requestedAt: startedAt.toISOString(),
            context,
          },
          errorMessage:
            error instanceof Error ? error.message : "Unknown AI agent error.",
        },
      });
    }

    return Response.json(
      { error: "AI agent failed. Review configuration and try again." },
      { status: 500 },
    );
  }
}

async function getEntityContext(entityType: string, id: string) {
  if (entityType === "Lead") {
    return getLeadDetailView(id);
  }

  if (entityType === "QuoteRequest") {
    return getQuoteRequestDetailView(id);
  }

  if (entityType === "Load") {
    return getLoadDetailView(id);
  }

  if (entityType === "Carrier") {
    return getCarrierDetailView(id);
  }

  return null;
}

async function maybeCreateActivity(
  input: {
    relatedEntityType: string;
    relatedEntityId: string;
    agentName: string;
  },
  agentResult: { summary: string; nextAction: string },
) {
  if (!prisma || input.relatedEntityType !== "Lead") {
    return;
  }

  const lead = await prisma.lead.findUnique({
    where: { id: input.relatedEntityId },
    select: {
      id: true,
      shipperId: true,
      contactId: true,
    },
  });

  if (!lead) {
    return;
  }

  await prisma.activity.create({
    data: {
      leadId: lead.id,
      shipperId: lead.shipperId,
      contactId: lead.contactId,
      type: "AI_TOUCH",
      direction: "INTERNAL",
      subject: input.agentName,
      body: agentResult.summary,
      outcome: agentResult.nextAction,
    },
  });
}

function revalidateEntityPaths(entityType: string, id: string) {
  revalidatePath("/dashboard");

  if (entityType === "Lead") {
    revalidatePath("/leads");
    revalidatePath(`/leads/${id}`);
  }

  if (entityType === "QuoteRequest") {
    revalidatePath("/quote-requests");
    revalidatePath(`/quote-requests/${id}`);
  }

  if (entityType === "Load") {
    revalidatePath("/loads");
    revalidatePath(`/loads/${id}`);
  }

  if (entityType === "Carrier") {
    revalidatePath("/carriers");
    revalidatePath(`/carriers/${id}`);
  }
}
