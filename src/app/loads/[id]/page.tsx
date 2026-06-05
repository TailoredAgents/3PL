import Link from "next/link";
import { notFound } from "next/navigation";
import type { ComponentType } from "react";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  ClipboardCheck,
  FileText,
  MapPinned,
  Package,
  ReceiptText,
  Truck,
} from "lucide-react";

import {
  DocumentCreateForm,
  InvoiceCreateForm,
  LoadUpdateForm,
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

  return (
    <InternalShell
      active="Loads"
      eyebrow="Load detail"
      title={load.shipper}
      description="Execute the shipment from one workspace: status, carrier, margin, tracking events, POD readiness, and customer update context."
      action={{ label: "Back to loads", href: "/loads" }}
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
              value={`${load.pickup} -> ${load.delivery}`}
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
            <h2 className="text-2xl font-semibold">Add document</h2>
            <p className="mt-3 leading-7 text-slate-600">
              Log PODs, rate confirmations, invoices, and other load documents.
              Storage comes later; this records the document metadata now.
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
                        <p className="mt-2 break-all text-sm text-slate-500">
                          {document.fileUrl}
                        </p>
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
