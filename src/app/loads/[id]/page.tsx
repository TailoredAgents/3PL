import Link from "next/link";
import { notFound } from "next/navigation";
import type { ComponentType } from "react";
import {
  Bot,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  ClipboardCheck,
  Clock,
  FileText,
  Mail,
  MapPinned,
  Package,
  ReceiptText,
  Send,
  ShieldCheck,
  Truck,
  AlertTriangle,
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
  RateConfirmationSendForm,
  ShipmentEventCreateForm,
  LoadExceptionCreateForm,
  LoadExceptionUpdateForm,
  LoadCommissionAttributionForm,
} from "@/components/crm-forms";
import { InternalShell } from "@/components/internal-shell";
import {
  getLoadDetailView,
  getUserOptions,
  type LoadDetailView,
  type LoadDocumentView,
} from "@/lib/crm";
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

  const [load, userOptions] = await Promise.all([
    getLoadDetailView(id),
    getUserOptions(),
  ]);
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
          <LoadCommandStrip load={load} />

          <section className="grid gap-6 xl:grid-cols-[1fr_0.95fr]">
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

                <div className="mt-4 overflow-hidden rounded-md border border-slate-100 bg-white">
                  <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <CalendarDays className="h-3.5 w-3.5 text-slate-400" />
                      <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Shipment timeline</p>
                    </div>
                    <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-semibold text-slate-600">
                      {load.events.length}
                    </span>
                  </div>
                  {load.events.length ? (
                    <div className="divide-y divide-slate-100">
                      {load.events.slice(0, 4).map((event) => (
                        <div
                          key={`${event.type}-${event.time}-${event.message}`}
                          className="flex gap-3 px-4 py-3"
                        >
                          <div className="mt-2 h-2 w-2 flex-none rounded-full bg-emerald-500" />
                          <div>
                            <p className="text-sm font-semibold text-slate-900">
                              {event.type}
                              <span className="ml-2 text-xs font-medium text-slate-400">
                                {event.time}
                              </span>
                            </p>
                            <p className="mt-0.5 text-xs font-medium text-slate-600">
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
                    <p className="px-4 py-5 text-sm text-slate-400">No tracking events yet.</p>
                  )}
                </div>
              </div>
            </article>

            {/* Right: operations */}
            <div className="grid gap-6">
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
                  <Bot className="h-4 w-4 text-slate-400" />
                  <p className="text-sm font-semibold text-slate-700">Operations assistant</p>
                </div>
                <div className="p-5">
                  <p className="mb-3 rounded-md border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs leading-5 text-emerald-800">
                    Use agents for tracking risk, carrier coverage, and billing
                    readiness. The primary operational action remains in the
                    command strip above.
                  </p>
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
                  <CircleDollarSign className="h-4 w-4 text-slate-400" />
                  <p className="text-sm font-semibold text-slate-700">Commission attribution</p>
                </div>
                <div className="grid gap-4 p-5">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-md border border-slate-100 bg-slate-50 p-3">
                      <p className="text-xs font-semibold text-slate-500">Load manager</p>
                      <p className="mt-1 text-sm font-bold text-slate-900">
                        {load.managingUserName}
                      </p>
                    </div>
                    <div className="rounded-md border border-slate-100 bg-slate-50 p-3">
                      <p className="text-xs font-semibold text-slate-500">Lifetime client owner</p>
                      <p className="mt-1 text-sm font-bold text-slate-900">
                        {load.customerOwnerName}
                      </p>
                    </div>
                  </div>
                  <LoadCommissionAttributionForm
                    loadId={load.id}
                    users={userOptions}
                    managingUserId={load.managingUserId}
                    customerOwnerUserId={load.customerOwnerUserId}
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

              {/* Exceptions (Phase 5.2) */}
              <article className="overflow-hidden rounded-lg border border-slate-100 bg-white shadow-md shadow-slate-950/5">
                <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-5 py-3">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-slate-400" />
                    <p className="text-sm font-semibold text-slate-700">Exceptions</p>
                  </div>
                  <span className="rounded-full bg-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-600">
                    {load.exceptions?.length ?? 0}
                  </span>
                </div>
                <div className="p-5">
                  {load.exceptions && load.exceptions.length > 0 ? (
                    <div className="space-y-3 mb-4">
                      {load.exceptions.map((ex: any) => ( // eslint-disable-line @typescript-eslint/no-explicit-any
                        <div key={ex.id} className="text-sm border rounded p-2">
                          <div><strong>{ex.type}</strong> — {ex.status}</div>
                          {ex.owner && <div className="text-xs">Owner: {ex.owner}</div>}
                          {ex.notes && <div className="text-xs text-slate-600">{ex.notes}</div>}
                          <div className="mt-2">
                            <LoadExceptionUpdateForm
                              loadId={load.id}
                              exceptionId={ex.id}
                              currentStatus={ex.status}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500 mb-3">No persistent exceptions logged.</p>
                  )}
                  <LoadExceptionCreateForm loadId={load.id} />
                </div>
              </article>

              {/* Public tracking link (Phase 5.3 foundation) */}
              <article className="overflow-hidden rounded-lg border border-slate-100 bg-white shadow-md shadow-slate-950/5">
                <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-5 py-3">
                  <p className="text-sm font-semibold text-slate-700">Public tracking link</p>
                </div>
                <div className="p-5">
                  <form action={`/api/loads/${load.id}/public-tracking-link`} method="POST">
                    <button
                      type="submit"
                      className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800"
                    >
                      Generate shareable tracking link (30-day expiry)
                    </button>
                  </form>
                  <p className="mt-2 text-xs text-slate-500">Link is public but time-limited and scoped to basic shipment info only. Refresh page after generating to see it.</p>
                  {load.publicTrackingLinks && load.publicTrackingLinks.filter((l: any) => !l.revoked).length > 0 && ( // eslint-disable-line @typescript-eslint/no-explicit-any
                    <div className="mt-3 text-sm">
                      {load.publicTrackingLinks.filter((l: any) => !l.revoked).slice(0,1).map((link: any) => ( // eslint-disable-line @typescript-eslint/no-explicit-any
                        <div key={link.id}>
                          Active: <a href={`/track/${link.token}`} target="_blank" className="font-semibold text-emerald-700 hover:underline">/track/{link.token}</a> (expires {link.expiresAt})
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </article>
            </div>
          </section>
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
            <RateConfirmationWorkspace
              load={load}
              latestRateConfirmation={latestRateConfirmation}
            />

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
                        {document.type} · {document.storageState} · {document.fileSize} · {document.created}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        AI extraction: {document.extractionStatus}
                        {document.extractedFields ? " · Structured" : ""}
                      </p>
                      {document.downloadHref ? (
                        <div className="mt-1.5 break-all text-sm">
                          <DocumentLink
                            href={document.downloadHref}
                            label="Download document"
                          />
                        </div>
                      ) : (
                        <p className="mt-1.5 text-xs font-semibold text-amber-700">
                          Storage needed before download.
                        </p>
                      )}
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
              {load.invoice && (
                <div className="mt-3 flex gap-2">
                  <form action={`/api/loads/${load.id}/invoice/generate`} method="POST">
                    <button
                      type="submit"
                      className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      Generate Printable Invoice
                    </button>
                  </form>
                  <a
                    href={`/api/loads/${load.id}/invoice/print`}
                    target="_blank"
                    className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 inline-flex items-center"
                  >
                    Print / PDF
                  </a>
                </div>
              )}
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

function RateConfirmationWorkspace({
  load,
  latestRateConfirmation,
}: {
  load: LoadDetailView;
  latestRateConfirmation?: LoadDocumentView;
}) {
  const readiness = getRateConfirmationReadiness(load, latestRateConfirmation);
  const sendDraft = buildRateConfirmationSendDraft(load);
  const signature = parseRateConfirmationSignature(
    latestRateConfirmation?.extractedText,
  );
  const sentOrSigned = ["Sent", "Signed"].includes(
    load.rateConfirmationStatus ?? "",
  );

  return (
    <article className="overflow-hidden rounded-lg border border-slate-100 bg-white shadow-md shadow-slate-950/5">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-slate-50 px-5 py-4">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-emerald-600" />
          <div>
            <p className="text-sm font-semibold text-slate-800">
              Rate confirmation command
            </p>
            <p className="text-xs text-slate-500">
              Draft, verify, send, and track carrier signature readiness.
            </p>
          </div>
        </div>
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-bold ${readiness.badgeClass}`}
        >
          {readiness.badge}
        </span>
      </div>

      <div className="grid gap-5 p-5">
        <section className={`rounded-lg border p-5 ${readiness.panelClass}`}>
          <div className="flex gap-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-white/70">
              {readiness.readyToSend ? (
                <CheckCircle2 className="h-5 w-5" />
              ) : (
                <AlertTriangle className="h-5 w-5" />
              )}
            </span>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.24em] opacity-70">
                Dispatch readiness
              </p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight">
                {readiness.headline}
              </h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 opacity-80">
                {readiness.detail}
              </p>
            </div>
          </div>
        </section>

        <section className="grid gap-3 md:grid-cols-4">
          <RateConStatusStep
            label="Draft"
            detail={
              latestRateConfirmation
                ? latestRateConfirmation.fileName
                : "No draft generated"
            }
            complete={readiness.hasDraft}
            icon={FileText}
          />
          <RateConStatusStep
            label="Send"
            detail={load.rateConfirmationSentAt ?? "Not sent"}
            complete={sentOrSigned}
            icon={Send}
          />
          <RateConStatusStep
            label="Signature"
            detail={load.rateConfirmationSignedAt ?? "Not signed"}
            complete={load.rateConfirmationStatus === "Signed"}
            icon={ClipboardCheck}
          />
          <RateConStatusStep
            label="Carrier"
            detail={load.carrier}
            complete={load.carrier !== "Carrier needed"}
            icon={Truck}
          />
        </section>

        {load.rateConfirmationStatus === "Signed" ? (
          <section className="rounded-lg border border-emerald-100 bg-emerald-50 p-4 text-emerald-950">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] opacity-70">
                  Carrier signature
                </p>
                <h3 className="mt-1 text-lg font-bold">
                  Signed by {signature.signerName ?? "carrier portal signer"}
                </h3>
                <p className="mt-1 text-sm font-semibold opacity-80">
                  {signature.signerTitle ?? "Title not captured"} ·{" "}
                  {load.rateConfirmationSignedAt ?? "Signed timestamp pending"}
                </p>
              </div>
              {latestRateConfirmation?.downloadHref ? (
                <DocumentLink
                  href={latestRateConfirmation.downloadHref}
                  label="Open signed PDF"
                />
              ) : null}
            </div>
          </section>
        ) : null}

        <section className="grid gap-4 lg:grid-cols-[1fr_0.9fr]">
          <div className="rounded-lg border border-slate-100 bg-slate-50 p-4">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
              Send package
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <RateConFact label="Carrier" value={load.carrier} icon={Truck} />
              <RateConFact
                label="Compliance"
                value={load.carrierComplianceStatus ?? "Not reviewed"}
                icon={ShieldCheck}
              />
              <RateConFact
                label="Dispatch email"
                value={load.carrierEmail || "Email needed"}
                icon={Mail}
              />
              <RateConFact
                label="Carrier rate"
                value={load.carrierRate ? toCurrency(load.carrierRate) : "Needed"}
                icon={CircleDollarSign}
              />
              <RateConFact
                label="Pickup"
                value={`${load.pickup} ${load.pickupWindow ?? ""}`.trim()}
                icon={CalendarDays}
              />
              <RateConFact
                label="Delivery"
                value={`${load.delivery} ${load.deliveryWindow ?? ""}`.trim()}
                icon={CalendarDays}
              />
            </div>
            {latestRateConfirmation?.downloadHref ? (
              <div className="mt-4 rounded-md bg-white px-3 py-2 text-sm">
                <span className="font-semibold text-slate-900">Document: </span>
                <DocumentLink
                  href={latestRateConfirmation.downloadHref}
                  label={latestRateConfirmation.fileName}
                />
              </div>
            ) : null}
          </div>

          <div className="rounded-lg border border-slate-100 bg-white p-4">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
              Readiness checks
            </p>
            <div className="mt-4 grid gap-2">
              {readiness.checks.map((check) => (
                <RateConCheckItem key={check.label} {...check} />
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-lg border border-slate-100 bg-slate-50 p-4">
            <div className="mb-3 flex items-center gap-2">
              <FileText className="h-4 w-4 text-emerald-600" />
              <p className="text-sm font-semibold text-slate-800">
                Draft rate confirmation
              </p>
            </div>
            <RateConfirmationGenerateForm loadId={load.id} />
            <p className="mt-3 text-xs leading-5 text-slate-500">
              Drafting requires an approved carrier and a carrier rate. Sending
              should wait until the send package above is clean.
            </p>
          </div>

          <div className="rounded-lg border border-slate-100 bg-slate-50 p-4">
            <div className="mb-3 flex items-center gap-2">
              <Send className="h-4 w-4 text-emerald-600" />
              <p className="text-sm font-semibold text-slate-800">
                Send carrier package
              </p>
            </div>
            <RateConfirmationSendForm
              loadId={load.id}
              toEmail={load.carrierEmail ?? ""}
              subject={sendDraft.subject}
              body={sendDraft.body}
            />
            <p className="mt-3 text-xs leading-5 text-slate-500">
              Sending updates the load to Sent only after Resend accepts the
              email. Local validation logs the attempt without marking it sent.
            </p>
          </div>
        </section>

        <section className="grid gap-4">
          <div className="rounded-lg border border-slate-100 bg-slate-50 p-4">
            <div className="mb-3 flex items-center gap-2">
              <Clock className="h-4 w-4 text-slate-500" />
              <p className="text-sm font-semibold text-slate-800">
                Update send / signature status
              </p>
            </div>
            <RateConfirmationForm
              loadId={load.id}
              currentStatus={load.rateConfirmationStatus ?? "Not started"}
            />
          </div>
        </section>
      </div>
    </article>
  );
}

function getRateConfirmationReadiness(
  load: LoadDetailView,
  latestRateConfirmation?: LoadDocumentView,
) {
  const hasDraft =
    Boolean(latestRateConfirmation) ||
    ["Drafted", "Sent", "Signed"].includes(load.rateConfirmationStatus ?? "");
  const draftChecks = [
    {
      label: "Carrier assigned",
      complete: load.carrier !== "Carrier needed",
      detail: load.carrier,
    },
    {
      label: "Carrier approved",
      complete: load.carrierComplianceStatus === "Approved",
      detail: load.carrierComplianceStatus ?? "Not reviewed",
    },
    {
      label: "Carrier rate entered",
      complete: load.carrierRate > 0,
      detail: load.carrierRate ? toCurrency(load.carrierRate) : "Rate needed",
    },
  ];
  const checks = [
    ...draftChecks,
    {
      label: "Draft generated",
      complete: hasDraft,
      detail: latestRateConfirmation?.fileName ?? "Draft needed",
    },
    {
      label: "Carrier email",
      complete: Boolean(load.carrierEmail),
      detail: load.carrierEmail || "Email needed",
    },
    {
      label: "Pickup and delivery dates",
      complete: load.pickup !== "Not set" && load.delivery !== "Not set",
      detail: `${load.pickup} -> ${load.delivery}`,
    },
    {
      label: "Pickup and delivery addresses",
      complete:
        load.originAddress !== "Pickup address needed" &&
        load.destinationAddress !== "Delivery address needed",
      detail: "Required before carrier dispatch",
    },
  ];
  const blockers = checks.filter((check) => !check.complete);
  const readyToDraft = draftChecks.every((check) => check.complete);
  const readyToSend = checks.every((check) => check.complete);

  if (readyToSend) {
    return {
      checks,
      hasDraft,
      readyToSend,
      headline: "Ready to send to carrier",
      detail:
        "The carrier, rate, document, dispatch email, dates, and addresses are ready for the send/sign workflow.",
      badge: "Ready",
      badgeClass: "bg-emerald-100 text-emerald-800",
      panelClass: "border-emerald-200 bg-emerald-50 text-emerald-950",
    };
  }

  if (readyToDraft) {
    return {
      checks,
      hasDraft,
      readyToSend,
      headline: hasDraft ? "Draft ready, send package incomplete" : "Ready to draft",
      detail: hasDraft
        ? `${blockers.length} send-readiness checks need attention before this should go to the carrier.`
        : "The carrier and carrier rate are ready. Draft the rate confirmation, then finish the remaining send checks.",
      badge: `${blockers.length} blockers`,
      badgeClass: "bg-amber-100 text-amber-800",
      panelClass: "border-amber-200 bg-amber-50 text-amber-950",
    };
  }

  return {
    checks,
    hasDraft,
    readyToSend,
    headline: "Carrier dispatch is not ready",
    detail: `${blockers.length} required checks are blocking the rate confirmation workflow.`,
    badge: `${blockers.length} blockers`,
    badgeClass: "bg-red-100 text-red-800",
    panelClass: "border-red-200 bg-red-50 text-red-950",
  };
}

function parseRateConfirmationSignature(text: string | null | undefined) {
  return {
    signerName: text?.match(/^Signer:\s*(.+)$/m)?.[1]?.trim() ?? null,
    signerTitle: text?.match(/^Title:\s*(.+)$/m)?.[1]?.trim() ?? null,
  };
}

function buildRateConfirmationSendDraft(load: LoadDetailView) {
  const subject = `Rate Confirmation - ${load.loadNumber} | ${load.lane}`;
  const greeting =
    load.carrierContactName && load.carrierContactName !== "No dispatch contact"
      ? `Hi ${load.carrierContactName},`
      : "Hi Dispatch,";
  const body = [
    greeting,
    "",
    `Please review the linked rate confirmation PDF for ${load.loadNumber}.`,
    "",
    `Carrier: ${load.carrier}`,
    `Lane: ${load.lane}`,
    `Pickup: ${load.pickup} ${load.pickupWindow ?? ""}`.trim(),
    `Delivery: ${load.delivery} ${load.deliveryWindow ?? ""}`.trim(),
    `Equipment: ${load.equipment}`,
    `Carrier rate: ${load.carrierRate ? toCurrency(load.carrierRate) : "Rate needed"}`,
    "",
    "Please review and sign through the carrier portal link in this email. Report any pickup, delivery, accessorial, or tracking issue before dispatch.",
    "",
    "Thank you,",
    "DAO Logistics",
  ].join("\n");

  return { subject, body };
}

function RateConStatusStep({
  label,
  detail,
  complete,
  icon: Icon,
}: {
  label: string;
  detail: string;
  complete: boolean;
  icon: ComponentType<{ className?: string }>;
}) {
  return (
    <div
      className={`rounded-lg border p-4 ${
        complete
          ? "border-emerald-100 bg-emerald-50 text-emerald-950"
          : "border-slate-100 bg-slate-50 text-slate-700"
      }`}
    >
      <Icon
        className={`h-4 w-4 ${complete ? "text-emerald-600" : "text-slate-400"}`}
      />
      <p className="mt-3 text-xs font-bold uppercase tracking-[0.16em] opacity-70">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold leading-5">{detail}</p>
    </div>
  );
}

function RateConFact({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: ComponentType<{ className?: string }>;
}) {
  return (
    <div className="rounded-md bg-white p-3">
      <Icon className="h-4 w-4 text-emerald-600" />
      <p className="mt-2 text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
        {label}
      </p>
      <p className="mt-1 break-words text-sm font-semibold text-slate-900">
        {value}
      </p>
    </div>
  );
}

function RateConCheckItem({
  label,
  complete,
  detail,
}: {
  label: string;
  complete: boolean;
  detail: string;
}) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-md bg-slate-50 px-3 py-2">
      <div>
        <p className="text-sm font-semibold text-slate-900">{label}</p>
        <p className="mt-0.5 text-xs text-slate-500">{detail}</p>
      </div>
      <span
        className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-bold ${
          complete
            ? "bg-emerald-100 text-emerald-700"
            : "bg-amber-100 text-amber-700"
        }`}
      >
        {complete ? "Done" : "Needed"}
      </span>
    </div>
  );
}

function LoadCommandStrip({ load }: { load: LoadDetailView }) {
  const command = getLoadCommand(load);

  return (
    <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
      <article className={`rounded-lg border p-5 shadow-md shadow-slate-950/5 ${command.className}`}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] opacity-75">
              Load command
            </p>
            <h2 className="mt-1 text-2xl font-black tracking-normal">
              {command.label}
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 opacity-85">
              {command.detail}
            </p>
          </div>
          <Link
            href={command.href}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-md bg-slate-950 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-slate-950/15 hover:bg-slate-800"
          >
            {command.cta}
            <Truck className="h-4 w-4" />
          </Link>
        </div>
      </article>

      <article className="grid gap-3 sm:grid-cols-2">
        <CommandMetric
          label="Coverage"
          value={load.carrier === "Carrier needed" ? "Needs carrier" : "Covered"}
          tone={load.carrier === "Carrier needed" ? "red" : "emerald"}
        />
        <CommandMetric
          label="Tracking"
          value={load.events.length ? `${load.events.length} events` : "No events"}
          tone={load.events.length ? "emerald" : "amber"}
        />
        <CommandMetric
          label="Billing"
          value={load.billingReadiness}
          tone={load.billingReadiness === "Ready to invoice" ? "emerald" : "slate"}
        />
        <CommandMetric
          label="Margin"
          value={`${toCurrency(load.margin)} / ${load.marginPercent}%`}
          tone={load.marginPercent < 12 ? "amber" : "emerald"}
        />
      </article>
    </section>
  );
}

function CommandMetric({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "amber" | "emerald" | "red" | "slate";
}) {
  const toneClass = {
    amber: "border-amber-100 bg-amber-50 text-amber-950",
    emerald: "border-emerald-100 bg-emerald-50 text-emerald-950",
    red: "border-red-100 bg-red-50 text-red-950",
    slate: "border-slate-100 bg-white text-slate-800",
  }[tone];

  return (
    <div className={`rounded-lg border p-4 shadow-md shadow-slate-950/5 ${toneClass}`}>
      <p className="text-xs font-black uppercase tracking-[0.14em] opacity-70">
        {label}
      </p>
      <p className="mt-1 text-sm font-black leading-5">{value}</p>
    </div>
  );
}

function getLoadCommand(load: LoadDetailView) {
  if (load.carrier === "Carrier needed") {
    return {
      label: "Source carrier",
      detail:
        "This load is not covered. Source capacity, vet the carrier, collect a quote, and book the best compliant option.",
      cta: "Cover load",
      href: `/loads/${load.id}?tab=coverage`,
      className: "border-red-100 bg-red-50 text-red-950",
    };
  }

  if (load.customerUpdateStatus === "Needed") {
    return {
      label: "Send customer update",
      detail:
        "The shipper needs a proactive status update. Log the message before the customer asks for tracking.",
      cta: "Update customer",
      href: `/loads/${load.id}?tab=overview`,
      className: "border-amber-100 bg-amber-50 text-amber-950",
    };
  }

  if (load.billingReadiness === "Needs POD") {
    return {
      label: "Collect POD",
      detail:
        "The load cannot cleanly move to billing until proof of delivery is uploaded and reviewed.",
      cta: "Open documents",
      href: `/loads/${load.id}?tab=documents`,
      className: "border-amber-100 bg-amber-50 text-amber-950",
    };
  }

  if (load.billingReadiness === "Ready to invoice") {
    return {
      label: "Invoice customer",
      detail:
        "The load is ready for customer billing. Create or review the invoice and move it through finance.",
      cta: "Open billing",
      href: `/loads/${load.id}?tab=billing`,
      className: "border-emerald-100 bg-emerald-50 text-emerald-950",
    };
  }

  return {
    label: "Monitor load",
    detail:
      "Keep tracking events, customer updates, documents, and billing readiness current through delivery.",
    cta: "Review load",
    href: `/loads/${load.id}?tab=overview`,
    className: "border-slate-100 bg-white text-slate-900",
  };
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
