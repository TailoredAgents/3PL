import { revalidatePath } from "next/cache";

import {
  composeShipperNotes,
  nullableString,
  splitContactName,
} from "@/lib/server-utils";
import { hasDatabaseUrl, prisma } from "@/lib/prisma";

type ImportRow = {
  companyName: string;
  contactName: string;
  email?: string;
  phone?: string;
  lanes?: string;
  equipmentType?: string;
  monthlyVolume?: string;
  notes?: string;
};

export async function POST(request: Request) {
  const formData = await request.formData();
  const csvFile = formData.get("csv");

  if (!isFileLike(csvFile)) {
    return Response.json({ error: "Upload a CSV file." }, { status: 400 });
  }

  const text = await csvFile.text();
  const rows = normalizeRows(parseCsv(text));
  const validRows = rows.filter((row) => row.companyName && row.contactName);

  if (!validRows.length) {
    return Response.json(
      {
        error:
          "No importable rows found. Include company and contact columns.",
      },
      { status: 400 },
    );
  }

  if (!hasDatabaseUrl() || !prisma) {
    return Response.json({
      message: `Parsed ${validRows.length} contacts. Connect DATABASE_URL to persist imports.`,
      imported: 0,
      parsed: validRows.length,
    });
  }

  let imported = 0;

  for (const row of validRows) {
    const contactName = splitContactName(row.contactName);
    const shipperNotes = composeShipperNotes(row);

    const shipper = await prisma.shipper.create({
      data: {
        companyName: row.companyName,
        status: "LEAD",
        source: "MANUAL",
        notes: shipperNotes || nullableString(row.notes),
        contacts: {
          create: {
            ...contactName,
            email: nullableString(row.email),
            phone: nullableString(row.phone),
            isPrimary: true,
          },
        },
      },
      include: { contacts: true },
    });

    await prisma.lead.create({
      data: {
        shipperId: shipper.id,
        contactId: shipper.contacts[0]?.id,
        source: "MANUAL",
        stage: "NEW",
        priority: 3,
        notes:
          row.notes ??
          "Imported contact. Qualify lanes, shipment volume, and quote urgency.",
      },
    });

    imported += 1;
  }

  revalidatePath("/leads");
  revalidatePath("/shippers");
  revalidatePath("/dashboard");

  return Response.json({
    message: `Imported ${imported} contacts into the CRM.`,
    imported,
    parsed: validRows.length,
  });
}

function isFileLike(value: FormDataEntryValue | null): value is File {
  return (
    typeof value === "object" &&
    value !== null &&
    "name" in value &&
    "text" in value
  );
}

function normalizeRows(rows: Record<string, string>[]): ImportRow[] {
  return rows.map((row) => ({
    companyName: pick(row, "companyName", "company", "shipper", "account"),
    contactName: pick(row, "contactName", "contact", "name", "primaryContact"),
    email: pick(row, "email", "contactEmail"),
    phone: pick(row, "phone", "contactPhone", "mobile"),
    lanes: pick(row, "lanes", "lane", "commonLanes"),
    equipmentType: pick(row, "equipmentType", "equipment", "truckType"),
    monthlyVolume: pick(row, "monthlyVolume", "volume", "loadsPerMonth"),
    notes: pick(row, "notes", "pain", "comments"),
  }));
}

function pick(row: Record<string, string>, ...keys: string[]) {
  for (const key of keys) {
    const value = row[normalizeKey(key)];
    if (value) {
      return value;
    }
  }

  return "";
}

function parseCsv(text: string) {
  const rows = parseCsvRows(text);
  const [headers, ...body] = rows;

  if (!headers?.length) {
    return [];
  }

  const normalizedHeaders = headers.map(normalizeKey);

  return body
    .filter((row) => row.some((cell) => cell.trim()))
    .map((row) =>
      normalizedHeaders.reduce<Record<string, string>>((record, header, index) => {
        record[header] = row[index]?.trim() ?? "";
        return record;
      }, {}),
    );
}

function parseCsvRows(text: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (char === '"' && next === '"') {
      cell += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === "," && !inQuotes) {
      row.push(cell);
      cell = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") {
        index += 1;
      }

      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
      continue;
    }

    cell += char;
  }

  row.push(cell);
  rows.push(row);

  return rows;
}

function normalizeKey(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}
