import Link from "next/link";
import type { ReactNode } from "react";
import {
  AlertTriangle,
  Ban,
  CheckCircle2,
  Mail,
  Send,
  ShieldCheck,
} from "lucide-react";

import { InternalShell } from "@/components/internal-shell";
import { getEmailEventDashboardView, type EmailEventStatus } from "@/lib/crm";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const CARD_ACCENTS = [
  { border: "border-l-[3px] border-l-sky-400", icon: "bg-sky-50 text-sky-700" },
  { border: "border-l-[3px] border-l-emerald-400", icon: "bg-emerald-50 text-emerald-700" },
  { border: "border-l-[3px] border-l-red-400", icon: "bg-red-50 text-red-700" },
  { border: "border-l-[3px] border-l-amber-400", icon: "bg-amber-50 text-amber-700" },
  { border: "border-l-[3px] border-l-violet-400", icon: "bg-violet-50 text-violet-700" },
] as const;

export default async function EmailPage() {
  const dashboard = await getEmailEventDashboardView();
  const emailWork = dashboard.exceptionCount + dashboard.suppressedCount;
  const emailPosture =
    !dashboard.webhookConfigured
      ? {
          label: "Webhook setup is incomplete",
          body: "Resend can send email, but delivery, bounce, and complaint tracking needs the webhook secret before this page becomes a full source of truth.",
          className: "border-amber-200 bg-amber-50 text-amber-950",
          icon: AlertTriangle,
        }
      : emailWork > 0
        ? {
            label: "Email delivery needs attention",
            body: `${emailWork} email delivery items need review before quote follow-up automation should be trusted at full speed.`,
            className: "border-red-200 bg-red-50 text-red-950",
            icon: Ban,
          }
        : {
            label: "Email delivery is clean",
            body: "No bounces, complaints, or suppressed recipients are currently blocking customer quote follow-up.",
            className: "border-emerald-200 bg-emerald-50 text-emerald-950",
            icon: ShieldCheck,
          };
  const EmailPostureIcon = emailPosture.icon;
  const cards = [
    {
      icon: Send,
      label: "Sent",
      value: dashboard.sentCount.toString(),
      note: "Outbound Resend quote emails",
    },
    {
      icon: CheckCircle2,
      label: "Delivered",
      value: dashboard.deliveredCount.toString(),
      note: "Confirmed delivery webhooks",
    },
    {
      icon: AlertTriangle,
      label: "Exceptions",
      value: dashboard.exceptionCount.toString(),
      note: "Bounces and complaints",
    },
    {
      icon: Ban,
      label: "Suppressed",
      value: dashboard.suppressedCount.toString(),
      note: "Blocked future sends",
    },
    {
      icon: ShieldCheck,
      label: "Delivery rate",
      value: dashboard.deliveryRate,
      note: dashboard.webhookConfigured
        ? "Based on logged Resend events"
        : "Webhook secret not configured",
    },
  ];

  return (
    <InternalShell
      active="Communications"
      eyebrow="Communications"
      title="Email events"
      description="Track quote email sends, Resend delivery confirmations, bounces, and complaint events so sales follow-up stays clean."
      action={{ label: "Settings", href: "/settings" }}
    >
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {cards.map((card, i) => (
          <article
            key={card.label}
            className={`overflow-hidden rounded-lg border border-slate-100 bg-white shadow-md shadow-slate-950/5 ${CARD_ACCENTS[i].border}`}
          >
            <div className="p-5">
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-md ${CARD_ACCENTS[i].icon}`}
              >
                <card.icon className="h-4 w-4" />
              </div>
              <p className="mt-4 text-sm font-medium text-slate-600">
                {card.label}
              </p>
              <p className="mt-1 text-3xl font-bold tracking-tight text-slate-950">
                {card.value}
              </p>
              <p className="mt-2 text-xs leading-5 text-slate-500">
                {card.note}
              </p>
            </div>
          </article>
        ))}
      </section>

      <section
        className={`rounded-lg border p-5 shadow-sm ${emailPosture.className}`}
      >
        <div className="grid gap-5 lg:grid-cols-[1fr_420px] lg:items-center">
          <div className="flex gap-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-white/70">
              <EmailPostureIcon className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.24em] opacity-70">
                Email delivery posture
              </p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight">
                {emailPosture.label}
              </h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 opacity-80">
                {emailPosture.body}
              </p>
            </div>
          </div>
          <div className="grid gap-2 rounded-lg border border-white/70 bg-white/70 p-3 text-slate-700">
            <EmailHealthItem
              label="Webhook"
              value={dashboard.webhookConfigured ? "Configured" : "Missing"}
            />
            <EmailHealthItem
              label="Exceptions"
              value={dashboard.exceptionCount.toString()}
            />
            <EmailHealthItem
              label="Suppressed"
              value={dashboard.suppressedCount.toString()}
            />
            <Link
              href="/settings"
              className="inline-flex items-center justify-center rounded-md bg-slate-950 px-3 py-2 text-sm font-semibold text-white shadow-lg shadow-slate-950/10 hover:bg-slate-800"
            >
              Open Email Settings
            </Link>
          </div>
        </div>
      </section>

      <section className="grid items-start gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <article className="overflow-hidden rounded-lg border border-slate-100 bg-white shadow-md shadow-slate-950/5">
          <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-5 py-3">
            <Ban className="h-4 w-4 text-red-500" />
            <p className="text-sm font-semibold text-slate-700">
              Delivery exceptions
            </p>
          </div>
          <div className="grid gap-3 p-5">
            {dashboard.exceptions.length ? (
              dashboard.exceptions.map((event) => (
                <div
                  key={event.id}
                  className="rounded-md border border-red-100 bg-red-50 p-4"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="font-semibold text-red-950">
                        {event.company}
                      </p>
                      <p className="mt-0.5 text-sm font-medium text-red-900">
                        {event.recipient}
                      </p>
                    </div>
                    <EmailStatusPill status={event.status} />
                  </div>
                  <p className="mt-3 text-sm font-semibold text-red-950">
                    {event.subject}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-red-900">
                    {event.outcome}
                  </p>
                  <p className="mt-3 text-xs font-bold uppercase tracking-[0.14em] text-red-700">
                    {event.time}
                  </p>
                </div>
              ))
            ) : (
              <EmptyState
                icon={<CheckCircle2 className="h-9 w-9 text-emerald-300" />}
                title="No delivery exceptions"
                body="Bounces and complaints will appear here when Resend webhooks report them."
              />
            )}
          </div>
        </article>

        <article className="overflow-hidden rounded-lg border border-slate-100 bg-white shadow-md shadow-slate-950/5">
          <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-5 py-3">
            <Mail className="h-4 w-4 text-slate-400" />
            <p className="text-sm font-semibold text-slate-700">Recent email events</p>
          </div>
          <div className="overflow-x-auto p-5">
            {dashboard.events.length ? (
              <table className="w-full min-w-[920px] border-separate border-spacing-0 text-left text-sm">
                <thead>
                  <tr className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                    <th className="border-b border-slate-100 px-3 py-3">Status</th>
                    <th className="border-b border-slate-100 px-3 py-3">Account</th>
                    <th className="border-b border-slate-100 px-3 py-3">Recipient</th>
                    <th className="border-b border-slate-100 px-3 py-3">Subject</th>
                    <th className="border-b border-slate-100 px-3 py-3">Provider IDs</th>
                    <th className="border-b border-slate-100 px-3 py-3">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboard.events.map((event) => (
                    <tr key={event.id} className="align-top">
                      <td className="border-b border-slate-100 px-3 py-4">
                        <EmailStatusPill status={event.status} />
                      </td>
                      <td className="border-b border-slate-100 px-3 py-4">
                        <p className="font-semibold text-slate-950">
                          {event.company}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-500">
                          {event.contact}
                        </p>
                      </td>
                      <td className="border-b border-slate-100 px-3 py-4 text-slate-700">
                        {event.recipient}
                      </td>
                      <td className="border-b border-slate-100 px-3 py-4">
                        <p className="font-medium text-slate-900">{event.subject}</p>
                        <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">
                          {event.outcome}
                        </p>
                      </td>
                      <td className="border-b border-slate-100 px-3 py-4 text-xs leading-5 text-slate-500">
                        <p>{event.provider}</p>
                        <p>{event.messageId}</p>
                        <p>{event.eventId}</p>
                      </td>
                      <td className="border-b border-slate-100 px-3 py-4 text-slate-600">
                        {event.time}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <EmptyState
                icon={<Mail className="h-9 w-9 text-slate-300" />}
                title="No email events recorded yet"
                body="Sent quote emails, delivery confirmations, bounces, and complaints will populate this timeline."
              />
            )}
          </div>
        </article>
      </section>

      <article className="overflow-hidden rounded-lg border border-slate-100 bg-white shadow-md shadow-slate-950/5">
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-5 py-3">
          <div className="flex items-center gap-2">
            <Ban className="h-4 w-4 text-slate-400" />
            <p className="text-sm font-semibold text-slate-700">Suppressed recipients</p>
          </div>
          <span className="rounded-full bg-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-600">
            {dashboard.suppressions.length}
          </span>
        </div>
        <div className="grid gap-3 p-5 md:grid-cols-2 xl:grid-cols-3">
          {dashboard.suppressions.length ? (
            dashboard.suppressions.map((suppression) => (
              <div
                key={suppression.id}
                className="rounded-md border border-red-100 bg-red-50 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="break-all font-semibold text-red-950">
                      {suppression.email}
                    </p>
                    <p className="mt-1 text-sm text-red-900">
                      {suppression.notes}
                    </p>
                  </div>
                  <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-bold text-red-800">
                    {suppression.reason.toLowerCase()}
                  </span>
                </div>
                <div className="mt-4 grid gap-1 text-xs leading-5 text-red-800">
                  <p>{suppression.sourceProvider}</p>
                  <p>{suppression.messageId}</p>
                  <p>{suppression.eventId}</p>
                  <p className="font-bold uppercase tracking-[0.14em]">
                    {suppression.lastEvent}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="md:col-span-2 xl:col-span-3">
              <EmptyState
                icon={<ShieldCheck className="h-9 w-9 text-emerald-300" />}
                title="No suppressed recipients"
                body="Suppressed emails will appear here when a bounce or complaint blocks future sending."
              />
            </div>
          )}
        </div>
      </article>
    </InternalShell>
  );
}

function EmailStatusPill({ status }: { status: EmailEventStatus }) {
  return (
    <span
      className={cn(
        "inline-flex w-fit rounded-full px-2.5 py-1 text-xs font-bold",
        status === "DELIVERED" && "bg-emerald-100 text-emerald-800",
        status === "SENT" && "bg-sky-100 text-sky-800",
        status === "BOUNCED" && "bg-red-100 text-red-800",
        status === "COMPLAINED" && "bg-orange-100 text-orange-800",
        status === "UNKNOWN" && "bg-slate-100 text-slate-700",
      )}
    >
      {status.toLowerCase().replace("_", " ")}
    </span>
  );
}

function EmailHealthItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2">
      <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
        {label}
      </span>
      <span className="text-sm font-bold text-slate-950">{value}</span>
    </div>
  );
}

function EmptyState({
  icon,
  title,
  body,
}: {
  icon: ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="py-8 text-center">
      <div className="flex justify-center">{icon}</div>
      <p className="mt-3 font-semibold text-slate-700">{title}</p>
      <p className="mx-auto mt-1 max-w-lg text-sm leading-6 text-slate-400">
        {body}
      </p>
    </div>
  );
}
