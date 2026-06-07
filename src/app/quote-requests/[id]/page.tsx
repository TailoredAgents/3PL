import Link from "next/link";
import { notFound } from "next/navigation";
import type { ComponentType } from "react";
import {
  ArrowLeft,
  Bot,
  CalendarDays,
  CheckCircle2,
  DollarSign,
  Mail,
  MapPinned as MapPinIcon,
  Package,
  Phone,
  Truck,
  XCircle,
} from "lucide-react";

import {
  AiAgentRunForm,
  CustomerQuoteCreateForm,
  MarketRateFetchForm,
  PricingRecommendationCreateForm,
  PricingRecommendationGenerateForm,
  QuoteEmailSendForm,
  QuoteConvertForm,
  QuoteRequestEditForm,
  QuoteStatusUpdateForm,
  RateBenchmarkCreateForm,
} from "@/components/crm-forms";
import { InternalShell } from "@/components/internal-shell";
import { getQuoteRequestDetailView } from "@/lib/crm";
import { buildQuoteEmailDraft } from "@/lib/quote-email";

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
  const quoteEmailDraft = await buildQuoteEmailDraft(quote);
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
      active="Quotes & Pricing"
      eyebrow="Quote detail"
      title={quote.company}
      description="Review the quote request, confirm service details, then convert it to a load when the customer accepts."
      action={{ label: "Back to Quotes & Pricing", href: "/quote-requests" }}
    >
      <Link
        href="/quote-requests"
        className="inline-flex w-fit items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-950"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to quote queue
      </Link>

      {/* Quote details + actions */}
      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        {/* Left: quote info */}
        <article className="overflow-hidden rounded-lg border border-slate-100 bg-white shadow-md shadow-slate-950/5">
          <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-5 py-3">
            <div className="flex items-center gap-2">
              <Truck className="h-4 w-4 text-slate-400" />
              <p className="text-sm font-semibold text-slate-700">{quote.lane}</p>
            </div>
            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusBadgeClass(quote.status)}`}>
              {quote.status}
            </span>
          </div>
          <div className="p-5">
            <p className="text-sm font-medium text-slate-600">
              {quote.contact} · {quote.phone} · {quote.email}
            </p>

            <div className="mt-5 grid gap-4 sm:grid-cols-3">
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

            <div className="mt-5 rounded-md bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                Freight details
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {quote.specialRequirements}
              </p>
              <div className="mt-3 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
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

            <div className="mt-4 rounded-md border border-emerald-100 bg-emerald-50 p-4">
              <div className="flex items-center gap-2">
                <Bot className="h-4 w-4 text-emerald-700" />
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-emerald-700">
                  AI pricing note
                </p>
              </div>
              <p className="mt-2 text-sm leading-6 text-emerald-900">
                {quote.aiSummary}
              </p>
            </div>
          </div>
        </article>

        {/* Right: action cards */}
        <div className="grid gap-6">
          {/* Edit details */}
          <article className="overflow-hidden rounded-lg border border-slate-100 bg-white shadow-md shadow-slate-950/5">
            <details className="group">
              <summary className="flex cursor-pointer list-none items-center gap-2 border-b border-slate-100 bg-slate-50 px-5 py-3">
                <Package className="h-4 w-4 text-slate-400" />
                <p className="flex-1 text-sm font-semibold text-slate-700">Edit quote details before pricing</p>
                <span className="text-xs text-slate-400 group-open:hidden">Expand</span>
                <span className="hidden text-xs text-slate-400 group-open:inline">Collapse</span>
              </summary>
              <div className="p-5">
                <QuoteRequestEditForm quoteId={quote.id} defaults={quoteDefaults} />
              </div>
            </details>
          </article>

          {/* Run pricing agent */}
          <article className="overflow-hidden rounded-lg border border-slate-100 bg-white shadow-md shadow-slate-950/5">
            <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-5 py-3">
              <Bot className="h-4 w-4 text-slate-400" />
              <p className="text-sm font-semibold text-slate-700">Run pricing agent</p>
            </div>
            <div className="p-5">
              <AiAgentRunForm
                relatedEntityType="QuoteRequest"
                relatedEntityId={quote.id}
                defaultAgent="Quote Pricing Agent"
                agentOptions={["Quote Pricing Agent"]}
              />
            </div>
          </article>

          {/* Pricing workspace */}
          <article className="overflow-hidden rounded-lg border border-slate-100 bg-white shadow-md shadow-slate-950/5">
            <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-5 py-3">
              <DollarSign className="h-4 w-4 text-slate-400" />
              <p className="text-sm font-semibold text-slate-700">Pricing workspace</p>
            </div>
            <div className="grid gap-4 p-5">
              <div className="rounded-md border border-sky-100 bg-sky-50 p-4">
                <p className="text-sm font-semibold text-sky-900">Market rates first</p>
                <p className="mt-2 text-sm leading-6 text-sky-900">
                  Fetch DAT/Truckstop benchmarks after confirming the lane,
                  equipment, timing, and requirements above.
                </p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {quote.marketRateProviders.map((provider) => (
                    <div
                      key={provider.provider}
                      className={`rounded-md border px-3 py-2 text-xs ${marketProviderClass(provider.configured)}`}
                    >
                      <p className="font-bold">{provider.label}</p>
                      <p className="mt-1 leading-5">{provider.message}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-4">
                  <MarketRateFetchForm quoteId={quote.id} />
                </div>
              </div>
              <RateBenchmarkCreateForm quoteId={quote.id} />
              <PricingRecommendationGenerateForm quoteId={quote.id} />
              <PricingRecommendationCreateForm
                quoteId={quote.id}
                defaultCarrierCost={defaultCarrierCost ?? undefined}
                defaultCustomerRate={defaultCustomerRate ?? undefined}
                defaultTargetMarginPercent={quote.targetMarginPercent}
              />
            </div>
          </article>

          {/* Record customer quote */}
          <article className="overflow-hidden rounded-lg border border-slate-100 bg-white shadow-md shadow-slate-950/5">
            <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-5 py-3">
              <DollarSign className="h-4 w-4 text-slate-400" />
              <p className="text-sm font-semibold text-slate-700">Record customer quote</p>
            </div>
            <div className="p-5">
              <CustomerQuoteCreateForm
                quoteId={quote.id}
                defaultQuotedRate={defaultCustomerRate}
                defaultTargetCarrierCost={defaultCarrierCost ?? undefined}
              />
            </div>
          </article>

          {/* Quote email draft */}
          <article className="overflow-hidden rounded-lg border border-slate-100 bg-white shadow-md shadow-slate-950/5">
            <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-5 py-3">
              <Mail className="h-4 w-4 text-slate-400" />
              <p className="text-sm font-semibold text-slate-700">Quote email draft</p>
            </div>
            <div className="p-5">
              {quoteEmailDraft ? (
                <QuoteEmailSendForm
                  quoteId={quote.id}
                  toEmail={quoteEmailDraft.toEmail}
                  subject={quoteEmailDraft.subject}
                  body={quoteEmailDraft.body}
                />
              ) : (
                <p className="text-sm leading-6 text-slate-500">
                  Save a customer quote first. The email draft will use the
                  latest quoted rate, lane, equipment, timing, and validity.
                </p>
              )}
            </div>
          </article>

          {/* Customer decision */}
          <article className="overflow-hidden rounded-lg border border-slate-100 bg-white shadow-md shadow-slate-950/5">
            <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-5 py-3">
              <CheckCircle2 className="h-4 w-4 text-slate-400" />
              <p className="text-sm font-semibold text-slate-700">Customer decision</p>
            </div>
            <div className="grid gap-4 p-5 sm:grid-cols-3">
              <div className="rounded-lg bg-emerald-50 p-4">
                <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-emerald-900">
                  <CheckCircle2 className="h-4 w-4" />
                  Accepted
                </div>
                <QuoteStatusUpdateForm
                  quoteId={quote.id}
                  status="ACCEPTED"
                  label="Mark accepted"
                  notePlaceholder="Customer approved the quoted rate."
                />
              </div>
              <div className="rounded-lg bg-red-50 p-4">
                <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-red-900">
                  <XCircle className="h-4 w-4" />
                  Rejected
                </div>
                <QuoteStatusUpdateForm
                  quoteId={quote.id}
                  status="REJECTED"
                  label="Mark rejected"
                  notePlaceholder="Customer rejected or declined this quote."
                />
              </div>
              <div className="rounded-lg bg-slate-50 p-4">
                <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <DollarSign className="h-4 w-4" />
                  Reprice
                </div>
                <QuoteStatusUpdateForm
                  quoteId={quote.id}
                  status="PRICING"
                  label="Move to pricing"
                  notePlaceholder="Needs updated DAT/Truckstop rate work."
                />
              </div>
            </div>
          </article>

          {/* Convert accepted quote */}
          <article className="overflow-hidden rounded-lg border border-slate-100 bg-white shadow-md shadow-slate-950/5">
            <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-5 py-3">
              <Truck className="h-4 w-4 text-slate-400" />
              <p className="text-sm font-semibold text-slate-700">Convert accepted quote</p>
            </div>
            <div className="p-5">
              <div className="mb-4 rounded-md border border-emerald-100 bg-emerald-50 p-4">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">
                  Carries over to load
                </p>
                <div className="mt-3 grid gap-1.5 text-sm text-emerald-900 sm:grid-cols-2">
                  <p>Lane: {quote.lane}</p>
                  <p>Equipment: {quote.equipment}</p>
                  <p>Pickup: {quote.pickup}</p>
                  <p>Delivery: {quote.deliveryDateInput ?? "Not set"}</p>
                  <p>Weight: {quote.weight}</p>
                  <p>Commodity: {quote.commodity ?? "Not set"}</p>
                  {quote.customerReference ? (
                    <p>Customer ref: {quote.customerReference}</p>
                  ) : null}
                  {quote.hazmat ? <p>Hazmat: Yes</p> : null}
                  {quote.temperatureRequirement &&
                  quote.temperatureRequirement !== "Not set" ? (
                    <p>Temp: {quote.temperatureRequirement}</p>
                  ) : null}
                </div>
              </div>
              <QuoteConvertForm
                quoteId={quote.id}
                defaultCustomerRate={quote.latestQuote?.quotedRate}
                defaultCarrierRate={
                  quote.latestQuote?.targetCarrierCost ?? undefined
                }
              />
            </div>
          </article>
        </div>
      </section>

      {/* Rate benchmarks + buy/sell guidance */}
      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <article className="overflow-hidden rounded-lg border border-slate-100 bg-white shadow-md shadow-slate-950/5">
          <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-5 py-3">
            <p className="text-sm font-semibold text-slate-700">Rate benchmarks</p>
            <span className="rounded-full bg-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-600">
              {quote.rateBenchmarks.length} saved
            </span>
          </div>
          <div className="grid gap-3 p-5">
            {quote.rateBenchmarks.length ? (
              quote.rateBenchmarks.map((benchmark) => (
                <div
                  key={benchmark.id}
                  className="rounded-md border border-slate-100 bg-slate-50 p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="font-semibold">{benchmark.sourceLabel}</p>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${benchmarkSourceClass(benchmark.source)}`}>
                        {benchmark.source}
                      </span>
                      <p className="text-sm font-semibold text-slate-600">
                        {benchmark.created}
                      </p>
                    </div>
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
                  <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-600">
                    {benchmark.notes}
                  </p>
                </div>
              ))
            ) : (
              <p className="py-8 text-center text-sm text-slate-400">
                No benchmarks yet. Add from the pricing workspace above.
              </p>
            )}
          </div>
        </article>

        <article className="overflow-hidden rounded-lg border border-slate-100 bg-white shadow-md shadow-slate-950/5">
          <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-5 py-3">
            <p className="text-sm font-semibold text-slate-700">Buy / sell guidance</p>
            <span className="rounded-full bg-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-600">
              {quote.pricingRecommendations.length} saved
            </span>
          </div>
          <div className="grid gap-3 p-5">
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
                  <p className="mt-2 whitespace-pre-line text-xs leading-5 text-slate-500">
                    Source detail: {formatRecommendationNotes(recommendation.notes)}
                  </p>
                </div>
              ))
            ) : (
              <p className="py-8 text-center text-sm text-slate-400">
                No pricing recommendations yet. Add at least one benchmark, then generate one.
              </p>
            )}
          </div>
        </article>
      </section>

      {/* Lane history */}
      <article className="overflow-hidden rounded-lg border border-slate-100 bg-white shadow-md shadow-slate-950/5">
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-5 py-3">
          <p className="text-sm font-semibold text-slate-700">Lane history</p>
          <span className="rounded-full bg-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-600">
            {quote.laneHistory.length} loads
          </span>
        </div>
        <div className="grid gap-3 p-5">
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
            <p className="py-8 text-center text-sm text-slate-400">
              No same-lane load history yet. Manual benchmarks will drive pricing until history accumulates.
            </p>
          )}
        </div>
      </article>

      {/* Quote history */}
      <article className="overflow-hidden rounded-lg border border-slate-100 bg-white shadow-md shadow-slate-950/5">
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-5 py-3">
          <p className="text-sm font-semibold text-slate-700">Quote history</p>
          <span className="rounded-full bg-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-600">
            {quote.customerQuotes.length} saved
          </span>
        </div>
        <div className="grid gap-3 p-5">
          {quote.customerQuotes.length ? (
            quote.customerQuotes.map((customerQuote) => (
              <div
                key={customerQuote.id}
                className="grid gap-3 rounded-md border border-slate-100 bg-slate-50 p-4 md:grid-cols-6"
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
                <QuoteMetric label="Status" value={customerQuote.status} />
                <QuoteMetric label="Valid until" value={customerQuote.validUntil} />
              </div>
            ))
          ) : (
            <p className="py-8 text-center text-sm text-slate-400">
              No customer quotes saved yet. Record the rate after the pricing call, then follow up for acceptance.
            </p>
          )}
        </div>
      </article>
    </InternalShell>
  );
}

