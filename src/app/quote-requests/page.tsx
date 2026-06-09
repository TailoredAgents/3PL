import Link from "next/link";
import type { ComponentType } from "react";
import {
  ArrowRight,
  Bot,
  CalendarDays,
  ClipboardCheck,
  DollarSign,
  FilePlus2,
  Gauge,
  PhoneCall,
  Package,
  Route,
  Truck,
} from "lucide-react";

import { QuoteRequestCreateForm } from "@/components/crm-forms";
import { InternalShell } from "@/components/internal-shell";
import { getQuoteRequestViews } from "@/lib/crm";
import { cn } from "@/lib/utils";

const statusBadgeClass: Record<string, string> = {
  New: "bg-sky-50 text-sky-800 dark:bg-sky-400/15 dark:text-sky-200",
  Pricing: "bg-amber-50 text-amber-800 dark:bg-amber-400/15 dark:text-amber-200",
  Quoted: "bg-emerald-50 text-emerald-800 dark:bg-emerald-400/15 dark:text-emerald-200",
};

const statusPanelClass: Record<string, string> = {
  New: "border-l-[3px] border-l-sky-400 border-slate-100 bg-white dark:border-slate-800 dark:border-l-sky-400 dark:bg-slate-900/80",
  Pricing: "border-l-[3px] border-l-amber-400 border-slate-100 bg-white dark:border-slate-800 dark:border-l-amber-400 dark:bg-slate-900/80",
  Quoted: "border-l-[3px] border-l-emerald-400 border-slate-100 bg-white dark:border-slate-800 dark:border-l-emerald-400 dark:bg-slate-900/80",
};

const statusIconClass: Record<string, string> = {
  New: "bg-sky-50 text-sky-700 dark:bg-sky-400/15 dark:text-sky-200",
  Pricing: "bg-amber-50 text-amber-700 dark:bg-amber-400/15 dark:text-amber-200",
  Quoted: "bg-emerald-50 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-200",
};

export const dynamic = "force-dynamic";

