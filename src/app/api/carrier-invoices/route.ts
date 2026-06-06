import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    if (!prisma) {
      return NextResponse.json(
        { error: "Database is not configured" },
        { status: 503 },
      );
    }

    const fd = await req.formData();
    const loadId = fd.get("loadId") as string;
    const carrierId = fd.get("carrierId") as string;
    const amount = parseFloat(fd.get("amount") as string);
    const agreedRate = fd.get("agreedRate") ? parseFloat(fd.get("agreedRate") as string) : null;
    const invoiceNumber = (fd.get("invoiceNumber") as string) || null;
    const dueDate = fd.get("dueDate") ? new Date(fd.get("dueDate") as string) : null;
    const notes = (fd.get("notes") as string) || null;

    if (!loadId || !carrierId || isNaN(amount)) {
      return NextResponse.json({ error: "loadId, carrierId, and amount are required" }, { status: 400 });
    }

    const record = await prisma.carrierInvoice.upsert({
      where: { loadId },
      update: { carrierId, amount, agreedRate, invoiceNumber, dueDate, notes, updatedAt: new Date() },
      create: { loadId, carrierId, amount, agreedRate, invoiceNumber, dueDate, notes },
    });

    return NextResponse.json(record, { status: 201 });
  } catch (err) {
    console.error("carrier-invoice POST", err);
    return NextResponse.json({ error: "Failed to create carrier invoice" }, { status: 500 });
  }
}
