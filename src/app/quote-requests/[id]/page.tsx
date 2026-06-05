import Link from "next/link";
import { notFound } from "next/navigation";
import type { ComponentType } from "react";
import { ArrowLeft, Bot, CalendarDays, Package, Truck } from "lucide-react";

import { QuoteConvertForm } from "@/components/crm-forms";
import { InternalShell } from "@/components/internal-shell";
import { getQuoteRequestDetailView } from "@/lib/crm";

export const dynamic = "force-dynamic";

export default async function QuoteRequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const quote = await getQuoteRequestDetailView(id);

  if (!quote) {
    notFound();
  }

  return (
    <InternalShell
      active="Quote Requests"
      eyebrow="Quote detail"
      title={quote.company}
      description="Review the quote request, confirm service details, then convert it to a load when the customer accepts."
      action={{ label: "Back to quotes", href: "/quote-requests" }}
    >
      <Link
        href="/quote-requests"
        className="inline-flex w-fit items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-950"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to quote queue
      </Link>

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-2xl font-semibold">{quote.lane}</h2>
              <p className="mt-2 text-sm font-medium text-slate-600">
                {quote.contact} | {quote.email}
              </p>
            </div>
            <span className="w-fit rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-800">
              {quote.status}
            </span>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <Metric icon={Truck} label="Equipment" value={quote.equipment} />
            <Metric icon={CalendarDays} label="Pickup" value={quote.pickup} />
            <Metric icon={Package} label="Weight" value={quote.weight} />
          </div>

          <div className="mt-6 rounded-md bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-700">
              Freight details
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {quote.specialRequirements}
            </p>
          </div>

          <div className="mt-6 rounded-md border border-emerald-100 bg-emerald-50 p-4">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-emerald-700" />
              <p className="text-sm font-semibold text-emerald-900">
                AI pricing note
              </p>
            </div>
            <p className="mt-2 text-sm leading-6 text-emerald-900">
              {quote.aiSummary}
            </p>
          </div>
        </article>

        <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-2xl font-semibold">Convert quote to load</h2>
          <p className="mt-3 leading-7 text-slate-600">
            Once the customer accepts, enter the sell rate and optional carrier
            coverage to create the operational load.
          </p>
          <div className="mt-5 rounded-lg bg-slate-50 p-4">
            <QuoteConvertForm quoteId={quote.id} />
          </div>
        </article>
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
    <div className="rounded-md bg-slate-50 p-4">
      <Icon className="h-5 w-5 text-emerald-600" />
      <p className="mt-3 text-sm font-semibold text-slate-600">{label}</p>
      <p className="mt-1 font-medium">{value}</p>
    </div>
  );
}
