export const brokerageAgentNames = [
  "Sales Follow-Up Agent",
  "Quote Pricing Agent",
  "Carrier Coverage Agent",
  "Load Tracking Agent",
  "Billing Readiness Agent",
  "Carrier Compliance Agent",
] as const;

export type BrokerageAgentName = (typeof brokerageAgentNames)[number];