function getStatusBadgeClass(status: string) {
  if (status === "ACCEPTED" || status === "Accepted") return "bg-emerald-100 text-emerald-800";
  if (status === "REJECTED" || status === "Rejected" || status === "Lost") return "bg-red-100 text-red-800";
  if (status === "QUOTED" || status === "Quoted") return "bg-sky-100 text-sky-800";
  return "bg-amber-100 text-amber-800";
}

function marketProviderClass(configured: boolean) {
  return configured
    ? "border-emerald-100 bg-emerald-50 text-emerald-900"
    : "border-amber-100 bg-amber-50 text-amber-900";
}

function benchmarkSourceClass(source: string) {
  const map: Record<string, string> = {
    Dat: "bg-sky-100 text-sky-800",
    Truckstop: "bg-indigo-100 text-indigo-800",
    Manual: "bg-slate-200 text-slate-700",
    "Internal History": "bg-emerald-100 text-emerald-800",
    "Carrier Quote": "bg-amber-100 text-amber-800",
    "Customer History": "bg-violet-100 text-violet-800",
  };

  return map[source] ?? "bg-slate-200 text-slate-700";
}

function formatRecommendationNotes(notes: string) {
  try {
    const parsed = JSON.parse(notes) as Record<string, unknown>;
    const lines = [
      parsed.benchmarkAverage
        ? `Benchmark average: $${Number(parsed.benchmarkAverage).toLocaleString()}`
        : null,
      parsed.internalBuyAverage
        ? `Internal buy average: $${Number(parsed.internalBuyAverage).toLocaleString()}`
        : null,
      parsed.internalSellAverage
        ? `Internal sell average: $${Number(parsed.internalSellAverage).toLocaleString()}`
        : null,
      parsed.latestCustomerQuote
        ? `Latest customer quote: $${Number(parsed.latestCustomerQuote).toLocaleString()}`
        : null,
      parsed.appliedMarginRule
        ? `Applied margin rule: ${String(parsed.appliedMarginRule)}`
        : null,
      parsed.appliedQuoteTemplate
        ? `Applied quote template: ${String(parsed.appliedQuoteTemplate)}`
        : null,
    ].filter(Boolean);

    return lines.length ? lines.join("\n") : notes;
  } catch {
    return notes;
  }
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
      <Icon className="h-4 w-4 text-emerald-600" />
      <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-900">{value}</p>
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
