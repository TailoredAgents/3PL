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

export default async function EmailPage() {
  const dashboard = await getEmailEventDashboardView();
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
      active="Email"
      eyebrow="Communications"
      title="Email events"
      description="Track quote email sends, Resend delivery confirmations, bounces, and complaint events so sales follow-up stays clean."
      action={{ label: "Settings", href: "/settings" }}
    >
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {cards.map((card) => (
          <article
            key={card.label}
            className="rounded-lg border border-white bg-white p-5 shadow-lg shadow-slate-950/5"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-emerald-50 text-emerald-700">
              <card.icon className="h-5 w-5" />
            </div>
            <p className="mt-5 text-sm font-medium text-slate-600">
              {card.label}
            </p>
            <p className="mt-2 text-3xl font-semibold">{card.value}</p>
            <p className="mt-3 text-sm leading-6 text-slate-600">{card.note}</p>
          </article>
        ))}
      </section>

      <section className="grid items-start gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <article className="rounded-lg border border-white bg-white p-5 shadow-lg shadow-slate-950/5">
          <div className="flex items-center gap-3">
            <Ban className="h-6 w-6 text-red-600" />
            <div>
              <h2 className="text-2xl font-semibold">Delivery exceptions</h2>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                Bounced and complaint events should be reviewed before sending
                another customer email.
              </p>
            </div>
          </div>
          <div className="mt-5 grid gap-3">
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
                      <p className="mt-1 text-sm font-medium text-red-900">
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
              <p className="rounded-md border border-dashed border-slate-200 bg-slate-50 p-5 text-sm leading-6 text-slate-600">
                No bounced or complaint events are currently logged.
              </p>
            )}
          </div>
        </article>

        <article className="rounded-lg border border-white bg-white p-5 shadow-lg shadow-slate-950/5">
          <div className="flex items-center gap-3">
            <Mail className="h-6 w-6 text-emerald-600" />
            <div>
              <h2 className="text-2xl font-semibold">Recent email events</h2>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                The latest Resend-backed quote email activity and webhook
                events.
              </p>
            </div>
          </div>
          <div className="mt-5 overflow-x-auto">
            <table className="min-w-[920px] w-full border-separate border-spacing-0 text-left text-sm">
              <thead>
                <tr className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                  <th className="border-b border-slate-200 px-3 py-3">
                    Status
                  </th>
                  <th className="border-b border-slate-200 px-3 py-3">
                    Account
                  </th>
                  <th className="border-b border-slate-200 px-3 py-3">
                    Recipient
                  </th>
                  <th className="border-b border-slate-200 px-3 py-3">
                    Subject
                  </th>
                  <th className="border-b border-slate-200 px-3 py-3">
                    Provider IDs
                  </th>
                  <th className="border-b border-slate-200 px-3 py-3">Time</th>
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
                      <p className="mt-1 text-xs text-slate-500">
                        {event.contact}
                      </p>
                    </td>
                    <td className="border-b border-slate-100 px-3 py-4 text-slate-700">
                      {event.recipient}
                    </td>
                    <td className="border-b border-slate-100 px-3 py-4">
                      <p className="font-medium text-slate-900">
                        {event.subject}
                      </p>
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
          </div>
        </article>
      </section>

      <section className="rounded-lg border border-white bg-white p-5 shadow-lg shadow-slate-950/5">
        <div className="flex items-center gap-3">
          <Ban className="h-6 w-6 text-red-600" />
          <div>
            <h2 className="text-2xl font-semibold">Suppressed recipients</h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              These addresses are blocked from future quote emails until the
              customer provides a corrected address.
            </p>
          </div>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
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
            <p className="rounded-md border border-dashed border-slate-200 bg-slate-50 p-5 text-sm leading-6 text-slate-600 md:col-span-2 xl:col-span-3">
              No recipients are currently suppressed.
            </p>
          )}
        </div>
      </section>
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
