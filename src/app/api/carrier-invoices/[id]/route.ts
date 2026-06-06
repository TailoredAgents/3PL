import { NextResponse } from "next/server";
import { CarrierInvoiceStatus, PaymentMethod, Prisma } from "@prisma/client";

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

    if (!isCarrierInvoiceStatus(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    if (paymentMethod && !isPaymentMethod(paymentMethod)) {
      return NextResponse.json({ error: "Invalid payment method" }, { status: 400 });
    }
    const parsedPaymentMethod: PaymentMethod | null = paymentMethod
      ? (paymentMethod as PaymentMethod)
      : null;

    const now = new Date();
    const update: Prisma.CarrierInvoiceUpdateInput = { status, updatedAt: now };

    if (status === "APPROVED") update.approvedAt = now;
    if (status === "PAID") {
      update.paidAt = now;
      if (parsedPaymentMethod) update.paymentMethod = parsedPaymentMethod;
    }
    if (notes) update.notes = notes;

    const record = await prisma.carrierInvoice.update({
      where: { id },
      data: update,
    });

    return NextResponse.json(record);
  } catch (err) {
    console.error("carrier-invoice PATCH", err);
    return NextResponse.json({ error: "Failed to update carrier invoice" }, { status: 500 });
  }
}
