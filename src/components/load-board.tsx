"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowUpDown,
  ClipboardList,
  DollarSign,
  ExternalLink,
  FileCheck2,
  Package,
  Plus,
  RefreshCcw,
  Search,
  Send,
  Truck,
} from "lucide-react";

import { LoadCreateForm } from "@/components/crm-forms";
import type { LoadView } from "@/lib/crm";
import { cn, toCurrency } from "@/lib/utils";

type LoadBoardProps = {
  loads: LoadView[];
};

type BoardFilter =
  | "all"
  | "needs-carrier"
  | "posted"
  | "customer-update"
  | "pod"
  | "ready-invoice"
  | "exceptions";

type SortKey = "pickup" | "margin" | "shipper" | "status";

type NextLoadAction = {
  label: string;
  detail: string;
  cta: string;
  href: string;
  className: string;
  textClass: string;
};

export function LoadBoard({ loads }: LoadBoardProps) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<BoardFilter>("all");
  const [equipment, setEquipment] = useState("all");
  const [sortKey, setSortKey] = useState<SortKey>("pickup");

  const equipmentOptions = useMemo(
    () =>
      Array.from(new Set(loads.map((load) => load.equipment))).sort((a, b) =>
        a.localeCompare(b),
      ),
    [loads],
  );
  const boardRows = useMemo(
    () =>
      loads
        .filter((load) => matchesSearch(load, search))
        .filter((load) => matchesFilter(load, filter))
        .filter((load) => equipment === "all" || load.equipment === equipment)
        .sort((a, b) => sortLoads(a, b, sortKey)),
    [equipment, filter, loads, search, sortKey],
  );
  const boardMetrics = getBoardMetrics(loads);

  return (
    <>
      <section className="grid gap-3 md:grid-cols-3 xl:grid-cols-7">
        {boardMetrics.map((metric) => {
          const active = filter === metric.filter;
          return (
            <button
              key={metric.label}
              type="button"
              onClick={() => setFilter(metric.filter)}
              className={cn(
                "rounded-lg border p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md",
                active
                  ? "border-slate-950 bg-slate-950 shadow-md"
                  : "border-slate-200 bg-white hover:border-slate-300",
              )}
            >
              <div className="flex items-center justify-between gap-3">
                <p
                  className={cn(
                    "text-xs font-bold uppercase tracking-[0.08em]",
                    active ? "text-slate-400" : "text-slate-500",
                  )}
                >
                  {metric.label}
                </p>
                <metric.icon
                  className={cn(
                    "h-4 w-4",
                    active ? "text-slate-400" : metric.iconClass,
                  )}
                />
              </div>
              <p
                className={cn(
                  "mt-2 text-2xl font-bold",
                  active ? "text-white" : "text-slate-900",
                )}
              >
                {metric.value}
              </p>
              <p
                className={cn(
                  "mt-1 text-xs font-semibold",
                  active ? "text-slate-400" : "text-slate-400",
                )}
              >
                Click to filter
              </p>
            </button>
          );
        })}
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="grid gap-3 md:grid-cols-[minmax(240px,1fr)_190px_170px] xl:min-w-[760px]">
            <label className="relative block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search load, shipper, carrier, lane, ref"
                className="h-11 w-full rounded-md border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm font-medium text-slate-950 outline-none focus:border-emerald-400 focus:bg-white"
              />
            </label>
            <label className="flex h-11 items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3">
              <Package className="h-4 w-4 text-slate-400" />
              <select
                value={equipment}
                onChange={(event) => setEquipment(event.target.value)}
                className="w-full bg-transparent text-sm font-semibold text-slate-800 outline-none"
              >
                <option value="all">All equipment</option>
                {equipmentOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex h-11 items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3">
              <ArrowUpDown className="h-4 w-4 text-slate-400" />
              <select
                value={sortKey}
                onChange={(event) => setSortKey(event.target.value as SortKey)}
                className="w-full bg-transparent text-sm font-semibold text-slate-800 outline-none"
              >
                <option value="pickup">Sort: Pickup date</option>
                <option value="margin">Sort: Margin</option>
                <option value="shipper">Sort: Shipper</option>
                <option value="status">Sort: Status</option>
              </select>
            </label>
          </div>

          <details className="rounded-md border border-slate-200 bg-slate-50">
            <summary className="flex cursor-pointer list-none items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-slate-800">
              <Plus className="h-4 w-4" />
              Create load
            </summary>
            <div className="border-t border-slate-200 bg-white p-4 xl:w-[620px]">
              <LoadCreateForm />
            </div>
          </details>
        </div>
      </section>

      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-md shadow-slate-950/5">
        <div className="flex items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3">
          <div>
            <p className="text-sm font-bold text-slate-900">
              {boardRows.length} {boardRows.length === 1 ? "load" : "loads"}
              {filter !== "all" && (
                <span className="ml-2 text-slate-500 font-normal">
                  · filtered
                </span>
              )}
            </p>
            <p className="mt-0.5 text-xs text-slate-500">
              Scan coverage, tracking, documents, billing, and the next action
              without opening every load.
            </p>
          </div>
          <div className="hidden text-right md:block">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
              Visible margin
            </p>
            <p className="text-sm font-bold text-emerald-700">
              {toCurrency(boardRows.reduce((sum, load) => sum + load.margin, 0))}
            </p>
          </div>
        </div>

        <div className="hidden overflow-x-auto xl:block">
          <table className="min-w-[1300px] text-left text-sm">
            <thead className="border-b border-slate-100 bg-white text-xs font-semibold text-slate-400">
              <tr>
                <Th>Load</Th>
                <Th>Status</Th>
                <Th>Lane / dates</Th>
                <Th>Freight</Th>
                <Th>Coverage</Th>
                <Th>Rates</Th>
                <Th>Market</Th>
                <Th>Cust. update</Th>
                <Th>Docs</Th>
                <Th>Next action</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {boardRows.map((load) => (
                <LoadBoardTableRow key={load.id} load={load} />
              ))}
            </tbody>
          </table>
        </div>

        <div className="grid gap-3 p-3 xl:hidden">
          {boardRows.map((load) => (
            <LoadBoardMobileRow key={load.id} load={load} />
          ))}
        </div>

        {!boardRows.length ? (
          <div className="border-t border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
            <ClipboardList className="mx-auto h-8 w-8 text-slate-300" />
            <p className="mt-3 font-semibold text-slate-700">
              No loads match this board view
            </p>
            <p className="mt-1">
              Clear filters or create the next load from the toolbar above.
            </p>
          </div>
        ) : null}
      </section>

      {boardRows.length > 0 && boardRows.length < 4 ? (
        <div className="flex justify-end">
          <Link href="/tracking" className="dao-secondary-action shrink-0 text-xs">
            Open Tracking <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </div>
      ) : null}
    </>
  );
}

