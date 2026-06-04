import { revalidatePath } from "next/cache";

import { formValue } from "@/lib/server-utils";
import { hasDatabaseUrl, prisma } from "@/lib/prisma";
import { loadUpdateSchema } from "@/lib/validation";

export async function PATCH(
  request: Request,
  context: RouteContext<"/api/loads/[id]">,
) {
  const { id } = await context.params;
  const formData = await request.formData();
  const parsed = loadUpdateSchema.safeParse({
    status: formValue(formData, "status") ?? "TENDERED",
    carrierRate: formValue(formData, "carrierRate") ?? "",
    notes: formValue(formData, "notes"),
  });

  if (!parsed.success) {
    return Response.json(
      { error: "Please complete the required load update fields." },
      { status: 400 },
    );
  }

  if (!hasDatabaseUrl() || !prisma) {
    return Response.json({
      message:
        "Load update validated. Connect DATABASE_URL to persist updates.",
    });
  }

  const input = parsed.data;
  const existing = await prisma.load.findUnique({
    where: { id },
    select: { customerRate: true },
  });

  if (!existing) {
    return Response.json({ error: "Load not found." }, { status: 404 });
  }

  const carrierRate =
    typeof input.carrierRate === "number" ? input.carrierRate : null;
  const grossProfit =
    carrierRate === null
      ? undefined
      : Number(existing.customerRate) - carrierRate;

  await prisma.load.update({
    where: { id },
    data: {
      status: input.status,
      carrierRate,
      grossProfit,
    },
  });

  if (input.notes) {
    await prisma.shipmentEvent.create({
      data: {
        loadId: id,
        type: "LOCATION_UPDATE",
        message: input.notes,
        occurredAt: new Date(),
      },
    });
  }

  revalidatePath("/loads");
  revalidatePath(`/loads/${id}`);
  revalidatePath("/dashboard");

  return Response.json({ message: "Load updated." });
}
