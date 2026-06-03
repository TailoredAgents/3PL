import { runSavingsAuditAgent } from "@/lib/grok";
import { hasDatabaseUrl, prisma } from "@/lib/prisma";
import { freightAuditSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const formData = await request.formData();
  const documents = formData
    .getAll("documents")
    .filter(isFileLike)
    .map((file) => ({
      name: file.name,
      size: file.size,
      type: file.type,
    }));

  const parsed = freightAuditSchema.safeParse({
    companyName: formData.get("companyName"),
    contactName: formData.get("contactName"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    lanes: formData.get("lanes"),
    equipmentType: formData.get("equipmentType"),
    monthlyVolume: formData.get("monthlyVolume") ?? undefined,
    documents,
  });

  if (!parsed.success) {
    return Response.json(
      { error: "Please complete the audit form and upload at least one file." },
      { status: 400 },
    );
  }

  const agentResult = await runSavingsAuditAgent(parsed.data);

  if (hasDatabaseUrl() && prisma) {
    const [firstName, ...lastNameParts] = parsed.data.contactName.split(" ");

    const shipper = await prisma.shipper.create({
      data: {
        companyName: parsed.data.companyName,
        source: "AUDIT",
        notes: `Common lanes: ${parsed.data.lanes}\nMonthly volume: ${
          parsed.data.monthlyVolume ?? "Not provided"
        }`,
        contacts: {
          create: {
            firstName,
            lastName: lastNameParts.join(" ") || null,
            email: parsed.data.email,
            phone: parsed.data.phone,
            isPrimary: true,
          },
        },
      },
      include: { contacts: true },
    });

    const contact = shipper.contacts[0];

    await prisma.lead.create({
      data: {
        shipperId: shipper.id,
        contactId: contact.id,
        source: "AUDIT",
        priority: 1,
        notes: agentResult.nextAction,
      },
    });

    const audit = await prisma.savingsAudit.create({
      data: {
        shipperId: shipper.id,
        contactId: contact.id,
        status: "COMPLETED",
        extractedLanes: {
          rawLaneNotes: parsed.data.lanes,
          equipmentType: parsed.data.equipmentType,
          documents,
        },
        reportSummary: agentResult.summary,
        grokConfidence: agentResult.confidence,
        completedAt: new Date(),
        documents: {
          create: documents.map((document) => ({
            type: "AUDIT_UPLOAD",
            fileName: document.name,
            fileUrl: `pending-storage://${document.name}`,
          })),
        },
      },
    });

    await prisma.aiAgentRun.create({
      data: {
        agentName: "Savings Audit Agent",
        relatedEntityType: "SavingsAudit",
        relatedEntityId: audit.id,
        status: "COMPLETED",
        inputJson: parsed.data,
        outputJson: agentResult,
        confidence: agentResult.confidence,
      },
    });
  }

  return Response.json({
    message:
      "Audit received. The CRM lead and AI savings report workflow are ready for review.",
    agentResult,
  });
}

function isFileLike(value: FormDataEntryValue): value is File {
  return (
    typeof value === "object" &&
    value !== null &&
    "name" in value &&
    "size" in value &&
    "type" in value
  );
}
