import Link from "next/link";
import { notFound } from "next/navigation";
import type { ComponentType } from "react";
import {
  ArrowLeft,
  CalendarDays,
  CircleDollarSign,
  MapPinned,
  Package,
  Truck,
} from "lucide-react";

import { LoadUpdateForm, ShipmentEventCreateForm } from "@/components/crm-forms";
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
        </article>

        <div className="grid gap-6">
          <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-2xl font-semibold">Update load</h2>
            <p className="mt-3 leading-7 text-slate-600">
              Move the load through the operating workflow and update carrier
              cost as coverage changes.
            </p>
            <div className="mt-5 rounded-lg bg-slate-50 p-4">
              <LoadUpdateForm loadId={load.id} currentStatus={load.status} />
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
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
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
      </section>
    </InternalShell>
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
