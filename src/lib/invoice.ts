import { DocumentExtractionStatus, DocumentSource } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { toCurrency } from "@/lib/utils";

export async function generateCustomerInvoiceDocument(loadId: string) {
  if (!prisma) {
    throw new Error("Database is not configured.");
  }

  const load = await prisma.load.findUnique({
    where: { id: loadId },
    include: {
      shipper: true,
      carrier: true,
      invoice: true,
    },
  });

  if (!load) {
    throw new Error("Load not found.");
  }

  if (!load.invoice) {
    throw new Error("Create an invoice record before generating the printable document.");
  }

  const content = buildCustomerInvoiceContent({
    loadId: load.id,
    loadNumber: load.loadNumber,
    shipper: load.shipper.companyName,
    carrier: load.carrier?.companyName ?? "TBD",
    origin: `${load.originCity}, ${load.originState}`,
    destination: `${load.destinationCity}, ${load.destinationState}`,
    equipmentType: load.equipmentType,
    customerReference: load.customerReference,
    deliveryDate: load.deliveryDate,
    amount: Number(load.invoice!.amount),
    status: load.invoice!.status,
    terms: load.invoice!.terms,
    dueDate: load.invoice!.dueDate,
    invoiceNumber: load.invoice!.invoiceNumber,
  });

  const fileName = `invoice-${load.id}.html`;
  const fileUrl = `/api/loads/${load.id}/invoice/print`;
  const now = new Date();

  const document = await prisma.$transaction(async (tx) => {
    // Remove previous invoice docs if regenerating
    await tx.document.deleteMany({
      where: { loadId: load.id, type: "INVOICE", source: DocumentSource.SYSTEM_GENERATED },
    });

    const createdDocument = await tx.document.create({
      data: {
        loadId: load.id,
        shipperId: load.shipperId,
        type: "INVOICE",
        source: DocumentSource.SYSTEM_GENERATED,
        extractionStatus: DocumentExtractionStatus.COMPLETED,
        fileName,
        fileUrl,
        mimeType: "text/html",
        fileSize: Buffer.byteLength(content),
        extractedText: content,
      },
    });

    await tx.load.update({
      where: { id: load.id },
      data: { status: load.status === "DELIVERED" || load.status === "POD_RECEIVED" ? "INVOICED" : load.status },
    });

    await tx.shipmentEvent.create({
      data: {
        loadId: load.id,
        type: "LOCATION_UPDATE",
        message: `Customer invoice generated for ${toCurrency(Number(load.invoice!.amount))}.`,
        occurredAt: now,
      },
    });

    return createdDocument;
  });

  return document;
}

export async function getPrintableCustomerInvoice(loadId: string) {
  if (!prisma) {
    throw new Error("Database is not configured.");
  }

  const load = await prisma.load.findUnique({
    where: { id: loadId },
    include: {
      shipper: true,
      invoice: true,
      documents: {
        where: { type: "INVOICE", source: DocumentSource.SYSTEM_GENERATED },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  if (!load || !load.invoice) {
    throw new Error("Load or invoice not found.");
  }

  const document = load.documents[0];

  if (!document?.extractedText) {
    throw new Error("Generate the invoice before opening the printable view.");
  }

  return {
    title: document.fileName,
    html: renderCustomerInvoiceHtml({
      title: document.fileName,
      loadId: load.id,
      shipper: load.shipper.companyName,
      content: document.extractedText,
    }),
  };
}

function buildCustomerInvoiceContent(input: {
  loadId: string;
  loadNumber: number;
  shipper: string;
  carrier: string;
  origin: string;
  destination: string;
  equipmentType: string;
  customerReference?: string | null;
  deliveryDate?: Date | null;
  amount: number;
  status: string;
  terms?: string | null;
  dueDate?: Date | null;
  invoiceNumber?: string | null;
}) {
  const loadLabel = `LD-${String(input.loadNumber).padStart(4, "0")}`;
  return [
    "ATLANTA FREIGHT OS - CUSTOMER INVOICE",
    `Invoice: ${input.invoiceNumber || loadLabel}`,
    `Load: ${loadLabel}`,
    `Generated: ${new Date().toISOString()}`,
    "",
    "Bill To",
    input.shipper,
    "",
    "Shipment",
    `Carrier: ${input.carrier}`,
    `Origin: ${input.origin}`,
    `Destination: ${input.destination}`,
    `Equipment: ${input.equipmentType}`,
    `Delivery: ${input.deliveryDate ? input.deliveryDate.toISOString().slice(0,10) : "TBD"}`,
    `Customer Ref: ${input.customerReference || "N/A"}`,
    "",
    "Charges",
    `Total Due: ${toCurrency(input.amount)}`,
    `Terms: ${input.terms || "Net 30"}`,
    `Due Date: ${input.dueDate ? input.dueDate.toISOString().slice(0,10) : "Upon receipt"}`,
    `Status: ${input.status}`,
    "",
    "Payment Instructions",
    "Please remit payment to the account details on file or contact accounts@daologistics.example for wire/ACH.",
    "Reference the invoice number on all payments.",
    "",
    "Thank you for your business.",
  ].join("\n");
}

function renderCustomerInvoiceHtml(input: {
  title: string;
  loadId: string;
  shipper: string;
  content: string;
}) {
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(input.title)}</title>
    <style>
      body { color: #0f172a; font-family: Arial, Helvetica, sans-serif; margin: 0; padding: 40px; }
      main { margin: 0 auto; max-width: 860px; }
      h1 { font-size: 22px; margin: 0 0 6px; }
      .meta { color: #475569; font-size: 13px; margin-bottom: 24px; }
      pre { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; font-family: monospace; font-size: 14px; line-height: 1.6; padding: 24px; white-space: pre-wrap; }
      @media print { body { padding: 0; } pre { border: 0; } }
    </style>
  </head>
  <body>
    <main>
      <h1>Invoice</h1>
      <p class="meta">${escapeHtml(input.shipper)} | Load ${escapeHtml(input.loadId)}</p>
      <pre>${escapeHtml(input.content)}</pre>
    </main>
  </body>
</html>`;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
