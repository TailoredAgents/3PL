import type { ComponentType } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  FileWarning,
  MessageSquareText,
  Package,
  RadioTower,
  Truck,
  Users,
} from "lucide-react";

import { LoadExceptionCreateForm, LoadExceptionUpdateForm } from "@/components/crm-forms";
import { InternalShell } from "@/components/internal-shell";
import { getTrackingWorkspaceView, type LoadView } from "@/lib/crm";

export const dynamic = "force-dynamic";

type TrackingGroup = Awaited<ReturnType<typeof getTrackingWorkspaceView>>["groups"][number];

const riskIcons: Record<string, ComponentType<{ className?: string }>> = {
  "Pickup today": Calendar,
  "Delivery today": Calendar,
  "No recent check call / update": Clock,
  "Customer update due": Users,
  "Delivered but missing POD": Package,
  "Late pickup / delivery risk": AlertTriangle,
  "Uncovered / not booked": Truck,
};

const groupTone: Record<string, string> = {
  "Pickup today": "border-sky-100 bg-sky-50 text-sky-700",
  "Delivery today": "border-emerald-100 bg-emerald-50 text-emerald-700",
  "No recent check call / update": "border-amber-100 bg-amber-50 text-amber-700",
  "Customer update due": "border-cyan-100 bg-cyan-50 text-cyan-700",
  "Delivered but missing POD": "border-orange-100 bg-orange-50 text-orange-700",
  "Late pickup / delivery risk": "border-red-100 bg-red-50 text-red-700",
  "Uncovered / not booked": "border-rose-100 bg-rose-50 text-rose-700",
};

function groupCount(groups: TrackingGroup[], title: string) {
  return groups.find((group) => group.title === title)?.loads.length ?? 0;
}

function getUniqueLoads(groups: TrackingGroup[]) {
  return Array.from(new Map(groups.flatMap((group) => group.loads).map((load) => [load.id, load])).values());
}

function getPrimaryAction(load: LoadView, groupTitle: string) {
  if (groupTitle === "Uncovered / not booked" || load.carrier === "Carrier needed") {
    return { label: "Cover load", href: `/loads/${load.id}`, tone: "danger" };
  }

  if (groupTitle === "Delivered but missing POD" || !load.hasPod) {
    return { label: "Upload POD", href: "/documents", tone: "success" };
  }

  if (groupTitle === "Customer update due") {
    return { label: "Send update", href: `/loads/${load.id}`, tone: "primary" };
  }

  if (groupTitle === "No recent check call / update") {
    return { label: "Add check call", href: `/loads/${load.id}`, tone: "warning" };
  }

  return { label: "Update status", href: `/loads/${load.id}`, tone: "primary" };
}

function actionClass(tone: string) {
  if (tone === "danger") {
    return "border-red-200 bg-red-50 text-red-700 hover:bg-red-100";
  }

  if (tone === "success") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100";
  }

  if (tone === "warning") {
    return "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100";
  }

  return "border-slate-900 bg-slate-950 text-white shadow-sm shadow-slate-200 hover:bg-slate-800";
}

function formatEvent(load: LoadView) {
  const latest = load.events[0];
  if (!latest) {
    return {
      label: "No check call logged",
      detail: "Create the next tracking event before calling the customer.",
    };
  }

  return {
    label: latest.type,
    detail: `${latest.message}${latest.location ? ` · ${latest.location}` : ""} · ${latest.time}`,
  };
}

