import { revalidatePath } from "next/cache";

import {
  composeShipperNotes,
  formValue,
  nullableString,
  optionalDate,
  splitContactName,
} from "@/lib/server-utils";
import { hasDatabaseUrl, prisma } from "@/lib/prisma";
import { leadCreateSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const formData = await request.formData();
  const parsed = leadCreateSchema.safeParse({
    companyName: formValue(formData, "companyName"),
    contactName: formValue(formData, "contactName"),
    title: formValue(formData, "title"),
    email: formValue(formData, "email") ?? "",
    phone: formValue(formData, "phone"),
    stage: formValue(formData, "stage") ?? "NEW",
    source: formValue(formData, "source") ?? "MANUAL",
    priority: formValue(formData, "priority") ?? "3",
    lanes: formValue(formData, "lanes"),
    equipmentType: formValue(formData, "equipmentType"),
    monthlyVolume: formValue(formData, "monthlyVolume"),
    nextFollowUpAt: formValue(formData, "nextFollowUpAt"),
    notes: formValue(formData, "notes"),
  });

  if (!parsed.success) {
    return Response.json(
      { error: "Please complete the required lead fields." },
      { status: 400 },
    );
  }

  if (!hasDatabaseUrl() || !prisma) {
    return Response.json({
      message:
        "Lead validated. Connect DATABASE_URL to persist CRM records.",
    });
  }

  const input = parsed.data;
  const contactName = splitContactName(input.contactName);
  const shipperNotes = composeShipperNotes(input);

  const shipper = await prisma.shipper.create({
    data: {
      companyName: input.companyName,
      status: input.stage === "WON" ? "ACTIVE" : "LEAD",
      source: input.source,
      notes: shipperNotes || nullableString(input.notes),
      contacts: {
        create: {
          ...contactName,
          title: nullableString(input.title),
          email: nullableString(input.email),
          phone: nullableString(input.phone),
          isPrimary: true,
        },
      },
    },
    include: { contacts: true },
  });

  const lead = await prisma.lead.create({
    data: {
      shipperId: shipper.id,
      contactId: shipper.contacts[0]?.id,
      stage: input.stage,
      source: input.source,
      priority: input.priority,
      nextFollowUpAt: optionalDate(input.nextFollowUpAt),
      notes:
        input.notes ??
        "New lead created. Qualify lanes, volume, current provider pain, and quote urgency.",
    },
  });

  await prisma.activity.create({
    data: {
      leadId: lead.id,
      shipperId: shipper.id,
      contactId: shipper.contacts[0]?.id,
      type: "NOTE",
      direction: "INTERNAL",
      subject: "Lead created",
      body: input.notes ?? "Lead created from internal CRM form.",
    },
  });

  revalidatePath("/leads");
  revalidatePath("/shippers");
  revalidatePath("/dashboard");

  return Response.json({ message: "Lead created and added to the CRM." });
}
