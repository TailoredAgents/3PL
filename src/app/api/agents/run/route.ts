import { runAndLogBrokerageAgent } from "@/lib/agent-workflow";
import { guardInternalRole } from "@/lib/current-user";
import { formValue } from "@/lib/server-utils";
import { aiAgentRunRequestSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const guard = await guardInternalRole(
    ["OWNER", "ADMIN", "OPS", "SALES"],
    "You do not have permission to run AI agents.",
  );
  if (guard.response) return guard.response;

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

  try {
    const { agentResult, runId, status } = await runAndLogBrokerageAgent({
      agentName: input.agentName,
      relatedEntityType: input.relatedEntityType,
      relatedEntityId: input.relatedEntityId,
    });

    return Response.json({
      message:
        status === "NEEDS_HUMAN_APPROVAL"
          ? `${input.agentName} drafted a recommendation and is waiting for approval.`
          : `${input.agentName} completed.`,
      agentResult,
      runId,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Record not found.") {
      return Response.json({ error: error.message }, { status: 404 });
    }

    return Response.json(
      { error: "AI agent failed. Review configuration and try again." },
      { status: 500 },
    );
  }
}
