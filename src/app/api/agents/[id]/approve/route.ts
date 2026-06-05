import { approveAgentRun } from "@/lib/agent-workflow";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;

  try {
    await approveAgentRun(id);

    return Response.json({ message: "Agent run approved." });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "Agent run approval failed.",
      },
      { status: 400 },
    );
  }
}
