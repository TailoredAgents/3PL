import Link from "next/link";
import type { ComponentType } from "react";
import {
  ArrowRight,
  Bot,
  CalendarDays,
  ClipboardCheck,
  FilePlus2,
  Gauge,
  PhoneCall,
  Package,
  Truck,
} from "lucide-react";

import { QuoteRequestCreateForm } from "@/components/crm-forms";
import { InternalShell } from "@/components/internal-shell";
import { getQuoteRequestViews } from "@/lib/crm";
import { cn } from "@/lib/utils";

const statusBadgeClass: Record<string, string> = {
  New: "bg-sky-50 text-sky-800",
  Pricing: "bg-amber-50 text-amber-800",
  Quoted: "bg-emerald-50 text-emerald-800",
};

const statusPanelClass: Record<string, string> = {
  New: "border-l-[3px] border-l-sky-400 border-slate-100 bg-white",
  Pricing: "border-l-[3px] border-l-amber-400 border-slate-100 bg-white",
  Quoted: "border-l-[3px] border-l-emerald-400 border-slate-100 bg-white",
};

const statusIconClass: Record<string, string> = {
  New: "bg-sky-50 text-sky-700",
  Pricing: "bg-amber-50 text-amber-700",
  Quoted: "bg-emerald-50 text-emerald-700",
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
          <article
            key={item.label}
            className={cn(
              "overflow-hidden rounded-lg shadow-md shadow-slate-950/5",
              statusPanelClass[item.label] ?? "border border-slate-100 bg-white",
            )}
          >
            <div className="p-5">
              <div className={cn("flex h-9 w-9 items-center justify-center rounded-md", statusIconClass[item.label] ?? "bg-slate-50 text-slate-700")}>
                <item.icon className="h-4 w-4" />
              </div>
              <p className="mt-4 text-sm font-medium text-slate-600">{item.label}</p>
              <p className="mt-1 text-4xl font-bold tracking-tight text-slate-950">
                {(statusCounts[item.label] ?? 0).toString()}
              </p>
              <p className="mt-2 text-xs text-slate-500">{item.note}</p>
            </div>
          </article>
        ))}
      </section>

      {/* Phone intake form + call checklist */}
      <section className="grid items-start gap-6 xl:grid-cols-[1fr_360px]">
        <details className="group overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-4 hover:bg-slate-50">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-emerald-50 text-emerald-700">
                <PhoneCall className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">
                  Phone quote intake
                </p>
                <p className="text-sm font-semibold text-slate-900">
                  Create quote while the shipper is on the phone
                </p>
              </div>
            </div>
            <span className="text-xs font-semibold text-slate-400 group-open:hidden">
              Expand
            </span>
            <span className="hidden text-xs font-semibold text-slate-400 group-open:inline">
              Collapse
            </span>
          </summary>
          <div className="border-t border-slate-200 p-5">
            <QuoteRequestCreateForm />
          </div>
        </details>

        <article className="overflow-hidden rounded-lg border border-slate-100 bg-white shadow-md shadow-slate-950/5">
          <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-5 py-3">
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
                  className="flex items-start gap-3 rounded-md border border-slate-100 bg-slate-50 px-3 py-2.5 text-sm text-slate-700"
                >
                  <span className="mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-600">
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

      {/* Mini pricing queue */}
      <section className="overflow-hidden rounded-lg border border-slate-100 bg-white shadow-md shadow-slate-950/5">
        <div id="pricing-work" className="scroll-mt-24 flex items-center justify-between border-b border-slate-100 bg-slate-50 px-5 py-3">
          <p className="text-sm font-semibold text-slate-700">What needs pricing attention</p>
          <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-700">
            {pricingWork.length} active
          </span>
        </div>

        <div className="grid gap-3 p-4 lg:grid-cols-3">
          {pricingWork.length ? pricingWork.map((request) => (
            <Link
              key={`work-${request.id}`}
              href={`/quote-requests/${request.id}`}
              className="rounded-md border border-slate-100 bg-slate-50 p-4 hover:-translate-y-0.5 hover:border-emerald-200 hover:bg-white hover:shadow-md"
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
                <div className="rounded-md bg-white px-3 py-2">
                  <p className="text-xs font-semibold text-slate-500">Equipment</p>
                  <p className="mt-0.5 text-sm font-semibold text-slate-900">{request.equipment}</p>
                </div>
                <div className="rounded-md bg-white px-3 py-2">
                  <p className="text-xs font-semibold text-slate-500">Pickup</p>
                  <p className="mt-0.5 text-sm font-semibold text-slate-900">{request.pickup}</p>
                </div>
              </div>
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

      {/* Full quote detail cards */}
      <section className="grid gap-4">
        {quoteRequestViews.map((request) => (
          <article
            key={request.id}
            className="overflow-hidden rounded-lg border border-slate-100 bg-white shadow-md shadow-slate-950/5"
          >
            {/* Card header bar */}
            <div className="flex items-center justify-between gap-4 border-b border-slate-100 bg-slate-50 px-5 py-3">
              <div className="flex items-center gap-3">
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
                className="inline-flex items-center gap-1.5 rounded-md bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-700"
              >
                Open quote
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            <div className="p-5">
              {/* Metrics */}
              <div className="grid gap-3 md:grid-cols-4">
                <Metric icon={Truck} label="Equipment" value={request.equipment} />
                <Metric icon={CalendarDays} label="Pickup" value={request.pickup} />
                <Metric icon={Package} label="Weight" value={request.weight} />
                <Metric
                  icon={Gauge}
                  label="Priority"
                  value={request.status === "Pricing" ? "High" : "Normal"}
                />
              </div>

              {/* Details + AI note */}
              <div className="mt-3 grid gap-3 lg:grid-cols-2">
                <div className="rounded-md border border-slate-100 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                    Freight details
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-700">
                    {request.details}
                  </p>
                </div>
                <div className="rounded-md border-l-[3px] border-l-emerald-400 border border-slate-100 bg-slate-50 p-4">
                  <div className="flex items-center gap-2">
                    <Bot className="h-4 w-4 text-emerald-600" />
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-emerald-700">
                      AI pricing note
                    </p>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-700">
                    {request.aiSummary}
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
    <div className="rounded-md border border-slate-100 bg-slate-50 p-3">
      <Icon className="h-4 w-4 text-slate-400" />
      <p className="mt-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
        {label}
      </p>
      <p className="mt-0.5 text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}
