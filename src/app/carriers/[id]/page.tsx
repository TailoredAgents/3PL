import Link from "next/link";
import { notFound } from "next/navigation";
import type { ComponentType } from "react";
import {
  ArrowLeft,
  Bot,
  CircleDollarSign,
  Mail,
  MapPinned,
  Phone,
  ShieldCheck,
  Truck,
  UserRound,
} from "lucide-react";

import { AiAgentRunForm, CarrierComplianceForm } from "@/components/crm-forms";
import { InternalShell } from "@/components/internal-shell";
import { getCarrierDetailView } from "@/lib/crm";
import { toCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

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

  const marginHandled = carrier.loads.reduce(
    (total, load) => total + load.margin,
    0,
  );

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
        <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-2xl font-semibold">{carrier.contact}</h2>
              <p className="mt-2 text-sm font-medium text-slate-600">
                {carrier.mcNumber} | {carrier.dotNumber}
              </p>
            </div>
            <span className="w-fit rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-800">
              {carrier.complianceStatus}
            </span>
          </div>

          <div className="mt-6 grid gap-3 text-sm text-slate-700">
            <div className="flex gap-3">
              <UserRound className="h-5 w-5 flex-none text-slate-400" />
              <span>{carrier.contact}</span>
            </div>
            <div className="flex gap-3">
              <Mail className="h-5 w-5 flex-none text-slate-400" />
              <span>{carrier.email}</span>
            </div>
            <div className="flex gap-3">
              <Phone className="h-5 w-5 flex-none text-slate-400" />
              <span>{carrier.phone}</span>
            </div>
          </div>

          <div className="mt-6 rounded-md bg-slate-50 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <MapPinned className="h-4 w-4 text-emerald-600" />
              Preferred lanes
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {carrier.preferredLanes.map((lane) => (
                <span
                  key={lane}
                  className="rounded-full bg-white px-3 py-1 text-sm font-medium text-slate-700"
                >
                  {lane}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-6 rounded-md border border-slate-200 p-4">
            <p className="text-sm font-semibold text-slate-700">Carrier notes</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {carrier.notes}
            </p>
          </div>

          <div className="mt-6 rounded-md border border-amber-100 bg-amber-50 p-4">
            <p className="text-sm font-semibold text-amber-900">
              Compliance checklist
            </p>
            <div className="mt-3 grid gap-2 text-sm leading-6 text-amber-900 sm:grid-cols-2">
              <p>Authority: {carrier.authorityStatus}</p>
              <p>Insurance: {carrier.insuranceStatus}</p>
              <p>Safety: {carrier.safetyRating}</p>
              <p>Fraud risk: {carrier.fraudRiskLevel}</p>
              <p>Last vetted: {carrier.lastVettedAt}</p>
              <p>Approved by: {carrier.approvedBy}</p>
            </div>
            <p className="mt-3 text-sm leading-6 text-amber-900">
              {carrier.complianceNotes}
            </p>
          </div>
        </article>

        <div className="grid gap-4 md:grid-cols-3">
          <SummaryCard
            icon={Truck}
            label="Loads handled"
            value={carrier.loads.length.toString()}
          />
          <SummaryCard
            icon={CircleDollarSign}
            label="Margin handled"
            value={toCurrency(marginHandled)}
          />
          <SummaryCard
            icon={ShieldCheck}
            label="Compliance"
            value={carrier.complianceStatus}
          />
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <ShieldCheck className="h-6 w-6 text-emerald-600" />
          <h2 className="text-2xl font-semibold">Update compliance</h2>
        </div>
        <p className="mt-3 leading-7 text-slate-600">
          Vet authority, insurance, safety, fraud risk, and approval status
          before this carrier can be accepted on a load.
        </p>
        <div className="mt-5 rounded-lg bg-slate-50 p-4">
          <CarrierComplianceForm
            carrierId={carrier.id}
            currentStatus={carrier.complianceStatus}
          />
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <Bot className="h-6 w-6 text-emerald-600" />
          <h2 className="text-2xl font-semibold">Run compliance agent</h2>
        </div>
        <p className="mt-3 leading-7 text-slate-600">
          Review this carrier file for missing compliance details and the next
          approval step before tendering.
        </p>
        <div className="mt-5 rounded-lg bg-slate-50 p-4">
          <AiAgentRunForm
            relatedEntityType="Carrier"
            relatedEntityId={carrier.id}
            defaultAgent="Carrier Compliance Agent"
            agentOptions={["Carrier Compliance Agent"]}
          />
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-2xl font-semibold">Related loads</h2>
        <div className="mt-5 grid gap-4">
          {carrier.loads.length ? (
            carrier.loads.map((load) => (
              <Link
                key={load.id}
                href={`/loads/${load.id}`}
                className="grid gap-3 rounded-md bg-slate-50 p-4 hover:bg-slate-100 md:grid-cols-[1fr_auto]"
              >
                <div>
                  <p className="font-semibold">{load.lane}</p>
                  <p className="mt-1 text-sm text-slate-600">
                    {load.shipper} | {load.equipment} | {load.status}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {load.risk}
                  </p>
                </div>
                <div className="text-sm font-semibold text-slate-700 md:text-right">
                  <p>{toCurrency(load.customerRate)} sell</p>
                  <p className="mt-1 text-emerald-700">
                    {toCurrency(load.margin)} margin
                  </p>
                </div>
              </Link>
            ))
          ) : (
            <p className="rounded-md bg-slate-50 p-4 text-sm text-slate-600">
              No loads tied to this carrier yet.
            </p>
          )}
        </div>
      </section>
    </InternalShell>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <Icon className="h-5 w-5 text-emerald-600" />
      <p className="mt-3 text-sm font-medium text-slate-600">{label}</p>
      <p className="mt-1 text-3xl font-semibold">{value}</p>
    </article>
  );
}