export default async function TrackingPage() {
  const { groups, totalActive } = await getTrackingWorkspaceView();
  const uniqueLoads = getUniqueLoads(groups);
  const exceptionCount = uniqueLoads.reduce((count, load) => count + load.exceptions.length, 0);
  const firstPriority = groups[0]?.loads[0];
  const firstPriorityAction = firstPriority ? getPrimaryAction(firstPriority, groups[0].title) : null;

  const metrics = [
    {
      label: "Active loads",
      value: totalActive,
      helper: "Under active tracking",
      icon: RadioTower,
      tone: "border-slate-900 bg-slate-950 text-white",
    },
    {
      label: "Uncovered",
      value: groupCount(groups, "Uncovered / not booked"),
      helper: "Need carrier coverage",
      icon: Truck,
      tone: "border-rose-100 bg-white text-rose-600",
    },
    {
      label: "Stale updates",
      value: groupCount(groups, "No recent check call / update"),
      helper: "No recent touch",
      icon: Clock,
      tone: "border-amber-100 bg-white text-amber-600",
    },
    {
      label: "Customer due",
      value: groupCount(groups, "Customer update due"),
      helper: "Needs shipper update",
      icon: MessageSquareText,
      tone: "border-cyan-100 bg-white text-cyan-600",
    },
    {
      label: "POD needed",
      value: groupCount(groups, "Delivered but missing POD"),
      helper: "Blocks billing",
      icon: FileWarning,
      tone: "border-orange-100 bg-white text-orange-600",
    },
    {
      label: "Exceptions",
      value: exceptionCount,
      helper: "Open issue records",
      icon: AlertTriangle,
      tone: "border-red-100 bg-white text-red-600",
    },
  ];

  return (
    <InternalShell
      active="Tracking"
      eyebrow="Operations"
      title="Tracking & Visibility"
      description="A live operations board for active freight: coverage, check calls, customer updates, PODs, and exceptions."
      action={{ label: "Load Board", href: "/loads" }}
    >
      <section className="mb-6 grid gap-4 xl:grid-cols-[1.05fr_1.95fr]">
        <div className="rounded-lg border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.22em] text-emerald-700">
                Ops command
              </p>
              <h2 className="mt-2 text-xl font-black tracking-tight text-slate-950">
                Work the highest-risk load first
              </h2>
              <p className="mt-2 max-w-md text-sm leading-6 text-slate-600">
                Tracking rolls load events, POD readiness, customer update flags, and open exceptions into one action queue.
              </p>
            </div>
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
          </div>

          {firstPriority && firstPriorityAction ? (
            <div className="mt-5 rounded-lg border border-amber-100 bg-amber-50 p-4">
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-amber-700">
                First move
              </p>
              <p className="mt-2 font-black text-slate-950">
                {firstPriority.loadNumber} · {firstPriority.shipper}
              </p>
              <p className="mt-1 text-sm text-slate-700">{firstPriority.risk || groups[0].description}</p>
              <Link
                href={firstPriorityAction.href}
                className={`mt-4 inline-flex items-center rounded-md border px-3 py-2 text-sm font-black transition ${actionClass(firstPriorityAction.tone)}`}
              >
                {firstPriorityAction.label}
              </Link>
            </div>
          ) : (
            <div className="mt-5 rounded-lg border border-emerald-100 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">
              No tracked risks are waiting right now.
            </div>
          )}
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {metrics.map((metric) => {
            const Icon = metric.icon;
            const isInverted = metric.label === "Active loads";

            return (
              <div key={metric.label} className={`rounded-lg border p-4 shadow-sm ${metric.tone}`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className={`text-sm font-bold ${isInverted ? "text-slate-300" : "text-slate-600"}`}>
                      {metric.label}
                    </p>
                    <p className={`mt-2 text-3xl font-black tracking-tight ${isInverted ? "text-white" : "text-slate-950"}`}>
                      {metric.value}
                    </p>
                  </div>
                  <Icon className="h-5 w-5" />
                </div>
                <p className={`mt-3 text-xs font-semibold ${isInverted ? "text-slate-300" : "text-slate-500"}`}>
                  {metric.helper}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {groups.length === 0 ? (
        <div className="rounded-lg border border-slate-100 bg-white p-10 text-center text-sm font-semibold text-slate-500 shadow-sm">
          No loads currently match the tracked risk categories.
        </div>
      ) : (
        <div className="grid gap-5">
          {groups.map((group) => {
            const Icon = riskIcons[group.title] ?? AlertTriangle;
            const tone = groupTone[group.title] ?? "border-slate-100 bg-slate-50 text-slate-700";

            return (
              <section key={group.title} className="overflow-hidden rounded-lg border border-slate-100 bg-white shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-slate-50 px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-lg border ${tone}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-base font-black text-slate-950">{group.title}</p>
                      <p className="text-sm text-slate-500">
                        {group.description} · {group.loads.length} {group.loads.length === 1 ? "load" : "loads"}
                      </p>
                    </div>
                  </div>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-600 shadow-sm ring-1 ring-slate-100">
                    Work queue
                  </span>
                </div>

                <div className="grid gap-3 p-4">
                  {group.loads.map((load) => {
                    const action = getPrimaryAction(load, group.title);
                    const event = formatEvent(load);

                    return (
                      <article key={load.id} className="rounded-lg border border-slate-100 bg-white p-4 shadow-sm">
                        <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr_auto] xl:items-start">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <Link href={`/loads/${load.id}`} className="text-lg font-black text-slate-950 hover:text-emerald-700">
                                {load.loadNumber}
                              </Link>
                              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-black uppercase text-slate-600">
                                {load.status}
                              </span>
                            </div>
                            <p className="mt-1 font-semibold text-slate-800">{load.shipper}</p>
                            <p className="mt-1 text-sm text-slate-600">{load.lane}</p>
                            <div className="mt-3 grid gap-2 text-xs font-semibold text-slate-500 sm:grid-cols-2">
                              <span>Pickup: {load.pickup}{load.pickupWindow ? ` · ${load.pickupWindow}` : ""}</span>
                              <span>Delivery: {load.delivery}{load.deliveryWindow ? ` · ${load.deliveryWindow}` : ""}</span>
                            </div>
                          </div>

                          <div className="grid gap-3">
                            <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                                Latest touch
                              </p>
                              <p className="mt-2 text-sm font-black text-slate-900">{event.label}</p>
                              <p className="mt-1 text-xs leading-5 text-slate-500">{event.detail}</p>
                            </div>
                            <div className="grid gap-2 text-xs sm:grid-cols-2">
                              <span className="rounded-md bg-slate-50 px-3 py-2 font-bold text-slate-600">
                                Carrier: {load.carrier}
                              </span>
                              <span className="rounded-md bg-slate-50 px-3 py-2 font-bold text-slate-600">
                                Customer: {load.customerUpdateStatus || "Not flagged"}
                              </span>
                              <span className={`rounded-md px-3 py-2 font-bold ${load.hasPod ? "bg-emerald-50 text-emerald-700" : "bg-orange-50 text-orange-700"}`}>
                                POD: {load.hasPod ? "Received" : "Needed"}
                              </span>
                              <span className={`rounded-md px-3 py-2 font-bold ${load.exceptions.length ? "bg-red-50 text-red-700" : "bg-slate-50 text-slate-600"}`}>
                                Exceptions: {load.exceptions.length}
                              </span>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2 xl:w-36 xl:flex-col">
                            <Link
                              href={action.href}
                              className={`inline-flex justify-center rounded-md border px-3 py-2 text-sm font-black transition ${actionClass(action.tone)}`}
                            >
                              {action.label}
                            </Link>
                            <Link
                              href={`/loads/${load.id}`}
                              className="inline-flex justify-center rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-black text-slate-700 transition hover:bg-slate-50"
                            >
                              Open load
                            </Link>
                          </div>
                        </div>

                        {load.risk && (
                          <div className="mt-4 rounded-lg border border-amber-100 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-800">
                            {load.risk}
                          </div>
                        )}

                        <div className="mt-4 border-t border-slate-100 pt-3 text-xs">
                          <details>
                            <summary className="cursor-pointer font-black text-emerald-700">Create exception</summary>
                            <div className="mt-3">
                              <LoadExceptionCreateForm loadId={load.id} />
                            </div>
                          </details>

                          {load.exceptions.length > 0 && (
                            <div className="mt-3 grid gap-2">
                              {load.exceptions.map((exception) => (
                                <details key={exception.id} className="rounded-md border border-slate-100 bg-slate-50 p-3">
                                  <summary className="cursor-pointer font-black text-slate-700">
                                    Update {exception.type} · {exception.status}
                                  </summary>
                                  <div className="mt-3">
                                    <LoadExceptionUpdateForm
                                      loadId={load.id}
                                      exceptionId={exception.id}
                                      currentStatus={exception.status}
                                    />
                                  </div>
                                </details>
                              ))}
                            </div>
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </InternalShell>
  );
}
