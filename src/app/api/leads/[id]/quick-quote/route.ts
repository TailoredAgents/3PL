import { revalidatePath } from "next/cache";

import { runAndLogBrokerageAgent } from "@/lib/agent-workflow";
import { hasDatabaseUrl } from "@/lib/prisma";
import { createInternalQuoteRequest, parseInternalQuoteFormData } from "@/lib/quote-workflow";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const formData = await request.formData();
  const parsed = parseInternalQuoteFormData(formData);

  if (!parsed.success) {
    const missing = parsed.error.issues.map((i) => i.path.join(".")).join(", ");
    return Response.json(
      { error: `Please fill in: ${missing || "origin, destination, and equipment type"}.` },
      { status: 400 },
    );
  }

  if (!hasDatabaseUrl()) {
    return Response.json({
      message: "Quote validated. Connect DATABASE_URL to persist records.",
    });
  }

  const result = await createInternalQuoteRequest(parsed.data);
  const quoteRequestId = result.quoteRequest.id;

  // Run Quote Pricing Agent immediately — awaited so result is inline
  let pricingSummary: string | null = null;
  try {
    const { agentResult } = await runAndLogBrokerageAgent({
      agentName: "Quote Pricing Agent",
      relatedEntityType: "QuoteRequest",
      relatedEntityId: quoteRequestId,
    });
    pricingSummary = agentResult.summary ?? null;
  } catch {
    // Pricing is best-effort; quote is still created
  }

  revalidatePath("/quote-requests");
  revalidatePath(`/quote-requests/${quoteRequestId}`);
  revalidatePath(`/leads/${id}`);
  revalidatePath("/communications");
  revalidatePath("/dashboard");

  return Response.json({
    message: "Quote created and priced.",
    quoteRequestId,
    pricingSummary,
  });
}