function LoadBoardTableRow({ load }: { load: LoadView }) {
  const riskLevel = getLoadRiskLevel(load);
  const marketplaceStatus = getMarketplaceStatus(load);
  const nextAction = getNextLoadAction(load);

  return (
    <tr className={cn("align-top hover:bg-emerald-50/40", riskLevel.rowClass)}>
      {/* Load */}
      <Td>
        <div className="min-w-[160px]">
          <Link
            href={`/loads/${load.id}`}
            className="font-semibold text-slate-950 hover:text-emerald-700"
          >
            {load.shipper}
          </Link>
          {load.customerReference && (
            <p className="mt-1 text-xs font-medium text-slate-500">
              Ref {load.customerReference}
            </p>
          )}
          <p className="mt-2 w-fit rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-600">
            {load.loadNumber}
          </p>
          <p className="mt-2 text-xs font-medium text-slate-500">
            Manager: <span className="font-semibold text-slate-700">{load.managingUserName}</span>
          </p>
          <p className="mt-0.5 text-xs font-medium text-slate-500">
            Client owner: <span className="font-semibold text-slate-700">{load.customerOwnerName}</span>
          </p>
        </div>
      </Td>

      {/* Status */}
      <Td>
        <StatusPill label={load.status} />
      </Td>

      {/* Lane / dates */}
      <Td>
        <div className="min-w-[240px]">
          <p className="font-semibold text-slate-900">{load.lane}</p>
          <p className="mt-2 text-xs font-medium text-slate-500">
            PU {load.pickup}
            {load.pickupWindow ? ` · ${load.pickupWindow}` : ""}
          </p>
          <p className="mt-0.5 text-xs font-medium text-slate-500">
            DEL {load.delivery}
            {load.deliveryWindow ? ` · ${load.deliveryWindow}` : ""}
          </p>
        </div>
      </Td>

      {/* Freight */}
      <Td>
        <div className="min-w-[140px] text-xs text-slate-600">
          <p className="font-semibold text-slate-900">{load.equipment}</p>
          {load.commodity && <p className="mt-1">{load.commodity}</p>}
          {load.weight && <p className="mt-0.5">{load.weight}</p>}
          {load.hazmat === "Yes" && (
            <p className="mt-1 font-semibold text-amber-700">Hazmat</p>
          )}
        </div>
      </Td>

      {/* Coverage */}
      <Td>
        <div className="min-w-[155px]">
          <p
            className={cn(
              "w-fit rounded-full px-2 py-0.5 text-xs font-bold",
              getCoverageClass(load),
            )}
          >
            {getCoverageLabel(load)}
          </p>
          {load.carrier !== "Carrier needed" && (
            <p className="mt-2 font-semibold text-slate-900">{load.carrier}</p>
          )}
          <p className="mt-1 text-xs text-slate-500">
            {load.carrierCandidates.length} candidates ·{" "}
            {load.carrierQuotes.length} offers
          </p>
        </div>
      </Td>

      {/* Rates */}
      <Td>
        <div className="min-w-[130px] text-xs text-slate-500">
          <p>Cust {toCurrency(load.customerRate)}</p>
          <p className="mt-1">
            Carrier{" "}
            {load.carrierRate ? toCurrency(load.carrierRate) : (
              <span className="text-red-600 font-semibold">needed</span>
            )}
          </p>
          <p
            className={cn(
              "mt-2 text-sm font-bold",
              load.marginPercent < 12 ? "text-red-700" : "text-emerald-700",
            )}
          >
            {toCurrency(load.margin)} / {load.marginPercent}%
          </p>
        </div>
      </Td>

      {/* Market (board posting) */}
      <Td>
        <div className="min-w-[100px]">
          <p
            className={cn(
              "w-fit rounded-full px-2 py-0.5 text-xs font-bold",
              marketplaceStatus.className,
            )}
          >
            {marketplaceStatus.label}
          </p>
          {marketplaceStatus.label !== "Not posted" && (
            <p className="mt-1.5 text-xs text-slate-500">
              {marketplaceStatus.detail}
            </p>
          )}
        </div>
      </Td>

      {/* Customer update */}
      <Td>
        <div className="min-w-[120px]">
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-xs font-bold",
              load.customerUpdateStatus === "Needed"
                ? "bg-amber-50 text-amber-700"
                : "bg-slate-100 text-slate-600",
            )}
          >
            {load.customerUpdateStatus ?? "Not needed"}
          </span>
          {load.lastCustomerUpdateAt && (
            <p className="mt-2 text-xs text-slate-500">
              {load.lastCustomerUpdateAt}
            </p>
          )}
        </div>
      </Td>

      {/* Docs */}
      <Td>
        <div className="min-w-[120px] grid gap-1.5">
          <DocStatus
            label="Rate conf"
            done={load.rateConfirmationStatus === "Signed"}
            pending={
              load.rateConfirmationStatus !== "Not Started" &&
              load.rateConfirmationStatus !== "Signed"
            }
          />
          <DocStatus label="POD" done={load.hasPod} />
          <DocStatus
            label="Invoice"
            done={
              load.invoice?.status === "PAID" ||
              load.invoice?.status === "PARTIAL"
            }
            pending={load.invoice?.status === "SENT"}
          />
          {load.billingReadiness && load.billingReadiness !== "On track" && (
            <p className="mt-0.5 text-xs font-semibold text-slate-700">
              {load.billingReadiness}
            </p>
          )}
        </div>
      </Td>

      <Td>
        <QuickActions load={load} nextAction={nextAction} />
      </Td>
    </tr>
  );
}

