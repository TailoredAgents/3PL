import { Building2, Mail, MapPinned, Phone, UserRound } from "lucide-react";
import Link from "next/link";

import { ShipperCreateForm } from "@/components/crm-forms";
import { InternalShell } from "@/components/internal-shell";
import { getShipperViews } from "@/lib/crm";

export const dynamic = "force-dynamic";

export default async function ShippersPage() {
  const shipperViews = await getShipperViews();

  return (
    <InternalShell
      active="Shippers"
      eyebrow="Accounts"
      title="Shippers and contacts"
      description="A clean company file for each prospect or customer: who they are, who to call, what lanes they run, and what context should never get lost."
      action={{ label: "Savings audit form", href: "/#audit" }}
    >
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Companies", value: shipperViews.length.toString() },
          { label: "Primary contacts", value: shipperViews.length.toString() },
          {
            label: "Known lanes",
            value: shipperViews
              .reduce((total, shipper) => total + shipper.lanes.length, 0)
              .toString(),
          },
          { label: "High-service opportunities", value: "Review" },
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
        <h2 className="text-2xl font-semibold">Create shipper/contact</h2>
        <p className="mt-3 leading-7 text-slate-600">
          Add a company file before or after the first sales conversation. This
          keeps contacts, lanes, and notes from getting scattered.
        </p>
        <div className="mt-5 rounded-lg bg-slate-50 p-4">
          <ShipperCreateForm />
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        {shipperViews.map((shipper) => (
          <Link
            key={shipper.company}
            href={`/shippers/${shipper.id}`}
            className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <Building2 className="h-6 w-6 text-emerald-600" />
                  <h2 className="text-2xl font-semibold">{shipper.company}</h2>
                </div>
                <p className="mt-2 text-sm font-medium text-slate-600">
                  {shipper.industry}
                </p>
              </div>
              <span className="w-fit rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-800">
                {shipper.status}
              </span>
            </div>

            <div className="mt-6 grid gap-3 text-sm text-slate-700">
              <div className="flex gap-3">
                <UserRound className="h-5 w-5 flex-none text-slate-400" />
                <span>
                  <strong className="text-slate-950">Primary contact:</strong>{" "}
                  {shipper.primaryContact}
                </span>
              </div>
              <div className="flex gap-3">
                <Mail className="h-5 w-5 flex-none text-slate-400" />
                <span>{shipper.email}</span>
              </div>
              <div className="flex gap-3">
                <Phone className="h-5 w-5 flex-none text-slate-400" />
                <span>{shipper.phone}</span>
              </div>
            </div>

            <div className="mt-6">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                <MapPinned className="h-4 w-4 text-emerald-600" />
                Known lanes
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {shipper.lanes.map((lane) => (
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
                {shipper.notes}
              </p>
            </div>
          </Link>
        ))}
      </section>
    </InternalShell>
  );
}
