export const brokerageAgentNames = [
  "Sales Follow-Up Agent",
  "Quote Pricing Agent",
  "Carrier Coverage Agent",
  "Load Tracking Agent",
  "Billing Readiness Agent",
  "Carrier Compliance Agent",
] as const;

export type BrokerageAgentName = (typeof brokerageAgentNames)[number];

export type BrokerageAgentTemplate = {
  agentName: BrokerageAgentName;
  systemPrompt: string;
  task: string;
  placeholderNextAction: string;
};

export const defaultBrokerageAgentTemplates: BrokerageAgentTemplate[] = [
  {
    agentName: "Sales Follow-Up Agent",
    systemPrompt:
      "You are a freight brokerage sales manager helping a broker decide the next best human follow-up.",
    task:
      "Review the lead record and recommend the best next call, email, or qualification action.",
    placeholderNextAction:
      "Call the contact, confirm lane volume and service pain, then schedule the next follow-up.",
  },
  {
    agentName: "Quote Pricing Agent",
    systemPrompt:
      "You are a freight brokerage pricing analyst reviewing shipper quote details before the broker gives a rate.",
    task:
      "Review the quote request, identify missing pricing facts, and recommend the next pricing action.",
    placeholderNextAction:
      "Confirm service requirements, estimate target buy rate, then record a customer quote.",
  },
  {
    agentName: "Carrier Coverage Agent",
    systemPrompt:
      "You are a carrier sales and coverage coordinator evaluating carrier options for a load.",
    task:
      "Review the load and carrier offers, then recommend the strongest compliant coverage path.",
    placeholderNextAction:
      "Prioritize approved carriers, compare margin, and accept the best compliant offer.",
  },
  {
    agentName: "Load Tracking Agent",
    systemPrompt:
      "You are a freight operations coordinator watching active load execution and customer update needs.",
    task:
      "Review load status, events, documents, and risk notes, then recommend the next tracking action.",
    placeholderNextAction:
      "Call or text dispatch for the next status update, then log a shipment event.",
  },
  {
    agentName: "Billing Readiness Agent",
    systemPrompt:
      "You are a freight brokerage billing coordinator checking POD and invoice readiness.",
    task:
      "Review load documents, POD state, invoice state, and margin, then recommend the next billing action.",
    placeholderNextAction:
      "Collect POD if missing; otherwise create or send the invoice and log the billing status.",
  },
  {
    agentName: "Carrier Compliance Agent",
    systemPrompt:
      "You are a carrier compliance coordinator checking whether a carrier can be safely used.",
    task:
      "Review carrier compliance, identifiers, contact details, lanes, and related load context, then recommend the next compliance action.",
    placeholderNextAction:
      "Verify authority, insurance, MC/DOT details, and only tender once compliance is approved.",
  },
];

export function getDefaultBrokerageAgentTemplate(
  agentName: BrokerageAgentName,
) {
  return defaultBrokerageAgentTemplates.find(
    (template) => template.agentName === agentName,
  );
}
