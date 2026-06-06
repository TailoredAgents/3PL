import { revalidatePath } from "next/cache";

import { formValue } from "@/lib/server-utils";
import { hasDatabaseUrl, prisma } from "@/lib/prisma";
import { activityCreateSchema } from "@/lib/validation";
import { runAndLogBrokerageAgent } from "@/lib/agent-workflow";

export async function POST(
  request: Request,
  context: RouteContext<"/api/leads/[id]/activities">,
) {
  const { id } = await context.params;
  const formData = await request.formData();
  const parsed = activityCreateSchema.safeParse({
    type: formValue(formData, "type") ?? "NOTE",
    direction: formValue(formData, "direction") ?? "INTERNAL",
    subject: formValue(formData, "subject"),
    body: formValue(formData, "body"),
    outcome: formValue(formData, "outcome"),
  });

  if (!parsed.success) {
    return Response.json(
      { error: "Please add an activity note." },
      { status: 400 },
    );
  }

  if (!hasDatabaseUrl() || !prisma) {
    return Response.json({
      message:
        "Activity validated. Connect DATABASE_URL to persist activity records.",
    });
  }

  const lead = await prisma.lead.findUnique({
    where: { id },
    select: {
      id: true,
      shipperId: true,
      contactId: true,
    },
  });

  if (!lead) {
    return Response.json({ error: "Lead not found." }, { status: 404 });
  }

  const input = parsed.data;
  await prisma.activity.create({
    data: {
      leadId: lead.id,
      shipperId: lead.shipperId,
      contactId: lead.contactId,
      type: input.type,
      direction: input.direction,
      subject: input.subject,
      body: input.body,
      outcome: input.outcome,
    },
  });

  revalidatePath("/leads");
  revalidatePath(`/leads/${id}`);
  revalidatePath("/communications");
  revalidatePath("/dashboard");

  // Auto-run Conversation Notes Agent whenever any communication with content is logged
  if (["CALL", "EMAIL", "SMS"].includes(input.type) && input.body) {
    void runAndLogBrokerageAgent({
      agentName: "Conversation Notes Agent",
      relatedEntityType: "Lead",
      relatedEntityId: lead.id,
    }).catch(() => { /* best-effort — don't block the response */ });
  }

  return Response.json({ message: "Activity added." });
}
