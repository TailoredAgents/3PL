import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Bot,
  Building2,
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

const CARD_ACCENTS = [
  {
    border: "border-l-[3px] border-l-amber-400",
    icon: "bg-amber-50 text-amber-700",
  },
  {
    border: "border-l-[3px] border-l-sky-400",
    icon: "bg-sky-50 text-sky-700",
  },
  {
    border: "border-l-[3px] border-l-emerald-400",
    icon: "bg-emerald-50 text-emerald-700",
  },
  {
    border: "border-l-[3px] border-l-violet-400",
    icon: "bg-violet-50 text-violet-700",
  },
] as const;

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
    {
      icon: Headphones,
      label: "Communications",
      href: "/communications",
      detail: "Calls, email, SMS, and requests",
    },
    {
      icon: FileText,
      label: "Quotes & Pricing",
      href: "/quote-requests",
      detail: "Price work and quote-to-load",
    },
    {
      icon: MapPinned,
      label: "Load Board",
      href: "/loads",
      detail: "Tracking, POD, margin",
    },
    {
      icon: Building2,
      label: "Customers",
      href: "/shippers",
      detail: "Company files, contacts, and lanes",
    },
    {
      icon: ReceiptText,
      label: "Billing & Accounting",
      href: "/billing",
      detail: "POD, invoices, payment status",
    },
    {
      icon: Truck,
      label: "Carriers",
      href: "/carriers",
      detail: "Compliance and coverage",
    },
  ];

  const maxPipelineCount = Math.max(
    1,
    ...metrics.leadPipeline.map((s) => s.count),
  );

  return (
    <InternalShell
      active="Dashboard"
      eyebrow="Command center"
      title="Dashboard"
      description="The first screen for sales and operations: follow-ups, open quotes, active load attention, AI notes, and the next work that matters."
      action={{ label: "Open Quotes & Pricing", href: "/quote-requests" }}
    >
      {/* KPI metric cards */}
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {dashboardCards.map((card, i) => {
          const accent = CARD_ACCENTS[i];
          return (
            <Link
              key={card.label}
              href={card.href}
              className={`overflow-hidden rounded-lg border border-slate-100 bg-white shadow-md shadow-slate-950/5 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-slate-950/10 ${accent.border}`}
            >
              <div className="p-5">
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-lg ${accent.icon}`}
                >
                  <card.icon className="h-5 w-5" />
                </div>
                <p className="mt-4 text-sm font-medium text-slate-500">
                  {card.label}
                </p>
                <p className="mt-1 text-4xl font-bold tracking-tight text-slate-950">
                  {card.value}
                </p>
                <p className="mt-3 text-sm leading-6 text-slate-500">
                  {card.note}
                </p>
              </div>
            </Link>
          );
        })}
      </section>

      {/* Today's schedule */}
      <section className="rounded-lg border border-slate-100 bg-white shadow-md shadow-slate-950/5">
        <div className="flex flex-col gap-3 border-b border-slate-100 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-700">
              Today&apos;s schedule
            </p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight">
              Pickups &amp; deliveries today
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700">
              {pickups.length} pickups
            </span>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-600">
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
        <div className="grid gap-0 lg:grid-cols-2 lg:divide-x lg:divide-slate-100">
          <div className="p-6">
            <p className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
              <Truck className="h-3.5 w-3.5 text-emerald-500" />
              Pickups
            </p>
            {pickups.length ? (
              <div className="grid gap-2">
                {pickups.map((item) => (
                  <ScheduleRow key={`${item.id}-pickup`} item={item} />
                ))}
              </div>
            ) : (
              <p className="rounded-md bg-slate-50 px-4 py-3 text-sm text-slate-500">
                No pickups scheduled today.
              </p>
            )}
          </div>
          <div className="border-t border-slate-100 p-6 lg:border-t-0">
            <p className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
              <Package className="h-3.5 w-3.5 text-emerald-500" />
              Deliveries
            </p>
            {deliveries.length ? (
              <div className="grid gap-2">
                {deliveries.map((item) => (
                  <ScheduleRow key={`${item.id}-delivery`} item={item} />
                ))}
              </div>
            ) : (
              <p className="rounded-md bg-slate-50 px-4 py-3 text-sm text-slate-500">
                No deliveries scheduled today.
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Stale load alerts */}
      {staleAlerts.length > 0 && (
        <section className="rounded-lg border border-red-200 bg-red-50 p-5 shadow-sm">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-100">
                <AlertTriangle className="h-4 w-4 text-red-600" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-red-700">
                  Attention required
                </p>
                <h2 className="mt-0.5 text-lg font-semibold text-red-950">
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
                    ? `${alert.hoursStale}h ago`
                    : "No tracking"}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Pipeline health + AI operator brief */}
      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <article className="rounded-lg border border-slate-100 bg-white p-6 shadow-md shadow-slate-950/5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-700">
                Sales snapshot
              </p>
              <h2 className="mt-1 text-2xl font-semibold tracking-tight">
                Pipeline health
              </h2>
            </div>
            <Bot className="h-5 w-5 text-slate-300" />
          </div>
          <div className="mt-6 grid gap-2">
            {metrics.leadPipeline.map((stage) => {
              const pct = Math.round((stage.count / maxPipelineCount) * 100);
              return (
                <div key={stage.stage} className="rounded-md bg-slate-50 px-4 py-3">
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-sm font-semibold text-slate-800">
                      {stage.stage}
                    </p>
                    <span className="text-sm font-bold text-slate-700">
                      {stage.count}
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                    <div
                      className="h-1.5 rounded-full bg-emerald-400 transition-all duration-500"
                      style={{ width: stage.count === 0 ? "0%" : `${Math.max(pct, 4)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </article>

        <article
          id="ai"
          className="rounded-lg border border-slate-100 bg-white p-6 shadow-md shadow-slate-950/5"
        >
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-700">
            Operator brief
          </p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight">
            AI-assisted next moves
          </h2>
          <div className="mt-6 grid gap-3">
            {agentBriefs.map((brief) => (
              <div
                key={brief.title}
                className="rounded-md border border-slate-100 bg-slate-50 p-4"
              >
                <div className="flex gap-3">
                  <brief.icon className="mt-0.5 h-4 w-4 flex-none text-emerald-600" />
                  <div>
                    <p className="text-sm font-semibold">{brief.title}</p>
                    <p className="mt-0.5 text-sm leading-6 text-slate-600">
                      {brief.body}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>

      {/* Agent run log */}
      <section className="rounded-lg border border-slate-100 bg-white p-6 shadow-md shadow-slate-950/5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-700">
              Agent run log
            </p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight">
              Recent AI recommendations
            </h2>
          </div>
          <p className="text-sm text-slate-500">
            Every AI action is logged before it becomes automation.
          </p>
        </div>

        <div className="mt-5 grid gap-3">
          {recentAgentRuns.length ? (
            recentAgentRuns.map((run) => (
              <Link
                key={run.id}
                href={getAgentRunHref(run.relatedEntityType, run.relatedEntityId)}
                className="grid gap-4 rounded-md border border-slate-100 bg-slate-50 p-4 hover:-translate-y-0.5 hover:border-emerald-200 hover:bg-white hover:shadow-md lg:grid-cols-[220px_1fr_auto]"
              >
                <div>
                  <p className="font-semibold">{run.agentName}</p>
                  <p className="mt-1 text-sm text-slate-500">
                    {run.relatedEntityType} · {run.created}
                  </p>
                  <p className="mt-2 w-fit rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-700 shadow-sm">
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
                <div className="text-sm font-bold text-slate-500 lg:text-right">
                  {run.confidence === null
                    ? "n/a"
                    : `${Math.round(run.confidence * 100)}% confidence`}
                </div>
              </Link>
            ))
          ) : (
            <p className="rounded-md bg-slate-50 px-4 py-3 text-sm text-slate-500">
              No agent runs yet — open a lead, quote, load, or carrier to run an agent.
            </p>
          )}
        </div>
      </section>

      {/* Operating checklist + Work queues */}
      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <article
          id="loads"
          className="rounded-lg border border-slate-100 bg-white p-6 shadow-md shadow-slate-950/5"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50">
              <ClipboardList className="h-4 w-4 text-emerald-600" />
            </div>
            <h2 className="text-xl font-semibold">Operating checklist</h2>
          </div>
          <p className="mt-3 text-sm leading-7 text-slate-500">
            Keep every load moving through pickup, tracking, delivery, POD,
            invoice, and customer follow-up without losing context.
          </p>
          <div className="mt-5 grid gap-2">
            {operatingChecklist.map((item, i) => (
              <div
                key={item}
                className="flex items-center gap-3 rounded-md border border-slate-100 bg-slate-50 px-4 py-3"
              >
                <span className="flex h-5 w-5 flex-none items-center justify-center rounded-full bg-emerald-100 text-[10px] font-bold text-emerald-700">
                  {i + 1}
                </span>
                <CheckCircle2 className="h-4 w-4 flex-none text-emerald-400" />
                <span className="text-sm font-medium text-slate-700">{item}</span>
              </div>
            ))}
          </div>
        </article>

        <article
          id="queues"
          className="rounded-lg border border-slate-100 bg-white p-6 shadow-md shadow-slate-950/5"
        >
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-700">
            Open work queues
          </p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight">
            Jump into the active work
          </h2>
          <div className="mt-5 grid gap-2 md:grid-cols-2">
            {workQueues.map((queue) => {
              const Icon = queue.icon;
              return (
                <Link
                  key={queue.href}
                  href={queue.href}
                  className="flex items-start gap-3 rounded-md border border-slate-100 bg-slate-50 p-4 hover:-translate-y-0.5 hover:border-emerald-200 hover:bg-white hover:shadow-md"
                >
                  <div className="mt-0.5 flex h-8 w-8 flex-none items-center justify-center rounded-md bg-white shadow-sm">
                    <Icon className="h-4 w-4 text-slate-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold">{queue.label}</p>
                      <ArrowRight className="h-3.5 w-3.5 flex-none text-emerald-600" />
                    </div>
                    <p className="mt-0.5 text-xs leading-5 text-slate-500">
                      {queue.detail}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
          <div className="mt-4 rounded-md border border-amber-100 bg-amber-50 p-4">
            <div className="flex gap-3">
              <AlertTriangle className="mt-0.5 h-4 w-4 flex-none text-amber-600" />
              <div>
                <p className="text-sm font-semibold text-amber-950">
                  Watch exceptions first
                </p>
                <p className="mt-0.5 text-sm leading-6 text-amber-800">
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
        <p className="mt-0.5 text-sm font-medium text-slate-700">
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
  if (entityType === "Lead") return `/leads/${id}`;
  if (entityType === "QuoteRequest") return `/quote-requests/${id}`;
  if (entityType === "Load") return `/loads/${id}`;
  if (entityType === "Carrier") return `/carriers/${id}`;
  return "/dashboard";
}
