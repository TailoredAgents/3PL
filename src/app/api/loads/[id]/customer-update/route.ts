import { revalidatePath } from "next/cache";

import { formValue, optionalDate } from "@/lib/server-utils";
import { hasDatabaseUrl, prisma } from "@/lib/prisma";
import { customerUpdateSchema } from "@/lib/validation";

export async function POST(
  request: Request,
  context: RouteContext<"/api/loads/[id]/customer-update">,
) {
  const { id } = await context.params;
  const formData = await request.formData();
  const parsed = customerUpdateSchema.safeParse({
    customerUpdateStatus: formValue(formData, "customerUpdateStatus") ?? "SENT",
    message: formValue(formData, "message"),
    sentAt: formValue(formData, "sentAt"),
  });

  if (!parsed.success) {
    return Response.json(
      { error: "Add the customer update message before saving." },
      { status: 400 },
    );
  }

  if (!hasDatabaseUrl() || !prisma) {
    return Response.json({
      message:
        "Customer update validated. Connect DATABASE_URL to persist updates.",
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
  const sentAt = optionalDate(input.sentAt) ?? new Date();

  await prisma.$transaction([
    prisma.load.update({
      where: { id },
      data: {
        customerUpdateStatus: input.customerUpdateStatus,
        lastCustomerUpdateAt:
          input.customerUpdateStatus === "SENT" ? sentAt : undefined,
      },
    }),
    prisma.shipmentEvent.create({
      data: {
        loadId: id,
        type: "LOCATION_UPDATE",
        message: `Customer update ${input.customerUpdateStatus.toLowerCase().replace("_", " ")}: ${input.message}`,
        occurredAt: sentAt,
      },
    }),
  ]);

  revalidatePath("/loads");
  revalidatePath(`/loads/${id}`);
  revalidatePath("/dashboard");

  return Response.json({ message: "Customer update saved." });
}