function LoadBoardMobileRow({ load }: { load: LoadView }) {
  const riskLevel = getLoadRiskLevel(load);
  const marketplaceStatus = getMarketplaceStatus(load);
  const nextAction = getNextLoadAction(load);

  return (
    <article className="rounded-lg border border-slate-100 bg-slate-50 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/loads/${load.id}`}
              className="font-semibold text-slate-950 hover:text-emerald-700"
            >
              {load.shipper}
            </Link>
            <StatusPill label={load.status} />
          </div>
          <p className="mt-2 text-sm font-semibold text-slate-700">
            {load.lane}
          </p>
        </div>
        <Link
          href={`/loads/${load.id}`}
          className="inline-flex items-center justify-center gap-2 rounded-md bg-slate-950 px-3 py-2 text-sm font-semibold text-white"
        >
          Open
          <ExternalLink className="h-4 w-4" />
        </Link>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <MobileFact
          label="Pickup"
          value={`${load.pickup} | ${load.pickupWindow ?? "Window needed"}`}
        />
        <MobileFact
          label="Delivery"
          value={`${load.delivery} | ${load.deliveryWindow ?? "Window needed"}`}
        />
        <MobileFact
          label="Equipment"
          value={`${load.equipment} / ${load.weight ?? "Weight needed"}`}
        />
        <MobileFact label="Carrier" value={load.carrier} />
        <MobileFact label="Manager" value={load.managingUserName} />
        <MobileFact label="Client owner" value={load.customerOwnerName} />
        <MobileFact
          label="Margin"
          value={`${toCurrency(load.margin)} / ${load.marginPercent}%`}
        />
        <MobileFact label="Billing" value={load.billingReadiness} />
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <span
          className={cn(
            "rounded-full px-3 py-1 text-xs font-bold",
            riskLevel.badgeClass,
          )}
        >
          {riskLevel.label}
        </span>
        <span
          className={cn(
            "rounded-full px-3 py-1 text-xs font-bold",
            marketplaceStatus.className,
          )}
        >
          {marketplaceStatus.label}
        </span>
        <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-700">
          {load.customerUpdateStatus ?? "Not needed"}
        </span>
      </div>
      <div className="mt-4 rounded-md border border-slate-200 bg-white p-3">
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
          Next action
        </p>
        <p className={cn("mt-1 text-sm font-bold", nextAction.textClass)}>
          {nextAction.label}
        </p>
        <p className="mt-1 text-xs leading-5 text-slate-500">
          {nextAction.detail}
        </p>
      </div>
    </article>
  );
}

