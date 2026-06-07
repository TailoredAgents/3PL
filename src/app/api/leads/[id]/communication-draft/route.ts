import { createCommunicationDraft } from "@/lib/communication-drafts";
import { formValue } from "@/lib/server-utils";
import { communicationDraftSchema } from "@/lib/validation";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const formData = await request.formData();
  const parsed = communicationDraftSchema.safeParse({
    channel: formValue(formData, "channel"),
    purpose: formValue(formData, "purpose"),
  });

  if (!parsed.success) {
    return Response.json(
      { error: "Choose an email or SMS draft type." },
      { status: 400 },
    );
  }

  try {
    const draft = await createCommunicationDraft(id, parsed.data);

    return Response.json({
      message: "AI draft created. Review and edit before sending.",
      draft,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to create AI draft.";
    const status = message === "Lead not found." ? 404 : 400;

    return Response.json({ error: message }, { status });
  }
}
