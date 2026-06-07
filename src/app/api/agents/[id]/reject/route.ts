import { rejectAgentRun } from "@/lib/agent-workflow";
import { formValue } from "@/lib/server-utils";
import { aiAgentReviewSchema } from "@/lib/validation";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const formData = await request.formData();
  const parsed = aiAgentReviewSchema.safeParse({
    reviewNotes: formValue(formData, "reviewNotes"),
  });

  if (!parsed.success) {
    return Response.json({ error: "Review notes are invalid." }, { status: 400 });
  }

  try {
    await rejectAgentRun(id, parsed.data.reviewNotes);

    return Response.json({ message: "Agent run rejected." });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "Agent run rejection failed.",
      },
      { status: 400 },
    );
  }
}
