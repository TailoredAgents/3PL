import type { ComponentType } from "react";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Mail,
  MapPinned,
  Phone,
  Plus,
  Target,
  UserRound,
} from "lucide-react";
import Link from "next/link";

import { ShipperCreateForm } from "@/components/crm-forms";
import { InternalShell } from "@/components/internal-shell";
import { getShipperViews, type ShipperView } from "@/lib/crm";

export const dynamic = "force-dynamic";

const METRIC_ACCENTS = [
  {
    border: "border-l-[3px] border-l-emerald-400",
    icon: "bg-emerald-50 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-200",
  },
  {
    border: "border-l-[3px] border-l-sky-400",
    icon: "bg-sky-50 text-sky-700 dark:bg-sky-400/15 dark:text-sky-200",
  },
  {
    border: "border-l-[3px] border-l-amber-400",
    icon: "bg-amber-50 text-amber-700 dark:bg-amber-400/15 dark:text-amber-200",
  },
  {
    border: "border-l-[3px] border-l-violet-400",
    icon: "bg-violet-50 text-violet-700 dark:bg-violet-400/15 dark:text-violet-200",
  },
] as const;

const panelClass =
  "overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/80 dark:shadow-black/25";

function hasContact(shipper: ShipperView) {
  return Boolean(shipper.primaryContact && shipper.primaryContact !== "No contact");
}

function hasEmail(shipper: ShipperView) {
  return Boolean(shipper.email && shipper.email !== "No email");
}

function hasPhone(shipper: ShipperView) {
  return Boolean(shipper.phone && shipper.phone !== "No phone");
}

function hasIndustry(shipper: ShipperView) {
  return Boolean(shipper.industry && shipper.industry !== "Industry needed");
}

function getAccountPriority({
  noContact,
  noLanes,
  activeCount,
}: {
  noContact: number;
  noLanes: number;
  activeCount: number;
}) {
  if (noContact > 0) {
    return {
      icon: UserRound,
      label: "Complete account contacts",
      detail: `${noContact} shipper${noContact === 1 ? "" : "s"} need a primary contact before sales follow-up, quote recaps, and customer updates are reliable.`,
      tone:
        "border-amber-100 bg-amber-50 text-amber-900 dark:border-amber-500/45 dark:bg-amber-950/30 dark:text-amber-100",
    };
  }

  if (noLanes > 0) {
    return {
      icon: MapPinned,
      label: "Add lane intelligence",
      detail: `${noLanes} shipper${noLanes === 1 ? "" : "s"} need known lanes so pricing, quote templates, and follow-up agents have useful context.`,
      tone:
        "border-sky-100 bg-sky-50 text-sky-900 dark:border-sky-500/45 dark:bg-sky-950/30 dark:text-sky-100",
    };
  }

  if (activeCount > 0) {
    return {
      icon: CheckCircle2,
      label: "Account files are usable",
      detail: "Active shipper files have enough contact and lane context to support CRM, quoting, and load workflows.",
      tone:
        "border-emerald-100 bg-emerald-50 text-emerald-900 dark:border-emerald-500/45 dark:bg-emerald-950/30 dark:text-emerald-100",
    };
  }

  return {
    icon: Target,
    label: "Build the customer base",
    detail: "Add shipper prospects, contacts, lanes, and notes so the CRM starts feeding quotes and follow-up work.",
    tone:
      "border-slate-100 bg-slate-50 text-slate-800 dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-100",
  };
}