export default async function QuoteRequestsPage() {
  const quoteRequestViews = await getQuoteRequestViews();
  const statusCounts = quoteRequestViews.reduce<Record<string, number>>(
    (counts, request) => {
      counts[request.status] = (counts[request.status] ?? 0) + 1;
      return counts;
    },
    {},
  );
  const pricingWork = quoteRequestViews.filter((request) =>
    ["Pricing", "New", "Quoted"].includes(request.status),
  );
  const rateWork = quoteRequestViews.filter((request) =>
    ["Pricing", "New"].includes(request.status),
  );
  const followUpWork = quoteRequestViews.filter(
    (request) => request.status === "Quoted",
  );
  const urgentWork = quoteRequestViews.filter((request) =>
    ["High", "Urgent", "Same day", "Today"].some((term) =>
      request.urgency?.toLowerCase().includes(term.toLowerCase()),
    ),
  );
  const phoneChecklist = [
    "Origin, destination, pickup, and delivery timing",
    "Equipment, weight, commodity, and pallet count",
    "Appointment windows, accessorials, and special requirements",
    "Target rate, current carrier issue, and urgency",
  ];

  const statusItems = [
    { icon: FilePlus2, label: "New", note: "Needs first review" },
    { icon: Gauge, label: "Pricing", note: "Needs rate work" },
    { icon: ClipboardCheck, label: "Quoted", note: "Needs follow-up" },
  ];

  return (
    <InternalShell
      active="Quotes & Pricing"
      eyebrow="Pricing desk"
      title="Quotes & Pricing"
      description="Capture shipper details fast, price the load, and convert accepted quotes into booked freight."
      action={{ label: "Public quote form", href: "/#quote" }}
    >
      {/* Status cards */}
      <section className="grid gap-4 md:grid-cols-3">
        {statusItems.map((item) => (
          <Link
            key={item.label}
            href="#pricing-work"
            className={cn(
              "group overflow-hidden rounded-lg shadow-md shadow-slate-950/5 transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-slate-950/10 dark:shadow-black/25 dark:hover:border-slate-700 dark:hover:shadow-black/35",
              statusPanelClass[item.label] ?? "border border-slate-100 bg-white",
            )}
          >
            <div className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div className={cn("flex h-9 w-9 items-center justify-center rounded-md", statusIconClass[item.label] ?? "bg-slate-50 text-slate-700")}>
                  <item.icon className="h-4 w-4" />
                </div>
                <ArrowRight className="h-4 w-4 text-slate-300 transition group-hover:text-emerald-600 dark:text-slate-600 dark:group-hover:text-emerald-300" />
              </div>
              <p className="mt-4 text-sm font-medium text-slate-600">{item.label}</p>
              <p className="mt-1 text-4xl font-bold tracking-tight text-slate-950">
                {(statusCounts[item.label] ?? 0).toString()}
              </p>
              <p className="mt-2 text-xs text-slate-500">{item.note}</p>
            </div>
          </Link>
        ))}
      </section>

      <section className="grid items-start gap-6 xl:grid-cols-[1fr_380px]">
        <article className="rounded-lg border border-slate-100 bg-white p-6 shadow-md shadow-slate-950/5 dark:border-slate-800 dark:bg-slate-900/80 dark:shadow-black/25">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-700">
                Pricing command desk
              </p>
              <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">
                Rate, protect margin, and convert
              </h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                Work new and pricing requests first, validate DAT/Truckstop
                market context on the quote record, then follow up quoted
                customers before the rate gets stale.
              </p>
            </div>
            <Link href="#pricing-work" className="dao-primary-action shrink-0 text-xs">
              Open pricing queue <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <CommandTile
              icon={Gauge}
              label="Needs rate work"
              value={rateWork.length.toString()}
              detail="New or pricing status"
              tone="amber"
            />
            <CommandTile
              icon={ClipboardCheck}
              label="Quoted follow-up"
              value={followUpWork.length.toString()}
              detail="Customer decision needed"
              tone="emerald"
            />
            <CommandTile
              icon={Route}
              label="Active lanes"
              value={pricingWork.length.toString()}
              detail="In pricing workflow"
              tone="sky"
            />
            <CommandTile
              icon={DollarSign}
              label="Urgent requests"
              value={urgentWork.length.toString()}
              detail="Same-day/high urgency"
              tone="red"
            />
          </div>

          <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/40">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-slate-950 text-white shadow-sm dark:bg-slate-900 dark:ring-1 dark:ring-slate-700">
                <PhoneCall className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">
                  Phone quote intake
                </p>
                <p className="text-sm font-semibold text-slate-900">
                  Create a quote while the shipper is on the phone
                </p>
              </div>
            </div>
            <details className="group mt-4">
              <summary className="flex cursor-pointer list-none items-center justify-between rounded-md border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800 transition hover:border-emerald-200 dark:border-slate-800 dark:bg-slate-950/70 dark:hover:border-emerald-700">
                Open quick intake form
                <span className="text-xs text-slate-400 group-open:hidden">Expand</span>
                <span className="hidden text-xs text-slate-400 group-open:inline">Collapse</span>
              </summary>
              <div className="mt-4 rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900/70">
                <QuoteRequestCreateForm />
              </div>
            </details>
          </div>
        </article>

        <article className="overflow-hidden rounded-lg border border-slate-100 bg-white shadow-md shadow-slate-950/5 dark:border-slate-800 dark:bg-slate-900/80 dark:shadow-black/25">
          <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-5 py-3 dark:border-slate-800 dark:bg-slate-950/40">
            <ClipboardCheck className="h-4 w-4 text-slate-500" />
            <p className="text-sm font-semibold text-slate-700">Call checklist</p>
          </div>
          <div className="p-4">
            <p className="text-xs text-slate-500">
              Ask these before hanging up so pricing does not stall later.
            </p>
            <div className="mt-3 grid gap-2">
              {phoneChecklist.map((item, i) => (
                <div
                  key={item}
                  className="flex items-start gap-3 rounded-md border border-slate-100 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-950/55"
                >
                  <span className="mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-600 dark:bg-slate-700 dark:text-slate-200">
                    {i + 1}
                  </span>
                  {item}
                </div>
              ))}
            </div>
            <Link
              href="#pricing-work"
              className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700"
            >
              Review pricing queue
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </article>
      </section>

      <section className="overflow-hidden rounded-lg border border-slate-100 bg-white shadow-md shadow-slate-950/5 dark:border-slate-800 dark:bg-slate-900/80 dark:shadow-black/25">
        <div id="pricing-work" className="scroll-mt-24 flex flex-col gap-2 border-b border-slate-100 bg-slate-50 px-5 py-4 dark:border-slate-800 dark:bg-slate-950/40 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">
              Pricing queue
            </p>
            <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-950">
              What needs pricing attention
            </h2>
          </div>
          <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
            {pricingWork.length} active
          </span>
        </div>

        <div className="grid gap-3 p-4 xl:grid-cols-3">
          {pricingWork.length ? pricingWork.map((request) => (
            <Link
              key={`work-${request.id}`}
              href={`/quote-requests/${request.id}`}
              className="rounded-lg border border-slate-100 bg-slate-50 p-4 transition hover:-translate-y-0.5 hover:border-emerald-200 hover:bg-white hover:shadow-md dark:border-slate-800 dark:bg-slate-950/45 dark:hover:border-emerald-700 dark:hover:bg-slate-900 dark:hover:shadow-black/25"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-900">{request.company}</p>
                  <p className="mt-0.5 text-xs text-slate-500">{request.lane}</p>
                </div>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-xs font-semibold",
                    statusBadgeClass[request.status] ?? "bg-slate-100 text-slate-700",
                  )}
                >
                  {request.status}
                </span>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <QueueMiniMetric label="Equipment" value={request.equipment} />
                <QueueMiniMetric label="Pickup" value={request.pickup} />
                <QueueMiniMetric
                  label="Margin target"
                  value={request.targetMarginPercent}
                />
                <QueueMiniMetric label="Urgency" value={request.urgency} />
              </div>
              <p className="mt-3 line-clamp-2 text-xs leading-5 text-slate-500">
                {request.pricingNotes}
              </p>
              <span className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700">
                Open quote
                <ArrowRight className="h-3 w-3" />
              </span>
            </Link>
          )) : (
            <div className="col-span-3 py-8 text-center text-sm text-slate-400">
              No active quote requests.
            </div>
          )}
        </div>
      </section>

      <section className="grid gap-4">
        {quoteRequestViews.map((request) => (
          <article
            key={request.id}
            className="overflow-hidden rounded-lg border border-slate-100 bg-white shadow-md shadow-slate-950/5 dark:border-slate-800 dark:bg-slate-900/80 dark:shadow-black/25"
          >
            <div className="flex items-center justify-between gap-4 border-b border-slate-100 bg-slate-50 px-5 py-3 dark:border-slate-800 dark:bg-slate-950/40">
              <div className="flex min-w-0 flex-wrap items-center gap-3">
                <p className="font-semibold text-slate-900">{request.company}</p>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-xs font-semibold",
                    statusBadgeClass[request.status] ?? "bg-slate-100 text-slate-700",
                  )}
                >
                  {request.status}
                </span>
                <span className="text-sm text-slate-500">{request.lane}</span>
              </div>
              <Link
                href={`/quote-requests/${request.id}`}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-md bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:-translate-y-0.5 hover:bg-slate-700 dark:bg-slate-950 dark:ring-1 dark:ring-slate-800 dark:hover:bg-slate-800"
              >
                Open quote
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            <div className="p-5">
              <div className="grid gap-3 md:grid-cols-4">
                <Metric icon={Truck} label="Equipment" value={request.equipment} />
                <Metric icon={CalendarDays} label="Pickup" value={request.pickup} />
                <Metric icon={Package} label="Weight" value={request.weight} />
                <Metric icon={Gauge} label="Urgency" value={request.urgency ?? "Normal"} />
              </div>

              <div className="mt-3 grid gap-3 lg:grid-cols-[1fr_1fr_1fr]">
                <Metric icon={DollarSign} label="Target margin" value={request.targetMarginPercent ?? "Not set"} />
                <Metric icon={CalendarDays} label="Delivery" value={request.delivery ?? "Not set"} />
                <Metric icon={Package} label="Commodity" value={request.commodity ?? "Commodity needed"} />
              </div>

              <div className="mt-3 grid gap-3 lg:grid-cols-2">
                <div className="rounded-md border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/55">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                    Freight details
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-700">
                    {request.details}
                  </p>
                </div>
                <div className="rounded-md border border-l-[3px] border-slate-100 border-l-emerald-400 bg-slate-50 p-4 dark:border-slate-800 dark:border-l-emerald-400 dark:bg-emerald-950/15">
                  <div className="flex items-center gap-2">
                    <Bot className="h-4 w-4 text-emerald-600" />
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-emerald-700">
                      Pricing note
                    </p>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-700">
                    {request.pricingNotes}
                  </p>
                  <p className="mt-2 text-xs font-semibold text-emerald-700">
                    AI: {request.aiSummary}
                  </p>
                </div>
              </div>
            </div>
          </article>
        ))}
      </section>
    </InternalShell>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-md border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950/55">
      <Icon className="h-4 w-4 text-slate-400" />
      <p className="mt-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
        {label}
      </p>
      <p className="mt-0.5 text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function QueueMiniMetric({
  label,
  value,
}: {
  label: string;
  value?: string;
}) {
  return (
    <div className="rounded-md bg-white px-3 py-2 dark:bg-slate-900/80 dark:ring-1 dark:ring-slate-800">
      <p className="text-xs font-semibold text-slate-500">{label}</p>
      <p className="mt-0.5 text-sm font-semibold text-slate-900">
        {value ?? "Not set"}
      </p>
    </div>
  );
}

