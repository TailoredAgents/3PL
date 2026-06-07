import { revalidatePath } from "next/cache";

import { logAudit } from "@/lib/audit";
import { requireInternalRole } from "@/lib/current-user";
import { formValue, optionalDate } from "@/lib/server-utils";
import { hasDatabaseUrl, prisma } from "@/lib/prisma";
import { loadUpdateSchema } from "@/lib/validation";

export async function PATCH(
  request: Request,
  context: RouteContext<"/api/loads/[id]">,
) {
  const { id } = await context.params;
  let currentUser: Awaited<ReturnType<typeof requireInternalRole>>;

  try {
    currentUser = await requireInternalRole(["OWNER", "ADMIN", "OPS", "SALES"]);
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "You do not have permission to update loads.",
      },
      { status: 403 },
    );
  }

  const formData = await request.formData();
  const parsed = loadUpdateSchema.safeParse({
    status: formValue(formData, "status") ?? "TENDERED",
    carrierCompanyName: formValue(formData, "carrierCompanyName"),
    carrierRate: formValue(formData, "carrierRate") ?? "",
    deliveryDate: formValue(formData, "deliveryDate"),
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
    select: {
      customerRate: true,
      carrierId: true,
      carrierRate: true,
      grossProfit: true,
      status: true,
      deliveryDate: true,
      loadNumber: true,
    },
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
  const carrier = input.carrierCompanyName
    ? await findOrCreateCarrier(input.carrierCompanyName)
    : null;
  const deliveryDate = optionalDate(input.deliveryDate);

  if (carrier && input.status === "BOOKED" && carrier.complianceStatus !== "APPROVED") {
    return Response.json(
      {
        error:
          "Carrier must be approved before the load can be marked booked.",
      },
      { status: 400 },
    );
  }

  await prisma.load.update({
    where: { id },
    data: {
      status: input.status,
      carrierId: carrier?.id,
      carrierRate,
      grossProfit,
      deliveryDate: deliveryDate ?? undefined,
    },
  });

  const updateMessages = [
    carrier && carrier.id !== existing.carrierId
      ? `Carrier assigned: ${carrier.companyName}.`
      : null,
    input.status !== existing.status ? `Status changed to ${input.status}.` : null,
    input.notes || null,
  ].filter(Boolean);

  if (updateMessages.length) {
    await prisma.shipmentEvent.create({
      data: {
        loadId: id,
        type: "LOCATION_UPDATE",
        message: updateMessages.join(" "),
        occurredAt: new Date(),
      },
    });
  }

  revalidatePath("/loads");
  revalidatePath(`/loads/${id}`);
  revalidatePath("/dashboard");
  revalidatePath("/admin");

  await logAudit({
    action: "LOAD_UPDATED",
    entityType: "Load",
    entityId: id,
    summary: `LD-${String(existing.loadNumber).padStart(4, "0")} updated.`,
    user: currentUser,
    beforeJson: {
      status: existing.status,
      carrierId: existing.carrierId,
      carrierRate: existing.carrierRate,
      grossProfit: existing.grossProfit,
      deliveryDate: existing.deliveryDate,
    },
    afterJson: {
      status: input.status,
      carrierId: carrier?.id ?? null,
      carrierRate,
      grossProfit,
      deliveryDate,
    },
  });

  return Response.json({ message: "Load updated." });
}

async function findOrCreateCarrier(companyName: string) {
  if (!prisma) {
    throw new Error("Database is not configured.");
  }

  const existing = await prisma.carrier.findFirst({
    where: {
      companyName: {
        equals: companyName,
        mode: "insensitive",
      },
    },
  });

  if (existing) {
    return existing;
  }

  return prisma.carrier.create({
    data: {
      companyName,
      complianceStatus: "PENDING",
    },
  });
}