export default async function ShippersPage() {
  const shipperViews = await getShipperViews();
  const activeCount = shipperViews.filter((s) => s.status === "Active").length;
  const totalLanes = shipperViews.reduce(
    (total, s) => total + s.lanes.length,
    0,
  );
  const withContact = shipperViews.filter(
    (s) => hasContact(s),
  ).length;
  const noContact = shipperViews.length - withContact;
  const noLanes = shipperViews.filter((shipper) => !shipper.lanes.length).length;
  const accountPriority = getAccountPriority({ noContact, noLanes, activeCount });
  const PriorityIcon = accountPriority.icon;

  const metrics = [
    { icon: Building2, label: "Accounts", value: shipperViews.length.toString(), helper: "Prospects and customers" },
    { icon: CheckCircle2, label: "Active", value: activeCount.toString(), helper: "Ready for load work" },
    { icon: MapPinned, label: "Known lanes", value: totalLanes.toString(), helper: "Pricing context" },
    { icon: UserRound, label: "Contact ready", value: withContact.toString(), helper: `${noContact} missing` },
  ];

  return (
    <InternalShell
      active="Shippers"
      eyebrow="Sales & CRM"
      title="Shippers"
      description="Company files for every shipper prospect and customer — contacts, lanes, and load history in one place."
      action={{ label: "Savings audit form", href: "/#audit" }}
    >
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((item, index) => (
          <MetricCard
            key={item.label}
            icon={item.icon}
            label={item.label}
            value={item.value}
            helper={item.helper}
            accent={METRIC_ACCENTS[index]}
          />
        ))}
      </section>

      <section className="grid items-start gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(400px,0.85fr)]">
        <article className={`rounded-lg border p-5 shadow-sm ${accountPriority.tone}`}>
          <div className="flex gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-white/70 dark:bg-slate-950/35 dark:ring-1 dark:ring-white/10">
              <PriorityIcon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] opacity-75">
                Account priority
              </p>
              <h2 className="mt-2 text-2xl font-black tracking-tight">{accountPriority.label}</h2>
              <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 opacity-85">
                {accountPriority.detail}
              </p>
              <div className="mt-5 grid gap-2 sm:grid-cols-3">
                <AccountStep label="Contacts" value={`${withContact}/${shipperViews.length || 0} ready`} />
                <AccountStep label="Lanes" value={`${totalLanes} known`} />
                <AccountStep label="Gaps" value={`${noContact + noLanes} open`} />
              </div>
            </div>
          </div>
        </article>

        <details className={`group self-start ${panelClass}`}>
          <summary className="flex cursor-pointer list-none items-center justify-between border-b border-slate-100 bg-slate-50 px-5 py-4 hover:bg-slate-100/60 dark:border-slate-800 dark:bg-slate-950/40 dark:hover:bg-slate-900">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-emerald-50 dark:bg-emerald-400/15">
                <Plus className="h-4 w-4 text-emerald-700" />
              </div>
              <div>
                <p className="text-sm font-black text-slate-900">
                  Add shipper
                </p>
                <p className="mt-0.5 text-xs font-semibold text-slate-500">
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
          <div className="grid gap-2 border-b border-slate-100 p-4 dark:border-slate-800 sm:grid-cols-3">
            <CaptureHint label="Company" value="Account and industry" />
            <CaptureHint label="Contact" value="Decision maker info" />
            <CaptureHint label="Lanes" value="Pricing context" />
          </div>
          <div className="border-t border-slate-200 p-5 dark:border-slate-800">
            <ShipperCreateForm />
          </div>
        </details>
      </section>

      <section className={panelClass}>
        <div className="flex flex-col gap-2 border-b border-slate-100 bg-slate-50 px-5 py-3 dark:border-slate-800 dark:bg-slate-950/40 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-black text-slate-800">Customer account desk</p>
            <p className="mt-0.5 text-xs font-semibold text-slate-500">
              Scan account readiness, primary contact, lanes, and next record to open.
            </p>
          </div>
          <span className="w-fit rounded-full bg-slate-200 px-3 py-1 text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
            {shipperViews.length} {shipperViews.length === 1 ? "shipper" : "shippers"}
          </span>
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
          <div className="grid gap-3 p-4">
            {shipperViews.map((shipper) => (
              <ShipperAccountCard key={shipper.id} shipper={shipper} />
            ))}
          </div>
        )}
      </section>
    </InternalShell>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  helper,
  accent,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string;
  helper: string;
  accent: (typeof METRIC_ACCENTS)[number];
}) {
  return (
    <article className={`overflow-hidden rounded-lg border border-slate-100 bg-white shadow-md shadow-slate-950/5 dark:border-slate-800 dark:bg-slate-900/80 dark:shadow-black/25 ${accent.border}`}>
      <div className="p-5">
        <div className={`flex h-9 w-9 items-center justify-center rounded-md ${accent.icon}`}>
          <Icon className="h-4 w-4" />
        </div>
        <p className="mt-4 text-sm font-medium text-slate-600">{label}</p>
        <p className="mt-1 text-3xl font-bold tracking-tight text-slate-950">
          {value}
        </p>
        <p className="mt-2 text-xs font-semibold text-slate-400">{helper}</p>
      </div>
    </article>
  );
}

