import { DocumentExtractionStatus, DocumentSource } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { toCurrency } from "@/lib/utils";

export async function generateRateConfirmationDocument(loadId: string) {
  if (!prisma) {
    throw new Error("Database is not configured.");
  }

  const load = await prisma.load.findUnique({
    where: { id: loadId },
    include: {
      shipper: true,
      carrier: true,
    },
  });

  if (!load) {
    throw new Error("Load not found.");
  }

  if (!load.carrier) {
    throw new Error("Assign an approved carrier before drafting a rate confirmation.");
  }

  if (load.carrier.complianceStatus !== "APPROVED") {
    throw new Error("Approve carrier compliance before drafting a rate confirmation.");
  }

  if (!load.carrierRate) {
    throw new Error("Enter the carrier rate before drafting a rate confirmation.");
  }

  const carrierCompanyName = load.carrier.companyName;
  const content = buildRateConfirmationContent({
    id: load.id,
    shipper: load.shipper.companyName,
    carrier: carrierCompanyName,
    carrierContact: load.carrier.contactName,
    carrierPhone: load.carrier.phone,
    carrierEmail: load.carrier.email,
    mcNumber: load.carrier.mcNumber,
    dotNumber: load.carrier.dotNumber,
    origin: `${load.originCity}, ${load.originState}`,
    originAddress: load.originAddress,
    destination: `${load.destinationCity}, ${load.destinationState}`,
    destinationAddress: load.destinationAddress,
    equipmentType: load.equipmentType,
    commodity: load.commodity,
    weight: load.weight,
    palletCount: load.palletCount,
    pieceCount: load.pieceCount,
    dimensions: load.dimensions,
    hazmat: load.hazmat,
    temperatureRequirement: load.temperatureRequirement,
    appointmentRequired: load.appointmentRequired,
    accessorials: load.accessorials,
    customerReference: load.customerReference,
    pickupDate: load.pickupDate,
    pickupWindow: load.pickupWindow,
    deliveryDate: load.deliveryDate,
    deliveryWindow: load.deliveryWindow,
    carrierRate: Number(load.carrierRate),
  });
  const fileName = `rate-confirmation-${formatLoadNumber(load.loadNumber)}.pdf`;
  const fileUrl = `/api/loads/${load.id}/rate-confirmation/pdf`;
  const pdfBytes = buildRateConfirmationPdf(content);
  const now = new Date();
  const document = await prisma.$transaction(async (tx) => {
    const createdDocument = await tx.document.create({
      data: {
        loadId: load.id,
        shipperId: load.shipperId,
        type: "RATE_CONFIRMATION",
        source: DocumentSource.SYSTEM_GENERATED,
        extractionStatus: DocumentExtractionStatus.COMPLETED,
        fileName,
        fileUrl,
        mimeType: "application/pdf",
        fileSize: pdfBytes.length,
        extractedText: content,
      },
    });

    await tx.load.update({
      where: { id: load.id },
      data: {
        rateConfirmationStatus:
          load.rateConfirmationStatus === "NOT_STARTED"
            ? "DRAFTED"
            : load.rateConfirmationStatus,
      },
    });

    await tx.shipmentEvent.create({
      data: {
        loadId: load.id,
        type: "LOCATION_UPDATE",
        message: `Rate confirmation drafted for ${carrierCompanyName}.`,
        occurredAt: now,
      },
    });

    return createdDocument;
  });

  return document;
}

