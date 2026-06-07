import { approveAgentRun } from "@/lib/agent-workflow";
import { guardInternalRole } from "@/lib/current-user";
import { formValue } from "@/lib/server-utils";
import { aiAgentReviewSchema } from "@/lib/validation";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const guard = await guardInternalRole(
    ["OWNER", "ADMIN", "OPS", "SALES"],
    "You do not have permission to approve AI agent runs.",
  );
  if (guard.response) return guard.response;

  const { id } = await context.params;
  const formData = await request.formData();
  const parsed = aiAgentReviewSchema.safeParse({
    reviewNotes: formValue(formData, "reviewNotes"),
  });

  if (!parsed.success) {
    return Response.json({ error: "Review notes are invalid." }, { status: 400 });
  }

  try {
    await approveAgentRun(id, parsed.data.reviewNotes);

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
