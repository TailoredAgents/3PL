import Link from "next/link";
import { notFound } from "next/navigation";
import type { ComponentType } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  Bot,
  CircleDollarSign,
  Download,
  FileText,
  Mail,
  MapPinned,
  Package,
  Phone,
  ReceiptText,
  ShieldAlert,
  ShieldCheck,
  TrendingUp,
  Truck,
  UserRound,
} from "lucide-react";

import { AiAgentRunForm, CarrierComplianceForm } from "@/components/crm-forms";
import { InternalShell } from "@/components/internal-shell";
import { getCarrierDetailView, type CarrierDetailView } from "@/lib/crm";
import { cn, toCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

const REQUIRED_DOCUMENTS = [
  { type: "W9", label: "W-9" },
  { type: "CERTIFICATE_OF_INSURANCE", label: "Certificate of insurance" },
  { type: "BROKER_CARRIER_AGREEMENT", label: "Broker-carrier agreement" },
] as const;

type CarrierContact = {
  name?: string;
  phone?: string;
  email?: string;
};

function isContact(value: unknown): value is CarrierContact {
  return typeof value === "object" && value !== null;
}

function isFilled(value: string | undefined | null) {
  return Boolean(value && value !== "Not set" && !value.toLowerCase().includes("needed"));
}

function getMissingRequiredDocuments(carrier: CarrierDetailView) {
  return REQUIRED_DOCUMENTS.filter(
    (required) => !carrier.documents.some((document) => document.type === required.type),
  );
}

function getTenderDecision(carrier: CarrierDetailView) {
  const missingDocs = getMissingRequiredDocuments(carrier);

  if (carrier.blockedReason) {
    return {
      label: "Do not tender",
      detail: carrier.blockedReason,
      icon: ShieldAlert,
      className: "border-red-100 bg-red-50 text-red-900",
      action: "Resolve block before booking",
    };
  }

  if (carrier.complianceStatus !== "Approved") {
    return {
      label: "Needs compliance approval",
      detail: "Authority, insurance, fraud, callback, and onboarding documents should be cleared before this carrier is booked.",
      icon: AlertTriangle,
      className: "border-amber-100 bg-amber-50 text-amber-900",
      action: "Run compliance review",
    };
  }

  if (missingDocs.length || !isFilled(carrier.callbackVerifiedAt)) {
    return {
      label: "Approved with onboarding gaps",
      detail: `${missingDocs.length} required document${missingDocs.length === 1 ? "" : "s"} missing${isFilled(carrier.callbackVerifiedAt) ? "" : " · callback verification missing"}.`,
      icon: AlertTriangle,
      className: "border-amber-100 bg-amber-50 text-amber-900",
      action: "Complete onboarding",
    };
  }

  return {
    label: "Tender ready",
    detail: "Compliance is approved, required onboarding documents are on file, and callback verification is complete.",
    icon: ShieldCheck,
    className: "border-emerald-100 bg-emerald-50 text-emerald-900",
    action: "Ready to cover loads",
  };
}

export default async function CarrierDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const carrier = await getCarrierDetailView(id);

  if (!carrier) {
    notFound();
  }

  const marginHandled = carrier.loads.reduce((total, load) => total + load.margin, 0);
  const missingRequiredDocuments = getMissingRequiredDocuments(carrier);
  const tenderDecision = getTenderDecision(carrier);
  const DecisionIcon = tenderDecision.icon;
  const outstandingCount = carrier.loads.filter(
    (load) => load.carrierInvoiceNumber && !load.carrierPaidAt,
  ).length;
  const paidCount = carrier.loads.filter((load) => load.carrierPaidAt).length;
  const additionalContacts = Array.isArray(carrier.additionalContacts)
    ? carrier.additionalContacts.filter(isContact)
    : [];

  const complianceItems = [
    { label: "Authority", value: carrier.authorityStatus },
    { label: "Insurance", value: carrier.insuranceStatus },
    { label: "Safety", value: carrier.safetyRating },
    { label: "Fraud risk", value: carrier.fraudRiskLevel },
    { label: "Last vetted", value: carrier.lastVettedAt },
    { label: "Approved by", value: carrier.approvedBy },
    { label: "Insurance expires", value: carrier.insuranceExpiration },
    { label: "W-9 received", value: carrier.w9ReceivedAt },
    { label: "Agreement signed", value: carrier.agreementSignedAt },
    { label: "Payment setup", value: carrier.paymentSetup },
    { label: "Callback verified", value: carrier.callbackVerifiedAt },
  ];
  const complianceFieldGaps = complianceItems.filter((item) => !isFilled(item.value)).length;
  const callbackReady = isFilled(carrier.callbackVerifiedAt);
  const scorecardOnTime =
    carrier.onTimePickupRate === null || carrier.onTimePickupRate === undefined
      ? "No data"
      : `${carrier.onTimePickupRate}%`;

  return (
    <InternalShell
      active="Carriers"
      eyebrow="Carrier detail"
      title={carrier.company}
      description="Carrier command file for tender readiness, compliance, dispatch contacts, onboarding documents, payables, and load history."
      action={{ label: "Back to carriers", href: "/carriers" }}
    >
      <Link
        href="/carriers"
        className="inline-flex w-fit items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-950"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to carrier desk
      </Link>

      <section className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
        <article className={cn("rounded-lg border p-5 shadow-sm", tenderDecision.className)}>
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-white/70">
                <DecisionIcon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.2em] opacity-75">
                  Tender decision
                </p>
                <h2 className="mt-2 text-2xl font-black tracking-tight">{tenderDecision.label}</h2>
                <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 opacity-85">
                  {tenderDecision.detail}
                </p>
                <div className="mt-5 grid gap-2 sm:grid-cols-3">
                  <ReadinessChip
                    label="Compliance"
                    value={carrier.complianceStatus}
                    ready={carrier.complianceStatus === "Approved" && !carrier.blockedReason}
                  />
                  <ReadinessChip
                    label="Onboarding docs"
                    value={
                      missingRequiredDocuments.length
                        ? `${missingRequiredDocuments.length} missing`
                        : "Complete"
                    }
                    ready={!missingRequiredDocuments.length}
                  />
                  <ReadinessChip
                    label="Callback"
                    value={callbackReady ? "Verified" : "Missing"}
                    ready={callbackReady}
                  />
                </div>
              </div>
            </div>
            <div className="rounded-lg bg-white/70 px-4 py-3 text-sm font-black shadow-sm">
              {tenderDecision.action}
            </div>
          </div>
        </article>

        <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
          <MetricTile icon={Truck} label="Loads handled" value={carrier.loads.length.toString()} />
          <MetricTile icon={CircleDollarSign} label="Margin handled" value={toCurrency(marginHandled)} />
          <MetricTile icon={ShieldCheck} label="Compliance" value={carrier.complianceStatus} />
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
        <article className="overflow-hidden rounded-lg border border-slate-100 bg-white shadow-md shadow-slate-950/5">
          <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-5 py-3">
            <div className="flex items-center gap-2">
              <Truck className="h-4 w-4 text-slate-400" />
              <p className="text-sm font-black text-slate-800">Carrier identity</p>
            </div>
            <span
              className={cn(
                "rounded-full px-2.5 py-1 text-xs font-black",
                carrier.blockedReason
                  ? "bg-red-100 text-red-700"
                  : carrier.complianceStatus === "Approved"
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-amber-50 text-amber-700",
              )}
            >
              {carrier.blockedReason ? "Blocked" : carrier.complianceStatus}
            </span>
          </div>
          <div className="p-5">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
              {carrier.mcNumber} · {carrier.dotNumber}
            </p>
            <div className="mt-4 grid gap-3 text-sm text-slate-700">
              <ContactLine icon={UserRound} value={carrier.contact} />
              <ContactLine icon={Mail} value={carrier.email} />
              <ContactLine icon={Phone} value={carrier.phone} />
            </div>

            <div className="mt-5 rounded-lg border border-slate-100 bg-slate-50 p-4">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                <MapPinned className="h-3.5 w-3.5" />
                Preferred lanes
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {carrier.preferredLanes.length ? (
                  carrier.preferredLanes.map((lane) => (
                    <span
                      key={lane}
                      className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-bold text-slate-700"
                    >
                      {lane}
                    </span>
                  ))
                ) : (
                  <p className="text-xs text-slate-400">No preferred lanes set.</p>
                )}
              </div>
            </div>

            {carrier.notes ? (
              <div className="mt-4 rounded-lg border border-slate-100 bg-slate-50 p-4">
                <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">Carrier notes</p>
                <p className="mt-2 text-sm leading-6 text-slate-700">{carrier.notes}</p>
              </div>
            ) : null}

            {additionalContacts.length ? (
              <div className="mt-4 rounded-lg border border-slate-100 bg-white p-4">
                <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                  Additional contacts
                </p>
                <div className="mt-2 grid gap-2 text-sm text-slate-700">
                  {additionalContacts.map((contact, index) => (
                    <p key={`${contact.name ?? "contact"}-${index}`}>
                      {contact.name ?? "Contact"} · {contact.phone ?? "No phone"} {contact.email ?? ""}
                    </p>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </article>

        <div className="grid gap-5">
          <article className="overflow-hidden rounded-lg border border-slate-100 bg-white shadow-md shadow-slate-950/5">
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-5 py-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-slate-400" />
                <p className="text-sm font-black text-slate-800">Compliance checklist</p>
              </div>
              <span className="text-xs font-bold text-slate-400">
                {complianceFieldGaps ? `${complianceFieldGaps} open fields` : "Complete"}
              </span>
            </div>
            <div className="grid gap-0 sm:grid-cols-2">
              {complianceItems.map((item, index) => (
                <div
                  key={item.label}
                  className={cn(
                    "border-b border-slate-100 px-5 py-3",
                    index % 2 === 0 ? "sm:border-r" : "",
                  )}
                >
                  <p className="text-xs font-bold text-slate-400">{item.label}</p>
                  <p className={cn("mt-0.5 text-sm font-semibold", isFilled(item.value) ? "text-slate-900" : "text-slate-300")}>
                    {isFilled(item.value) ? item.value : "Not set"}
                  </p>
                </div>
              ))}
            </div>
            {carrier.complianceNotes ? (
              <div className="border-t border-slate-100 px-5 py-4">
                <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">Compliance notes</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">{carrier.complianceNotes}</p>
              </div>
            ) : null}
          </article>

          <article className="rounded-lg border border-slate-100 bg-white p-5 shadow-md shadow-slate-950/5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
                  Required onboarding documents
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-600">
                  These should be on file before tendering freight.
                </p>
              </div>
              <Link href="/documents" className="dao-secondary-action shrink-0 text-xs">
                Documents
              </Link>
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-3">
              {REQUIRED_DOCUMENTS.map((required) => {
                const hasDocument = carrier.documents.some((document) => document.type === required.type);
                return (
                  <div
                    key={required.type}
                    className={cn(
                      "rounded-lg border px-3 py-3 text-xs font-black",
                      hasDocument
                        ? "border-emerald-100 bg-emerald-50 text-emerald-800"
                        : "border-amber-100 bg-amber-50 text-amber-800",
                    )}
                  >
                    {required.label}
                    <span className="mt-1 block font-semibold">
                      {hasDocument ? "On file" : "Missing"}
                    </span>
                  </div>
                );
              })}
            </div>
          </article>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <article className="overflow-hidden rounded-lg border border-slate-100 bg-white shadow-md shadow-slate-950/5">
          <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-5 py-3">
            <TrendingUp className="h-4 w-4 text-slate-400" />
            <p className="text-sm font-black text-slate-800">Performance scorecard</p>
          </div>
          <div className="grid gap-3 p-5 sm:grid-cols-2">
            <ScoreFact label="Loads handled" value={carrier.loads.length.toString()} />
            <ScoreFact label="On-time proxy" value={scorecardOnTime} muted={scorecardOnTime === "No data"} />
            <ScoreFact
              label="Issues / blocks"
              value={(carrier.issuesCount ?? 0).toString()}
              valueClassName={(carrier.issuesCount ?? 0) > 0 ? "text-amber-700" : "text-slate-950"}
            />
            <ScoreFact label="Margin handled" value={toCurrency(marginHandled)} />
          </div>
          <p className="border-t border-slate-100 px-5 py-3 text-xs leading-5 text-slate-500">
            Scorecard is derived from load status and events. ELD/GPS integrations would make this more precise later.
          </p>
        </article>

        <article className="overflow-hidden rounded-lg border border-slate-100 bg-white shadow-md shadow-slate-950/5">
          <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-5 py-3">
            <Bot className="h-4 w-4 text-slate-400" />
            <p className="text-sm font-black text-slate-800">Compliance agent</p>
          </div>
          <div className="grid gap-4 p-5 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
            <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-4 text-emerald-900">
              <p className="text-xs font-black uppercase tracking-[0.16em]">AI review target</p>
              <p className="mt-2 text-sm font-semibold leading-6">
                Use this agent to review authority, insurance, fraud risk, callback verification, and missing onboarding documents.
              </p>
            </div>
            <AiAgentRunForm
              relatedEntityType="Carrier"
              relatedEntityId={carrier.id}
              defaultAgent="Carrier Compliance Agent"
              agentOptions={["Carrier Compliance Agent"]}
            />
          </div>
        </article>
      </section>

      <details className="group overflow-hidden rounded-lg border border-slate-100 bg-white shadow-md shadow-slate-950/5">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 border-b border-slate-100 bg-slate-50 px-5 py-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-slate-400" />
            <div>
              <p className="text-sm font-black text-slate-800">Edit compliance record</p>
              <p className="mt-0.5 text-xs font-semibold text-slate-500">
                Expand only when updating authority, insurance, callback, payment setup, or block status.
              </p>
            </div>
          </div>
          <span className="text-xs font-black text-slate-400 group-open:hidden">Expand</span>
          <span className="hidden text-xs font-black text-slate-400 group-open:inline">Collapse</span>
        </summary>
        <div className="p-5">
          <CarrierComplianceForm carrierId={carrier.id} currentStatus={carrier.complianceStatus} />
        </div>
      </details>

      <section className="grid gap-5 xl:grid-cols-2">
        <CarrierDocumentsSection carrier={carrier} />
        <CarrierPayablesSection carrier={carrier} outstandingCount={outstandingCount} paidCount={paidCount} />
      </section>

      <RelatedLoadsSection carrier={carrier} />
    </InternalShell>
  );
}

function MetricTile({
  icon: Icon,
  label,
  value,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <article className="rounded-lg border border-slate-100 bg-white p-4 shadow-md shadow-slate-950/5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-600">{label}</p>
          <p className="mt-2 text-2xl font-black tracking-tight text-slate-950">{value}</p>
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-slate-50 text-slate-500">
          <Icon className="h-4 w-4" />
        </div>
      </div>
    </article>
  );
}

function ContactLine({
  icon: Icon,
  value,
}: {
  icon: ComponentType<{ className?: string }>;
  value: string;
}) {
  return (
    <div className="flex gap-3">
      <Icon className="h-4 w-4 flex-none text-slate-400" />
      <span>{value}</span>
    </div>
  );
}

function ScoreFact({
  label,
  value,
  valueClassName,
  muted,
}: {
  label: string;
  value: string;
  valueClassName?: string;
  muted?: boolean;
}) {
  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50 p-4">
      <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">{label}</p>
      <p className={cn("mt-2 text-2xl font-black text-slate-950", muted ? "text-slate-400" : valueClassName)}>
        {value}
      </p>
    </div>
  );
}

function ReadinessChip({
  label,
  value,
  ready,
}: {
  label: string;
  value: string;
  ready: boolean;
}) {
  return (
    <div className="rounded-md bg-white/70 px-3 py-2">
      <p className="text-[10px] font-black uppercase tracking-[0.12em] opacity-60">
        {label}
      </p>
      <p className={cn("mt-1 text-sm font-black", ready ? "text-emerald-800" : "text-amber-800")}>
        {value}
      </p>
    </div>
  );
}

function CarrierDocumentsSection({ carrier }: { carrier: CarrierDetailView }) {
  return (
    <article className="overflow-hidden rounded-lg border border-slate-100 bg-white shadow-md shadow-slate-950/5">
      <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-5 py-3">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-slate-400" />
          <p className="text-sm font-black text-slate-800">Carrier documents</p>
        </div>
        <Link href="/documents" className="text-xs font-black text-emerald-700 hover:text-emerald-900">
          Open document center
        </Link>
      </div>
      {carrier.documents.length ? (
        <div className="grid gap-3 p-5">
          {carrier.documents.map((document) => (
            <div key={document.id} className="rounded-lg border border-slate-100 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-950">{document.fileName}</p>
              <p className="mt-1 text-xs text-slate-500">
                {document.type} · {document.storageState}
              </p>
              {document.downloadHref ? (
                <Link
                  href={document.downloadHref}
                  target="_blank"
                  className="mt-3 inline-flex items-center gap-1.5 text-xs font-black text-emerald-700 hover:text-emerald-900"
                >
                  <Download className="h-3.5 w-3.5" />
                  Download
                </Link>
              ) : null}
            </div>
          ))}
        </div>
      ) : (
        <p className="px-5 py-8 text-center text-sm text-slate-400">
          No carrier-level documents logged yet.
        </p>
      )}
    </article>
  );
}

function CarrierPayablesSection({
  carrier,
  outstandingCount,
  paidCount,
}: {
  carrier: CarrierDetailView;
  outstandingCount: number;
  paidCount: number;
}) {
  const payableLoads = carrier.loads.filter((load) => load.carrierInvoiceNumber);

  return (
    <article className="overflow-hidden rounded-lg border border-slate-100 bg-white shadow-md shadow-slate-950/5">
      <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-5 py-3">
        <div className="flex items-center gap-2">
          <ReceiptText className="h-4 w-4 text-slate-400" />
          <p className="text-sm font-black text-slate-800">Carrier payables</p>
        </div>
        <div className="flex items-center gap-3 text-xs font-bold text-slate-500">
          <span>{outstandingCount} outstanding</span>
          <span>{paidCount} paid</span>
        </div>
      </div>
      <div className="grid gap-3 p-5">
        {payableLoads.length ? (
          payableLoads.map((load) => (
            <div
              key={`payable-${load.id}`}
              className="grid gap-3 rounded-lg border border-slate-100 bg-slate-50 p-4 md:grid-cols-[1fr_auto]"
            >
              <div>
                <p className="text-sm font-semibold text-slate-900">{load.loadNumber}</p>
                <p className="mt-0.5 text-xs text-slate-500">
                  {load.lane} · Inv: {load.carrierInvoiceNumber}
                </p>
                {load.carrierPaymentDue ? (
                  <p className="mt-1 text-xs font-semibold text-amber-700">
                    Due: {load.carrierPaymentDue}
                  </p>
                ) : null}
              </div>
              <div className="text-right text-sm font-semibold">
                <p className="text-slate-900">{toCurrency(load.carrierRate)}</p>
                {load.carrierPaidAt ? (
                  <p className="mt-1 text-xs text-emerald-700">Paid {load.carrierPaidAt}</p>
                ) : (
                  <p className="mt-1 text-xs text-amber-700">Unpaid</p>
                )}
              </div>
            </div>
          ))
        ) : (
          <p className="py-6 text-center text-sm text-slate-400">
            No carrier invoices recorded yet. Add invoice numbers to loads from the load detail Billing tab.
          </p>
        )}
      </div>
    </article>
  );
}

function RelatedLoadsSection({ carrier }: { carrier: CarrierDetailView }) {
  return (
    <article className="overflow-hidden rounded-lg border border-slate-100 bg-white shadow-md shadow-slate-950/5">
      <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-5 py-3">
        <div className="flex items-center gap-2">
          <Package className="h-4 w-4 text-slate-400" />
          <p className="text-sm font-black text-slate-800">Related loads</p>
        </div>
        <span className="rounded-full bg-slate-200 px-2.5 py-1 text-xs font-bold text-slate-600">
          {carrier.loads.length}
        </span>
      </div>
      {carrier.loads.length ? (
        <div className="divide-y divide-slate-100">
          {carrier.loads.map((load) => (
            <Link
              key={load.id}
              href={`/loads/${load.id}`}
              className="grid gap-3 px-5 py-4 hover:bg-slate-50 md:grid-cols-[1fr_auto]"
            >
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-slate-400">{load.loadNumber}</span>
                  <p className="text-sm font-semibold text-slate-900">{load.lane}</p>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-black uppercase text-slate-600">
                    {load.status}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-slate-500">
                  {load.shipper} · {load.equipment}
                </p>
                {load.risk ? (
                  <p className="mt-1 text-xs leading-5 text-slate-500">{load.risk}</p>
                ) : null}
              </div>
              <div className="text-sm font-semibold md:text-right">
                <p className="text-slate-900">{toCurrency(load.customerRate)} sell</p>
                <p className="mt-0.5 text-xs text-emerald-700">{toCurrency(load.margin)} margin</p>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <p className="py-8 text-center text-sm text-slate-400">No loads tied to this carrier yet.</p>
      )}
    </article>
  );
}
