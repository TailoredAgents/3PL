import { revalidatePath } from "next/cache";

import { formValue, optionalDate } from "@/lib/server-utils";
import { hasDatabaseUrl, prisma } from "@/lib/prisma";
import { leadUpdateSchema } from "@/lib/validation";

export async function PATCH(
  request: Request,
  context: RouteContext<"/api/leads/[id]">,
) {
  const { id } = await context.params;
  const formData = await request.formData();
  const parsed = leadUpdateSchema.safeParse({
    stage: formValue(formData, "stage") ?? "NEW",
    priority: formValue(formData, "priority") ?? "3",
    nextFollowUpAt: formValue(formData, "nextFollowUpAt"),
    notes: formValue(formData, "notes"),
  });

  if (!parsed.success) {
    return Response.json(
      { error: "Please complete the required lead update fields." },
      { status: 400 },
    );
  }

  if (!hasDatabaseUrl() || !prisma) {
    return Response.json({
      message:
        "Lead update validated. Connect DATABASE_URL to persist updates.",
    });
  }

  const input = parsed.data;
  const lead = await prisma.lead.update({
    where: { id },
    data: {
      stage: input.stage,
      priority: input.priority,
      nextFollowUpAt: optionalDate(input.nextFollowUpAt),
      notes: input.notes,
    },
  });

  await prisma.shipper.update({
    where: { id: lead.shipperId },
    data: {
      status: input.stage === "WON" ? "ACTIVE" : "LEAD",
    },
  });

  revalidatePath("/leads");
  revalidatePath(`/leads/${id}`);
  revalidatePath("/dashboard");

  return Response.json({ message: "Lead updated." });
}
