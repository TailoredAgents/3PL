import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Bot,
  CircleDollarSign,
  Mail,
  MapPinned,
  Package,
  Phone,
  ReceiptText,
  ShieldCheck,
  Truck,
  UserRound,
} from "lucide-react";

import { AiAgentRunForm, CarrierComplianceForm } from "@/components/crm-forms";
import { InternalShell } from "@/components/internal-shell";
import { getCarrierDetailView } from "@/lib/crm";
import { toCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

const CARD_ACCENTS = [
  { border: "border-l-[3px] border-l-sky-400", icon: "bg-sky-50 text-sky-700" },
  { border: "border-l-[3px] border-l-emerald-400", icon: "bg-emerald-50 text-emerald-700" },
  { border: "border-l-[3px] border-l-violet-400", icon: "bg-violet-50 text-violet-700" },
] as const;

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

  const summaryCards = [
    { icon: Truck, label: "Loads handled", value: carrier.loads.length.toString() },
    { icon: CircleDollarSign, label: "Margin handled", value: toCurrency(marginHandled) },
    { icon: ShieldCheck, label: "Compliance", value: carrier.complianceStatus },
  ];

  const complianceItems = [
    { label: "Authority", value: carrier.authorityStatus },
    { label: "Insurance", value: carrier.insuranceStatus },
    { label: "Safety", value: carrier.safetyRating },
    { label: "Fraud risk", value: carrier.fraudRiskLevel },
    { label: "Last vetted", value: carrier.lastVettedAt },
    { label: "Approved by", value: carrier.approvedBy },
  ];

  const outstandingCount = carrier.loads.filter(
    (l) => l.carrierInvoiceNumber && !l.carrierPaidAt,
  ).length;
  const paidCount = carrier.loads.filter((l) => l.carrierPaidAt).length;

  return (
    <InternalShell
      active="Carriers"
      eyebrow="Carrier detail"
      title={carrier.company}
      description="Carrier profile for compliance, dispatch contact details, preferred lanes, and related load history."
      action={{ label: "Back to carriers", href: "/carriers" }}
    >
      <Link
        href="/carriers"
        className="inline-flex w-fit items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-950"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to carrier desk
      </Link>

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        {/* Profile card */}
        <article className="overflow-hidden rounded-lg border border-slate-100 bg-white shadow-md shadow-slate-950/5">
          <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-5 py-3">
            <div className="flex items-center gap-2">
              <Truck className="h-4 w-4 text-slate-400" />
              <p className="text-sm font-semibold text-slate-700">{carrier.contact}</p>
            </div>
            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
              carrier.complianceStatus === "Approved"
                ? "bg-emerald-50 text-emerald-700"
                : "bg-amber-50 text-amber-700"
            }`}>
              {carrier.complianceStatus}
            </span>
          </div>
          <div className="p-5">
            <p className="text-xs font-medium text-slate-500">{carrier.mcNumber} · {carrier.dotNumber}</p>
            <div className="mt-4 grid gap-3 text-sm text-slate-700">
              <div className="flex gap-3">
                <UserRound className="h-4 w-4 flex-none text-slate-400" />
                <span>{carrier.contact}</span>
              </div>
              <div className="flex gap-3">
                <Mail className="h-4 w-4 flex-none text-slate-400" />
                <span>{carrier.email}</span>
              </div>
              <div className="flex gap-3">
                <Phone className="h-4 w-4 flex-none text-slate-400" />
                <span>{carrier.phone}</span>
              </div>
            </div>

            <div className="mt-5 rounded-md bg-slate-50 p-4">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                <MapPinned className="h-3.5 w-3.5" />
                Preferred lanes
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {carrier.preferredLanes.length ? (
                  carrier.preferredLanes.map((lane) => (
                    <span
                      key={lane}
                      className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700"
                    >
                      {lane}
                    </span>
                  ))
                ) : (
                  <p className="text-xs text-slate-400">No preferred lanes set.</p>
                )}
              </div>
            </div>

            {carrier.notes && (
              <div className="mt-4 rounded-md border border-slate-100 bg-slate-50 p-4">
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Carrier notes</p>
                <p className="mt-2 text-sm leading-6 text-slate-700">{carrier.notes}</p>
              </div>
            )}

            <div className="mt-4 overflow-hidden rounded-md border border-slate-100 bg-white">
              <div className="border-b border-slate-100 bg-slate-50 px-4 py-2.5">
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Compliance checklist</p>
              </div>
              <div className="grid gap-0 sm:grid-cols-2">
                {complianceItems.map((item, i) => (
                  <div key={item.label} className={`px-4 py-2.5 ${i % 2 === 0 ? "sm:border-r" : ""} border-b border-slate-100 last:border-b-0`}>
                    <p className="text-xs text-slate-400">{item.label}</p>
                    <p className={`mt-0.5 text-sm font-semibold ${item.value ? "text-slate-900" : "text-slate-300"}`}>
                      {item.value || "Not set"}
                    </p>
                  </div>
                ))}
              </div>
              {carrier.complianceNotes && (
                <div className="border-t border-slate-100 px-4 py-3">
                  <p className="text-xs leading-5 text-slate-600">{carrier.complianceNotes}</p>
                </div>
              )}
            </div>
          </div>
        </article>

        {/* Summary metric cards */}
        <div className="grid content-start gap-4 md:grid-cols-3 xl:grid-cols-1 xl:grid-rows-3">
          {summaryCards.map((card, i) => (
            <article
              key={card.label}
              className={`overflow-hidden rounded-lg border border-slate-100 bg-white shadow-md shadow-slate-950/5 ${CARD_ACCENTS[i].border}`}
            >
              <div className="p-5">
                <div className={`flex h-9 w-9 items-center justify-center rounded-md ${CARD_ACCENTS[i].icon}`}>
                  <card.icon className="h-4 w-4" />
                </div>
                <p className="mt-4 text-sm font-medium text-slate-600">{card.label}</p>
                <p className="mt-1 text-3xl font-bold tracking-tight text-slate-950">{card.value}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Update compliance */}
      <article className="overflow-hidden rounded-lg border border-slate-100 bg-white shadow-md shadow-slate-950/5">
        <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-5 py-3">
          <ShieldCheck className="h-4 w-4 text-slate-400" />
          <p className="text-sm font-semibold text-slate-700">Update compliance</p>
        </div>
        <div className="p-5">
          <CarrierComplianceForm carrierId={carrier.id} currentStatus={carrier.complianceStatus} />
        </div>
      </article>

      {/* Run compliance agent */}
      <article className="overflow-hidden rounded-lg border border-slate-100 bg-white shadow-md shadow-slate-950/5">
        <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-5 py-3">
          <Bot className="h-4 w-4 text-slate-400" />
          <p className="text-sm font-semibold text-slate-700">Run compliance agent</p>
        </div>
        <div className="p-5">
          <AiAgentRunForm
            relatedEntityType="Carrier"
            relatedEntityId={carrier.id}
            defaultAgent="Carrier Compliance Agent"
            agentOptions={["Carrier Compliance Agent"]}
          />
        </div>
      </article>

      {/* Carrier payables */}
      <article className="overflow-hidden rounded-lg border border-slate-100 bg-white shadow-md shadow-slate-950/5">
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-5 py-3">
          <div className="flex items-center gap-2">
            <ReceiptText className="h-4 w-4 text-slate-400" />
            <p className="text-sm font-semibold text-slate-700">Carrier payables</p>
          </div>
          <div className="flex items-center gap-3 text-xs font-semibold text-slate-500">
            <span>{outstandingCount} outstanding</span>
            <span>{paidCount} paid</span>
          </div>
        </div>
        <div className="grid gap-3 p-5">
          {carrier.loads.some((l) => l.carrierInvoiceNumber) ? (
            carrier.loads
              .filter((l) => l.carrierInvoiceNumber)
              .map((load) => (
                <div
                  key={`payable-${load.id}`}
                  className="grid gap-3 rounded-md border border-slate-100 bg-slate-50 p-4 md:grid-cols-[1fr_auto]"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{load.loadNumber}</p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {load.lane} · Inv: {load.carrierInvoiceNumber}
                    </p>
                    {load.carrierPaymentDue && (
                      <p className="mt-1 text-xs font-semibold text-amber-700">
                        Due: {load.carrierPaymentDue}
                      </p>
                    )}
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

      {/* Related loads */}
      <article className="overflow-hidden rounded-lg border border-slate-100 bg-white shadow-md shadow-slate-950/5">
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-5 py-3">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-slate-400" />
            <p className="text-sm font-semibold text-slate-700">Related loads</p>
          </div>
          <span className="rounded-full bg-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-600">
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
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-400">{load.loadNumber}</span>
                    <p className="text-sm font-semibold text-slate-900">{load.lane}</p>
                  </div>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {load.shipper} · {load.equipment} · {load.status}
                  </p>
                  {load.risk && (
                    <p className="mt-1 text-xs leading-5 text-slate-500">{load.risk}</p>
                  )}
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
    </InternalShell>
  );
}
