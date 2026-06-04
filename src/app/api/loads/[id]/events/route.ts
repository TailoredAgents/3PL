import { revalidatePath } from "next/cache";

import { formValue, optionalDate } from "@/lib/server-utils";
import { hasDatabaseUrl, prisma } from "@/lib/prisma";
import { shipmentEventCreateSchema } from "@/lib/validation";

export async function POST(
  request: Request,
  context: RouteContext<"/api/loads/[id]/events">,
) {
  const { id } = await context.params;
  const formData = await request.formData();
  const parsed = shipmentEventCreateSchema.safeParse({
    type: formValue(formData, "type") ?? "LOCATION_UPDATE",
    message: formValue(formData, "message"),
    location: formValue(formData, "location"),
    occurredAt: formValue(formData, "occurredAt"),
  });

  if (!parsed.success) {
    return Response.json(
      { error: "Please add a shipment event message." },
      { status: 400 },
    );
  }

  if (!hasDatabaseUrl() || !prisma) {
    return Response.json({
      message:
        "Shipment event validated. Connect DATABASE_URL to persist tracking events.",
    });
  }

  const load = await prisma.load.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!load) {
    return Response.json({ error: "Load not found." }, { status: 404 });
  }

  const input = parsed.data;
  await prisma.shipmentEvent.create({
    data: {
      loadId: id,
      type: input.type,
      message: input.message,
      location: input.location,
      occurredAt: optionalDate(input.occurredAt) ?? new Date(),
    },
  });

  revalidatePath("/loads");
  revalidatePath(`/loads/${id}`);
  revalidatePath("/dashboard");

  return Response.json({ message: "Shipment event added." });
}
