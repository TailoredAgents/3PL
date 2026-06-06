import Link from "next/link";
import {
  AlertTriangle,
  Calendar,
  Clock,
  Package,
  Truck,
  Users,
} from "lucide-react";

import { InternalShell } from "@/components/internal-shell";
import { getTrackingWorkspaceView } from "@/lib/crm";

export const dynamic = "force-dynamic";

export default async function TrackingPage() {
  const { groups, totalActive } = await getTrackingWorkspaceView();

  const riskIcons: Record<string, React.ComponentType<{ className?: string }>> = {
    "Pickup today": Calendar,
    "Delivery today": Calendar,
    "No recent check call / update": Clock,
    "Customer update due": Users,
    "Delivered but missing POD": Package,
    "Late pickup / delivery risk": AlertTriangle,
    "Uncovered / not booked": Truck,
  };

  return (
    <InternalShell
      active="Tracking"
      eyebrow="Operations"
      title="Tracking & Visibility"
      description="Internal command center for active loads. Monitor risks, exceptions, and next actions without opening every record."
      action={{ label: "Load Board", href: "/loads" }}
    >
      {/* Summary */}
      <section className="mb-6 rounded-lg border border-slate-100 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-600">Active loads under management</p>
            <p className="text-3xl font-bold tracking-tight text-slate-950">{totalActive}</p>
          </div>
          <div className="text-right text-xs text-slate-500">
            Risks are computed from load dates, status, events, POD documents, and customer update flags.<br />
            All actions link to existing load detail workflows.
          </div>
        </div>
      </section>

      {groups.length === 0 ? (
        <div className="rounded-lg border border-slate-100 bg-white p-10 text-center text-sm text-slate-500">
          No loads currently match the tracked risk categories. Great job!
        </div>
      ) : (
        <div className="grid gap-6">
          {groups.map((group) => {
            const Icon = (riskIcons[group.title] || AlertTriangle) as any; // eslint-disable-line @typescript-eslint/no-explicit-any
            return (
              <section key={group.title} className="overflow-hidden rounded-lg border border-slate-100 bg-white shadow-sm">
                <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50 px-5 py-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-amber-100 text-amber-700">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{group.title}</p>
                    <p className="text-xs text-slate-500">{group.description} · {group.loads.length} loads</p>
                  </div>
                </div>

                <div className="divide-y divide-slate-100">
                  {group.loads.map((load) => (
                    <div key={load.id} className="grid gap-3 px-5 py-4 md:grid-cols-[1fr_auto] md:items-start">
                      <div>
                        <div className="flex items-center gap-2">
                          <Link href={`/loads/${load.id}`} className="font-semibold text-slate-950 hover:text-emerald-700">
                            {load.loadNumber}
                          </Link>
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                            {load.status}
                          </span>
                        </div>
                        <p className="mt-0.5 text-sm text-slate-700">{load.lane}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          Pickup: {load.pickup} · Delivery: {load.delivery}
                          {load.hasPod ? " · POD ✓" : ""}
                        </p>
                        {load.risk && (
                          <p className="mt-1 text-xs text-amber-700">{load.risk}</p>
                        )}
                        {load.customerUpdateStatus && (
                          <p className="mt-0.5 text-xs text-slate-500">Customer update: {load.customerUpdateStatus}</p>
                        )}
                      </div>

                      {/* Quick actions reusing existing system */}
                      <div className="flex flex-wrap gap-2 text-xs md:justify-end">
                        <Link
                          href={`/loads/${load.id}`}
                          className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-3 py-1 font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          Open load
                        </Link>
                        <Link
                          href={`/loads/${load.id}`}
                          className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-3 py-1 font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          Add check call
                        </Link>
                        <Link
                          href={`/loads/${load.id}`}
                          className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-3 py-1 font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          Customer update
                        </Link>
                        <Link
                          href={`/documents`}
                          className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-1 font-semibold text-emerald-700 hover:bg-emerald-100"
                        >
                          Upload POD
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}

      <p className="mt-8 text-center text-[10px] text-slate-400">
        Internal use only. Public tracking links and automated exception ownership are planned for later sub-phases.
      </p>
    </InternalShell>
  );
}