export async function getPrintableRateConfirmation(loadId: string) {
  if (!prisma) {
    throw new Error("Database is not configured.");
  }

  const load = await prisma.load.findUnique({
    where: { id: loadId },
    include: {
      shipper: true,
      carrier: true,
      documents: {
        where: { type: "RATE_CONFIRMATION" },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  if (!load) {
    throw new Error("Load not found.");
  }

  const document = load.documents[0];

  if (!document?.extractedText) {
    throw new Error("Generate a rate confirmation before opening the printable view.");
  }

  return {
    title: document.fileName,
    html: renderRateConfirmationHtml({
      title: document.fileName,
      loadId: load.id,
      shipper: load.shipper.companyName,
      carrier: load.carrier?.companyName ?? "Carrier",
      content: document.extractedText,
    }),
  };
}

export async function getRateConfirmationPdf(loadId: string) {
  if (!prisma) {
    throw new Error("Database is not configured.");
  }

  const load = await prisma.load.findUnique({
    where: { id: loadId },
    include: {
      shipper: true,
      carrier: true,
      documents: {
        where: { type: "RATE_CONFIRMATION" },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  if (!load) {
    throw new Error("Load not found.");
  }

  const document = load.documents[0];

  if (!document?.extractedText) {
    throw new Error("Generate a rate confirmation before opening the PDF.");
  }

  return {
    title: getPdfFileName(document.fileName, load.loadNumber),
    pdf: buildRateConfirmationPdf(document.extractedText),
  };
}

function buildRateConfirmationContent(input: {
  id: string;
  shipper: string;
  carrier: string;
  carrierContact: string | null;
  carrierPhone: string | null;
  carrierEmail: string | null;
  mcNumber: string | null;
  dotNumber: string | null;
  origin: string;
  originAddress: string | null;
  destination: string;
  destinationAddress: string | null;
  equipmentType: string;
  commodity: string | null;
  weight: number | null;
  palletCount: number | null;
  pieceCount: number | null;
  dimensions: string | null;
  hazmat: boolean;
  temperatureRequirement: string | null;
  appointmentRequired: boolean;
  accessorials: string | null;
  customerReference: string | null;
  pickupDate: Date | null;
  pickupWindow: string | null;
  deliveryDate: Date | null;
  deliveryWindow: string | null;
  carrierRate: number;
}) {
  return [
    "ATLANTA FREIGHT OS RATE CONFIRMATION",
    `Load ID: ${input.id}`,
    `Generated: ${formatDateTime(new Date())}`,
    "",
    "Carrier",
    `Company: ${input.carrier}`,
    `Dispatch contact: ${input.carrierContact ?? "Not provided"}`,
    `Phone: ${input.carrierPhone ?? "Not provided"}`,
    `Email: ${input.carrierEmail ?? "Not provided"}`,
    `MC: ${input.mcNumber ?? "Not provided"}`,
    `DOT: ${input.dotNumber ?? "Not provided"}`,
    "",
    "Load",
    `Shipper: ${input.shipper}`,
    `Customer reference: ${input.customerReference ?? "Not provided"}`,
    `Origin: ${input.origin}`,
    `Pickup address: ${input.originAddress ?? "Not provided"}`,
    `Pickup: ${input.pickupDate ? formatDate(input.pickupDate) : "Not set"} ${input.pickupWindow ?? ""}`.trim(),
    `Destination: ${input.destination}`,
    `Delivery address: ${input.destinationAddress ?? "Not provided"}`,
    `Delivery: ${input.deliveryDate ? formatDate(input.deliveryDate) : "Not set"} ${input.deliveryWindow ?? ""}`.trim(),
    "",
    "Freight",
    `Equipment: ${input.equipmentType}`,
    `Commodity: ${input.commodity ?? "Not provided"}`,
    `Weight: ${input.weight ? `${input.weight.toLocaleString()} lbs` : "Not provided"}`,
    `Pallets: ${input.palletCount ?? "Not provided"}`,
    `Pieces: ${input.pieceCount ?? "Not provided"}`,
    `Dimensions: ${input.dimensions ?? "Not provided"}`,
    `Hazmat: ${input.hazmat ? "Yes" : "No"}`,
    `Temperature: ${input.temperatureRequirement ?? "None"}`,
    `Appointment required: ${input.appointmentRequired ? "Yes" : "No"}`,
    `Accessorials: ${input.accessorials ?? "None"}`,
    "",
    "Rate",
    `Carrier linehaul/accessorial total: ${toCurrency(input.carrierRate)}`,
    "Detention, layover, tonu, lumper, and other accessorials require broker approval before charges are accepted.",
    "",
    "Instructions",
    "Carrier must confirm pickup, report delays immediately, provide tracking updates, and submit POD after delivery.",
    "Carrier may not double broker this load. Carrier must maintain active authority and valid insurance through delivery.",
    "",
    "Signatures",
    "Carrier signature: ________________________________ Date: __________",
    "Broker signature: _________________________________ Date: __________",
  ].join("\n");
}

export function buildRateConfirmationPdf(content: string) {
  const lines = paginatePdfLines(wrapPdfText(content));
  const objects: Array<{ id: number; content: string }> = [
    { id: 1, content: "<< /Type /Catalog /Pages 2 0 R >>" },
  ];
  const pageObjectIds = lines.map((_page, index) => 4 + index * 2);
  const fontObjectId = 3;

  objects.push({
    id: 2,
    content: `<< /Type /Pages /Kids [${pageObjectIds
      .map((id) => `${id} 0 R`)
      .join(" ")}] /Count ${pageObjectIds.length} >>`,
  });
  objects.push({
    id: fontObjectId,
    content: "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
  });

  lines.forEach((pageLines, index) => {
    const pageObjectId = pageObjectIds[index];
    const contentObjectId = pageObjectId + 1;
    const stream = buildPdfTextStream(pageLines);

    objects.push({
      id: pageObjectId,
      content: `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 ${fontObjectId} 0 R >> >> /Contents ${contentObjectId} 0 R >>`,
    });
    objects.push({
      id: contentObjectId,
      content: `<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}\nendstream`,
    });
  });

  objects.sort((a, b) => a.id - b.id);

  let output = "%PDF-1.4\n";
  const offsets: number[] = [0];

  for (const object of objects) {
    offsets[object.id] = Buffer.byteLength(output);
    output += `${object.id} 0 obj\n${object.content}\nendobj\n`;
  }

  const xrefOffset = Buffer.byteLength(output);
  output += `xref\n0 ${objects.length + 1}\n`;
  output += "0000000000 65535 f \n";

  for (let id = 1; id <= objects.length; id += 1) {
    output += `${String(offsets[id]).padStart(10, "0")} 00000 n \n`;
  }

  output += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;

  return Buffer.from(output, "ascii");
}

function wrapPdfText(content: string) {
  const maxLength = 88;

  return content
    .split("\n")
    .flatMap((line) => {
      const normalized = normalizePdfText(line);

      if (!normalized.trim()) {
        return [""];
      }

      const wrapped: string[] = [];
      let current = "";

      for (const word of normalized.split(/\s+/)) {
        const next = current ? `${current} ${word}` : word;

        if (next.length > maxLength && current) {
          wrapped.push(current);
          current = word;
        } else {
          current = next;
        }
      }

      if (current) {
        wrapped.push(current);
      }

      return wrapped;
    });
}

function paginatePdfLines(lines: string[]) {
  const linesPerPage = 49;
  const pages: string[][] = [];

  for (let index = 0; index < lines.length; index += linesPerPage) {
    pages.push(lines.slice(index, index + linesPerPage));
  }

  return pages.length ? pages : [["Rate confirmation"]];
}

function buildPdfTextStream(lines: string[]) {
  return [
    "BT",
    "/F1 10 Tf",
    "50 742 Td",
    "14 TL",
    ...lines.map((line) => `(${escapePdfText(line)}) Tj T*`),
    "ET",
  ].join("\n");
}

function normalizePdfText(value: string) {
  return value
    .replaceAll("→", "->")
    .replaceAll("•", "-")
    .replaceAll("—", "-")
    .replaceAll("–", "-")
    .replaceAll("’", "'")
    .replaceAll("“", '"')
    .replaceAll("”", '"')
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, "");
}

function escapePdfText(value: string) {
  return normalizePdfText(value).replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function renderRateConfirmationHtml(input: {
  title: string;
  loadId: string;
  shipper: string;
  carrier: string;
  content: string;
}) {
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(input.title)}</title>
    <style>
      body {
        color: #0f172a;
        font-family: Arial, Helvetica, sans-serif;
        margin: 0;
        padding: 40px;
      }
      main {
        margin: 0 auto;
        max-width: 860px;
      }
      h1 {
        font-size: 24px;
        margin: 0 0 6px;
      }
      .meta {
        color: #475569;
        font-size: 13px;
        margin-bottom: 24px;
      }
      pre {
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        font-family: Arial, Helvetica, sans-serif;
        font-size: 14px;
        line-height: 1.65;
        padding: 24px;
        white-space: pre-wrap;
      }
      @media print {
        body {
          padding: 0;
        }
        pre {
          border: 0;
        }
      }
    </style>
  </head>
  <body>
    <main>
      <h1>Rate Confirmation</h1>
      <p class="meta">${escapeHtml(input.shipper)} | ${escapeHtml(input.carrier)} | ${escapeHtml(input.loadId)}</p>
      <pre>${escapeHtml(input.content)}</pre>
    </main>
  </body>
</html>`;
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(value);
}

function formatLoadNumber(loadNumber: number | null) {
  return `LD-${String(loadNumber ?? "").padStart(4, "0")}`;
}

function getPdfFileName(fileName: string, loadNumber: number | null) {
  if (fileName.toLowerCase().endsWith(".pdf")) {
    return fileName;
  }

  return `rate-confirmation-${formatLoadNumber(loadNumber)}.pdf`;
}

function formatDateTime(value: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(value);
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
