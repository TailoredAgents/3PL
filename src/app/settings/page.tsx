import { PhoneCall, ShieldCheck } from "lucide-react";

import { SettingsForm } from "@/components/crm-forms";
import { InternalShell } from "@/components/internal-shell";
import { getAppSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const settings = await getAppSettings();

  return (
    <InternalShell
      active="Settings"
      eyebrow="Configuration"
      title="Settings"
      description="Control operational defaults that the brokerage workflow and future integrations use."
      action={{ label: "Dashboard", href: "/dashboard" }}
    >
      <section className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
        <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <PhoneCall className="h-6 w-6 text-emerald-600" />
            <h2 className="text-2xl font-semibold">Call recording disclosure</h2>
          </div>
          <p className="mt-3 leading-7 text-slate-600">
            This message is the configurable notice callers should hear before
            call recording and transcription begin. Twilio wiring comes later,
            but the system setting is ready now.
          </p>
          <div className="mt-5 rounded-lg bg-slate-50 p-4">
            <SettingsForm
              callRecordingDisclosure={settings.callRecordingDisclosure}
            />
          </div>
        </article>

        <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-6 w-6 text-emerald-600" />
            <h2 className="text-2xl font-semibold">Phase 1 operating rules</h2>
          </div>
          <div className="mt-5 grid gap-3 text-sm leading-6 text-slate-700">
            {[
              "AI and Twilio call automation should use this disclosure before recording starts.",
              "Salespeople still review AI-filled quote drafts before saving customer-facing rates.",
              "Carrier acceptance should stay tied to compliance status and signed rate confirmation state.",
              "Billing readiness depends on carrier assignment, rate confirmation, POD, and invoice state.",
            ].map((rule) => (
              <p key={rule} className="rounded-md bg-slate-50 p-4">
                {rule}
              </p>
            ))}
          </div>
        </article>
      </section>
    </InternalShell>
  );
}