function QuickActions({
  load,
  nextAction,
}: {
  load: LoadView;
  nextAction: NextLoadAction;
}) {
  return (
    <div className="grid min-w-[150px] gap-2">
      <div className={cn("rounded-md border px-3 py-2", nextAction.className)}>
        <p className="text-xs font-black uppercase tracking-[0.12em] opacity-70">
          Next
        </p>
        <p className="mt-1 text-xs font-bold">{nextAction.label}</p>
      </div>
      <Link
        href={nextAction.href}
        className="inline-flex items-center justify-center gap-2 rounded-md bg-slate-950 px-3 py-2 text-xs font-bold text-white hover:bg-slate-800"
      >
        {nextAction.cta}
        <ExternalLink className="h-3.5 w-3.5" />
      </Link>
      {nextAction.cta !== "Open" && (
        <Link
          href={`/loads/${load.id}`}
          className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:border-emerald-200 hover:text-emerald-700"
        >
          Open load
        </Link>
      )}
    </div>
  );
}

function DocStatus({
  label,
  done,
  pending,
}: {
  label: string;
  done: boolean;
  pending?: boolean;
}) {
  const state = done ? "done" : pending ? "pending" : "none";
  const suffix = state === "done" ? "✓" : state === "pending" ? "sent" : "needed";
  return (
    <p
      className={cn(
        "text-xs font-medium",
        state === "done"
          ? "text-emerald-700"
          : state === "pending"
            ? "text-amber-700"
            : "text-slate-400",
      )}
    >
      {label}: {suffix}
    </p>
  );
}

function StatusPill({ label }: { label: string }) {
  return (
    <span
      className={cn(
        "rounded-full px-2.5 py-0.5 text-xs font-bold",
        getStatusClass(label),
      )}
    >
      {label}
    </span>
  );
}

function Th({ children }: { children: ReactNode }) {
  return <th className="px-4 py-3 tracking-wide">{children}</th>;
}

function Td({ children }: { children: ReactNode }) {
  return <td className="px-4 py-4">{children}</td>;
}

function MobileFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-white p-3">
      <p className="text-xs font-bold uppercase text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function getBoardMetrics(loads: LoadView[]) {
  const needsCarrier = loads.filter(
    (load) => load.carrier === "Carrier needed",
  );
  const posted = loads.filter((load) =>
    load.integrationLogs.some(
      (log) => log.action === "Load Post" && log.status === "Success",
    ),
  );
  const needsPod = loads.filter(
    (load) => load.billingReadiness === "Needs POD",
  );
  const readyToInvoice = loads.filter(
    (load) => load.billingReadiness === "Ready to invoice",
  );
  const needsCustomerUpdate = loads.filter(
    (load) => load.customerUpdateStatus === "Needed",
  );
  const exceptions = loads.filter(
    (load) => getLoadRiskLevel(load).level !== 0,
  );

  return [
    {
      label: "All loads",
      value: loads.length.toString(),
      icon: ClipboardList,
      iconClass: "text-slate-500",
      filter: "all" as const,
    },
    {
      label: "Needs carrier",
      value: needsCarrier.length.toString(),
      icon: Truck,
      iconClass: "text-red-500",
      filter: "needs-carrier" as const,
    },
    {
      label: "Posted",
      value: posted.length.toString(),
      icon: Send,
      iconClass: "text-emerald-500",
      filter: "posted" as const,
    },
    {
      label: "Cust update",
      value: needsCustomerUpdate.length.toString(),
      icon: RefreshCcw,
      iconClass: "text-amber-500",
      filter: "customer-update" as const,
    },
    {
      label: "Needs POD",
      value: needsPod.length.toString(),
      icon: FileCheck2,
      iconClass: "text-amber-500",
      filter: "pod" as const,
    },
    {
      label: "Ready invoice",
      value: readyToInvoice.length.toString(),
      icon: DollarSign,
      iconClass: "text-emerald-500",
      filter: "ready-invoice" as const,
    },
    {
      label: "Exceptions",
      value: exceptions.length.toString(),
      icon: AlertTriangle,
      iconClass: "text-red-500",
      filter: "exceptions" as const,
    },
  ];
}

function getNextLoadAction(load: LoadView): NextLoadAction {
  if (load.carrier === "Carrier needed") {
    return {
      label: "Source carrier",
      detail: "Find capacity, vet the carrier, and secure coverage.",
      cta: "Cover load",
      href: `/loads/${load.id}?tab=coverage`,
      className: "border-red-100 bg-red-50 text-red-800",
      textClass: "text-red-700",
    };
  }
  if (load.customerUpdateStatus === "Needed") {
    return {
      label: "Send customer update",
      detail: "Log a shipper update before they ask for status.",
      cta: "Update",
      href: `/loads/${load.id}?tab=tracking`,
      className: "border-amber-100 bg-amber-50 text-amber-800",
      textClass: "text-amber-700",
    };
  }
  if (load.rateConfirmationStatus !== "Signed") {
    return {
      label: "Finish rate confirmation",
      detail: "Send or collect the signed carrier rate confirmation.",
      cta: "Rate con",
      href: `/loads/${load.id}?tab=coverage`,
      className: "border-amber-100 bg-amber-50 text-amber-800",
      textClass: "text-amber-700",
    };
  }
  if (load.billingReadiness === "Needs POD") {
    return {
      label: "Collect POD",
      detail: "Upload or request proof of delivery before billing.",
      cta: "Docs",
      href: `/loads/${load.id}?tab=documents`,
      className: "border-amber-100 bg-amber-50 text-amber-800",
      textClass: "text-amber-700",
    };
  }
  if (load.billingReadiness === "Ready to invoice") {
    return {
      label: "Invoice customer",
      detail: "Move the load into customer billing.",
      cta: "Invoice",
      href: `/loads/${load.id}?tab=billing`,
      className: "border-emerald-100 bg-emerald-50 text-emerald-800",
      textClass: "text-emerald-700",
    };
  }

  return {
    label: "Monitor load",
    detail: "Keep tracking, customer updates, and documents current.",
    cta: "Open",
    href: `/loads/${load.id}`,
    className: "border-slate-100 bg-slate-50 text-slate-700",
    textClass: "text-slate-700",
  };
}

function matchesSearch(load: LoadView, search: string) {
  const normalized = search.trim().toLowerCase();
  if (!normalized) return true;
  return [
    load.id,
    load.shipper,
    load.carrier,
    load.lane,
    load.equipment,
    load.commodity,
    load.customerReference,
    load.status,
  ]
    .filter(Boolean)
    .some((value) => String(value).toLowerCase().includes(normalized));
}

