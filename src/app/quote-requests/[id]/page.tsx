import Link from "next/link";
import { notFound } from "next/navigation";
import type { ComponentType } from "react";
import {
  ArrowLeft,
  Bot,
  CalendarDays,
  DollarSign,
  MapPinned as MapPinIcon,
  Package,
  Phone,
  Truck,
} from "lucide-react";

import {
  AiAgentRunForm,
  CustomerQuoteCreateForm,
  MarketRateFetchForm,
  PricingRecommendationCreateForm,
  PricingRecommendationGenerateForm,
  QuoteConvertForm,
  QuoteRequestEditForm,
  RateBenchmarkCreateForm,
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
  const latestRecommendation = quote.pricingRecommendations[0];
  const defaultCarrierCost =
    latestRecommendation?.recommendedCarrierCost ??
    quote.latestQuote?.targetCarrierCost ??
    undefined;
  const defaultCustomerRate =
    latestRecommendation?.recommendedCustomerRate ??
    quote.latestQuote?.quotedRate ??
    undefined;
  const quoteDefaults = {
    companyName: quote.company,
    contactName: quote.contact === "No contact" ? undefined : quote.contact,
    email: quote.email === "No email" ? undefined : quote.email,
    phone: quote.phone === "No phone" ? undefined : quote.phone,
    originCity: quote.originCity,
    originState: quote.originState,
    originAddress: editDefault(quote.originAddress),
    destinationCity: quote.destinationCity,
    destinationState: quote.destinationState,
    destinationAddress: editDefault(quote.destinationAddress),
    pickupDate: quote.pickupDateInput,
    pickupWindow: editDefault(quote.pickupWindow),
    deliveryDate: quote.deliveryDateInput,
    deliveryWindow: editDefault(quote.deliveryWindow),
    equipmentType: quote.equipment,
    commodity: editDefault(quote.commodity),
    weight:
      quote.weight === "Not set"
        ? undefined
        : quote.weight?.replace(/[^\d]/g, ""),
    palletCount: editDefault(quote.palletCount),
    pieceCount: editDefault(quote.pieceCount),
    dimensions: editDefault(quote.dimensions),
    hazmat: quote.hazmat === "Yes",
    temperatureRequirement: editDefault(quote.temperatureRequirement),
    appointmentRequired: quote.appointmentRequired === "Yes",
    accessorials: editDefault(quote.accessorials),
    customerReference: editDefault(quote.customerReference),
    urgency: editDefault(quote.urgency),
    targetMarginPercent: quote.targetMarginPercentInput,
    pricingNotes: editDefault(quote.pricingNotes),
    specialRequirements: editDefault(quote.specialRequirements),
  };

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

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Metric
              icon={MapPinIcon}
              label="Pickup address"
              value={quote.originAddress ?? "Pickup address needed"}
            />
            <Metric
              icon={MapPinIcon}
              label="Delivery address"
              value={quote.destinationAddress ?? "Delivery address needed"}
            />
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-4">
            <Metric
              icon={CalendarDays}
              label="Pickup window"
              value={quote.pickupWindow ?? "Window needed"}
            />
            <Metric
              icon={CalendarDays}
              label="Delivery"
              value={`${quote.delivery ?? "Not set"} / ${
                quote.deliveryWindow ?? "Window needed"
              }`}
            />
            <Metric
              icon={Package}
              label="Pieces / pallets"
              value={`${quote.pieceCount ?? "Not set"} / ${
                quote.palletCount ?? "Not set"
              }`}
            />
            <Metric
              icon={Package}
              label="Customer ref"
              value={quote.customerReference ?? "Not set"}
            />
          </div>

          <div className="mt-6 rounded-md bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-700">
              Freight details
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {quote.specialRequirements}
            </p>
            <div className="mt-4 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
              <p>Commodity: {quote.commodity ?? "Commodity needed"}</p>
              <p>Dimensions: {quote.dimensions ?? "Not set"}</p>
              <p>Hazmat: {quote.hazmat ?? "No"}</p>
              <p>Temperature: {quote.temperatureRequirement ?? "None"}</p>
              <p>Appointment: {quote.appointmentRequired ?? "No"}</p>
              <p>Urgency: {quote.urgency ?? "Normal"}</p>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Accessorials: {quote.accessorials ?? "None"}
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Pricing notes: {quote.pricingNotes ?? "No pricing notes yet."}
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
          <details className="mb-6 rounded-md border border-slate-200 bg-slate-50 p-4">
            <summary className="cursor-pointer text-sm font-bold text-slate-800">
              Edit quote details before pricing
            </summary>
            <div className="mt-4">
              <QuoteRequestEditForm quoteId={quote.id} defaults={quoteDefaults} />
            </div>
          </details>

          <div className="rounded-md border border-emerald-100 bg-emerald-50 p-4">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-emerald-700" />
              <p className="text-sm font-semibold text-emerald-900">
                Run pricing agent
              </p>
            </div>
            <p className="mt-2 text-sm leading-6 text-emerald-900">
              Ask Grok to review this quote request before the rate is sent.
            </p>
            <div className="mt-4 rounded-md bg-white/70 p-3">
              <AiAgentRunForm
                relatedEntityType="QuoteRequest"
                relatedEntityId={quote.id}
                defaultAgent="Quote Pricing Agent"
                agentOptions={["Quote Pricing Agent"]}
              />
            </div>
          </div>

          <div className="mt-6 border-t border-slate-100 pt-6">
            <h2 className="text-2xl font-semibold">Pricing workspace</h2>
            <p className="mt-3 leading-7 text-slate-600">
              Add lane benchmarks, generate a recommended buy/sell rate, then
              save the final customer quote after the pricing call or email.
            </p>
            <div className="mt-5 rounded-lg bg-slate-50 p-4">
              <div className="mb-4 rounded-md border border-sky-100 bg-sky-50 p-4">
                <p className="text-sm font-semibold text-sky-900">
                  Market rates first
                </p>
                <p className="mt-2 text-sm leading-6 text-sky-900">
                  Fetch DAT/Truckstop benchmarks after confirming the lane,
                  equipment, timing, and requirements above. Manual benchmarks
                  are fallback when provider credentials or endpoints are not
                  configured.
                </p>
                <div className="mt-4">
                  <MarketRateFetchForm quoteId={quote.id} />
                </div>
              </div>
              <RateBenchmarkCreateForm quoteId={quote.id} />
            </div>
            <div className="mt-4 rounded-lg bg-slate-50 p-4">
              <PricingRecommendationGenerateForm quoteId={quote.id} />
            </div>
            <div className="mt-4 rounded-lg bg-slate-50 p-4">
              <PricingRecommendationCreateForm
                quoteId={quote.id}
                defaultCarrierCost={defaultCarrierCost ?? undefined}
                defaultCustomerRate={defaultCustomerRate ?? undefined}
                defaultTargetMarginPercent={quote.targetMarginPercent}
              />
            </div>
          </div>

          <div className="mt-6 border-t border-slate-100 pt-6" />
          <h2 className="text-2xl font-semibold">Record customer quote</h2>
          <p className="mt-3 leading-7 text-slate-600">
            Save the sell rate you gave the shipper. This moves the request to
            quoted status and keeps rate history attached to the account.
          </p>
          <div className="mt-5 rounded-lg bg-slate-50 p-4">
            <CustomerQuoteCreateForm
              quoteId={quote.id}
              defaultQuotedRate={defaultCustomerRate}
              defaultTargetCarrierCost={
                defaultCarrierCost ?? undefined
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

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-700">
                Pricing intelligence
              </p>
              <h2 className="mt-2 text-2xl font-semibold">
                Rate benchmarks
              </h2>
            </div>
            <p className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">
              {quote.rateBenchmarks.length} saved
            </p>
          </div>
          <div className="mt-5 grid gap-3">
            {quote.rateBenchmarks.length ? (
              quote.rateBenchmarks.map((benchmark) => (
                <div
                  key={benchmark.id}
                  className="rounded-md border border-slate-100 bg-slate-50 p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="font-semibold">{benchmark.sourceLabel}</p>
                    <p className="text-sm font-semibold text-slate-600">
                      {benchmark.source} | {benchmark.created}
                    </p>
                  </div>
                  <div className="mt-3 grid gap-3 sm:grid-cols-4">
                    <QuoteMetric
                      label="Low"
                      value={
                        benchmark.lowRate === null
                          ? "Not set"
                          : `$${benchmark.lowRate.toLocaleString()}`
                      }
                    />
                    <QuoteMetric
                      label="Average"
                      value={`$${benchmark.averageRate.toLocaleString()}`}
                    />
                    <QuoteMetric
                      label="High"
                      value={
                        benchmark.highRate === null
                          ? "Not set"
                          : `$${benchmark.highRate.toLocaleString()}`
                      }
                    />
                    <QuoteMetric
                      label="Confidence"
                      value={
                        benchmark.confidence === null
                          ? "Not set"
                          : `${Math.round(benchmark.confidence * 100)}%`
                      }
                    />
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    {benchmark.notes}
                  </p>
                </div>
              ))
            ) : (
              <p className="rounded-md border border-dashed border-slate-200 bg-slate-50 p-5 text-sm leading-6 text-slate-600">
                No benchmarks yet. Add a manual benchmark from DAT,
                Truckstop, a carrier quote, or internal lane knowledge before
                generating a system recommendation.
              </p>
            )}
          </div>
        </article>

        <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-700">
                Recommendations
              </p>
              <h2 className="mt-2 text-2xl font-semibold">
                Buy / sell guidance
              </h2>
            </div>
            <p className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">
              {quote.pricingRecommendations.length} saved
            </p>
          </div>
          <div className="mt-5 grid gap-3">
            {quote.pricingRecommendations.length ? (
              quote.pricingRecommendations.map((recommendation) => (
                <div
                  key={recommendation.id}
                  className="rounded-md border border-slate-100 bg-slate-50 p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="font-semibold">{recommendation.source}</p>
                    <p className="text-sm font-semibold text-slate-600">
                      {recommendation.riskLevel} risk | {recommendation.created}
                    </p>
                  </div>
                  <div className="mt-3 grid gap-3 sm:grid-cols-4">
                    <QuoteMetric
                      label="Target buy"
                      value={`$${recommendation.recommendedCarrierCost.toLocaleString()}`}
                    />
                    <QuoteMetric
                      label="Customer sell"
                      value={`$${recommendation.recommendedCustomerRate.toLocaleString()}`}
                    />
                    <QuoteMetric
                      label="Gross profit"
                      value={`$${recommendation.projectedGrossProfit.toLocaleString()}`}
                    />
                    <QuoteMetric
                      label="Margin"
                      value={`${recommendation.marginPercent}%`}
                    />
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    {recommendation.summary}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Valid:{" "}
                    {recommendation.validForHours === null
                      ? "Not set"
                      : `${recommendation.validForHours} hours`}
                  </p>
                </div>
              ))
            ) : (
              <p className="rounded-md border border-dashed border-slate-200 bg-slate-50 p-5 text-sm leading-6 text-slate-600">
                No pricing recommendations yet. Add at least one benchmark,
                then generate a system recommendation or save a manual one.
              </p>
            )}
          </div>
        </article>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-700">
              Lane history
            </p>
            <h2 className="mt-2 text-2xl font-semibold">
              Similar completed or active loads
            </h2>
          </div>
          <p className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">
            {quote.laneHistory.length} loads
          </p>
        </div>
        <div className="mt-5 grid gap-3">
          {quote.laneHistory.length ? (
            quote.laneHistory.map((load) => (
              <Link
                key={load.id}
                href={`/loads/${load.id}`}
                className="grid gap-3 rounded-md border border-slate-100 bg-slate-50 p-4 hover:bg-white hover:shadow-sm md:grid-cols-5"
              >
                <QuoteMetric
                  label="Customer"
                  value={`$${load.customerRate.toLocaleString()}`}
                />
                <QuoteMetric
                  label="Carrier"
                  value={
                    load.carrierRate
                      ? `$${load.carrierRate.toLocaleString()}`
                      : "Not set"
                  }
                />
                <QuoteMetric
                  label="Margin"
                  value={`$${load.margin.toLocaleString()} (${load.marginPercent}%)`}
                />
                <QuoteMetric label="Pickup" value={load.pickup} />
                <QuoteMetric label="Status" value={load.status} />
              </Link>
            ))
          ) : (
            <p className="rounded-md border border-dashed border-slate-200 bg-slate-50 p-5 text-sm leading-6 text-slate-600">
              No same-lane load history yet. Manual benchmarks will drive this
              pricing recommendation until history accumulates.
            </p>
          )}
        </div>
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

function editDefault(value: string | undefined) {
  if (
    !value ||
    [
      "Not set",
      "None",
      "Normal",
      "Pickup address needed",
      "Delivery address needed",
      "Window needed",
      "Commodity needed",
      "No pricing notes yet.",
      "No details yet.",
    ].includes(value)
  ) {
    return undefined;
  }

  return value;
}
