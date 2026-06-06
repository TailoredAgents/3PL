import { revalidatePath } from "next/cache";

import { sendTransactionalEmail } from "@/lib/email";
import { formValue, optionalDate } from "@/lib/server-utils";
import { hasDatabaseUrl, prisma } from "@/lib/prisma";
import { invoiceCreateSchema } from "@/lib/validation";
import { generateCustomerInvoiceDocument } from "@/lib/invoice";

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
    invoiceNumber: formValue(formData, "invoiceNumber"),
    terms: formValue(formData, "terms"),
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
    select: {
      id: true,
      shipperId: true,
      loadNumber: true,
      originCity: true,
      originState: true,
      destinationCity: true,
      destinationState: true,
      shipper: {
        select: {
          companyName: true,
          contacts: {
            where: { isPrimary: true },
            select: { firstName: true, email: true },
            take: 1,
          },
        },
      },
    },
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
        invoiceNumber: input.invoiceNumber || null,
        amount: input.amount,
        balance: input.amount,
        status: input.status,
        terms: input.terms || null,
        sentAt: input.status === "SENT" || input.status === "PARTIAL" ? new Date() : null,
        dueDate: optionalDate(input.dueDate),
        paidAt,
      },
      update: {
        invoiceNumber: input.invoiceNumber || undefined,
        amount: input.amount,
        balance: input.amount,
        status: input.status,
        terms: input.terms || undefined,
        sentAt: input.status === "SENT" || input.status === "PARTIAL" ? new Date() : undefined,
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
  revalidatePath("/billing");
  revalidatePath("/dashboard");

  if (input.status === "SENT") {
    try {
      await generateCustomerInvoiceDocument(id);
    } catch {
      // Non-fatal: generation is best-effort for printable view
    }
  }

  const billingContact = load.shipper?.contacts?.[0];
  if (input.status === "SENT" && billingContact?.email) {
    const loadLabel = `LD-${String(load.loadNumber).padStart(4, "0")}`;
    const lane = `${load.originCity}, ${load.originState} → ${load.destinationCity}, ${load.destinationState}`;
    await sendTransactionalEmail({
      to: billingContact.email,
      subject: `Invoice — ${loadLabel} | ${load.shipper?.companyName ?? "DAO Logistics"}`,
      idempotencyKey: `invoice-${load.id}-sent`,
      text: [
        `Hi ${billingContact.firstName},`,
        `Your invoice for load ${loadLabel} (${lane}) has been sent.`,
        `Amount due: $${Number(input.amount).toLocaleString()}`,
        `Please process payment at your earliest convenience. Reply to this email with any questions.`,
        `— DAO Logistics`,
      ].join("\n\n"),
    }).catch(() => {
      // Non-fatal: email failure should not block the invoice save response
    });
  }

  return Response.json({ message: "Invoice saved." });
}
