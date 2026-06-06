import { CheckCircle2, Mail, PhoneCall, ShieldCheck } from "lucide-react";

import {
  QuoteEmailTemplateSettingsForm,
  SettingsForm,
} from "@/components/crm-forms";
import { InternalShell } from "@/components/internal-shell";
import { isClerkAuthConfigured } from "@/lib/auth";
import { getCurrentInternalUser } from "@/lib/current-user";
import {
  getAppSettings,
  getQuoteEmailTemplate,
  quoteEmailTemplatePlaceholders,
} from "@/lib/settings";

export const dynamic = "force-dynamic";

const OPERATING_RULES = [
  "AI and Twilio call automation should use the disclosure before recording starts.",
  "Salespeople still review AI-filled quote drafts before saving customer-facing rates.",
  "Carrier acceptance stays tied to compliance status and signed rate confirmation.",
  "Billing readiness depends on carrier assignment, rate confirmation, POD, and invoice state.",
];

export default async function SettingsPage() {
  const [settings, quoteEmailTemplate, currentUser] = await Promise.all([
    getAppSettings(),
    getQuoteEmailTemplate(),
    getCurrentInternalUser(),
  ]);
  const clerkEnabled = isClerkAuthConfigured();
  const canManageSettings =
    !clerkEnabled ||
    currentUser?.role === "OWNER" ||
    currentUser?.role === "ADMIN";

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
