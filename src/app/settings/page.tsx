import Link from "next/link";
import { redirect } from "next/navigation";
import {
  AlertCircle,
  Bot,
  CheckCircle2,
  ExternalLink,
  Mail,
  PhoneCall,
  Plug,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import {
  AgentModeToggleForm,
  QuoteEmailTemplateSettingsForm,
  SettingsForm,
} from "@/components/crm-forms";
import { InternalShell } from "@/components/internal-shell";
import { getAgentAutomationPolicy } from "@/lib/agent-control";
import { isClerkAuthConfigured } from "@/lib/auth";
import { defaultBrokerageAgentTemplates } from "@/lib/agent-config";
import { getCurrentInternalUser, requireInternalRole } from "@/lib/current-user";
import {
  getAgentModes,
  getAppSettings,
  getQuoteEmailTemplate,
  isAlwaysAutonomousAgent,
  quoteEmailTemplatePlaceholders,
} from "@/lib/settings";

export const dynamic = "force-dynamic";

const INTEGRATIONS = [
  {
    name: "Grok (xAI)",
    envKey: "XAI_API_KEY",
    description: "AI reasoning engine — powers freight automation agents",
    required: true,
  },
  {
    name: "FMCSA QCMobile",
    envKey: "FMCSA_WEB_KEY",
    description: "Live carrier authority, OOS status, and CSA safety scores",
    required: false,
  },
  {
    name: "EIA Diesel Prices",
    envKey: "EIA_API_KEY",
    description: "Weekly national diesel price for fuel surcharge calculations",
    required: false,
  },
  {
    name: "HERE Routing",
    envKey: "HERE_API_KEY",
    description: "Truck-specific mileage for rate-per-mile pricing",
    required: false,
  },
  {
    name: "CarrierOk",
    envKey: "CARRIEROK_API_KEY",
    description: "Carrier risk profiles and fraud signal detection",
    required: false,
  },
  {
    name: "Truckstop Rate Intelligence",
    envKey: "TRUCKSTOP_CLIENT_ID",
    description: "Live spot rates, carrier risk scores, and ELD tracking",
    required: false,
  },
] as const;

const OPERATING_RULES = [
  "AI and Twilio call automation should use the disclosure before recording starts.",
  "Salespeople still review AI-filled quote drafts before saving customer-facing rates.",
  "Carrier acceptance stays tied to compliance status and signed rate confirmation.",
  "Billing readiness depends on carrier assignment, rate confirmation, POD, and invoice state.",
];

const RISK_STYLES = {
  low: "bg-emerald-50 text-emerald-700",
  medium: "bg-amber-50 text-amber-700",
  high: "bg-red-50 text-red-700",
} as const;

export default async function SettingsPage() {
  try {
    await requireInternalRole(["OWNER", "ADMIN"]);
  } catch {
    redirect("/dashboard");
  }

  const [settings, quoteEmailTemplate, agentModes, currentUser] = await Promise.all([
    getAppSettings(),
    getQuoteEmailTemplate(),
    getAgentModes(),
    getCurrentInternalUser(),
  ]);
  const clerkEnabled = isClerkAuthConfigured();
  const canManageSettings =
    !clerkEnabled ||
    currentUser?.role === "OWNER" ||
    currentUser?.role === "ADMIN";

  const integrationStatus = INTEGRATIONS.map((integration) => ({
    ...integration,
    configured: Boolean(process.env[integration.envKey]),
  }));
  const configuredCount = integrationStatus.filter((i) => i.configured).length;
  const requiredMissingCount = integrationStatus.filter(
    (integration) => integration.required && !integration.configured,
  ).length;
  const autonomousAgents = defaultBrokerageAgentTemplates.filter((template) => {
    const mode = agentModes[template.agentName];
    return isAlwaysAutonomousAgent(template.agentName) || mode === "autonomous";
  }).length;
  const approvalLockedAgents = defaultBrokerageAgentTemplates.length - autonomousAgents;
  const highRiskAgents = defaultBrokerageAgentTemplates.filter(
    (template) => getAgentAutomationPolicy(template.agentName).riskLevel === "high",
  ).length;

  return (
    <InternalShell
      active="Settings"
      eyebrow="Configuration"
      title="Settings"
      description="Control operational defaults that the brokerage workflow and future integrations use."
      action={{ label: "Dashboard", href: "/dashboard" }}
    >
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatusCard
          icon={PhoneCall}
          label="Recording script"
          value={settings.callRecordingDisclosure ? "Ready" : "Missing"}
          detail="Used before recorded calls begin"
          tone={settings.callRecordingDisclosure ? "emerald" : "amber"}
        />
        <StatusCard
          icon={Mail}
          label="Quote email"
          value="Configured"
          detail="Template used on customer quotes"
          tone="sky"
        />
        <StatusCard
          icon={Bot}
          label="Agent approvals"
          value={`${approvalLockedAgents} guarded`}
          detail={`${autonomousAgents} autonomous agent${autonomousAgents === 1 ? "" : "s"}`}
          tone="violet"
        />
        <StatusCard
          icon={Plug}
          label="Integrations"
          value={`${configuredCount}/${integrationStatus.length}`}
          detail={
            requiredMissingCount
              ? `${requiredMissingCount} required key missing`
              : "Required providers connected"
          }
          tone={requiredMissingCount ? "red" : "emerald"}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <article className="overflow-hidden rounded-lg border border-slate-100 bg-white shadow-md shadow-slate-950/5">
          <div className="flex items-start justify-between gap-4 border-b border-slate-100 bg-slate-50 px-5 py-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                <PhoneCall className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">Call recording disclosure</p>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  This is the message callers hear before recording and AI transcription.
                </p>
              </div>
            </div>
            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
              Active
            </span>
          </div>
          <div className="p-5">
            {canManageSettings ? (
              <SettingsForm
                callRecordingDisclosure={settings.callRecordingDisclosure}
              />
            ) : (
              <p className="rounded-md border border-amber-100 bg-amber-50 p-4 text-sm font-semibold text-amber-900">
                Settings are limited to owner and admin users.
              </p>
            )}
          </div>
        </article>

        <article className="overflow-hidden rounded-lg border border-slate-100 bg-white shadow-md shadow-slate-950/5">
          <div className="flex items-start justify-between gap-4 border-b border-slate-100 bg-slate-50 px-5 py-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-50 text-sky-700">
                <Mail className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">Quote email template</p>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  The customer-facing email used when a quote is ready to send.
                </p>
              </div>
            </div>
            <span className="rounded-full bg-sky-50 px-2.5 py-1 text-xs font-bold text-sky-700">
              Customer-facing
            </span>
          </div>
          <div className="p-5">
            <div className="mb-4 rounded-lg border border-slate-100 bg-slate-50 p-3">
              <p className="mb-2 text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                Merge fields
              </p>
              <div className="flex flex-wrap gap-1.5">
                {quoteEmailTemplatePlaceholders.map((placeholder) => (
                  <span
                    key={placeholder}
                    className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600"
                  >
                    {`{{${placeholder}}}`}
                  </span>
                ))}
              </div>
            </div>
            {canManageSettings ? (
              <QuoteEmailTemplateSettingsForm
                subject={quoteEmailTemplate.subject}
                body={quoteEmailTemplate.body}
              />
            ) : (
              <p className="rounded-md border border-amber-100 bg-amber-50 p-4 text-sm font-semibold text-amber-900">
                Quote email templates are limited to owner and admin users.
              </p>
            )}
          </div>
        </article>
      </section>

      <article className="overflow-hidden rounded-lg border border-slate-100 bg-white shadow-md shadow-slate-950/5">
        <div className="flex flex-col gap-4 border-b border-slate-100 bg-slate-50 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-50 text-violet-700">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">AI automation guardrails</p>
              <p className="mt-1 max-w-3xl text-xs leading-5 text-slate-500">
                Choose which agents can act autonomously. High-risk financial, pricing,
                compliance, and booking actions stay approval-gated.
              </p>
            </div>
          </div>
          <div className="grid gap-2 text-xs font-bold text-slate-600 sm:grid-cols-3">
            <span className="rounded-full bg-white px-3 py-1.5 shadow-sm">
              {approvalLockedAgents} approve first
            </span>
            <span className="rounded-full bg-white px-3 py-1.5 shadow-sm">
              {autonomousAgents} autonomous
            </span>
            <span className="rounded-full bg-white px-3 py-1.5 shadow-sm">
              {highRiskAgents} high risk
            </span>
          </div>
        </div>
        <div className="grid gap-3 p-4 xl:grid-cols-2">
          {defaultBrokerageAgentTemplates.map((template) => (
            <AgentModeRow
              key={template.agentName}
              template={template}
              currentMode={agentModes[template.agentName]}
              canManageSettings={canManageSettings}
            />
          ))}
        </div>
      </article>

      <article className="overflow-hidden rounded-lg border border-slate-100 bg-white shadow-md shadow-slate-950/5">
        <div className="flex flex-col gap-4 border-b border-slate-100 bg-slate-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
              <Plug className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">External integration readiness</p>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                API keys stay in Render environment variables. Use Integrations for logs and health checks.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-600">
              {configuredCount} / {integrationStatus.length} configured
            </span>
            <Link
              href="/integrations"
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-sm hover:border-emerald-200 hover:text-emerald-700"
            >
              Logs <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
        </div>
        <div className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-3">
          {integrationStatus.map((integration) => (
            <div
              key={integration.envKey}
              className="rounded-lg border border-slate-100 bg-slate-50 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                  {integration.configured ? (
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                  ) : (
                    <AlertCircle
                      className={`mt-0.5 h-4 w-4 shrink-0 ${
                        integration.required ? "text-red-500" : "text-amber-400"
                      }`}
                    />
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900">{integration.name}</p>
                    <p className="mt-1 text-xs font-semibold text-slate-400">{integration.envKey}</p>
                  </div>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
                    integration.configured
                      ? "bg-emerald-50 text-emerald-700"
                      : integration.required
                        ? "bg-red-50 text-red-700"
                        : "bg-amber-50 text-amber-700"
                  }`}
                >
                  {integration.configured ? "Connected" : integration.required ? "Required" : "Not set"}
                </span>
              </div>
              <div className="mt-3">
                <p className="mt-0.5 text-xs text-slate-500">{integration.description}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="border-t border-slate-100 bg-slate-50 px-5 py-3">
          <p className="text-xs text-slate-500">
            Set API keys as environment variables on your Render deployment. Keys are never stored in the database.
          </p>
        </div>
      </article>

      <article className="overflow-hidden rounded-lg border border-slate-100 bg-white shadow-md shadow-slate-950/5">
        <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-5 py-3">
          <ShieldCheck className="h-4 w-4 text-emerald-600" />
          <p className="text-sm font-semibold text-slate-700">Operating guardrails</p>
        </div>
        <ul className="grid divide-y divide-slate-100 lg:grid-cols-2 lg:divide-x lg:divide-y-0">
          {OPERATING_RULES.map((rule) => (
            <li key={rule} className="flex items-start gap-3 px-5 py-3.5">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
              <p className="text-sm leading-6 text-slate-700">{rule}</p>
            </li>
          ))}
        </ul>
      </article>
    </InternalShell>
  );
}

function StatusCard({
  icon: Icon,
  label,
  value,
  detail,
  tone,
}: {
  icon: typeof PhoneCall;
  label: string;
  value: string;
  detail: string;
  tone: "amber" | "emerald" | "red" | "sky" | "violet";
}) {
  const toneClasses = {
    amber: {
      card: "border-l-amber-400",
      icon: "bg-amber-50 text-amber-700",
    },
    emerald: {
      card: "border-l-emerald-400",
      icon: "bg-emerald-50 text-emerald-700",
    },
    red: {
      card: "border-l-red-400",
      icon: "bg-red-50 text-red-700",
    },
    sky: {
      card: "border-l-sky-400",
      icon: "bg-sky-50 text-sky-700",
    },
    violet: {
      card: "border-l-violet-400",
      icon: "bg-violet-50 text-violet-700",
    },
  }[tone];

  return (
    <div className={`rounded-lg border border-l-4 border-slate-100 bg-white p-5 shadow-sm ${toneClasses.card}`}>
      <div className="flex items-center justify-between gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${toneClasses.icon}`}>
          <Icon className="h-5 w-5" />
        </div>
        <Sparkles className="h-4 w-4 text-slate-300" />
      </div>
      <p className="mt-4 text-sm font-semibold text-slate-600">{label}</p>
      <p className="mt-1 text-2xl font-black text-slate-950">{value}</p>
      <p className="mt-2 text-xs font-semibold text-slate-400">{detail}</p>
    </div>
  );
}

function AgentModeRow({
  template,
  currentMode,
  canManageSettings,
}: {
  template: (typeof defaultBrokerageAgentTemplates)[number];
  currentMode: string;
  canManageSettings: boolean;
}) {
  const policy = getAgentAutomationPolicy(template.agentName);
  const alwaysAutonomous = isAlwaysAutonomousAgent(template.agentName);
  const modeLabel = alwaysAutonomous
    ? "Always autonomous"
    : currentMode === "autonomous"
      ? "Autonomous"
      : "Approve first";

  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50 p-4">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-bold text-slate-900">{template.agentName}</p>
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-bold ${RISK_STYLES[policy.riskLevel]}`}
          >
            {policy.riskLevel} risk
          </span>
          <span className="rounded-full bg-white px-2 py-0.5 text-xs font-bold text-slate-500">
            {modeLabel}
          </span>
        </div>
        <p className="mt-2 text-sm leading-6 text-slate-600">{policy.actionSummary}</p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {policy.gatedActions.slice(0, 4).map((action) => (
            <span
              key={action}
              className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-500"
            >
              {action}
            </span>
          ))}
        </div>
      </div>
      <div className="mt-4 border-t border-slate-200 pt-4">
        {alwaysAutonomous ? (
          <span className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-emerald-700">
            Always autonomous
          </span>
        ) : canManageSettings ? (
          <AgentModeToggleForm
            agentName={template.agentName}
            currentMode={currentMode}
          />
        ) : (
          <span className="text-xs font-semibold capitalize text-slate-500">
            {currentMode.replace("_", " ")}
          </span>
        )}
      </div>
    </div>
  );
}
