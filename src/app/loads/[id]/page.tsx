import Link from "next/link";
import { notFound } from "next/navigation";
import type { ComponentType } from "react";
import {
  Bot,
  CalendarDays,
  CircleDollarSign,
  ClipboardCheck,
  FileText,
  MapPinned,
  Package,
  ReceiptText,
  ShieldCheck,
  Truck,
} from "lucide-react";

import {
  AiAgentRunForm,
  CarrierCandidateCreateForm,
  CarrierCandidateGenerateForm,
  CarrierCandidateRequestQuoteForm,
  CarrierQuoteAcceptForm,
  CarrierQuoteCreateForm,
  CustomerUpdateForm,
  DocumentCreateForm,
  InvoiceCreateForm,
  LoadUpdateForm,
  MarketplaceCapacitySearchForm,
  MarketplaceLoadPostForm,
  RateConfirmationGenerateForm,
  RateConfirmationForm,
  ShipmentEventCreateForm,
} from "@/components/crm-forms";
import { InternalShell } from "@/components/internal-shell";
import { getLoadDetailView } from "@/lib/crm";
import { toCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

const TABS = [
  { key: "overview", label: "Overview" },
  { key: "coverage", label: "Coverage" },
  { key: "documents", label: "Documents" },
  { key: "billing", label: "Billing" },
] as const;
type TabKey = (typeof TABS)[number]["key"];

export default async function LoadDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const [{ id }, { tab: rawTab }] = await Promise.all([params, searchParams]);
  const tab: TabKey =
    TABS.find((t) => t.key === rawTab)?.key ?? "overview";

  const load = await getLoadDetailView(id);
  if (!load) {
    notFound();
  }

  const latestRateConfirmation = load.documents.find(
    (document) => document.type === "Rate Confirmation",
  );

  return (
    <InternalShell
      active="Load Board"
      eyebrow={load.loadNumber}
      title={load.shipper}
      description="Execute the shipment from one workspace: status, carrier, margin, tracking events, POD readiness, and customer update context."
      action={{ label: "Back to Load Board", href: "/loads" }}
    >
      {/* Tab nav */}
      <div className="flex gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={`/loads/${id}?tab=${t.key}`}
            className={`flex-1 rounded-md px-4 py-2 text-center text-sm font-semibold transition-colors ${
              tab === t.key
                ? "bg-white shadow-sm text-slate-950"
                : "text-slate-500 hover:text-slate-950"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {/* ── Overview tab ─────────────────────────────────────────── */}
      {tab === "overview" && (
        <>
          <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
            {/* Left: load details */}
            <article className="overflow-hidden rounded-lg border border-slate-100 bg-white shadow-md shadow-slate-950/5">
              <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-5 py-3">
                <div className="flex items-center gap-2">
                  <Truck className="h-4 w-4 text-slate-400" />
                  <p className="text-sm font-semibold text-slate-700">{load.lane}</p>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusBadgeClass(load.status)}`}>
                  {load.status}
                </span>
              </div>
              <div className="p-5">
                <p className="text-xs font-medium text-slate-500">{load.equipment}</p>

                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <MetricCard icon={Truck} label="Carrier" value={load.carrier} />
                  <MetricCard
                    icon={CalendarDays}
                    label="Pickup / Delivery"
                    value={`${load.pickup} ${load.pickupWindow ?? ""} → ${load.delivery} ${load.deliveryWindow ?? ""}`}
                  />
                  <MetricCard
                    icon={CircleDollarSign}
                    label="Customer rate"
                    value={toCurrency(load.customerRate)}
                  />
                  <MetricCard
                    icon={CircleDollarSign}
                    label="Carrier rate"
                    value={load.carrierRate ? toCurrency(load.carrierRate) : "Needed"}
                  />
                  <MetricCard
                    icon={CircleDollarSign}
                    label="Margin"
                    value={`${toCurrency(load.margin)} (${load.marginPercent}%)`}
                  />
                </div>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <MetricCard
                    icon={MapPinned}
                    label="Pickup address"
                    value={load.originAddress ?? "Pickup address needed"}
                  />
                  <MetricCard
                    icon={MapPinned}
                    label="Delivery address"
                    value={load.destinationAddress ?? "Delivery address needed"}
                  />
                </div>

                <FreightRequirements load={load} />

                {load.risk && (
                  <div className="mt-5 rounded-md border border-amber-100 bg-amber-50 p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-700">
                      Next action
                    </p>
                    <p className="mt-1.5 text-sm font-medium leading-6 text-amber-900">
                      {load.risk}
                    </p>
                  </div>
                )}

                <div className="mt-4 overflow-hidden rounded-md border border-slate-100 bg-white">
                  <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-4 py-2.5">
                    <ClipboardCheck className="h-3.5 w-3.5 text-slate-400" />
                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Billing readiness</p>
                  </div>
                  <div className="grid gap-2 p-4">
                    <ReadinessItem
                      label="Carrier assigned"
                      complete={load.carrier !== "Carrier needed"}
                    />
                    <ReadinessItem
                      label="Carrier rate entered"
                      complete={load.carrierRate > 0}
                    />
                    <ReadinessItem label="POD received" complete={load.hasPod} />
                    <ReadinessItem
                      label="Rate confirmation signed"
                      complete={load.rateConfirmationStatus === "Signed"}
                    />
                    <ReadinessItem
                      label="Invoice created"
                      complete={Boolean(load.invoice)}
                    />
                  </div>
                  <div className="border-t border-slate-100 px-4 py-2.5">
                    <p className="text-sm font-semibold text-slate-700">
                      {load.billingReadiness}
                    </p>
                  </div>
                </div>
              </div>
            </article>

            {/* Right: operations */}
            <div className="grid gap-6">
              <article className="overflow-hidden rounded-lg border border-slate-100 bg-white shadow-md shadow-slate-950/5">
                <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-5 py-3">
                  <Bot className="h-4 w-4 text-slate-400" />
                  <p className="text-sm font-semibold text-slate-700">AI operations agent</p>
                </div>
                <div className="p-5">
                  <AiAgentRunForm
                    relatedEntityType="Load"
                    relatedEntityId={load.id}
                    defaultAgent="Load Tracking Agent"
                    agentOptions={[
                      "Load Tracking Agent",
                      "Carrier Coverage Agent",
                      "Billing Readiness Agent",
                    ]}
                  />
                </div>
              </article>

              <article className="overflow-hidden rounded-lg border border-slate-100 bg-white shadow-md shadow-slate-950/5">
                <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-5 py-3">
                  <Truck className="h-4 w-4 text-slate-400" />
                  <p className="text-sm font-semibold text-slate-700">Update load</p>
                </div>
                <div className="p-5">
                  <LoadUpdateForm
                    loadId={load.id}
                    currentStatus={load.status}
                    currentCarrier={load.carrier}
                    currentCarrierRate={load.carrierRate}
                  />
                </div>
              </article>

              <article className="overflow-hidden rounded-lg border border-slate-100 bg-white shadow-md shadow-slate-950/5">
                <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-5 py-3">
                  <MapPinned className="h-4 w-4 text-slate-400" />
                  <p className="text-sm font-semibold text-slate-700">Add tracking event</p>
                </div>
                <div className="p-5">
                  <ShipmentEventCreateForm loadId={load.id} />
                </div>
              </article>

              <article className="overflow-hidden rounded-lg border border-slate-100 bg-white shadow-md shadow-slate-950/5">
                <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-5 py-3">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-slate-400" />
                    <p className="text-sm font-semibold text-slate-700">Customer update</p>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span>Status: <span className="font-semibold text-slate-700">{load.customerUpdateStatus ?? "Not needed"}</span></span>
                  </div>
                </div>
                <div className="p-5">
                  <CustomerUpdateForm
                    loadId={load.id}
                    currentStatus={load.customerUpdateStatus ?? "Not needed"}
                  />
                </div>
              </article>
            </div>
          </section>

          {/* Shipment timeline */}
          <article className="overflow-hidden rounded-lg border border-slate-100 bg-white shadow-md shadow-slate-950/5">
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-5 py-3">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-slate-400" />
                <p className="text-sm font-semibold text-slate-700">Shipment timeline</p>
              </div>
              <span className="rounded-full bg-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-600">
                {load.events.length}
              </span>
            </div>
            {load.events.length ? (
              <div className="divide-y divide-slate-100">
                {load.events.map((event) => (
                  <div
                    key={`${event.type}-${event.time}-${event.message}`}
                    className="flex gap-4 px-5 py-4"
                  >
                    <div className="mt-2 h-2 w-2 flex-none rounded-full bg-emerald-500" />
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {event.type}
                        <span className="ml-2 text-xs font-medium text-slate-400">
                          {event.time}
                        </span>
                      </p>
                      <p className="mt-0.5 text-sm font-medium text-slate-700">
                        {event.location}
                      </p>
                      <p className="mt-1 text-sm leading-6 text-slate-600">
                        {event.message}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-8 text-center text-sm text-slate-400">No tracking events yet.</p>
            )}
          </article>
        </>
      )}

      {/* ── Coverage tab ─────────────────────────────────────────── */}
      {tab === "coverage" && (
        <>
          <article className="overflow-hidden rounded-lg border border-slate-100 bg-white shadow-md shadow-slate-950/5">
            <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-5 py-3">
              <Bot className="h-4 w-4 text-slate-400" />
              <p className="text-sm font-semibold text-slate-700">AI coverage agent</p>
            </div>
            <div className="p-5">
              <AiAgentRunForm
                relatedEntityType="Load"
                relatedEntityId={load.id}
                defaultAgent="Carrier Coverage Agent"
                agentOptions={["Carrier Coverage Agent"]}
              />
            </div>
          </article>

          <article className="overflow-hidden rounded-lg border border-slate-100 bg-white shadow-md shadow-slate-950/5">
            <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-5 py-3">
              <Truck className="h-4 w-4 text-slate-400" />
              <p className="text-sm font-semibold text-slate-700">Carrier coverage</p>
            </div>
            <div className="grid gap-4 p-5">
              <CarrierCandidateGenerateForm loadId={load.id} />
              <div className="rounded-md border border-slate-100 bg-slate-50 p-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <MarketplaceCapacitySearchForm loadId={load.id} />
                  <MarketplaceLoadPostForm loadId={load.id} />
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-500">
                  These actions use configured DAT/Truckstop endpoint URLs and
                  log each provider request for auditability. Manual candidates
                  stay available when provider endpoints are not connected.
                </p>
              </div>
              <CarrierCandidateCreateForm loadId={load.id} />
              <CarrierQuoteCreateForm loadId={load.id} />
            </div>
          </article>

          <article className="overflow-hidden rounded-lg border border-slate-100 bg-white shadow-md shadow-slate-950/5">
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-5 py-3">
              <p className="text-sm font-semibold text-slate-700">Carrier candidates</p>
              <span className="rounded-full bg-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-600">
                {load.carrierCandidates.length}
              </span>
            </div>
            <div className="grid gap-4 p-5">
              {load.carrierCandidates.length ? (
                load.carrierCandidates.map((candidate) => (
                  <div
                    key={candidate.id}
                    className="grid gap-4 rounded-md border border-slate-100 bg-slate-50 p-4 xl:grid-cols-[1fr_auto]"
                  >
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <p className="font-semibold text-slate-900">
                          {candidate.companyName}
                        </p>
                        <span className="rounded-full bg-sky-100 px-2.5 py-1 text-xs font-bold text-sky-800">
                          {candidate.source}
                        </span>
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                            candidate.complianceStatus === "Approved"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {candidate.complianceStatus}
                        </span>
                        <span className="rounded-full bg-slate-200 px-2.5 py-1 text-xs font-bold text-slate-700">
                          {candidate.status}
                        </span>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        {candidate.notes}
                      </p>
                      <div className="mt-4 grid gap-3 sm:grid-cols-4">
                        <OfferMetric
                          label="Target rate"
                          value={
                            candidate.suggestedRate === null
                              ? "Not set"
                              : toCurrency(candidate.suggestedRate)
                          }
                        />
                        <OfferMetric
                          label="Match"
                          value={
                            candidate.matchScore === null
                              ? "Not set"
                              : `${Math.round(candidate.matchScore * 100)}%`
                          }
                        />
                        <OfferMetric
                          label="Contact"
                          value={candidate.contactName}
                        />
                        <OfferMetric label="Created" value={candidate.created} />
                      </div>
                      <div className="mt-3 grid gap-3 text-sm leading-6 text-slate-600 sm:grid-cols-2">
                        <p>{candidate.phone}</p>
                        <p>{candidate.email}</p>
                        <p>{candidate.mcNumber}</p>
                        <p>{candidate.dotNumber}</p>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        {candidate.complianceSnapshot}
                      </p>
                    </div>
                    <div className="flex flex-col justify-between gap-3 xl:w-56">
                      {candidate.carrierId ? (
                        <Link
                          href={`/carriers/${candidate.carrierId}`}
                          className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                        >
                          <ShieldCheck className="h-4 w-4" />
                          Carrier file
                        </Link>
                      ) : null}
                      {candidate.status === "Quote Requested" ||
                      candidate.status === "Converted" ? (
                        <p className="rounded-md bg-emerald-50 px-4 py-2 text-center text-sm font-semibold text-emerald-800">
                          Quote requested
                        </p>
                      ) : (
                        <CarrierCandidateRequestQuoteForm
                          loadId={load.id}
                          candidateId={candidate.id}
                        />
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="py-8 text-center text-sm text-slate-400">
                  No carrier candidates yet. Generate from the coverage tools above.
                </p>
              )}
            </div>
          </article>

          <article className="overflow-hidden rounded-lg border border-slate-100 bg-white shadow-md shadow-slate-950/5">
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-5 py-3">
              <p className="text-sm font-semibold text-slate-700">Carrier offers</p>
              <span className="rounded-full bg-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-600">
                {load.carrierQuotes.length}
              </span>
            </div>
            <div className="grid gap-4 p-5">
              {load.carrierQuotes.length ? (
                load.carrierQuotes.map((quote) => (
                  <div
                    key={quote.id}
                    className="grid gap-4 rounded-md border border-slate-100 bg-slate-50 p-4 xl:grid-cols-[1fr_auto]"
                  >
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <p className="font-semibold text-slate-900">
                          {quote.carrier}
                        </p>
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                            quote.complianceStatus === "Approved"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {quote.complianceStatus}
                        </span>
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                            quote.status === "Accepted"
                              ? "bg-emerald-100 text-emerald-800"
                              : quote.status === "Rejected"
                                ? "bg-slate-200 text-slate-600"
                                : "bg-sky-100 text-sky-800"
                          }`}
                        >
                          {quote.status}
                        </span>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        {quote.notes}
                      </p>
                      <div className="mt-4 grid gap-3 sm:grid-cols-4">
                        <OfferMetric
                          label="Carrier rate"
                          value={toCurrency(quote.quotedRate)}
                        />
                        <OfferMetric
                          label="Projected margin"
                          value={toCurrency(quote.projectedMargin)}
                        />
                        <OfferMetric
                          label="Margin %"
                          value={`${quote.projectedMarginPercent}%`}
                        />
                        <OfferMetric label="Received" value={quote.created} />
                      </div>
                    </div>
                    <div className="flex flex-col justify-between gap-3 xl:w-52">
                      <Link
                        href={`/carriers/${quote.carrierId}`}
                        className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                      >
                        <ShieldCheck className="h-4 w-4" />
                        Carrier file
                      </Link>
                      {quote.status === "Accepted" ? (
                        <p className="rounded-md bg-emerald-50 px-4 py-2 text-center text-sm font-semibold text-emerald-800">
                          Booked carrier
                        </p>
                      ) : quote.status === "Rejected" ? (
                        <p className="rounded-md bg-slate-100 px-4 py-2 text-center text-sm font-semibold text-slate-500">
                          Not selected
                        </p>
                      ) : (
                        <CarrierQuoteAcceptForm
                          loadId={load.id}
                          carrierQuoteId={quote.id}
                        />
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="py-8 text-center text-sm text-slate-400">
                  No carrier offers yet. Add offers as dispatchers call back, then accept the best compliant option.
                </p>
              )}
            </div>
          </article>

          <article className="overflow-hidden rounded-lg border border-slate-100 bg-white shadow-md shadow-slate-950/5">
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-5 py-3">
              <p className="text-sm font-semibold text-slate-700">DAT / Truckstop activity</p>
              <span className="rounded-full bg-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-600">
                {load.integrationLogs.length} logs
              </span>
            </div>
            <div className="grid gap-3 p-5">
              {load.integrationLogs.length ? (
                load.integrationLogs.map((log) => (
                  <div
                    key={log.id}
                    className="grid gap-3 rounded-md border border-slate-100 bg-slate-50 p-4 md:grid-cols-[0.8fr_0.8fr_1.3fr_0.8fr]"
                  >
                    <OfferMetric label="Provider" value={log.provider} />
                    <OfferMetric label="Action" value={log.action} />
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                        Result
                      </p>
                      <p className="mt-1 text-sm font-semibold text-slate-950">
                        {log.status}: {log.error ?? log.message}
                      </p>
                    </div>
                    <OfferMetric label="Time" value={log.created} />
                  </div>
                ))
              ) : (
                <p className="py-8 text-center text-sm text-slate-400">
                  No marketplace activity yet. Search capacity or post this load to DAT/Truckstop.
                </p>
              )}
            </div>
          </article>
        </>
      )}

      {/* ── Documents tab ────────────────────────────────────────── */}
      {tab === "documents" && (
        <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="grid gap-6">
            <article className="overflow-hidden rounded-lg border border-slate-100 bg-white shadow-md shadow-slate-950/5">
              <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-5 py-3">
                <FileText className="h-4 w-4 text-slate-400" />
                <p className="text-sm font-semibold text-slate-700">Rate confirmation</p>
              </div>
              <div className="p-5">
                <div className="rounded-md bg-slate-50 p-4 text-sm leading-6 text-slate-700">
                  <p>Status: {load.rateConfirmationStatus ?? "Not started"}</p>
                  <p>Sent: {load.rateConfirmationSentAt ?? "Not sent"}</p>
                  <p>Signed: {load.rateConfirmationSignedAt ?? "Not signed"}</p>
                  {latestRateConfirmation?.fileUrl ? (
                    <p>
                      Document:{" "}
                      <DocumentLink
                        href={latestRateConfirmation.fileUrl}
                        label={latestRateConfirmation.fileName}
                      />
                    </p>
                  ) : null}
                </div>
                <div className="mt-4 grid gap-4">
                  <RateConfirmationGenerateForm loadId={load.id} />
                  <RateConfirmationForm
                    loadId={load.id}
                    currentStatus={load.rateConfirmationStatus ?? "Not started"}
                  />
                </div>
              </div>
            </article>

            <article className="overflow-hidden rounded-lg border border-slate-100 bg-white shadow-md shadow-slate-950/5">
              <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-5 py-3">
                <FileText className="h-4 w-4 text-slate-400" />
                <p className="text-sm font-semibold text-slate-700">Add document</p>
              </div>
              <div className="p-5">
                <DocumentCreateForm loadId={load.id} />
              </div>
            </article>
          </div>

          <article className="overflow-hidden rounded-lg border border-slate-100 bg-white shadow-md shadow-slate-950/5">
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-5 py-3">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-slate-400" />
                <p className="text-sm font-semibold text-slate-700">Documents</p>
              </div>
              <span className="rounded-full bg-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-600">
                {load.documents?.length ?? 0}
              </span>
            </div>
            {load.documents?.length ? (
              <div className="divide-y divide-slate-100">
                {load.documents.map((document) => (
                  <div key={document.id} className="flex gap-3 px-5 py-4">
                    <FileText className="mt-0.5 h-4 w-4 flex-none text-emerald-600" />
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900">{document.fileName}</p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {document.type} · {document.created}
                      </p>
                      {document.fileUrl ? (
                        <div className="mt-1.5 break-all text-sm">
                          <DocumentLink
                            href={document.fileUrl}
                            label={document.fileUrl}
                          />
                        </div>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-8 text-center text-sm text-slate-400">No documents logged yet.</p>
            )}
          </article>
        </section>
      )}

      {/* ── Billing tab ──────────────────────────────────────────── */}
      {tab === "billing" && (
        <section className="grid gap-6 xl:grid-cols-2">
          <article className="overflow-hidden rounded-lg border border-slate-100 bg-white shadow-md shadow-slate-950/5">
            <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-5 py-3">
              <ReceiptText className="h-4 w-4 text-slate-400" />
              <p className="text-sm font-semibold text-slate-700">Invoice load</p>
            </div>
            <div className="p-5">
              {load.invoice ? (
                <div className="mb-4 rounded-md border border-emerald-100 bg-emerald-50 p-4 text-sm leading-6 text-emerald-900">
                  Current invoice: {toCurrency(load.invoice.amount)} |{" "}
                  {load.invoice.status} | Due {load.invoice.dueDate}
                </div>
              ) : null}
              <InvoiceCreateForm
                loadId={load.id}
                defaultAmount={load.invoice?.amount ?? load.customerRate}
              />
            </div>
          </article>

          <article className="overflow-hidden rounded-lg border border-slate-100 bg-white shadow-md shadow-slate-950/5">
            <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-5 py-3">
              <ClipboardCheck className="h-4 w-4 text-slate-400" />
              <p className="text-sm font-semibold text-slate-700">Billing readiness</p>
            </div>
            <div className="p-5">
              <div className="grid gap-2">
                <ReadinessItem
                  label="Carrier assigned"
                  complete={load.carrier !== "Carrier needed"}
                />
                <ReadinessItem
                  label="Carrier rate entered"
                  complete={load.carrierRate > 0}
                />
                <ReadinessItem label="POD received" complete={load.hasPod} />
                <ReadinessItem
                  label="Rate confirmation signed"
                  complete={load.rateConfirmationStatus === "Signed"}
                />
                <ReadinessItem
                  label="Invoice created"
                  complete={Boolean(load.invoice)}
                />
              </div>
              <p className="mt-4 rounded-md bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700">
                {load.billingReadiness}
              </p>

              <div className="mt-5 rounded-md border border-slate-100 bg-slate-50 p-4">
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Financials</p>
                <div className="mt-3 grid gap-2 text-sm leading-6 text-slate-600">
                  <p>Customer rate: {toCurrency(load.customerRate)}</p>
                  <p>
                    Carrier rate:{" "}
                    {load.carrierRate ? toCurrency(load.carrierRate) : "Needed"}
                  </p>
                  <p>
                    Margin: {toCurrency(load.margin)} ({load.marginPercent}%)
                  </p>
                  {load.carrierInvoiceNumber ? (
                    <p>Carrier invoice: {load.carrierInvoiceNumber}</p>
                  ) : null}
                  {load.carrierPaymentDue ? (
                    <p>Carrier payment due: {load.carrierPaymentDue}</p>
                  ) : null}
                  {load.carrierPaidAt ? (
                    <p>Carrier paid: {load.carrierPaidAt}</p>
                  ) : null}
                </div>
              </div>

              <div className="mt-4">
                <Link
                  href="/invoicing"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 hover:text-emerald-900"
                >
                  <ReceiptText className="h-4 w-4" />
                  View invoicing dashboard →
                </Link>
              </div>
            </div>
          </article>
        </section>
      )}
    </InternalShell>
  );
}

function DocumentLink({ href, label }: { href: string; label: string }) {
  if (href.startsWith("/")) {
    return (
      <Link
        href={href}
        target="_blank"
        className="font-semibold text-emerald-700 hover:text-emerald-900"
      >
        {label}
      </Link>
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="font-semibold text-emerald-700 hover:text-emerald-900"
    >
      {label}
    </a>
  );
}

function OfferMetric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
        {label}
      </p>
      <p className="mt-1 font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function ReadinessItem({
  label,
  complete,
}: {
  label: string;
  complete: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md bg-white px-3 py-2 text-sm">
      <span className={complete ? "font-medium text-slate-900" : "text-slate-400"}>
        {label}
      </span>
      <span
        className={`text-xs font-bold ${
          complete ? "text-emerald-600" : "text-slate-400"
        }`}
      >
        {complete ? "Done" : "Pending"}
      </span>
    </div>
  );
}

function MetricCard({
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
      <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function getStatusBadgeClass(status: string) {
  if (["Delivered", "Pod Received", "Invoiced", "Paid"].includes(status)) {
    return "bg-emerald-100 text-emerald-800";
  }
  if (["Picked Up", "In Transit", "Booked"].includes(status)) {
    return "bg-sky-100 text-sky-800";
  }
  return "bg-amber-100 text-amber-800";
}

function FreightRequirements({ load }: { load: { commodity?: string | null; weight?: string | null; palletCount?: string | null; pieceCount?: string | null; dimensions?: string | null; hazmat?: string | null; temperatureRequirement?: string | null; appointmentRequired?: string | null; customerReference?: string | null; accessorials?: string | null } }) {
  const fields = [
    { label: "Commodity", value: load.commodity },
    { label: "Weight", value: load.weight },
    { label: "Pallets", value: load.palletCount },
    { label: "Pieces", value: load.pieceCount },
    { label: "Dimensions", value: load.dimensions },
    { label: "Temperature", value: load.temperatureRequirement },
    { label: "Customer ref", value: load.customerReference },
    { label: "Accessorials", value: load.accessorials },
    ...(load.hazmat === "Yes" ? [{ label: "Hazmat", value: "Yes" }] : []),
    ...(load.appointmentRequired === "Yes" ? [{ label: "Appointment", value: "Required" }] : []),
  ].filter((f) => f.value);

  return (
    <div className="mt-4 rounded-md bg-slate-50 p-4">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
        Freight details
      </p>
      {fields.length ? (
        <div className="mt-3 grid gap-1.5 text-sm sm:grid-cols-2">
          {fields.map((f) => (
            <p key={f.label} className="text-slate-700">
              <span className="font-semibold text-slate-900">{f.label}:</span>{" "}
              {f.value}
            </p>
          ))}
        </div>
      ) : (
        <p className="mt-2 text-sm text-slate-400">Freight details not yet specified.</p>
      )}
    </div>
  );
}