function AccountStep({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-white/70 px-3 py-2 dark:bg-slate-950/35 dark:ring-1 dark:ring-white/10">
      <p className="text-[10px] font-black uppercase tracking-[0.12em] opacity-60">
        {label}
      </p>
      <p className="mt-1 text-sm font-black">{value}</p>
    </div>
  );
}

function CaptureHint({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-slate-100 bg-white px-3 py-2 dark:border-slate-800 dark:bg-slate-950/55">
      <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-xs font-semibold leading-5 text-slate-700">{value}</p>
    </div>
  );
}

function ShipperAccountCard({ shipper }: { shipper: ShipperView }) {
  const contactReady = hasContact(shipper);
  const emailReady = hasEmail(shipper);
  const phoneReady = hasPhone(shipper);
  const laneReady = shipper.lanes.length > 0;
  const industryReady = hasIndustry(shipper);

  return (
    <Link
      href={`/shippers/${shipper.id}`}
      className="grid gap-4 rounded-lg border border-slate-100 bg-white p-4 transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md dark:border-slate-800 dark:bg-slate-950/45 dark:hover:border-emerald-700 dark:hover:bg-slate-900 dark:hover:shadow-black/25 lg:grid-cols-[1.1fr_0.95fr_1fr_auto] lg:items-start"
    >
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-black text-slate-950">{shipper.company}</p>
          <StatusBadge status={shipper.status} />
        </div>
        <p className="mt-1 text-xs font-semibold text-slate-500">
          {industryReady ? shipper.industry : "Industry needed"}
        </p>
        {shipper.notes ? (
          <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-500">
            {shipper.notes}
          </p>
        ) : null}
      </div>

      <div className="grid gap-2 text-sm">
        <ContactInfo icon={UserRound} value={contactReady ? shipper.primaryContact : "No contact"} ready={contactReady} />
        <ContactInfo icon={Mail} value={emailReady ? shipper.email : "No email"} ready={emailReady} />
        <ContactInfo icon={Phone} value={phoneReady ? shipper.phone : "No phone"} ready={phoneReady} />
      </div>

      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">
          Lanes
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {laneReady ? (
            shipper.lanes.slice(0, 3).map((lane) => (
              <span
                key={lane}
                className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300"
              >
                {lane}
              </span>
            ))
          ) : (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700">
              <MapPinned className="h-3.5 w-3.5" />
              Lane details needed
            </span>
          )}
          {shipper.lanes.length > 3 ? (
            <span className="text-xs font-semibold text-slate-400">
              +{shipper.lanes.length - 3}
            </span>
          ) : null}
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 lg:justify-end">
        <ReadinessBadge contactReady={contactReady} laneReady={laneReady} />
        <span className="inline-flex items-center gap-1 text-xs font-black text-emerald-700">
          View <ArrowRight className="h-3.5 w-3.5" />
        </span>
      </div>
    </Link>
  );
}

function StatusBadge({ status }: { status: string }) {
  const className =
    status === "Active"
      ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-200"
      : status === "Customer"
        ? "bg-sky-50 text-sky-700 dark:bg-sky-400/15 dark:text-sky-200"
        : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300";

  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${className}`}>
      {status}
    </span>
  );
}

function ContactInfo({
  icon: Icon,
  value,
  ready,
}: {
  icon: ComponentType<{ className?: string }>;
  value: string;
  ready: boolean;
}) {
  return (
    <div className="flex min-w-0 items-center gap-2 text-slate-600">
      <Icon className="h-3.5 w-3.5 flex-none text-slate-400" />
      <span className={`truncate text-sm ${ready ? "text-slate-700 dark:text-slate-200" : "text-slate-400"}`}>
        {value}
      </span>
    </div>
  );
}

function ReadinessBadge({
  contactReady,
  laneReady,
}: {
  contactReady: boolean;
  laneReady: boolean;
}) {
  const ready = contactReady && laneReady;

  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-black ${
        ready
          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-200"
          : "bg-amber-50 text-amber-700 dark:bg-amber-400/15 dark:text-amber-200"
      }`}
    >
      {ready ? "Ready" : "Needs setup"}
    </span>
  );
}
