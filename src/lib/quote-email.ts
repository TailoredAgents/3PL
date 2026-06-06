import type { QuoteRequestDetailView } from "@/lib/crm";
import { getQuoteEmailTemplate } from "@/lib/settings";
import { toCurrency } from "@/lib/utils";

export type QuoteEmailDraft = {
  toEmail: string;
  subject: string;
  body: string;
};

export async function buildQuoteEmailDraft(
  quote: QuoteRequestDetailView,
): Promise<QuoteEmailDraft | null> {
  const customerQuote = quote.latestQuote;

  if (!customerQuote) {
    return null;
  }

  const contactName =
    quote.contact === "No contact" ? "there" : quote.contact.split(" ")[0];
  const quoteEmailTemplate = await getQuoteEmailTemplate();
  const validUntilMessage =
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

  const variables: Record<string, string> = {
    brokerageName: "DAO Logistics",
    companyName: quote.company ?? "",
    contactFirstName: contactName,
    originCity: quote.originCity ?? "",
    originState: quote.originState ?? "",
    destinationCity: quote.destinationCity ?? "",
    destinationState: quote.destinationState ?? "",
    equipment: quote.equipment ?? "",
    pickup: quote.pickup ?? "",
    pickupWindow: quote.pickupWindow ?? "",
    delivery:
      !quote.delivery || quote.delivery === "Not set" ? "" : quote.delivery,
    deliveryWindow: quote.deliveryWindow ?? "",
    commodity:
      quote.commodity && quote.commodity !== "Commodity needed"
        ? quote.commodity
        : "",
    weight: quote.weight && quote.weight !== "Not set" ? quote.weight : "",
    quotedRate: toCurrency(customerQuote.quotedRate),
    validUntil: customerQuote.validUntil === "Not set" ? "" : customerQuote.validUntil,
    validUntilMessage,
    serviceDetails: serviceDetails.join("\n"),
  };

  return {
    toEmail: quote.email === "No email" ? "" : quote.email,
    subject: renderQuoteEmailTemplate(quoteEmailTemplate.subject, variables),
    body: renderQuoteEmailTemplate(quoteEmailTemplate.body, variables),
  };
}

function renderQuoteEmailTemplate(
  template: string,
  variables: Record<string, string>,
) {
  return template
    .replace(/\{\{\s*([a-zA-Z0-9]+)\s*\}\}/g, (_match, key: string) => {
      return variables[key] ?? "";
    })
    .replace(/[ \t]+\n/g, "\n")
    .trim();
}