function matchesFilter(load: LoadView, filter: BoardFilter) {
  if (filter === "all") return true;
  if (filter === "needs-carrier") return load.carrier === "Carrier needed";
  if (filter === "posted")
    return getMarketplaceStatus(load).label !== "Not posted";
  if (filter === "customer-update")
    return load.customerUpdateStatus === "Needed";
  if (filter === "pod") return load.billingReadiness === "Needs POD";
  if (filter === "ready-invoice")
    return load.billingReadiness === "Ready to invoice";
  return getLoadRiskLevel(load).level !== 0;
}

function sortLoads(a: LoadView, b: LoadView, sortKey: SortKey) {
  if (sortKey === "margin") return b.margin - a.margin;
  if (sortKey === "shipper") return a.shipper.localeCompare(b.shipper);
  if (sortKey === "status") return a.status.localeCompare(b.status);
  return getDateSortValue(a.pickup) - getDateSortValue(b.pickup);
}

function getDateSortValue(value: string) {
  if (!value || value === "Not set") return Number.MAX_SAFE_INTEGER;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? Number.MAX_SAFE_INTEGER : parsed;
}

function getCoverageLabel(load: LoadView) {
  if (load.carrier !== "Carrier needed") return "Covered";
  if (load.carrierQuotes.some((q) => q.status === "Received"))
    return "Offer received";
  if (load.carrierCandidates.length) return "Working";
  return "Needs sourcing";
}

function getCoverageClass(load: LoadView) {
  if (load.carrier !== "Carrier needed")
    return "bg-emerald-50 text-emerald-700";
  if (load.carrierQuotes.some((q) => q.status === "Received"))
    return "bg-sky-50 text-sky-700";
  if (load.carrierCandidates.length)
    return "bg-amber-50 text-amber-700";
  return "bg-red-50 text-red-700";
}

function getMarketplaceStatus(load: LoadView) {
  const latestPost = load.integrationLogs.find(
    (log) => log.action === "Load Post",
  );
  if (!latestPost) {
    return {
      label: "Not posted",
      detail: "Internal only",
      className: "bg-slate-100 text-slate-600",
    };
  }
  if (latestPost.status === "Success") {
    return {
      label: "Posted",
      detail: `${latestPost.provider} ${latestPost.created}`,
      className: "bg-emerald-50 text-emerald-700",
    };
  }
  if (latestPost.status === "Failed") {
    return {
      label: "Post failed",
      detail: latestPost.provider,
      className: "bg-red-50 text-red-700",
    };
  }
  return {
    label: latestPost.status,
    detail: latestPost.provider,
    className: "bg-amber-50 text-amber-700",
  };
}

function getLoadRiskLevel(load: LoadView) {
  if (load.carrier === "Carrier needed") {
    return {
      level: 3,
      label: "No carrier",
      rowClass: "bg-red-50/30",
      iconClass: "text-red-500",
      badgeClass: "bg-red-50 text-red-700",
    };
  }
  if (load.customerUpdateStatus === "Needed") {
    return {
      level: 2,
      label: "Update due",
      rowClass: "bg-amber-50/40",
      iconClass: "text-amber-500",
      badgeClass: "bg-amber-50 text-amber-700",
    };
  }
  if (load.rateConfirmationStatus !== "Signed") {
    return {
      level: 2,
      label: "Rate conf",
      rowClass: "bg-amber-50/30",
      iconClass: "text-amber-500",
      badgeClass: "bg-amber-50 text-amber-700",
    };
  }
  if (load.billingReadiness === "Needs POD") {
    return {
      level: 2,
      label: "POD needed",
      rowClass: "bg-amber-50/30",
      iconClass: "text-amber-500",
      badgeClass: "bg-amber-50 text-amber-700",
    };
  }
  if (load.marginPercent < 12) {
    return {
      level: 1,
      label: "Low margin",
      rowClass: "",
      iconClass: "text-slate-400",
      badgeClass: "bg-slate-100 text-slate-700",
    };
  }
  return {
    level: 0,
    label: "On track",
    rowClass: "",
    iconClass: "text-emerald-500",
    badgeClass: "bg-emerald-50 text-emerald-700",
  };
}

function getStatusClass(status: string) {
  if (["Delivered", "Pod Received", "Invoiced", "Paid"].includes(status)) {
    return "bg-emerald-50 text-emerald-700";
  }
  if (["Picked Up", "In Transit", "Booked"].includes(status)) {
    return "bg-sky-50 text-sky-700";
  }
  return "bg-amber-50 text-amber-700";
}
