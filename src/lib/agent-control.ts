import type { BrokerageAgentName } from "@/lib/agent-config";
import type { AgentMode } from "@/lib/settings";

export type AgentRiskLevel = "low" | "medium" | "high";

export type AgentAutomationPolicy = {
  riskLevel: AgentRiskLevel;
  approvalRequired: boolean;
  actionSummary: string;
  gatedActions: string[];
};

const policies: Record<BrokerageAgentName, AgentAutomationPolicy> = {
  "Sales Follow-Up Agent": {
    riskLevel: "medium",
    approvalRequired: true,
    actionSummary: "Drafts sales follow-up recommendations for human review.",
    gatedActions: [
      "Customer emails",
      "Customer SMS",
      "Outbound calls",
      "Lead stage changes",
    ],
  },
  "Quote Pricing Agent": {
    riskLevel: "high",
    approvalRequired: true,
    actionSummary: "Recommends quote pricing; money changes require approval.",
    gatedActions: [
      "Customer quote sends",
      "Sell-rate changes",
      "Margin overrides",
      "Load creation from quote",
    ],
  },
  "Carrier Coverage Agent": {
    riskLevel: "medium",
    approvalRequired: true,
    actionSummary: "Recommends carrier coverage; booking requires approval.",
    gatedActions: [
      "Carrier outreach",
      "Tender sends",
      "Carrier booking",
      "Marketplace posting",
    ],
  },
  "Load Tracking Agent": {
    riskLevel: "medium",
    approvalRequired: true,
    actionSummary: "Recommends tracking actions and exception triage.",
    gatedActions: [
      "Customer status updates",
      "Carrier escalation",
      "Exception closure",
    ],
  },
  "Billing Readiness Agent": {
    riskLevel: "high",
    approvalRequired: true,
    actionSummary: "Recommends billing actions; financial changes require approval.",
    gatedActions: [
      "Invoice creation",
      "Invoice send",
      "Carrier invoice approval",
      "Payment status changes",
    ],
  },
  "Carrier Compliance Agent": {
    riskLevel: "high",
    approvalRequired: true,
    actionSummary: "Recommends compliance decisions; carrier status changes require approval.",
    gatedActions: [
      "Carrier approval",
      "Carrier rejection",
      "Compliance overrides",
      "Booking gate changes",
    ],
  },
  "Conversation Notes Agent": {
    riskLevel: "low",
    approvalRequired: false,
    actionSummary: "Cleans and structures communication notes without external action.",
    gatedActions: [
      "Quote request creation",
      "Customer replies",
      "Load creation",
    ],
  },
};

export function getAgentAutomationPolicy(
  agentName: BrokerageAgentName,
): AgentAutomationPolicy {
  return policies[agentName];
}

export function getEffectiveAgentRunStatus({
  mode,
  policy,
}: {
  mode: AgentMode;
  policy: AgentAutomationPolicy;
}) {
  if (policy.approvalRequired || mode === "approve_first") {
    return "NEEDS_HUMAN_APPROVAL" as const;
  }

  return "COMPLETED" as const;
}
