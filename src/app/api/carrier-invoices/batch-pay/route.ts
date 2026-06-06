import { revalidatePath } from "next/cache";

import { hasDatabaseUrl, prisma } from "@/lib/prisma";

export async function POST(_request: Request) { // eslint-disable-line @typescript-eslint/no-unused-vars
  if (!hasDatabaseUrl() || !prisma) {
    return Response.json({ message: "Database not configured." }, { status: 503 });
  }

  try {
    const now = new Date();
    const batchRef = `BATCH-${now.toISOString().slice(0, 10)}`;

    const approvedInvoices = await prisma.carrierInvoice.findMany({
      where: { status: "APPROVED" },
      select: { id: true, loadId: true, carrierId: true },
    });

    if (approvedInvoices.length === 0) {
      return Response.json({ message: "No approved carrier invoices to batch." });
    }

    await prisma.$transaction([
      prisma.carrierInvoice.updateMany({
        where: { id: { in: approvedInvoices.map((i) => i.id) } },
        data: {
          status: "PAID",
          paidAt: now,
          paymentBatch: batchRef,
          updatedAt: now,
        },
      }),
      ...approvedInvoices.map((inv) =>
        prisma!.shipmentEvent.create({
          data: {
            loadId: inv.loadId,
            type: "LOCATION_UPDATE",
            message: `Carrier invoice paid as part of batch ${batchRef}.`,
            occurredAt: now,
          },
        })
      ),
    ]);

    revalidatePath("/payables");
    revalidatePath("/loads");
    revalidatePath("/dashboard");

    return Response.json({
      message: `Batch ${batchRef} paid: ${approvedInvoices.length} invoices.`,
      batchRef,
    });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Batch payment failed." },
      { status: 500 },
    );
  }
}
