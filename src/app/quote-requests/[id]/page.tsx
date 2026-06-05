import Link from "next/link";
import { notFound } from "next/navigation";
import type { ComponentType } from "react";
import {
  ArrowLeft,
  Bot,
  CalendarDays,
  DollarSign,
  Package,
  Phone,
  Truck,
} from "lucide-react";

import {
  CustomerQuoteCreateForm,
  QuoteConvertForm,
} from "@/components/crm-forms";
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
                {quote.contact} | {quote.phone} | {quote.email}
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

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Metric icon={Phone} label="Best next action" value="Call with rate" />
            <Metric
              icon={DollarSign}
              label="Latest quoted rate"
              value={
                quote.latestQuote
                  ? `$${quote.latestQuote.quotedRate.toLocaleString()}`
                  : "Not quoted yet"
              }
            />
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
          <h2 className="text-2xl font-semibold">Record customer quote</h2>
          <p className="mt-3 leading-7 text-slate-600">
            Save the sell rate you gave the shipper. This moves the request to
            quoted status and keeps rate history attached to the account.
          </p>
          <div className="mt-5 rounded-lg bg-slate-50 p-4">
            <CustomerQuoteCreateForm
              quoteId={quote.id}
              defaultQuotedRate={quote.latestQuote?.quotedRate}
              defaultTargetCarrierCost={
                quote.latestQuote?.targetCarrierCost ?? undefined
              }
            />
          </div>

          <div className="mt-6 border-t border-slate-100 pt-6">
            <h3 className="text-lg font-semibold">Convert accepted quote</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Use this only after the shipper says yes. The latest quoted rate
              is prefilled when available.
            </p>
            <div className="mt-4 rounded-lg bg-slate-50 p-4">
              <QuoteConvertForm
                quoteId={quote.id}
                defaultCustomerRate={quote.latestQuote?.quotedRate}
                defaultCarrierRate={
                  quote.latestQuote?.targetCarrierCost ?? undefined
                }
              />
            </div>
          </div>
        </article>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-700">
              Quote history
            </p>
            <h2 className="mt-2 text-2xl font-semibold">
              Rates offered to the shipper
            </h2>
          </div>
          <p className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">
            {quote.customerQuotes.length} saved
          </p>
        </div>

        <div className="mt-5 grid gap-3">
          {quote.customerQuotes.length ? (
            quote.customerQuotes.map((customerQuote) => (
              <div
                key={customerQuote.id}
                className="grid gap-3 rounded-md border border-slate-100 bg-slate-50 p-4 md:grid-cols-5"
              >
                <QuoteMetric
                  label="Customer quote"
                  value={`$${customerQuote.quotedRate.toLocaleString()}`}
                />
                <QuoteMetric
                  label="Carrier target"
                  value={
                    customerQuote.targetCarrierCost === null
                      ? "Not set"
                      : `$${customerQuote.targetCarrierCost.toLocaleString()}`
                  }
                />
                <QuoteMetric
                  label="Projected margin"
                  value={
                    customerQuote.projectedGrossProfit === null
                      ? "Not set"
                      : `$${customerQuote.projectedGrossProfit.toLocaleString()}`
                  }
                />
                <QuoteMetric
                  label="Margin percent"
                  value={
                    customerQuote.marginPercent === null
                      ? "Not set"
                      : `${customerQuote.marginPercent}%`
                  }
                />
                <QuoteMetric label="Saved" value={customerQuote.created} />
              </div>
            ))
          ) : (
            <div className="rounded-md border border-dashed border-slate-200 bg-slate-50 p-5 text-sm leading-6 text-slate-600">
              No customer quotes have been saved yet. Record the rate after the
              pricing call or email, then follow up for acceptance.
            </div>
          )}
        </div>
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

function QuoteMetric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
        {label}
      </p>
      <p className="mt-1 font-semibold text-slate-950">{value}</p>
    </div>
  );
}
