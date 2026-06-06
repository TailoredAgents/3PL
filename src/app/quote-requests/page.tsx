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

const statusStyles: Record<string, string> = {
  New: "bg-sky-100 text-sky-800",
  Pricing: "bg-amber-100 text-amber-800",
  Quoted: "bg-emerald-100 text-emerald-800",
};

const statusPanelStyles: Record<string, string> = {
  New: "border-sky-100 bg-sky-50 text-sky-900",
  Pricing: "border-amber-100 bg-amber-50 text-amber-900",
  Quoted: "border-emerald-100 bg-emerald-50 text-emerald-900",
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

  return (
    <InternalShell
      active="Quotes & Pricing"
      eyebrow="Pricing desk"
      title="Quotes & Pricing"
      description="Most quotes start with a phone conversation. Capture the shipper's details fast, then price, follow up, and convert accepted quotes into booked loads."
      action={{ label: "Public quote form", href: "/#quote" }}
    >
      <section className="grid gap-4 md:grid-cols-3">
        {[
          {
            icon: FilePlus2,
            label: "New",
            value: (statusCounts.New ?? 0).toString(),
            note: "Needs first review",
          },
          {
            icon: Gauge,
            label: "Pricing",
            value: (statusCounts.Pricing ?? 0).toString(),
            note: "Needs rate work",
          },
          {
            icon: ClipboardCheck,
            label: "Quoted",
            value: (statusCounts.Quoted ?? 0).toString(),
            note: "Needs follow-up",
          },
        ].map((item) => (
          <article
            key={item.label}
            className={cn(
              "rounded-lg border p-5 shadow-lg shadow-slate-950/5",
              statusPanelStyles[item.label] ?? "border-white bg-white text-slate-950",
            )}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-white/70 text-current shadow-sm">
              <item.icon className="h-5 w-5" />
            </div>
            <p className="mt-5 text-sm font-medium opacity-80">{item.label}</p>
            <p className="mt-2 text-3xl font-semibold">{item.value}</p>
            <p className="mt-3 text-sm leading-6 opacity-80">{item.note}</p>
          </article>
        ))}
      </section>

      <section className="grid items-start gap-6 xl:grid-cols-[1fr_380px]">
        <details
          open
          className="group rounded-lg border border-white bg-white p-5 shadow-lg shadow-slate-950/5"
        >
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-md bg-emerald-50 text-emerald-700">
                <PhoneCall className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-700">
                  Phone quote intake
                </p>
                <h2 className="mt-1 text-2xl font-semibold">
                  Create quote while the shipper is on the phone
                </h2>
                <p className="mt-1 leading-7 text-slate-600">
                  Use this for relationship-driven quote calls, emails, and
                  texts from existing or warm shippers.
                </p>
              </div>
            </div>
            <span className="flex-none rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white group-open:bg-slate-700">
              <span className="group-open:hidden">Open form</span>
              <span className="hidden group-open:inline">Hide form</span>
            </span>
          </summary>
          <div className="mt-5 rounded-lg border border-slate-100 bg-slate-50 p-4">
            <QuoteRequestCreateForm />
          </div>
        </details>

        <article className="rounded-lg border border-white bg-white p-5 shadow-lg shadow-slate-950/5">
          <div className="flex items-center gap-3">
            <ClipboardCheck className="h-6 w-6 text-emerald-600" />
            <h2 className="text-2xl font-semibold">Call checklist</h2>
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Ask these before hanging up so pricing does not stall later.
          </p>
          <div className="mt-5 grid gap-3">
            {phoneChecklist.map((item) => (
              <div
                key={item}
                className="rounded-md border border-slate-100 bg-slate-50 p-4 text-sm font-medium leading-6 text-slate-700"
              >
                {item}
              </div>
            ))}
          </div>
          <Link
            href="#pricing-work"
            className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-emerald-700"
          >
            Review pricing queue
            <ArrowRight className="h-4 w-4" />
          </Link>
        </article>
      </section>

      <section className="rounded-lg border border-white bg-white p-5 shadow-lg shadow-slate-950/5">
        <div id="pricing-work" className="scroll-mt-24" />
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-700">
              Pricing work
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">
              What needs pricing attention
            </h2>
          </div>
          <p className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">
            {pricingWork.length} active quote requests
          </p>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          {pricingWork.map((request) => (
            <Link
              key={`work-${request.id}`}
              href={`/quote-requests/${request.id}`}
              className="rounded-md border border-slate-100 bg-slate-50 p-4 hover:-translate-y-0.5 hover:border-emerald-200 hover:bg-white hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{request.company}</p>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    {request.lane}
                  </p>
                </div>
                <span
                  className={cn(
                    "rounded-full px-2 py-1 text-xs font-bold",
                    statusStyles[request.status] ??
                      "bg-slate-100 text-slate-700",
                  )}
                >
                  {request.status}
                </span>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                <p className="rounded-md bg-white px-3 py-2">
                  <span className="block text-xs font-semibold text-slate-500">
                    Equipment
                  </span>
                  <span className="font-semibold">{request.equipment}</span>
                </p>
                <p className="rounded-md bg-white px-3 py-2">
                  <span className="block text-xs font-semibold text-slate-500">
                    Pickup
                  </span>
                  <span className="font-semibold">{request.pickup}</span>
                </p>
              </div>
              <span className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-emerald-700">
                Open quote
                <ArrowRight className="h-4 w-4" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="grid gap-5">
        {quoteRequestViews.map((request) => (
          <article
            key={request.id}
            className="rounded-lg border border-white bg-white p-5 shadow-lg shadow-slate-950/5"
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-2xl font-semibold">{request.company}</h2>
                  <span
                    className={cn(
                      "rounded-full px-3 py-1 text-sm font-semibold",
                      statusStyles[request.status] ??
                        "bg-slate-100 text-slate-700",
                    )}
                  >
                    {request.status}
                  </span>
                </div>
                <p className="mt-2 text-lg font-medium text-slate-700">
                  {request.lane}
                </p>
              </div>
              <Link
                href={`/quote-requests/${request.id}`}
                className="inline-flex items-center justify-center gap-2 rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-slate-950/15 hover:bg-slate-800"
              >
                Open quote
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="mt-6 grid gap-3 md:grid-cols-4">
              <Metric icon={Truck} label="Equipment" value={request.equipment} />
              <Metric icon={CalendarDays} label="Pickup" value={request.pickup} />
              <Metric icon={Package} label="Weight" value={request.weight} />
              <Metric
                icon={Gauge}
                label="Priority"
                value={request.status === "Pricing" ? "High" : "Normal"}
              />
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
              <div className="rounded-md border border-slate-100 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-700">
                  Freight details
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {request.details}
                </p>
              </div>
              <div className="rounded-md border border-emerald-100 bg-emerald-50 p-4">
                <div className="flex items-center gap-2">
                  <Bot className="h-5 w-5 text-emerald-700" />
                  <p className="text-sm font-semibold text-emerald-900">
                    AI pricing note
                  </p>
                </div>
                <p className="mt-2 text-sm leading-6 text-emerald-900">
                  {request.aiSummary}
                </p>
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
    <div className="rounded-md border border-slate-100 bg-slate-50 p-4">
      <Icon className="h-5 w-5 text-emerald-600" />
      <p className="mt-3 text-sm font-semibold text-slate-600">{label}</p>
      <p className="mt-1 font-medium">{value}</p>
    </div>
  );
}
