import { Mail, MapPinned, Phone, ShieldCheck, Truck } from "lucide-react";
import Link from "next/link";

import { CarrierCreateForm } from "@/components/crm-forms";
import { InternalShell } from "@/components/internal-shell";
import { getCarrierViews } from "@/lib/crm";

export const dynamic = "force-dynamic";

export default async function CarriersPage() {
  const carrierViews = await getCarrierViews();
  const approved = carrierViews.filter(
    (carrier) => carrier.complianceStatus === "Approved",
  ).length;

  return (
    <InternalShell
      active="Carriers"
      eyebrow="Carrier desk"
      title="Carrier management"
      description="Build a reliable carrier file before tendering loads: authority, contacts, compliance status, preferred lanes, and performance notes."
      action={{ label: "Open Load Board", href: "/loads" }}
    >
      <section className="grid gap-4 md:grid-cols-3">
        {[
          { label: "Carriers", value: carrierViews.length.toString() },
          { label: "Approved", value: approved.toString() },
          {
            label: "Loads covered",
            value: carrierViews
              .reduce((total, carrier) => total + carrier.loadCount, 0)
              .toString(),
          },
        ].map((item) => (
          <article
            key={item.label}
            className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
          >
            <p className="text-sm font-medium text-slate-600">{item.label}</p>
            <p className="mt-2 text-3xl font-semibold">{item.value}</p>
          </article>
        ))}
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-2xl font-semibold">Create carrier</h2>
        <p className="mt-3 leading-7 text-slate-600">
          Add carriers before they are assigned to a load. Compliance status
          should be verified before tendering.
        </p>
        <div className="mt-5 rounded-lg bg-slate-50 p-4">
          <CarrierCreateForm />
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        {carrierViews.map((carrier) => (
          <Link
            key={carrier.id}
            href={`/carriers/${carrier.id}`}
            className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <Truck className="h-6 w-6 text-emerald-600" />
                  <h2 className="text-2xl font-semibold">{carrier.company}</h2>
                </div>
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
                <ShieldCheck className="h-5 w-5 flex-none text-slate-400" />
                <span>Loads covered: {carrier.loadCount}</span>
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

            <div className="mt-6">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                <MapPinned className="h-4 w-4 text-emerald-600" />
                Preferred lanes
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {carrier.preferredLanes.map((lane) => (
                  <span
                    key={lane}
                    className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700"
                  >
                    {lane}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-6 rounded-md bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-700">Notes</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {carrier.notes}
              </p>
            </div>
          </Link>
        ))}
      </section>
    </InternalShell>
  );
}
