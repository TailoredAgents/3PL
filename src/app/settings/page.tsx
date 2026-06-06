import { AlertCircle, Bot, CheckCircle2, Mail, PhoneCall, Plug, ShieldCheck } from "lucide-react";

import {
  AgentModeToggleForm,
  QuoteEmailTemplateSettingsForm,
  SettingsForm,
} from "@/components/crm-forms";
import { InternalShell } from "@/components/internal-shell";
import { isClerkAuthConfigured } from "@/lib/auth";
import { defaultBrokerageAgentTemplates } from "@/lib/agent-config";
import { getCurrentInternalUser } from "@/lib/current-user";
import {
  getAgentModes,
  getAppSettings,
  getQuoteEmailTemplate,
  quoteEmailTemplatePlaceholders,
} from "@/lib/settings";

export const dynamic = "force-dynamic";

const INTEGRATIONS = [
  {
    name: "Grok (xAI)",
    envKey: "XAI_API_KEY",
    description: "AI reasoning engine — powers all six agents",
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

export default async function SettingsPage() {
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

  return (
    <InternalShell
      active="Settings"
      eyebrow="Configuration"
      title="Settings"
      description="Control operational defaults that the brokerage workflow and future integrations use."
      action={{ label: "Dashboard", href: "/dashboard" }}
    >
      <section className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
        {/* Call recording disclosure */}
        <article className="overflow-hidden rounded-lg border border-slate-100 bg-white shadow-md shadow-slate-950/5">
          <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-5 py-3">
            <PhoneCall className="h-4 w-4 text-slate-400" />
            <p className="text-sm font-semibold text-slate-700">Call recording disclosure</p>
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

        {/* Quote email template */}
        <article className="overflow-hidden rounded-lg border border-slate-100 bg-white shadow-md shadow-slate-950/5">
          <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-5 py-3">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-slate-400" />
              <p className="text-sm font-semibold text-slate-700">Quote email template</p>
            </div>
            <span className="text-xs text-slate-400">Used on each quoted request</span>
          </div>
          <div className="p-5">
            <div className="mb-4 flex flex-wrap gap-1.5">
              {quoteEmailTemplatePlaceholders.map((placeholder) => (
                <span
                  key={placeholder}
                  className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600"
                >
                  {`{{${placeholder}}}`}
                </span>
              ))}
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

      {/* AI agent execution modes */}
      <article className="overflow-hidden rounded-lg border border-slate-100 bg-white shadow-md shadow-slate-950/5">
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-5 py-3">
          <div className="flex items-center gap-2">
            <Bot className="h-4 w-4 text-slate-400" />
            <p className="text-sm font-semibold text-slate-700">AI agent execution modes</p>
          </div>
          <span className="text-xs text-slate-400">Approve first holds each run for broker review</span>
        </div>
        <div className="divide-y divide-slate-100">
          {defaultBrokerageAgentTemplates.map((template) => (
            <div
              key={template.agentName}
              className="grid gap-3 px-5 py-4 sm:grid-cols-[1fr_auto] sm:items-center"
            >
              <div>
                <p className="text-sm font-semibold text-slate-900">{template.agentName}</p>
                <p className="mt-0.5 text-xs leading-5 text-slate-500">{template.task}</p>
              </div>
              {canManageSettings ? (
                <AgentModeToggleForm
                  agentName={template.agentName}
                  currentMode={agentModes[template.agentName]}
                />
              ) : (
                <span className="text-xs font-semibold capitalize text-slate-500">
                  {agentModes[template.agentName].replace("_", " ")}
                </span>
              )}
            </div>
          ))}
        </div>
      </article>

      {/* External integrations status */}
      <article className="overflow-hidden rounded-lg border border-slate-100 bg-white shadow-md shadow-slate-950/5">
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-5 py-3">
          <div className="flex items-center gap-2">
            <Plug className="h-4 w-4 text-slate-400" />
            <p className="text-sm font-semibold text-slate-700">External integrations</p>
          </div>
          <span className="rounded-full bg-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-600">
            {configuredCount} / {integrationStatus.length} configured
          </span>
        </div>
        <div className="divide-y divide-slate-100">
          {integrationStatus.map((integration) => (
            <div key={integration.envKey} className="flex items-center gap-4 px-5 py-3.5">
              {integration.configured ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
              ) : (
                <AlertCircle className={`h-4 w-4 shrink-0 ${integration.required ? "text-red-500" : "text-amber-400"}`} />
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-900">{integration.name}</p>
                <p className="mt-0.5 text-xs text-slate-500">{integration.description}</p>
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
          ))}
        </div>
        <div className="border-t border-slate-100 bg-slate-50 px-5 py-3">
          <p className="text-xs text-slate-500">
            Set API keys as environment variables on your Render deployment. Keys are never stored in the database.
          </p>
        </div>
      </article>

      {/* Phase 1 operating rules */}
      <article className="overflow-hidden rounded-lg border border-slate-100 bg-white shadow-md shadow-slate-950/5 xl:max-w-[calc(50%-12px)]">
        <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-5 py-3">
          <ShieldCheck className="h-4 w-4 text-slate-400" />
          <p className="text-sm font-semibold text-slate-700">Phase 1 operating rules</p>
        </div>
        <ul className="divide-y divide-slate-100">
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
