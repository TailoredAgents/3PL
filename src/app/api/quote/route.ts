import { runQuoteStructuringAgent } from "@/lib/grok";
import { hasDatabaseUrl, prisma } from "@/lib/prisma";
import { quoteRequestSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const formData = await request.formData();

  const parsed = quoteRequestSchema.safeParse({
    companyName: formData.get("companyName"),
    email: formData.get("email"),
    origin: formData.get("origin"),
    destination: formData.get("destination"),
    pickupDate: formData.get("pickupDate") ?? undefined,
    equipmentType: formData.get("equipmentType"),
    weight: formData.get("weight") ?? undefined,
    details: formData.get("details") ?? undefined,
  });

  if (!parsed.success) {
    return Response.json(
      { error: "Please complete the required quote fields." },
      { status: 400 },
    );
  }

  const agentResult = await runQuoteStructuringAgent(parsed.data);

  if (hasDatabaseUrl() && prisma) {
    const origin = parseLocation(parsed.data.origin);
    const destination = parseLocation(parsed.data.destination);
    const pickupDate = parsed.data.pickupDate
      ? new Date(`${parsed.data.pickupDate}T12:00:00.000Z`)
      : null;
    const weight = parsed.data.weight
      ? Number.parseInt(parsed.data.weight.replace(/\D/g, ""), 10)
      : null;

    const shipper = await prisma.shipper.create({
      data: {
        companyName: parsed.data.companyName,
        source: "QUOTE_FORM",
        notes: parsed.data.details,
        contacts: {
          create: {
            firstName: "Shipping",
            email: parsed.data.email,
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
        source: "QUOTE_FORM",
        stage: "QUALIFIED",
        priority: 2,
        notes: agentResult.nextAction,
      },
    });

    const quoteRequest = await prisma.quoteRequest.create({
      data: {
        shipperId: shipper.id,
        contactId: shipper.contacts[0]?.id,
        originCity: origin.city,
        originState: origin.state,
        destinationCity: destination.city,
        destinationState: destination.state,
        pickupDate,
        equipmentType: parsed.data.equipmentType,
        weight: Number.isNaN(weight) ? null : weight,
        specialRequirements: parsed.data.details,
        status: "NEW",
      },
    });

    await prisma.aiAgentRun.create({
      data: {
        agentName: "Quote Structuring Agent",
        relatedEntityType: "QuoteRequest",
        relatedEntityId: quoteRequest.id,
        status: "COMPLETED",
        inputJson: parsed.data,
        outputJson: agentResult,
        confidence: agentResult.confidence,
      },
    });
  }

  return Response.json({
    message:
      "Quote request received. It is ready for pricing, carrier coverage, and follow-up.",
    agentResult,
  });
}

function parseLocation(value: string) {
  const [city, state] = value.split(",").map((part) => part.trim());

  return {
    city: city || "Unknown",
    state: state || "NA",
  };
}
