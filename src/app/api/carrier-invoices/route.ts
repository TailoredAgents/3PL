import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

import { logAudit } from "@/lib/audit";
import { requireInternalRole } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    if (!prisma) {
      return NextResponse.json(
        { error: "Database is not configured" },
        { status: 503 },
      );
    }

    const currentUser = await requireInternalRole(["OWNER", "ADMIN", "OPS"]);

    const fd = await req.formData();
    const loadId = fd.get("loadId") as string;
    const carrierId = fd.get("carrierId") as string;
    const amount = parseFloat(fd.get("amount") as string);
    const agreedRate = fd.get("agreedRate") ? parseFloat(fd.get("agreedRate") as string) : null;
    const invoiceNumber = (fd.get("invoiceNumber") as string) || null;
    const dueDate = fd.get("dueDate") ? new Date(fd.get("dueDate") as string) : null;
    const notes = (fd.get("notes") as string) || null;
    const approvalOwner = (fd.get("approvalOwner") as string) || null;

    if (!loadId || !carrierId || isNaN(amount)) {
      return NextResponse.json({ error: "loadId, carrierId, and amount are required" }, { status: 400 });
    }

    const existing = await prisma.carrierInvoice.findUnique({
      where: { loadId },
    });
    const record = await prisma.carrierInvoice.upsert({
      where: { loadId },
      update: { carrierId, amount, agreedRate, invoiceNumber, dueDate, notes, approvalOwner, updatedAt: new Date() },
      create: { loadId, carrierId, amount, agreedRate, invoiceNumber, dueDate, notes, approvalOwner },
    });

    await logAudit({
      action: existing ? "CARRIER_INVOICE_UPDATED" : "CARRIER_INVOICE_CREATED",
      entityType: "CarrierInvoice",
      entityId: record.id,
      summary: `Carrier invoice ${invoiceNumber ?? record.id} saved.`,
      user: currentUser,
      beforeJson: existing
        ? {
            carrierId: existing.carrierId,
            amount: Number(existing.amount),
            agreedRate:
              existing.agreedRate === null ? null : Number(existing.agreedRate),
            invoiceNumber: existing.invoiceNumber,
            dueDate: existing.dueDate,
          }
        : null,
      afterJson: {
        carrierId,
        amount,
        agreedRate,
        invoiceNumber,
        dueDate,
      },
    });

    revalidatePath("/payables");
    revalidatePath("/admin");
    revalidatePath("/dashboard");

    return NextResponse.json(record, { status: 201 });
  } catch (err) {
    if (
      err instanceof Error &&
      (err.message.includes("permission") ||
        err.message.includes("Internal user"))
    ) {
      return NextResponse.json({ error: err.message }, { status: 403 });
    }

    console.error("carrier-invoice POST", err);
    return NextResponse.json({ error: "Failed to create carrier invoice" }, { status: 500 });
  }
}
