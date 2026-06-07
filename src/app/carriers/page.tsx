import { AlertTriangle, ClipboardCheck, Plus, ShieldCheck, Truck, TrendingUp } from "lucide-react";

import { CarrierCreateForm } from "@/components/crm-forms";
import { CarrierListFilter } from "@/components/carrier-list-filter";
import { InternalShell } from "@/components/internal-shell";
import { getCarrierViews } from "@/lib/crm";

export const dynamic = "force-dynamic";

const CARD_ACCENTS = [
  { border: "border-l-[3px] border-l-amber-400", icon: "bg-amber-50 text-amber-700" },
  { border: "border-l-[3px] border-l-emerald-400", icon: "bg-emerald-50 text-emerald-700" },
  { border: "border-l-[3px] border-l-sky-400", icon: "bg-sky-50 text-sky-700" },
  { border: "border-l-[3px] border-l-violet-400", icon: "bg-violet-50 text-violet-700" },
] as const;

export default async function CarriersPage() {
  const carrierViews = await getCarrierViews();
  const approved = carrierViews.filter(
    (c) => c.complianceStatus === "Approved",
  ).length;
  const pending = carrierViews.filter(
    (c) => c.complianceStatus === "Pending",
  ).length;
  const blocked = carrierViews.filter(
    (c) => c.blockedReason || ["Blocked", "Rejected"].includes(c.complianceStatus),
  ).length;
  const totalLoads = carrierViews.reduce((sum, c) => sum + c.loadCount, 0);

  const metrics = [
    { icon: Truck, label: "Total carriers", value: carrierViews.length.toString(), helper: "In carrier file" },
    { icon: ShieldCheck, label: "Tender ready", value: approved.toString(), helper: "Approved to book" },
    { icon: ClipboardCheck, label: "Needs vetting", value: pending.toString(), helper: "Compliance not finished" },
    { icon: TrendingUp, label: "Loads covered", value: totalLoads.toString(), helper: "Historical coverage" },
  ];

  return (
    <InternalShell
      active="Carriers"
      eyebrow="Operations"
      title="Carriers"
      description="Authority, contacts, compliance, and preferred lanes — every carrier you can tender to."
      action={{ label: "Open Load Board", href: "/loads" }}
    >
      {/* Metrics */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((item, i) => (
          <article
            key={item.label}
            className={`overflow-hidden rounded-lg border border-slate-100 bg-white shadow-md shadow-slate-950/5 ${CARD_ACCENTS[i].border}`}
          >
            <div className="p-5">
              <div className={`flex h-9 w-9 items-center justify-center rounded-md ${CARD_ACCENTS[i].icon}`}>
                <item.icon className="h-4 w-4" />
              </div>
              <p className="mt-4 text-sm font-medium text-slate-600">{item.label}</p>
              <p className="mt-1 text-4xl font-bold tracking-tight text-slate-950">
                {item.value}
              </p>
              <p className="mt-2 text-xs font-semibold text-slate-400">{item.helper}</p>
            </div>
          </article>
        ))}
      </section>

      {blocked > 0 ? (
        <section className="rounded-lg border border-red-100 bg-red-50 p-4 text-red-950 shadow-sm">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 text-red-600" />
            <div>
              <p className="font-black">Blocked carrier review needed</p>
              <p className="mt-1 text-sm leading-6 text-red-800">
                {blocked} carrier {blocked === 1 ? "has" : "have"} a block or rejection signal. Do not tender until compliance clears the record.
              </p>
            </div>
          </div>
        </section>
      ) : null}

      {/* Create carrier — collapsed by default */}
      <details className="group overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-4 hover:bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-slate-100">
              <Plus className="h-4 w-4 text-slate-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">Add carrier</p>
              <p className="text-xs text-slate-500">
                Verify compliance before tendering loads
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
          <CarrierCreateForm />
        </div>
      </details>

      {/* Carrier list with search + filter */}
      <CarrierListFilter
        carriers={carrierViews.map((c) => ({
          id: c.id,
          company: c.company,
          mcNumber: c.mcNumber,
          dotNumber: c.dotNumber,
          contact: c.contact,
          phone: c.phone,
          email: c.email,
          complianceStatus: c.complianceStatus,
          preferredLanes: c.preferredLanes,
          notes: c.notes,
          loadCount: c.loadCount,
          deliveredLoads: c.deliveredLoads ?? 0,
          avgMargin: c.avgMargin ?? 0,
          authorityStatus: c.authorityStatus,
          insuranceStatus: c.insuranceStatus,
          safetyRating: c.safetyRating,
          fraudRiskLevel: c.fraudRiskLevel,
          lastVettedAt: c.lastVettedAt,
          callbackVerifiedAt: c.callbackVerifiedAt,
          blockedReason: c.blockedReason,
          onTimePickupRate: c.onTimePickupRate,
          issuesCount: c.issuesCount,
        }))}
      />
    </InternalShell>
  );
}
