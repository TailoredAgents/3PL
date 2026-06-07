import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

import { carrierAuthCookie } from "@/lib/auth";
import { verifyPortalSessionToken } from "@/lib/auth-portal";
import { hasDatabaseUrl, prisma } from "@/lib/prisma";
import { formValue, optionalDate } from "@/lib/server-utils";
import { shipmentEventCreateSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const carrierId = verifyPortalSessionToken(
    "carrier",
    cookieStore.get(carrierAuthCookie)?.value,
  );

  if (!carrierId) {
    return Response.json({ error: "Not logged in to carrier portal." }, { status: 401 });
  }

  const formData = await request.formData();
  const loadId = formValue(formData, "loadId");

  if (!loadId) {
    return Response.json({ error: "Load is required." }, { status: 400 });
  }

  const parsed = shipmentEventCreateSchema.safeParse({
    type: formValue(formData, "type") ?? "LOCATION_UPDATE",
    message: formValue(formData, "message"),
    location: formValue(formData, "location"),
    occurredAt: formValue(formData, "occurredAt"),
  });

  if (!parsed.success) {
    return Response.json(
      { error: "Please add a shipment update message." },
      { status: 400 },
    );
  }

  if (!hasDatabaseUrl() || !prisma) {
    return Response.json({
      message: "Shipment update validated. Connect DATABASE_URL to persist tracking events.",
    });
  }

  const load = await prisma.load.findUnique({
    where: { id: loadId },
    select: { id: true, carrierId: true },
  });

  if (!load || load.carrierId !== carrierId) {
    return Response.json({ error: "Load not found or not yours." }, { status: 404 });
  }

  const input = parsed.data;
  await prisma.shipmentEvent.create({
    data: {
      loadId,
      type: input.type,
      message: input.message,
      location: input.location,
      occurredAt: optionalDate(input.occurredAt) ?? new Date(),
    },
  });

  revalidatePath("/carrier-portal");
  revalidatePath("/loads");
  revalidatePath(`/loads/${loadId}`);
  revalidatePath("/tracking");
  revalidatePath("/dashboard");

  return Response.json({ message: "Shipment update added." });
}
