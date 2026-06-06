import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Bot,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  FileText,
  Headphones,
  MapPinned,
  Package,
  ReceiptText,
  Truck,
} from "lucide-react";

import { InternalShell } from "@/components/internal-shell";
import {
  getDashboardMetrics,
  getRecentAiAgentRunViews,
  getStaleLoadAlerts,
  getTodayScheduleView,
} from "@/lib/crm";
import { agentBriefs } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [metrics, recentAgentRuns, todaySchedule, staleAlerts] =
    await Promise.all([
      getDashboardMetrics(),
      getRecentAiAgentRunViews(),
      getTodayScheduleView(),
      getStaleLoadAlerts(),
    ]);
  const pickups = todaySchedule.filter((item) => item.eventType === "Pickup");
  const deliveries = todaySchedule.filter(
    (item) => item.eventType === "Delivery",
  );

  const dashboardCards = [
    {
      icon: Headphones,
      label: "Leads needing follow-up",
      value: metrics.leadsDue,
      note: "Call qualified leads and new audit submissions first.",
      href: "/leads",
    },
    {
      icon: FileText,
      label: "Open quote requests",
      value: metrics.openQuotes,
      note: "Review service details before rate work starts.",
      href: "/quote-requests",
    },
    {
      icon: MapPinned,
      label: "Active loads",
      value: metrics.activeLoads,
      note: "Watch pickup, delivery, POD, and customer update needs.",
      href: "/loads",
    },
    {
      icon: ReceiptText,
      label: "Projected margin",
      value: metrics.projectedMargin,
      note: "Margin from loads with carrier costs entered.",
      href: "/loads",
    },
  ];
  const operatingChecklist = [
    "Confirm pickup",
    "Update shipper",
    "Check carrier status",
    "Collect POD",
    "Mark ready for invoice",
  ];
  const workQueues = [
    { label: "Communications", href: "/communications", detail: "Calls, email, SMS, and requests" },
    { label: "Quotes & Pricing", href: "/quote-requests", detail: "Price work and quote-to-load" },
    { label: "Load Board", href: "/loads", detail: "Tracking, POD, margin" },
    { label: "Customers", href: "/shippers", detail: "Company files, contacts, and lanes" },
    { label: "Billing & Accounting", href: "/billing", detail: "POD, invoices, payment status" },
    { label: "Carriers", href: "/carriers", detail: "Compliance and coverage" },
  ];

  return (
    <InternalShell
      active="Dashboard"
      eyebrow="Command center"
      title="Dashboard"
      description="The first screen for sales and operations: follow-ups, open quotes, active load attention, AI notes, and the next work that matters."
      action={{ label: "Open Quotes & Pricing", href: "/quote-requests" }}
    >
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {dashboardCards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="rounded-lg border border-white bg-white p-5 shadow-lg shadow-slate-950/5 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-slate-950/10"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-emerald-50 text-emerald-700">
              <card.icon className="h-5 w-5" />
            </div>
            <p className="mt-5 text-sm font-medium text-slate-600">
              {card.label}
            </p>
            <p className="mt-2 text-3xl font-semibold">{card.value}</p>
            <p className="mt-3 text-sm leading-6 text-slate-600">{card.note}</p>
          </Link>
        ))}
      </section>

      <section className="rounded-lg border border-white bg-white p-5 shadow-lg shadow-slate-950/5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-700">
              Today&apos;s schedule
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">
              Pickups &amp; deliveries today
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">
              {pickups.length} pickups
            </span>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">
              {deliveries.length} deliveries
            </span>
            <Link
              href="/loads"
              className="inline-flex items-center gap-1 text-sm font-bold text-emerald-700 hover:text-emerald-900"
            >
              All loads <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <div>
            <p className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-700">
              <Truck className="h-4 w-4 text-emerald-600" />
              Pickups
            </p>
            {pickups.length ? (
              <div className="grid gap-2">
                {pickups.map((item) => (
                  <ScheduleRow key={`${item.id}-pickup`} item={item} />
                ))}
              </div>
            ) : (
              <p className="rounded-md border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                No pickups scheduled today.
              </p>
            )}
          </div>
          <div>
            <p className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-700">
              <Package className="h-4 w-4 text-emerald-600" />
              Deliveries
            </p>
            {deliveries.length ? (
              <div className="grid gap-2">
                {deliveries.map((item) => (
                  <ScheduleRow key={`${item.id}-delivery`} item={item} />
                ))}
              </div>
            ) : (
              <p className="rounded-md border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                No deliveries scheduled today.
              </p>
            )}
          </div>
        </div>
      </section>

      {staleAlerts.length > 0 && (
        <section className="rounded-lg border border-red-200 bg-red-50 p-5 shadow-sm">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 flex-none text-red-600" />
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-red-700">
                  Attention required
                </p>
                <h2 className="mt-1 text-xl font-semibold text-red-950">
                  {staleAlerts.length} load
                  {staleAlerts.length !== 1 ? "s" : ""} with no update in 24h+
                </h2>
              </div>
            </div>
            <Link
              href="/loads"
              className="inline-flex items-center gap-1 text-sm font-bold text-red-700 hover:text-red-900"
            >
              Open load board <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid gap-2">
            {staleAlerts.map((alert) => (
              <Link
                key={alert.id}
                href={`/loads/${alert.id}`}
                className="grid grid-cols-[1fr_auto] items-center gap-4 rounded-md border border-red-200 bg-white px-4 py-3 hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="grid gap-1 sm:grid-cols-[auto_1fr_1fr_1fr] sm:items-center sm:gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900">
                      {alert.loadNumber}
                    </span>
                    <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-800">
                      {alert.status}
                    </span>
                  </div>
                  <p className="truncate text-sm text-slate-700">{alert.lane}</p>
                  <p className="text-sm text-slate-600">{alert.shipper}</p>
                  <p className="text-sm text-slate-500">{alert.carrier}</p>
                </div>
                <p className="text-right text-xs font-semibold text-red-700">
                  {alert.lastEventAt
                    ? `Last update ${alert.hoursStale}h ago`
                    : "No tracking yet"}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <article className="rounded-lg border border-white bg-white p-5 shadow-lg shadow-slate-950/5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-700">
                Sales snapshot
              </p>
              <h2 className="mt-2 text-2xl font-semibold">
                Pipeline health
              </h2>
            </div>
            <Bot className="h-6 w-6 text-slate-400" />
          </div>
          <div className="mt-6 grid gap-3">
            {metrics.leadPipeline.map((stage) => (
              <div
                key={stage.stage}
                className="grid grid-cols-[1fr_auto] items-center gap-4 rounded-md border border-slate-100 bg-slate-50 px-4 py-3"
              >
                <div>
                  <p className="font-semibold">{stage.stage}</p>
                  <p className="mt-1 text-sm text-slate-600">
                    {stage.count} leads in stage
                  </p>
                </div>
                <span className="rounded-full bg-white px-3 py-1 text-sm font-bold text-slate-700 shadow-sm">
                  {stage.count}
                </span>
              </div>
            ))}
          </div>
        </article>

        <article
          id="ai"
          className="rounded-lg border border-white bg-white p-5 shadow-lg shadow-slate-950/5"
        >
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-700">
            Operator brief
          </p>
          <h2 className="mt-2 text-2xl font-semibold">AI-assisted next moves</h2>
          <div className="mt-6 grid gap-4">
            {agentBriefs.map((brief) => (
              <div
                key={brief.title}
                className="rounded-md border border-slate-100 bg-slate-50 p-4"
              >
                <div className="flex gap-3">
                  <brief.icon className="mt-1 h-5 w-5 flex-none text-emerald-600" />
                  <div>
                    <p className="font-semibold">{brief.title}</p>
                    <p className="mt-1 text-sm leading-6 text-slate-600">
                      {brief.body}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="rounded-lg border border-white bg-white p-5 shadow-lg shadow-slate-950/5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-700">
              Agent run log
            </p>
            <h2 className="mt-2 text-2xl font-semibold">
              Recent AI recommendations
            </h2>
          </div>
          <p className="text-sm leading-6 text-slate-600">
            Every AI action is logged before it becomes automation.
          </p>
        </div>

        <div className="mt-6 grid gap-4">
          {recentAgentRuns.length ? (
            recentAgentRuns.map((run) => (
              <Link
                key={run.id}
                href={getAgentRunHref(run.relatedEntityType, run.relatedEntityId)}
                className="grid gap-4 rounded-md border border-slate-100 bg-slate-50 p-4 hover:-translate-y-0.5 hover:border-emerald-200 hover:bg-white hover:shadow-md lg:grid-cols-[220px_1fr_auto]"
              >
                <div>
                  <p className="font-semibold">{run.agentName}</p>
                  <p className="mt-1 text-sm text-slate-600">
                    {run.relatedEntityType} | {run.created}
                  </p>
                  <p className="mt-2 w-fit rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-700">
                    {run.status}
                  </p>
                </div>
                <div>
                  <p className="text-sm leading-6 text-slate-700">
                    {run.summary}
                  </p>
                  <p className="mt-2 text-sm font-semibold text-emerald-800">
                    Next: {run.nextAction}
                  </p>
                </div>
                <div className="text-sm font-bold text-slate-600 lg:text-right">
                  {run.confidence === null
                    ? "Confidence n/a"
                    : `${Math.round(run.confidence * 100)}% confidence`}
                </div>
              </Link>
            ))
          ) : (
            <div className="rounded-md border border-dashed border-slate-200 bg-slate-50 p-5 text-sm leading-6 text-slate-600">
              No AI agent runs have been logged yet. Open a lead, quote, load,
              or carrier and run an agent from that detail page.
            </div>
          )}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <article
          id="loads"
          className="rounded-lg border border-white bg-white p-5 shadow-lg shadow-slate-950/5"
        >
          <div className="flex items-center gap-3">
            <ClipboardList className="h-6 w-6 text-emerald-600" />
            <h2 className="text-2xl font-semibold">Operating checklist</h2>
          </div>
          <p className="mt-3 leading-7 text-slate-600">
            Keep every load moving through pickup, tracking, delivery, POD,
            invoice, and customer follow-up without losing context.
          </p>
          <div className="mt-6 grid gap-3">
            {operatingChecklist.map((item) => (
              <div
                key={item}
                className="flex items-center gap-3 rounded-md border border-slate-100 bg-slate-50 px-4 py-3"
              >
                <CheckCircle2 className="h-5 w-5 flex-none text-emerald-600" />
                <span className="font-medium">{item}</span>
              </div>
            ))}
          </div>
        </article>

        <article
          id="queues"
          className="rounded-lg border border-white bg-white p-5 shadow-lg shadow-slate-950/5"
        >
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-700">
            Open work queues
          </p>
          <h2 className="mt-2 text-2xl font-semibold">
            Jump into the active work
          </h2>
          <div className="mt-6 grid gap-3 md:grid-cols-2">
            {workQueues.map((queue) => (
              <Link
                key={queue.href}
                href={queue.href}
                className="rounded-md border border-slate-100 bg-slate-50 p-4 hover:-translate-y-0.5 hover:border-emerald-200 hover:bg-white hover:shadow-md"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold">{queue.label}</p>
                  <ArrowRight className="h-4 w-4 text-emerald-700" />
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {queue.detail}
                </p>
              </Link>
            ))}
          </div>
          <div className="mt-5 rounded-md border border-amber-100 bg-amber-50 p-4">
            <div className="flex gap-3">
              <AlertTriangle className="mt-1 h-5 w-5 flex-none text-amber-700" />
              <div>
                <p className="font-semibold text-amber-950">
                  Watch exceptions first
                </p>
                <p className="mt-1 text-sm leading-6 text-amber-900">
                  Any late pickup, missing POD, carrier compliance hold, or
                  margin gap should move ahead of routine admin work.
                </p>
              </div>
            </div>
          </div>
        </article>
      </section>
    </InternalShell>
  );
}

import type { TodayScheduleItem } from "@/lib/crm";

function ScheduleRow({ item }: { item: TodayScheduleItem }) {
  return (
    <Link
      href={`/loads/${item.id}`}
      className="grid grid-cols-[1fr_auto] items-center gap-3 rounded-md border border-slate-100 bg-slate-50 px-4 py-3 hover:-translate-y-0.5 hover:border-emerald-200 hover:bg-white hover:shadow-md"
    >
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-bold text-slate-900">
            {item.loadNumber}
          </span>
          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800">
            {item.status}
          </span>
        </div>
        <p className="mt-1 text-sm font-medium text-slate-700">
          {item.shipper}
        </p>
        <p className="mt-0.5 text-xs text-slate-500">{item.lane}</p>
      </div>
      <div className="text-right">
        <p className="flex items-center gap-1 text-xs font-semibold text-slate-600">
          <CalendarDays className="h-3 w-3" />
          {item.window}
        </p>
        <p className="mt-1 text-xs text-slate-500">{item.carrier}</p>
      </div>
    </Link>
  );
}

function getAgentRunHref(entityType: string, id: string) {
  if (entityType === "Lead") {
    return `/leads/${id}`;
  }

  if (entityType === "QuoteRequest") {
    return `/quote-requests/${id}`;
  }

  if (entityType === "Load") {
    return `/loads/${id}`;
  }

  if (entityType === "Carrier") {
    return `/carriers/${id}`;
  }

  return "/dashboard";
}
