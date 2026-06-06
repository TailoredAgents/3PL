import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const fd = await req.formData();
    const status = fd.get("status") as string;
    const paymentMethod = (fd.get("paymentMethod") as string) || null;
    const notes = (fd.get("notes") as string) || null;

    const validStatuses = ["RECEIVED", "MATCHED", "APPROVED", "PAID", "DISPUTED"];
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const now = new Date();
    const update: Record<string, unknown> = { status, updatedAt: now };

    if (status === "APPROVED") update.approvedAt = now;
    if (status === "PAID") {
      update.paidAt = now;
      if (paymentMethod) update.paymentMethod = paymentMethod;
    }
    if (notes) update.notes = notes;

    const record = await (prisma as any).carrierInvoice.update({
      where: { id },
      data: update,
    });

    return NextResponse.json(record);
  } catch (err) {
    console.error("carrier-invoice PATCH", err);
    return NextResponse.json({ error: "Failed to update carrier invoice" }, { status: 500 });
  }
}
