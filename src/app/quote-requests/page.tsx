import { Bot, CalendarDays, Gauge, Package, Truck } from "lucide-react";

import { QuoteRequestCreateForm } from "@/components/crm-forms";
import { InternalShell } from "@/components/internal-shell";
import { getQuoteRequestViews } from "@/lib/crm";
import { cn } from "@/lib/utils";

const statusStyles: Record<string, string> = {
  New: "bg-sky-100 text-sky-800",
  Pricing: "bg-amber-100 text-amber-800",
  Quoted: "bg-emerald-100 text-emerald-800",
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

  return (
    <InternalShell
      active="Quote Requests"
      eyebrow="Pricing desk"
      title="Quote request queue"
      description="Every quote request should be structured, prioritized, priced, and followed up from one place before it becomes a booked load."
      action={{ label: "Public quote form", href: "/#quote" }}
    >
      <section className="grid gap-4 md:grid-cols-3">
        {[
          {
            label: "New",
            value: (statusCounts.New ?? 0).toString(),
            note: "Needs first review",
          },
          {
            label: "Pricing",
            value: (statusCounts.Pricing ?? 0).toString(),
            note: "Needs rate work",
          },
          {
            label: "Quoted",
            value: (statusCounts.Quoted ?? 0).toString(),
            note: "Needs follow-up",
          },
        ].map((item) => (
          <article
            key={item.label}
            className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
          >
            <p className="text-sm font-medium text-slate-600">{item.label}</p>
            <p className="mt-2 text-3xl font-semibold">{item.value}</p>
            <p className="mt-3 text-sm leading-6 text-slate-600">{item.note}</p>
          </article>
        ))}
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-2xl font-semibold">Create quote request</h2>
        <p className="mt-3 leading-7 text-slate-600">
          Capture a quote from a phone call or email before rate work starts.
        </p>
        <div className="mt-5 rounded-lg bg-slate-50 p-4">
          <QuoteRequestCreateForm />
        </div>
      </section>

      <section className="grid gap-6">
        {quoteRequestViews.map((request) => (
          <article
            key={`${request.company}-${request.lane}`}
            className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
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
              <button className="rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">
                Open quote
              </button>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-4">
              <div className="rounded-md bg-slate-50 p-4">
                <Truck className="h-5 w-5 text-emerald-600" />
                <p className="mt-3 text-sm font-semibold text-slate-600">
                  Equipment
                </p>
                <p className="mt-1 font-medium">{request.equipment}</p>
              </div>
              <div className="rounded-md bg-slate-50 p-4">
                <CalendarDays className="h-5 w-5 text-emerald-600" />
                <p className="mt-3 text-sm font-semibold text-slate-600">
                  Pickup
                </p>
                <p className="mt-1 font-medium">{request.pickup}</p>
              </div>
              <div className="rounded-md bg-slate-50 p-4">
                <Package className="h-5 w-5 text-emerald-600" />
                <p className="mt-3 text-sm font-semibold text-slate-600">
                  Weight
                </p>
                <p className="mt-1 font-medium">{request.weight}</p>
              </div>
              <div className="rounded-md bg-slate-50 p-4">
                <Gauge className="h-5 w-5 text-emerald-600" />
                <p className="mt-3 text-sm font-semibold text-slate-600">
                  Priority
                </p>
                <p className="mt-1 font-medium">
                  {request.status === "Pricing" ? "High" : "Normal"}
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_1fr]">
              <div className="rounded-md bg-slate-50 p-4">
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
