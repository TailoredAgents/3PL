import type { QuoteRequestDetailView } from "@/lib/crm";
import { toCurrency } from "@/lib/utils";

export type QuoteEmailDraft = {
  toEmail: string;
  subject: string;
  body: string;
};

export function buildQuoteEmailDraft(
  quote: QuoteRequestDetailView,
): QuoteEmailDraft | null {
  const customerQuote = quote.latestQuote;

  if (!customerQuote) {
    return null;
  }

  const contactName =
    quote.contact === "No contact" ? "there" : quote.contact.split(" ")[0];
  const validUntil =
    customerQuote.validUntil === "Not set"
      ? "This rate is subject to market movement until confirmed."
      : `This rate is valid until ${customerQuote.validUntil}.`;
  const serviceDetails = [
    `Lane: ${quote.originCity}, ${quote.originState} to ${quote.destinationCity}, ${quote.destinationState}`,
    `Equipment: ${quote.equipment}`,
    `Pickup: ${quote.pickup} ${quote.pickupWindow ?? ""}`.trim(),
    quote.delivery === "Not set"
      ? null
      : `Delivery: ${quote.delivery} ${quote.deliveryWindow ?? ""}`.trim(),
    quote.commodity && quote.commodity !== "Commodity needed"
      ? `Commodity: ${quote.commodity}`
      : null,
    quote.weight && quote.weight !== "Not set" ? `Weight: ${quote.weight}` : null,
  ].filter(Boolean);

  return {
    toEmail: quote.email === "No email" ? "" : quote.email,
    subject: `Freight quote: ${quote.originCity}, ${quote.originState} to ${quote.destinationCity}, ${quote.destinationState}`,
    body: [
      `Hi ${contactName},`,
      `Thank you for the opportunity. Based on the shipment details provided, we can cover this load for ${toCurrency(customerQuote.quotedRate)}.`,
      serviceDetails.join("\n"),
      validUntil,
      "If this works, reply with approval and any final pickup or delivery instructions. Once approved, we will move it into dispatch and send the required confirmation details.",
      "Thank you,",
      "Atlanta Freight OS",
    ].join("\n\n"),
  };
}
