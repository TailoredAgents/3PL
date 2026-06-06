import {
  Building2,
  Mail,
  MapPinned,
  Phone,
  Plus,
  UserRound,
} from "lucide-react";
import Link from "next/link";

import { ShipperCreateForm } from "@/components/crm-forms";
import { InternalShell } from "@/components/internal-shell";
import { getShipperViews } from "@/lib/crm";

export const dynamic = "force-dynamic";

const METRIC_ACCENTS = [
  { border: "border-l-[3px] border-l-emerald-400" },
  { border: "border-l-[3px] border-l-sky-400" },
  { border: "border-l-[3px] border-l-amber-400" },
  { border: "border-l-[3px] border-l-violet-400" },
] as const;

export default async function ShippersPage() {
  const shipperViews = await getShipperViews();
  const activeCount = shipperViews.filter((s) => s.status === "Active").length;
  const totalLanes = shipperViews.reduce(
    (total, s) => total + s.lanes.length,
    0,
  );
  const withContact = shipperViews.filter(
    (s) => s.primaryContact && s.primaryContact !== "No contact",
  ).length;

  const metrics = [
    { label: "Total shippers", value: shipperViews.length.toString() },
    { label: "Active shippers", value: activeCount.toString() },
    { label: "Known lanes", value: totalLanes.toString() },
    { label: "With primary contact", value: withContact.toString() },
  ];

  return (
    <InternalShell
      active="Shippers"
      eyebrow="Sales & CRM"
      title="Shippers"
      description="Company files for every shipper prospect and customer — contacts, lanes, and load history in one place."
      action={{ label: "Savings audit form", href: "/#audit" }}
    >
      {/* Metrics */}
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((item, i) => (
          <article
            key={item.label}
            className={`overflow-hidden rounded-lg border border-slate-100 bg-white shadow-md shadow-slate-950/5 ${METRIC_ACCENTS[i].border}`}
          >
            <div className="p-5">
              <p className="text-sm font-medium text-slate-600">{item.label}</p>
              <p className="mt-1 text-4xl font-bold tracking-tight text-slate-950">
                {item.value}
              </p>
            </div>
          </article>
        ))}
      </section>

      {/* Create form — collapsed by default */}
      <details className="group overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-4 hover:bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-slate-100">
              <Plus className="h-4 w-4 text-slate-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">
                Add shipper
              </p>
              <p className="text-xs text-slate-500">
                Create a company file for a new prospect or customer
              </p>
            </div>
          </div>
          <span className="text-xs font-semibold text-slate-400 group-open:hidden">
            Expand
          </span>
          <span className="hidden text-xs font-semibold text-slate-400 group-open:inline">
            Collapse
          </span>
        </summary>
        <div className="border-t border-slate-200 p-5">
          <ShipperCreateForm />
        </div>
      </details>

      {/* Shipper list */}
      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-5 py-3">
          <p className="text-sm font-semibold text-slate-700">
            {shipperViews.length}{" "}
            {shipperViews.length === 1 ? "shipper" : "shippers"}
          </p>
        </div>

        {shipperViews.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <Building2 className="mx-auto h-8 w-8 text-slate-300" />
            <p className="mt-4 text-sm font-semibold text-slate-600">
              No shippers yet
            </p>
            <p className="mt-1 text-sm text-slate-400">
              Use the form above to add your first shipper.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {shipperViews.map((shipper) => {
              const hasContact =
                shipper.primaryContact &&
                shipper.primaryContact !== "No contact";
              const hasEmail =
                shipper.email && shipper.email !== "No email";
              const hasPhone =
                shipper.phone && shipper.phone !== "No phone";
              const hasIndustry =
                shipper.industry && shipper.industry !== "Industry needed";

              return (
                <Link
                  key={shipper.id}
                  href={`/shippers/${shipper.id}`}
                  className="grid grid-cols-[1fr_auto] items-center gap-4 px-5 py-4 hover:bg-slate-50"
                >
                  <div className="grid gap-1 sm:grid-cols-[1.4fr_1fr_1fr_1fr] sm:items-center sm:gap-4">
                    {/* Company + status */}
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-slate-950">
                          {shipper.company}
                        </p>
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                            shipper.status === "Active"
                              ? "bg-emerald-50 text-emerald-700"
                              : shipper.status === "Customer"
                                ? "bg-sky-50 text-sky-700"
                                : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {shipper.status}
                        </span>
                      </div>
                      {hasIndustry && (
                        <p className="mt-0.5 text-xs text-slate-500">
                          {shipper.industry}
                        </p>
                      )}
                    </div>

                    {/* Primary contact */}
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <UserRound className="h-3.5 w-3.5 flex-none text-slate-400" />
                      <span className="truncate">
                        {hasContact ? shipper.primaryContact : (
                          <span className="text-slate-400">No contact</span>
                        )}
                      </span>
                    </div>

                    {/* Email / phone */}
                    <div className="space-y-1">
                      {hasEmail ? (
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <Mail className="h-3.5 w-3.5 flex-none text-slate-400" />
                          <span className="truncate">{shipper.email}</span>
                        </div>
                      ) : null}
                      {hasPhone ? (
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <Phone className="h-3.5 w-3.5 flex-none text-slate-400" />
                          <span>{shipper.phone}</span>
                        </div>
                      ) : null}
                      {!hasEmail && !hasPhone && (
                        <span className="text-xs text-slate-400">No contact info</span>
                      )}
                    </div>

                    {/* Lanes */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      {shipper.lanes.length ? (
                        shipper.lanes.slice(0, 2).map((lane) => (
                          <span
                            key={lane}
                            className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600"
                          >
                            {lane}
                          </span>
                        ))
                      ) : (
                        <div className="flex items-center gap-1.5 text-xs text-slate-400">
                          <MapPinned className="h-3.5 w-3.5" />
                          No lanes
                        </div>
                      )}
                      {shipper.lanes.length > 2 && (
                        <span className="text-xs text-slate-400">
                          +{shipper.lanes.length - 2}
                        </span>
                      )}
                    </div>
                  </div>

                  <span className="text-xs font-semibold text-emerald-700">
                    View →
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </InternalShell>
  );
}
