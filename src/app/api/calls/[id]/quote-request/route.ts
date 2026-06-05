import { revalidatePath } from "next/cache";

import { hasDatabaseUrl, prisma } from "@/lib/prisma";
import {
  createInternalQuoteRequest,
  parseInternalQuoteFormData,
} from "@/lib/quote-workflow";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const formData = await request.formData();
  const parsed = parseInternalQuoteFormData(formData);

  if (!parsed.success) {
    return Response.json(
      { error: "Please complete the required quote fields." },
      { status: 400 },
    );
  }

  if (!hasDatabaseUrl() || !prisma) {
    return Response.json({
      message:
        "Call quote draft validated. Connect DATABASE_URL to persist records.",
    });
  }

  const result = await createInternalQuoteRequest(parsed.data);

  await prisma.brokerageCall.update({
    where: { id },
    data: {
      quoteRequestId: result.quoteRequest.id,
      extractionStatus: "APPROVED",
      shipperId: result.shipper.id,
      contactId: result.contact.id,
    },
  });

  await prisma.activity.create({
    data: {
      shipperId: result.shipper.id,
      contactId: result.contact.id,
      type: "CALL",
      direction: "INBOUND",
      subject: "Quote request created from call",
      body: `Call intelligence draft approved for ${result.quoteRequest.originCity}, ${result.quoteRequest.originState} to ${result.quoteRequest.destinationCity}, ${result.quoteRequest.destinationState}.`,
      outcome: "Quote request created",
    },
  });

  revalidatePath("/calls");
  revalidatePath(`/calls/${id}`);
  revalidatePath("/quote-requests");
  revalidatePath(`/quote-requests/${result.quoteRequest.id}`);
  revalidatePath("/dashboard");

  return Response.json({
    message: "Quote request created from call.",
    redirectTo: `/quote-requests/${result.quoteRequest.id}`,
  });
}
