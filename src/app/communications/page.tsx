import Link from "next/link";
import {
  ArrowRight,
  ClipboardList,
  FileText,
  Mail,
  MessageSquareText,
  PhoneCall,
  Send,
  TriangleAlert,
} from "lucide-react";

import { InternalShell } from "@/components/internal-shell";
import { getCallViews } from "@/lib/calls";
import {
  getEmailEventDashboardView,
  getIntakeViews,
  getLeadViews,
} from "@/lib/crm";

export const dynamic = "force-dynamic";

export default async function CommunicationsPage() {
  const [intakeItems, calls, emailDashboard, leadViews] = await Promise.all([
    getIntakeViews(),
    getCallViews(),
    getEmailEventDashboardView(),
    getLeadViews(),
  ]);
  const auditCount = intakeItems.filter((item) =>
    item.type.toLowerCase().includes("audit"),
  ).length;
  const quoteCount = intakeItems.length - auditCount;
  const needsTranscript = calls.filter(
    (call) => call.transcriptStatus !== "Completed",
  ).length;
  const needsExtraction = calls.filter(
    (call) =>
      call.transcriptStatus === "Completed" &&
      call.extractionStatus === "Not Started",
  ).length;
  const followUpLeads = leadViews.slice(0, 5);

  return (
    <InternalShell
      active="Communications"
      eyebrow="Customer contact"
      title="Communications"
      description="The working hub for inbound requests, recorded calls, email delivery, SMS follow-up paths, and customer conversations that need action."
      action={{ label: "Settings", href: "/settings" }}
    >
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          {
            icon: ClipboardList,
            label: "New requests",
            value: intakeItems.length.toString(),
            note: "Audits and quote forms",
          },
          {
            icon: PhoneCall,
            label: "Recorded calls",
            value: calls.length.toString(),
            note: "Twilio voice records",
          },
          {
            icon: Mail,
            label: "Email exceptions",
            value: emailDashboard.exceptionCount.toString(),
            note: "Bounces and complaints",
          },
          {
            icon: MessageSquareText,
            label: "Follow-ups",
            value: followUpLeads.length.toString(),
            note: "Customer contact queue",
          },
        ].map((item) => (
          <article
            key={item.label}
            className="rounded-lg border border-white bg-white p-5 shadow-lg shadow-slate-950/5"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-emerald-50 text-emerald-700">
              <item.icon className="h-5 w-5" />
            </div>
            <p className="mt-5 text-sm font-medium text-slate-600">
              {item.label}
            </p>
            <p className="mt-2 text-3xl font-semibold">{item.value}</p>
            <p className="mt-3 text-sm leading-6 text-slate-600">{item.note}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        {[
          {
            icon: PhoneCall,
            title: "Calls",
            body: "Inbound and outbound voice calls are handled through Twilio, recorded when configured, transcribed, and reviewed by the Call Intake Agent.",
            href: "/calls",
            action: "Open call records",
            detail: `${needsTranscript} need transcript | ${needsExtraction} need AI extraction`,
          },
          {
            icon: Mail,
            title: "Email",
            body: "Quote emails are sent from quote records through Resend. Delivery webhooks, bounces, complaints, and suppressions are tracked here.",
            href: "/email",
            action: "Open email events",
            detail: `${emailDashboard.deliveredCount} delivered | ${emailDashboard.suppressedCount} suppressed`,
          },
          {
            icon: Send,
            title: "SMS",
            body: "Sales follow-up texts are sent from customer lead records through Twilio and logged to the activity timeline.",
            href: "/customers",
            action: "Open customer follow-ups",
            detail: "Use a customer lead to send SMS",
          },
        ].map((item) => (
          <Link
            key={item.title}
            href={item.href}
            className="rounded-lg border border-white bg-white p-5 shadow-lg shadow-slate-950/5 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-slate-950/10"
          >
            <item.icon className="h-6 w-6 text-emerald-600" />
            <h2 className="mt-4 text-xl font-semibold">{item.title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">{item.body}</p>
            <p className="mt-4 rounded-md bg-slate-50 px-3 py-2 text-xs font-bold uppercase tracking-[0.14em] text-slate-600">
              {item.detail}
            </p>
            <p className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-emerald-700">
              {item.action}
              <ArrowRight className="h-4 w-4" />
            </p>
          </Link>
        ))}
      </section>

      <section className="grid items-start gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <article className="rounded-lg border border-white bg-white p-5 shadow-lg shadow-slate-950/5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-700">
                Request queue
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                New customer information
              </h2>
            </div>
            <p className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">
              {auditCount} audits | {quoteCount} quotes
            </p>
          </div>

          <div className="mt-5 grid gap-4">
            {intakeItems.length ? (
              intakeItems.map((item) => (
                <div
                  key={`${item.type}-${item.id}`}
                  className="rounded-md border border-slate-100 bg-slate-50 p-4"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <p className="text-lg font-semibold">{item.company}</p>
                        <span className="rounded-full bg-white px-3 py-1 text-sm font-semibold text-slate-700">
                          {item.type}
                        </span>
                        <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-800">
                          {item.status}
                        </span>
                      </div>
                      <p className="mt-3 text-sm leading-6 text-slate-600">
                        {item.detail}
                      </p>
                    </div>
                    <p className="text-sm font-medium text-slate-500">
                      {item.created}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="rounded-md border border-dashed border-slate-200 bg-slate-50 p-5 text-sm leading-6 text-slate-600">
                No request records are currently waiting.
              </p>
            )}
          </div>
        </article>

        <aside className="grid gap-4">
          <article className="rounded-lg border border-white bg-white p-5 shadow-lg shadow-slate-950/5">
            <TriangleAlert className="h-6 w-6 text-amber-600" />
            <h2 className="mt-4 text-xl font-semibold">Needs attention</h2>
            <div className="mt-4 grid gap-3">
              <CommunicationAlert
                label="Call transcripts"
                value={needsTranscript.toString()}
                href="/calls"
              />
              <CommunicationAlert
                label="Call AI extraction"
                value={needsExtraction.toString()}
                href="/calls"
              />
              <CommunicationAlert
                label="Email exceptions"
                value={emailDashboard.exceptionCount.toString()}
                href="/email"
              />
              <CommunicationAlert
                label="Suppressed emails"
                value={emailDashboard.suppressedCount.toString()}
                href="/email"
              />
            </div>
          </article>

          <article className="rounded-lg border border-white bg-white p-5 shadow-lg shadow-slate-950/5">
            <FileText className="h-6 w-6 text-emerald-600" />
            <h2 className="mt-4 text-xl font-semibold">Where users send</h2>
            <div className="mt-4 grid gap-3 text-sm leading-6 text-slate-600">
              <p>Call and SMS from a customer lead record.</p>
              <p>Email quote details from a quote record.</p>
              <p>Send customer load updates from a load record.</p>
              <p>Review delivery failures from Email events.</p>
            </div>
          </article>
        </aside>
      </section>

      <section className="rounded-lg border border-white bg-white p-5 shadow-lg shadow-slate-950/5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-700">
              Follow-up queue
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">
              Customers to contact
            </h2>
          </div>
          <Link
            href="/customers"
            className="inline-flex w-fit items-center justify-center gap-2 rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
          >
            Open Customers
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {followUpLeads.map((lead) => (
            <Link
              key={lead.id}
              href={`/leads/${lead.id}`}
              className="rounded-md border border-slate-100 bg-slate-50 p-4 hover:border-emerald-200 hover:bg-white hover:shadow-md"
            >
              <p className="font-semibold text-slate-950">{lead.company}</p>
              <p className="mt-1 text-sm font-medium text-slate-600">
                {lead.contact}
              </p>
              <p className="mt-3 text-xs font-bold uppercase tracking-[0.14em] text-emerald-700">
                {lead.nextFollowUp}
              </p>
              <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">
                {lead.aiNextAction}
              </p>
            </Link>
          ))}
        </div>
      </section>
    </InternalShell>
  );
}

function CommunicationAlert({
  label,
  value,
  href,
}: {
  label: string;
  value: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between gap-3 rounded-md border border-slate-100 bg-slate-50 p-4 hover:border-emerald-200 hover:bg-white"
    >
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      <span className="rounded-full bg-white px-2.5 py-1 text-sm font-bold text-slate-950">
        {value}
      </span>
    </Link>
  );
}
