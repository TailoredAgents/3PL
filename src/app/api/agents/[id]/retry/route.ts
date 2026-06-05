import { retryAgentRun } from "@/lib/agent-workflow";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;

  try {
    const { agentResult, runId } = await retryAgentRun(id);

    return Response.json({
      message: "Agent run retried and is ready for review.",
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
