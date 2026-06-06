import Link from "next/link";
import { notFound } from "next/navigation";
import type { ComponentType } from "react";
import {
  ArrowLeft,
  Bot,
  CalendarDays,
  CheckCircle2,
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

export default async function LoadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
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
      eyebrow="Load detail"
      title={load.shipper}
      description="Execute the shipment from one workspace: status, carrier, margin, tracking events, POD readiness, and customer update context."
      action={{ label: "Back to Load Board", href: "/loads" }}
    >
      <Link
        href="/loads"
        className="inline-flex w-fit items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-950"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to load board
      </Link>

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-2xl font-semibold">{load.lane}</h2>
              <p className="mt-2 text-sm font-medium text-slate-600">
                {load.equipment}
              </p>
            </div>
            <span className="w-fit rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-800">
              {load.status}
            </span>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <MetricCard
              icon={Truck}
              label="Carrier"
              value={load.carrier}
            />
            <MetricCard
              icon={CalendarDays}
              label="Pickup / Delivery"
              value={`${load.pickup} ${load.pickupWindow ?? ""} -> ${
                load.delivery
              } ${load.deliveryWindow ?? ""}`}
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
            <MetricCard icon={Package} label="Equipment" value={load.equipment} />
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

          <div className="mt-4 rounded-md bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-700">
              Freight requirements
            </p>
            <div className="mt-3 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
              <p>Commodity: {load.commodity ?? "Commodity needed"}</p>
              <p>Weight: {load.weight ?? "Not set"}</p>
              <p>Pallets: {load.palletCount ?? "Not set"}</p>
              <p>Pieces: {load.pieceCount ?? "Not set"}</p>
              <p>Dimensions: {load.dimensions ?? "Not set"}</p>
              <p>Hazmat: {load.hazmat ?? "No"}</p>
              <p>Temperature: {load.temperatureRequirement ?? "None"}</p>
              <p>Appointment: {load.appointmentRequired ?? "No"}</p>
              <p>Customer ref: {load.customerReference ?? "Not set"}</p>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Accessorials: {load.accessorials ?? "None"}
            </p>
          </div>

          <div className="mt-6 rounded-md bg-amber-50 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-amber-900">
              <MapPinned className="h-4 w-4 text-amber-600" />
              Current risk / next action
            </div>
            <p className="mt-2 text-sm leading-6 text-amber-900">{load.risk}</p>
          </div>

          <div className="mt-6 rounded-md border border-slate-100 bg-slate-50 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <ClipboardCheck className="h-4 w-4 text-emerald-600" />
              Billing readiness
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
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
            <p className="mt-4 rounded-md bg-white px-3 py-2 text-sm font-semibold text-slate-700">
              Current billing state: {load.billingReadiness}
            </p>
          </div>
        </article>

        <div className="grid gap-6">
          <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <Bot className="h-6 w-6 text-emerald-600" />
              <h2 className="text-2xl font-semibold">Run operations agent</h2>
            </div>
            <p className="mt-3 leading-7 text-slate-600">
              Generate the next best operating move from this load, carrier
              offers, timeline, POD state, margin, and invoice state.
            </p>
            <div className="mt-5 rounded-lg bg-slate-50 p-4">
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

          <article
            id="coverage"
            className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <Truck className="h-6 w-6 text-emerald-600" />
              <h2 className="text-2xl font-semibold">Carrier coverage</h2>
            </div>
            <p className="mt-3 leading-7 text-slate-600">
              Build a candidate list from internal history, DAT, Truckstop,
              carrier relationships, or dispatch notes before recording actual
              carrier offers.
            </p>
            <div className="mt-5 rounded-lg bg-slate-50 p-4">
              <CarrierCandidateGenerateForm loadId={load.id} />
            </div>
            <div className="mt-4 rounded-lg bg-slate-50 p-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <MarketplaceCapacitySearchForm loadId={load.id} />
                <MarketplaceLoadPostForm loadId={load.id} />
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                These actions use configured DAT/Truckstop endpoint URLs and
                log each provider request for auditability. Manual candidates
                stay available when provider endpoints are not connected.
              </p>
            </div>
            <div className="mt-4 rounded-lg bg-slate-50 p-4">
              <CarrierCandidateCreateForm loadId={load.id} />
            </div>
            <div className="mt-4 rounded-lg bg-slate-50 p-4">
              <CarrierQuoteCreateForm loadId={load.id} />
            </div>
          </article>

          <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <FileText className="h-6 w-6 text-emerald-600" />
              <h2 className="text-2xl font-semibold">Rate confirmation</h2>
            </div>
            <p className="mt-3 leading-7 text-slate-600">
              Track whether the carrier rate confirmation has been drafted,
              sent, and signed before dispatch.
            </p>
            <div className="mt-4 rounded-md bg-slate-50 p-4 text-sm leading-6 text-slate-700">
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
            <div className="mt-5 rounded-lg bg-slate-50 p-4">
              <RateConfirmationGenerateForm loadId={load.id} />
            </div>
            <div className="mt-4 rounded-lg bg-slate-50 p-4">
              <RateConfirmationForm
                loadId={load.id}
                currentStatus={load.rateConfirmationStatus ?? "Not started"}
              />
            </div>
          </article>

          <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-2xl font-semibold">Update load</h2>
            <p className="mt-3 leading-7 text-slate-600">
              Move the load through the operating workflow and update carrier
              cost as coverage changes.
            </p>
            <div className="mt-5 rounded-lg bg-slate-50 p-4">
              <LoadUpdateForm
                loadId={load.id}
                currentStatus={load.status}
                currentCarrier={load.carrier}
                currentCarrierRate={load.carrierRate}
              />
            </div>
          </article>

          <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-2xl font-semibold">Add tracking event</h2>
            <p className="mt-3 leading-7 text-slate-600">
              Record pickup confirmations, location updates, delays, delivery,
              and POD events.
            </p>
            <div className="mt-5 rounded-lg bg-slate-50 p-4">
              <ShipmentEventCreateForm loadId={load.id} />
            </div>
          </article>

          <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-2xl font-semibold">Customer update</h2>
            <p className="mt-3 leading-7 text-slate-600">
              Log customer-facing updates separately so active loads do not go
              quiet after pickup, delay, or delivery events.
            </p>
            <div className="mt-4 rounded-md bg-slate-50 p-4 text-sm leading-6 text-slate-700">
              <p>Status: {load.customerUpdateStatus ?? "Not needed"}</p>
              <p>Last update: {load.lastCustomerUpdateAt ?? "No update logged"}</p>
            </div>
            <div className="mt-5 rounded-lg bg-slate-50 p-4">
              <CustomerUpdateForm
                loadId={load.id}
                currentStatus={load.customerUpdateStatus ?? "Not needed"}
              />
            </div>
          </article>

          <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-2xl font-semibold">Add document</h2>
            <p className="mt-3 leading-7 text-slate-600">
              Log PODs, rate confirmations, invoices, and other load documents.
              Upload a file directly or add a name to record the document without a file.
            </p>
            <div className="mt-5 rounded-lg bg-slate-50 p-4">
              <DocumentCreateForm loadId={load.id} />
            </div>
          </article>

          <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <ReceiptText className="h-6 w-6 text-emerald-600" />
              <h2 className="text-2xl font-semibold">Invoice load</h2>
            </div>
            <p className="mt-3 leading-7 text-slate-600">
              Create or update the invoice once the POD is in. Marking the
              invoice sent or paid updates the load status.
            </p>
            {load.invoice ? (
              <div className="mt-4 rounded-md bg-emerald-50 p-4 text-sm leading-6 text-emerald-900">
                Current invoice: {toCurrency(load.invoice.amount)} |{" "}
                {load.invoice.status} | Due {load.invoice.dueDate}
              </div>
            ) : null}
            <div className="mt-5 rounded-lg bg-slate-50 p-4">
              <InvoiceCreateForm
                loadId={load.id}
                defaultAmount={load.invoice?.amount ?? load.customerRate}
              />
            </div>
          </article>
        </div>
      </section>

      <section
        id="marketplace"
        className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-700">
              Coverage pipeline
            </p>
            <h2 className="mt-2 text-2xl font-semibold">Carrier candidates</h2>
          </div>
          <p className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">
            {load.carrierCandidates.length} candidates
          </p>
        </div>

        <div className="mt-5 grid gap-4">
          {load.carrierCandidates.length ? (
            load.carrierCandidates.map((candidate) => (
              <div
                key={candidate.id}
                className="grid gap-4 rounded-md border border-slate-100 bg-slate-50 p-4 xl:grid-cols-[1fr_auto]"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="text-lg font-semibold">
                      {candidate.companyName}
                    </h3>
                    <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-bold text-sky-800">
                      {candidate.source}
                    </span>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold ${
                        candidate.complianceStatus === "Approved"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {candidate.complianceStatus}
                    </span>
                    <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-bold text-slate-700">
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
                    <OfferMetric label="Contact" value={candidate.contactName} />
                    <OfferMetric label="Created" value={candidate.created} />
                  </div>
                  <div className="mt-4 grid gap-3 text-sm leading-6 text-slate-600 sm:grid-cols-2">
                    <p>{candidate.phone}</p>
                    <p>{candidate.email}</p>
                    <p>{candidate.mcNumber}</p>
                    <p>{candidate.dotNumber}</p>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-600">
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
            <p className="rounded-md border border-dashed border-slate-200 bg-slate-50 p-5 text-sm leading-6 text-slate-600">
              No carrier candidates yet. Generate internal candidates or add
              carriers found through DAT, Truckstop, relationships, texts, or
              dispatch calls before requesting quotes.
            </p>
          )}
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-700">
              Marketplace audit
            </p>
            <h2 className="mt-2 text-2xl font-semibold">
              DAT / Truckstop activity
            </h2>
          </div>
          <p className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">
            {load.integrationLogs.length} logs
          </p>
        </div>

        <div className="mt-5 grid gap-3">
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
            <p className="rounded-md border border-dashed border-slate-200 bg-slate-50 p-5 text-sm leading-6 text-slate-600">
              No marketplace activity yet. Search capacity or post this load to
              DAT/Truckstop to create an audit log.
            </p>
          )}
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-700">
              Coverage desk
            </p>
            <h2 className="mt-2 text-2xl font-semibold">Carrier offers</h2>
          </div>
          <p className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">
            {load.carrierQuotes.length} offers
          </p>
        </div>

        <div className="mt-5 grid gap-4">
          {load.carrierQuotes.length ? (
            load.carrierQuotes.map((quote) => (
              <div
                key={quote.id}
                className="grid gap-4 rounded-md border border-slate-100 bg-slate-50 p-4 xl:grid-cols-[1fr_auto]"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="text-lg font-semibold">{quote.carrier}</h3>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold ${
                        quote.complianceStatus === "Approved"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {quote.complianceStatus}
                    </span>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold ${
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
                      label="Margin percent"
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
            <p className="rounded-md border border-dashed border-slate-200 bg-slate-50 p-5 text-sm leading-6 text-slate-600">
              No carrier offers yet. Add offers as dispatchers call back, then
              accept the best compliant option.
            </p>
          )}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-2xl font-semibold">Shipment timeline</h2>
          <div className="mt-5 grid gap-4">
            {load.events.length ? (
              load.events.map((event) => (
                <div
                  key={`${event.type}-${event.time}-${event.message}`}
                  className="flex gap-3"
                >
                  <div className="mt-2 h-2 w-2 flex-none rounded-full bg-emerald-500" />
                  <div>
                    <p className="font-semibold">
                      {event.type}
                      <span className="ml-2 text-sm font-medium text-slate-500">
                        {event.time}
                      </span>
                    </p>
                    <p className="mt-1 text-sm font-medium text-slate-700">
                      {event.location}
                    </p>
                    <p className="mt-1 text-sm leading-6 text-slate-600">
                      {event.message}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="rounded-md bg-slate-50 p-4 text-sm text-slate-600">
                No tracking events yet.
              </p>
            )}
          </div>
        </article>

        <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-2xl font-semibold">Documents</h2>
          <div className="mt-5 grid gap-3">
            {load.documents?.length ? (
              load.documents.map((document) => (
                <div key={document.id} className="rounded-md bg-slate-50 p-4">
                  <div className="flex items-start gap-3">
                    <FileText className="mt-1 h-5 w-5 flex-none text-emerald-600" />
                    <div className="min-w-0">
                      <p className="font-semibold">{document.fileName}</p>
                      <p className="mt-1 text-sm text-slate-600">
                        {document.type} | {document.created}
                      </p>
                      {document.fileUrl ? (
                        <div className="mt-2 break-all text-sm">
                          <DocumentLink
                            href={document.fileUrl}
                            label={document.fileUrl}
                          />
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="rounded-md bg-slate-50 p-4 text-sm text-slate-600">
                No documents logged yet.
              </p>
            )}
          </div>
        </article>
      </section>
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
    <div className="rounded-md bg-white p-3">
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
    <div className="flex items-center gap-2 rounded-md bg-white px-3 py-2 text-sm font-semibold">
      <CheckCircle2
        className={`h-4 w-4 ${
          complete ? "text-emerald-600" : "text-slate-300"
        }`}
      />
      <span className={complete ? "text-slate-900" : "text-slate-500"}>
        {label}
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
      <Icon className="h-5 w-5 text-emerald-600" />
      <p className="mt-3 text-sm font-semibold text-slate-600">{label}</p>
      <p className="mt-1 font-medium">{value}</p>
    </div>
  );
}
