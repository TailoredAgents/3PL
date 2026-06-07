import { retryAgentRun } from "@/lib/agent-workflow";
import { guardInternalRole } from "@/lib/current-user";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const guard = await guardInternalRole(
    ["OWNER", "ADMIN", "OPS", "SALES"],
    "You do not have permission to retry AI agent runs.",
  );
  if (guard.response) return guard.response;

  const { id } = await context.params;

  try {
    const { agentResult, runId, status } = await retryAgentRun(id);

    return Response.json({
      message:
        status === "NEEDS_HUMAN_APPROVAL"
          ? "Agent run retried and is waiting for approval."
          : "Agent run retried and completed.",
      agentResult,
      runId,
    });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "Agent run retry failed.",
      },
      { status: 400 },
    );
  }
}
