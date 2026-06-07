import { revalidatePath } from "next/cache";

import { hasDatabaseUrl, prisma } from "@/lib/prisma";
import { formValue, nullableString } from "@/lib/server-utils";
import { laneMarginRuleCreateSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const formData = await request.formData();
  const parsed = laneMarginRuleCreateSchema.safeParse({
    name: formValue(formData, "name"),
    shipperId: formValue(formData, "shipperId"),
    originCity: formValue(formData, "originCity"),
    originState: formValue(formData, "originState"),
    destinationCity: formValue(formData, "destinationCity"),
    destinationState: formValue(formData, "destinationState"),
    equipmentType: formValue(formData, "equipmentType"),
    urgency: formValue(formData, "urgency"),
    targetMarginPercent: formValue(formData, "targetMarginPercent"),
    minimumMarginPercent: formValue(formData, "minimumMarginPercent") ?? "",
    priority: formValue(formData, "priority") ?? "3",
    notes: formValue(formData, "notes"),
  });

  if (!parsed.success) {
    return Response.json(
      { error: "Enter a rule name and target margin percent." },
      { status: 400 },
    );
  }

  if (!hasDatabaseUrl() || !prisma) {
    return Response.json({
      message: "Lane margin rule validated. Connect DATABASE_URL to persist.",
    });
  }

  const input = parsed.data;
  await prisma.laneMarginRule.create({
    data: {
      name: input.name,
      shipperId: nullableString(input.shipperId),
      originCity: nullableString(input.originCity),
      originState: nullableString(input.originState),
      destinationCity: nullableString(input.destinationCity),
      destinationState: nullableString(input.destinationState),
      equipmentType: nullableString(input.equipmentType),
      urgency: nullableString(input.urgency),
      targetMarginPercent: input.targetMarginPercent,
      minimumMarginPercent:
        typeof input.minimumMarginPercent === "number"
          ? input.minimumMarginPercent
          : null,
      priority: input.priority,
      notes: nullableString(input.notes),
    },
  });

  revalidatePath("/analytics");
  revalidatePath("/quote-requests");

  return Response.json({ message: "Lane margin rule saved." });
}
