import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { CarrierInvoiceStatus, PaymentMethod, Prisma } from "@prisma/client";

import { logAudit } from "@/lib/audit";
import { requireInternalRole } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";

const VALID_STATUSES = [
  CarrierInvoiceStatus.RECEIVED,
  CarrierInvoiceStatus.MATCHED,
  CarrierInvoiceStatus.APPROVED,
  CarrierInvoiceStatus.PAID,
  CarrierInvoiceStatus.DISPUTED,
] as const;

function isCarrierInvoiceStatus(value: string | null): value is CarrierInvoiceStatus {
  return VALID_STATUSES.includes(value as CarrierInvoiceStatus);
}

function isPaymentMethod(value: string | null): value is PaymentMethod {
  return Object.values(PaymentMethod).includes(value as PaymentMethod);
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    if (!prisma) {
      return NextResponse.json(
        { error: "Database is not configured" },
        { status: 503 },
      );
    }

    const { id } = await params;
    const fd = await req.formData();
    const status = fd.get("status")?.toString() ?? null;
    const paymentMethod = fd.get("paymentMethod")?.toString() || null;
    const notes = (fd.get("notes") as string) || null;
    const disputeReason = (fd.get("disputeReason") as string) || null;
    const approvalOwner = (fd.get("approvalOwner") as string) || null;
    const paymentBatch = (fd.get("paymentBatch") as string) || null;
    const remittanceNotes = (fd.get("remittanceNotes") as string) || null;

    if (!isCarrierInvoiceStatus(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    if (paymentMethod && !isPaymentMethod(paymentMethod)) {
      return NextResponse.json({ error: "Invalid payment method" }, { status: 400 });
    }

    const currentUser = await requireInternalRole(
      status === "PAID" ? ["OWNER", "ADMIN"] : ["OWNER", "ADMIN", "OPS"],
    );
    const existing = await prisma.carrierInvoice.findUnique({
      where: { id },
      include: {
        carrier: { select: { companyName: true } },
        load: { select: { loadNumber: true } },
        approvedByUser: { select: { name: true } },
        paidByUser: { select: { name: true } },
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Carrier invoice not found." }, { status: 404 });
    }

    if (status === "PAID" && existing.status !== "APPROVED") {
      return NextResponse.json(
        { error: "Carrier invoice must be approved before it can be marked paid." },
        { status: 400 },
      );
    }

    const variance =
      existing.agreedRate === null
        ? null
        : Number(existing.amount) - Number(existing.agreedRate);
    const parsedPaymentMethod: PaymentMethod | null = paymentMethod
      ? (paymentMethod as PaymentMethod)
      : null;

    const now = new Date();
    const update: Prisma.CarrierInvoiceUpdateInput = { status, updatedAt: now };

    if (status === "APPROVED") {
      update.approvedAt = now;
      update.approvedByUser = currentUser
        ? { connect: { id: currentUser.id } }
        : undefined;
      update.approvalOwner = currentUser?.name ?? approvalOwner ?? existing.approvalOwner;
    }
    if (status === "PAID") {
      update.paidAt = now;
      update.paidByUser = currentUser
        ? { connect: { id: currentUser.id } }
        : undefined;
      if (parsedPaymentMethod) update.paymentMethod = parsedPaymentMethod;
    }
    if (notes) update.notes = notes;
    if (disputeReason) {
      update.disputeReason = disputeReason;
    } else if (status === "DISPUTED") {
      update.disputeReason = `Flagged from payables queue by ${currentUser?.name ?? "internal user"}.`;
    }
    if (approvalOwner) update.approvalOwner = approvalOwner;
    if (paymentBatch) update.paymentBatch = paymentBatch;
    if (remittanceNotes) update.remittanceNotes = remittanceNotes;

    const record = await prisma.carrierInvoice.update({
      where: { id },
      data: update,
    });

    await logAudit({
      action:
        status === "APPROVED"
          ? "CARRIER_INVOICE_APPROVED"
          : status === "PAID"
            ? "CARRIER_INVOICE_PAID"
            : status === "DISPUTED"
              ? "CARRIER_INVOICE_DISPUTED"
              : "CARRIER_INVOICE_UPDATED",
      entityType: "CarrierInvoice",
      entityId: record.id,
      summary: `${existing.carrier.companyName} invoice for L-${String(existing.load.loadNumber).padStart(4, "0")} set to ${status}.`,
      user: currentUser,
      beforeJson: {
        status: existing.status,
        amount: Number(existing.amount),
        agreedRate:
          existing.agreedRate === null ? null : Number(existing.agreedRate),
        approvedAt: existing.approvedAt,
        paidAt: existing.paidAt,
        approvedBy: existing.approvedByUser?.name ?? existing.approvalOwner,
        paidBy: existing.paidByUser?.name ?? null,
        paymentMethod: existing.paymentMethod,
        paymentBatch: existing.paymentBatch,
      },
      afterJson: {
        status: record.status,
        approvedAt: record.approvedAt,
        paidAt: record.paidAt,
        paymentMethod: record.paymentMethod,
        paymentBatch: record.paymentBatch,
      },
      metadata: { variance },
    });

    revalidatePath("/payables");
    revalidatePath("/admin");
    revalidatePath("/dashboard");
    revalidatePath("/loads");

    return NextResponse.json(record);
  } catch (err) {
    if (
      err instanceof Error &&
      (err.message.includes("permission") ||
        err.message.includes("Internal user"))
    ) {
      return NextResponse.json({ error: err.message }, { status: 403 });
    }

    console.error("carrier-invoice PATCH", err);
    return NextResponse.json({ error: "Failed to update carrier invoice" }, { status: 500 });
  }
}
