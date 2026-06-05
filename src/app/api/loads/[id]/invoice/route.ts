import { revalidatePath } from "next/cache";

import { formValue, optionalDate } from "@/lib/server-utils";
import { hasDatabaseUrl, prisma } from "@/lib/prisma";
import { invoiceCreateSchema } from "@/lib/validation";

export async function POST(
  request: Request,
  context: RouteContext<"/api/loads/[id]/invoice">,
) {
  const { id } = await context.params;
  const formData = await request.formData();
  const parsed = invoiceCreateSchema.safeParse({
    amount: formValue(formData, "amount"),
    status: formValue(formData, "status") ?? "DRAFT",
    dueDate: formValue(formData, "dueDate"),
  });

  if (!parsed.success) {
    return Response.json(
      { error: "Enter a valid invoice amount." },
      { status: 400 },
    );
  }

  if (!hasDatabaseUrl() || !prisma) {
    return Response.json({
      message: "Invoice validated. Connect DATABASE_URL to persist invoices.",
    });
  }

  const load = await prisma.load.findUnique({
    where: { id },
    select: { id: true, shipperId: true },
  });

  if (!load) {
    return Response.json({ error: "Load not found." }, { status: 404 });
  }

  const input = parsed.data;
  const paidAt = input.status === "PAID" ? new Date() : null;
  const nextLoadStatus =
    input.status === "PAID"
      ? "PAID"
      : input.status === "SENT" || input.status === "PARTIAL"
        ? "INVOICED"
        : undefined;

  await prisma.$transaction([
    prisma.invoice.upsert({
      where: { loadId: load.id },
      create: {
        loadId: load.id,
        shipperId: load.shipperId,
        amount: input.amount,
        status: input.status,
        dueDate: optionalDate(input.dueDate),
        paidAt,
      },
      update: {
        amount: input.amount,
        status: input.status,
        dueDate: optionalDate(input.dueDate),
        paidAt,
      },
    }),
    ...(nextLoadStatus
      ? [
          prisma.load.update({
            where: { id: load.id },
            data: { status: nextLoadStatus },
          }),
        ]
      : []),
    prisma.shipmentEvent.create({
      data: {
        loadId: load.id,
        type: "LOCATION_UPDATE",
        message: `Invoice ${input.status.toLowerCase()} for $${input.amount.toLocaleString()}.`,
        occurredAt: new Date(),
      },
    }),
  ]);

  revalidatePath("/loads");
  revalidatePath(`/loads/${id}`);
  revalidatePath("/dashboard");

  return Response.json({ message: "Invoice saved." });
}