function CommandTile({
  icon: Icon,
  label,
  value,
  detail,
  tone,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string;
  detail: string;
  tone: "amber" | "emerald" | "red" | "sky";
}) {
  const toneClass = {
    amber:
      "border-amber-100 bg-amber-50 text-amber-950 dark:border-amber-500/55 dark:bg-amber-950/35 dark:text-amber-100",
    emerald:
      "border-emerald-100 bg-emerald-50 text-emerald-950 dark:border-emerald-500/50 dark:bg-emerald-950/35 dark:text-emerald-100",
    red: "border-red-100 bg-red-50 text-red-950 dark:border-red-500/55 dark:bg-red-950/35 dark:text-red-100",
    sky: "border-sky-100 bg-sky-50 text-sky-950 dark:border-sky-500/50 dark:bg-sky-950/35 dark:text-sky-100",
  }[tone];

  return (
    <div className={cn("rounded-lg border p-4 shadow-sm dark:shadow-black/20", toneClass)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.14em] opacity-75">
            {label}
          </p>
          <p className="mt-1 text-2xl font-black tracking-normal">{value}</p>
        </div>
        <span className="flex h-9 w-9 flex-none items-center justify-center rounded-md bg-white/70 shadow-sm dark:bg-slate-950/45 dark:ring-1 dark:ring-white/10">
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <p className="mt-3 text-sm leading-6 opacity-85">{detail}</p>
    </div>
  );
}
