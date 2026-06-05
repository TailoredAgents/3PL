import { revalidatePath } from "next/cache";

import { getCurrentInternalUser } from "@/lib/current-user";
import { formValue, nullableString, optionalDate } from "@/lib/server-utils";
import { hasDatabaseUrl, prisma } from "@/lib/prisma";
import { customerQuoteCreateSchema } from "@/lib/validation";

export async function POST(
  request: Request,
  context: RouteContext<"/api/quote-requests/[id]/customer-quotes">,
) {
  const { id } = await context.params;
  const formData = await request.formData();
  const parsed = customerQuoteCreateSchema.safeParse({
    quotedRate: formValue(formData, "quotedRate"),
    targetCarrierCost: formValue(formData, "targetCarrierCost") ?? "",
    validUntil: formValue(formData, "validUntil"),
    notes: formValue(formData, "notes"),
  });

  if (!parsed.success) {
    return Response.json(
      { error: "Enter a valid customer quote before saving." },
      { status: 400 },
    );
  }

  if (!hasDatabaseUrl() || !prisma) {
    return Response.json({
      message:
        "Customer quote validated. Connect DATABASE_URL to persist quote history.",
    });
  }

  const quoteRequest = await prisma.quoteRequest.findUnique({
    where: { id },
    include: { shipper: true, contact: true },
  });

  if (!quoteRequest) {
    return Response.json({ error: "Quote request not found." }, { status: 404 });
  }

  const input = parsed.data;
  const currentUser = await getCurrentInternalUser();
  const targetCarrierCost =
    typeof input.targetCarrierCost === "number"
      ? input.targetCarrierCost
      : null;
  const projectedGrossProfit =
    targetCarrierCost === null ? null : input.quotedRate - targetCarrierCost;
  const marginPercent =
    projectedGrossProfit === null
      ? null
      : Number(((projectedGrossProfit / input.quotedRate) * 100).toFixed(2));

  const customerQuote = await prisma.customerQuote.create({
    data: {
      quoteRequestId: quoteRequest.id,
      quotedRate: input.quotedRate,
      targetCarrierCost,
      projectedGrossProfit,
      marginPercent,
      status: "SENT",
      validUntil: optionalDate(input.validUntil),
      createdByUserId: currentUser?.id,
    },
  });

  await prisma.quoteRequest.update({
    where: { id },
    data: { status: "QUOTED" },
  });

  await prisma.activity.create({
    data: {
      shipperId: quoteRequest.shipperId,
      contactId: quoteRequest.contactId,
      userId: currentUser?.id,
      type: "CALL",
      direction: "OUTBOUND",
      subject: "Customer quote recorded",
      body:
        nullableString(input.notes) ??
        `Quoted $${input.quotedRate.toLocaleString()} for ${quoteRequest.originCity}, ${quoteRequest.originState} to ${quoteRequest.destinationCity}, ${quoteRequest.destinationState}.`,
      outcome: `Quote ${customerQuote.status.toLowerCase()}`,
    },
  });

  revalidatePath("/quote-requests");
  revalidatePath(`/quote-requests/${id}`);
  revalidatePath("/leads");
  revalidatePath("/dashboard");

  return Response.json({ message: "Customer quote saved." });
}
