import { revalidatePath } from "next/cache";

import { hasDatabaseUrl, prisma } from "@/lib/prisma";
import { formValue, nullableString } from "@/lib/server-utils";
import { laneQuoteTemplateCreateSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const formData = await request.formData();
  const parsed = laneQuoteTemplateCreateSchema.safeParse({
    name: formValue(formData, "name"),
    shipperId: formValue(formData, "shipperId"),
    originCity: formValue(formData, "originCity"),
    originState: formValue(formData, "originState"),
    destinationCity: formValue(formData, "destinationCity"),
    destinationState: formValue(formData, "destinationState"),
    equipmentType: formValue(formData, "equipmentType"),
    targetCarrierCost: formValue(formData, "targetCarrierCost") ?? "",
    customerRate: formValue(formData, "customerRate") ?? "",
    targetMarginPercent: formValue(formData, "targetMarginPercent") ?? "",
    commodity: formValue(formData, "commodity"),
    pickupWindow: formValue(formData, "pickupWindow"),
    deliveryWindow: formValue(formData, "deliveryWindow"),
    accessorials: formValue(formData, "accessorials"),
    notes: formValue(formData, "notes"),
  });

  if (!parsed.success) {
    return Response.json(
      { error: "Enter a template name, lane, and equipment type." },
      { status: 400 },
    );
  }

  if (!hasDatabaseUrl() || !prisma) {
    return Response.json({
      message: "Lane quote template validated. Connect DATABASE_URL to persist.",
    });
  }

  const input = parsed.data;
  await prisma.laneQuoteTemplate.create({
    data: {
      name: input.name,
      shipperId: nullableString(input.shipperId),
      originCity: input.originCity,
      originState: input.originState,
      destinationCity: input.destinationCity,
      destinationState: input.destinationState,
      equipmentType: input.equipmentType,
      targetCarrierCost:
        typeof input.targetCarrierCost === "number" ? input.targetCarrierCost : null,
      customerRate:
        typeof input.customerRate === "number" ? input.customerRate : null,
      targetMarginPercent:
        typeof input.targetMarginPercent === "number"
          ? input.targetMarginPercent
          : null,
      commodity: nullableString(input.commodity),
      pickupWindow: nullableString(input.pickupWindow),
      deliveryWindow: nullableString(input.deliveryWindow),
      accessorials: nullableString(input.accessorials),
      notes: nullableString(input.notes),
    },
  });

  revalidatePath("/analytics");
  revalidatePath("/quote-requests");

  return Response.json({ message: "Lane quote template saved." });
}
