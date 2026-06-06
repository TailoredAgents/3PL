import { revalidatePath } from "next/cache";

import { hasDatabaseUrl, prisma } from "@/lib/prisma";

export async function POST() {
  if (!hasDatabaseUrl() || !prisma) {
    return Response.json({ message: "Database not configured." }, { status: 503 });
  }

  try {
    const now = new Date();
    const batchRef = `BATCH-${now.toISOString().slice(0, 10)}`;

    const batchableInvoices = await prisma.carrierInvoice.findMany({
      where: { status: "APPROVED", paymentBatch: null },
      select: { id: true, loadId: true, carrierId: true },
    });

    if (batchableInvoices.length === 0) {
      return Response.json({ message: "No unbatched approved carrier invoices to stage." });
    }

    await prisma.$transaction([
      prisma.carrierInvoice.updateMany({
        where: { id: { in: batchableInvoices.map((i) => i.id) } },
        data: {
          paymentBatch: batchRef,
          updatedAt: now,
        },
      }),
      ...batchableInvoices.map((inv) =>
        prisma!.shipmentEvent.create({
          data: {
            loadId: inv.loadId,
            type: "LOCATION_UPDATE",
            message: `Carrier invoice staged for payment batch ${batchRef}.`,
            occurredAt: now,
          },
        })
      ),
    ]);

    revalidatePath("/payables");
    revalidatePath("/loads");
    revalidatePath("/dashboard");

    return Response.json({
      message: `Batch ${batchRef} staged: ${batchableInvoices.length} invoices ready for payment review.`,
      batchRef,
    });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Payment batch staging failed." },
      { status: 500 },
    );
  }
}
