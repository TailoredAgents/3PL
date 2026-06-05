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
  Filter,
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

const filterOptions: { id: BoardFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "needs-carrier", label: "Needs carrier" },
  { id: "posted", label: "Posted" },
  { id: "customer-update", label: "Customer update" },
  { id: "pod", label: "Needs POD" },
  { id: "ready-invoice", label: "Ready invoice" },
  { id: "exceptions", label: "Exceptions" },
];

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
        {boardMetrics.map((metric) => (
          <button
            key={metric.label}
            type="button"
            onClick={() => setFilter(metric.filter)}
            className={cn(
              "rounded-lg border bg-white p-4 text-left shadow-sm hover:-translate-y-0.5 hover:shadow-md",
              filter === metric.filter
                ? "border-slate-950 ring-2 ring-slate-950/10"
                : "border-slate-200",
            )}
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-bold uppercase text-slate-500">
                {metric.label}
              </p>
              <metric.icon className={cn("h-4 w-4", metric.iconClass)} />
            </div>
            <p className="mt-2 text-2xl font-semibold">{metric.value}</p>
          </button>
        ))}
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
                <option value="pickup">Pickup</option>
                <option value="margin">Margin</option>
                <option value="shipper">Shipper</option>
                <option value="status">Status</option>
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

        <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
          {filterOptions.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setFilter(option.id)}
              className={cn(
                "flex-none rounded-full border px-3 py-1.5 text-sm font-semibold",
                filter === option.id
                  ? "border-slate-950 bg-slate-950 text-white"
                  : "border-slate-200 bg-white text-slate-700 hover:border-emerald-200 hover:text-emerald-700",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </section>

      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-slate-500" />
            <p className="text-sm font-semibold text-slate-800">
              {boardRows.length} visible loads
            </p>
          </div>
          <p className="hidden text-sm text-slate-500 md:block">
            Margin total{" "}
            {toCurrency(boardRows.reduce((sum, load) => sum + load.margin, 0))}
          </p>
        </div>

        <div className="hidden overflow-x-auto xl:block">
          <table className="min-w-[1440px] text-left text-sm">
            <thead className="bg-white text-xs font-bold uppercase text-slate-500">
              <tr>
                <Th>Load</Th>
                <Th>Status</Th>
                <Th>Lane / dates</Th>
                <Th>Freight</Th>
                <Th>Coverage</Th>
                <Th>Rates</Th>
                <Th>Board</Th>
                <Th>Tracking</Th>
                <Th>Docs / billing</Th>
                <Th>Actions</Th>
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
          <div className="border-t border-dashed border-slate-200 bg-slate-50 p-6 text-sm font-medium text-slate-600">
            No loads match the current board filters.
          </div>
        ) : null}
      </section>
    </>
  );
}

function LoadBoardTableRow({ load }: { load: LoadView }) {
  const riskLevel = getLoadRiskLevel(load);
  const marketplaceStatus = getMarketplaceStatus(load);

  return (
    <tr className={cn("align-top hover:bg-emerald-50/40", riskLevel.rowClass)}>
      <Td>
        <div className="min-w-[170px]">
          <Link
            href={`/loads/${load.id}`}
            className="font-semibold text-slate-950 hover:text-emerald-700"
          >
            {load.shipper}
          </Link>
          <p className="mt-1 text-xs font-medium text-slate-500">
            Ref {load.customerReference ?? load.id.slice(0, 8)}
          </p>
          <p className="mt-2 rounded-full bg-slate-100 px-2 py-1 text-xs font-bold text-slate-600">
            {load.id.slice(0, 8)}
          </p>
        </div>
      </Td>
      <Td>
        <StatusPill label={load.status} />
        <div className="mt-2 flex items-center gap-1 text-xs font-semibold text-slate-500">
          <AlertTriangle className={cn("h-3.5 w-3.5", riskLevel.iconClass)} />
          {riskLevel.label}
        </div>
      </Td>
      <Td>
        <div className="min-w-[260px]">
          <p className="font-semibold text-slate-900">{load.lane}</p>
          <p className="mt-2 text-xs font-medium text-slate-600">
            Pickup: {load.pickup} | {load.pickupWindow ?? "Window needed"}
          </p>
          <p className="mt-1 text-xs font-medium text-slate-600">
            Delivery: {load.delivery} | {load.deliveryWindow ?? "Window needed"}
          </p>
        </div>
      </Td>
      <Td>
        <div className="min-w-[160px] text-xs font-medium text-slate-600">
          <p className="font-semibold text-slate-900">{load.equipment}</p>
          <p className="mt-1">{load.commodity ?? "Commodity needed"}</p>
          <p className="mt-1">{load.weight ?? "Weight needed"}</p>
          <p className="mt-1">
            {load.hazmat === "Yes" ? "Hazmat" : "Non-hazmat"} | Temp{" "}
            {load.temperatureRequirement ?? "None"}
          </p>
        </div>
      </Td>
      <Td>
        <div className="min-w-[170px]">
          <p className="font-semibold text-slate-900">{load.carrier}</p>
          <p className="mt-1 text-xs font-medium text-slate-600">
            Candidates {load.carrierCandidates.length} | Offers{" "}
            {load.carrierQuotes.length}
          </p>
          <p className="mt-2 w-fit rounded-full bg-slate-100 px-2 py-1 text-xs font-bold text-slate-700">
            {getCoverageLabel(load)}
          </p>
        </div>
      </Td>
      <Td>
        <div className="min-w-[145px] text-xs font-medium text-slate-600">
          <p>Customer {toCurrency(load.customerRate)}</p>
          <p className="mt-1">
            Carrier {load.carrierRate ? toCurrency(load.carrierRate) : "Needed"}
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
      <Td>
        <div className="min-w-[140px]">
          <p
            className={cn(
              "w-fit rounded-full px-2 py-1 text-xs font-bold",
              marketplaceStatus.className,
            )}
          >
            {marketplaceStatus.label}
          </p>
          <p className="mt-2 text-xs font-medium text-slate-600">
            {marketplaceStatus.detail}
          </p>
        </div>
      </Td>
      <Td>
        <div className="min-w-[180px] text-xs font-medium text-slate-600">
          <p className="font-semibold text-slate-900">
            {load.customerUpdateStatus ?? "Not needed"}
          </p>
          <p className="mt-1">{load.lastCustomerUpdateAt}</p>
          <p className="mt-2 leading-5">{load.risk}</p>
        </div>
      </Td>
      <Td>
        <div className="min-w-[170px] text-xs font-medium text-slate-600">
          <p>POD {load.hasPod ? "Received" : "Needed"}</p>
          <p className="mt-1">Rate conf {load.rateConfirmationStatus}</p>
          <p className="mt-1">Invoice {load.invoice?.status ?? "Not created"}</p>
          <p className="mt-2 font-bold text-slate-900">
            {load.billingReadiness}
          </p>
        </div>
      </Td>
      <Td>
        <QuickActions load={load} />
      </Td>
    </tr>
  );
}

function LoadBoardMobileRow({ load }: { load: LoadView }) {
  const riskLevel = getLoadRiskLevel(load);
  const marketplaceStatus = getMarketplaceStatus(load);

  return (
    <article className="rounded-md border border-slate-100 bg-slate-50 p-4">
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
    </article>
  );
}

function QuickActions({ load }: { load: LoadView }) {
  return (
    <div className="grid min-w-[150px] gap-2">
      <Link
        href={`/loads/${load.id}`}
        className="inline-flex items-center justify-center gap-2 rounded-md bg-slate-950 px-3 py-2 text-xs font-bold text-white hover:bg-slate-800"
      >
        Open
        <ExternalLink className="h-3.5 w-3.5" />
      </Link>
      <Link
        href={`/loads/${load.id}#coverage`}
        className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:border-emerald-200 hover:text-emerald-700"
      >
        <Truck className="h-3.5 w-3.5" />
        Cover
      </Link>
      <Link
        href={`/loads/${load.id}#marketplace`}
        className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:border-emerald-200 hover:text-emerald-700"
      >
        <Send className="h-3.5 w-3.5" />
        Post
      </Link>
    </div>
  );
}

function StatusPill({ label }: { label: string }) {
  return (
    <span
      className={cn(
        "rounded-full px-2.5 py-1 text-xs font-bold",
        getStatusClass(label),
      )}
    >
      {label}
    </span>
  );
}

function Th({ children }: { children: ReactNode }) {
  return <th className="px-4 py-3">{children}</th>;
}

function Td({ children }: { children: ReactNode }) {
  return <td className="px-4 py-4">{children}</td>;
}

function MobileFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-white p-3">
      <p className="text-xs font-bold uppercase text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function getBoardMetrics(loads: LoadView[]) {
  const needsCarrier = loads.filter((load) => load.carrier === "Carrier needed");
  const posted = loads.filter((load) =>
    load.integrationLogs.some(
      (log) => log.action === "Load Post" && log.status === "Success",
    ),
  );
  const needsPod = loads.filter((load) => load.billingReadiness === "Needs POD");
  const readyToInvoice = loads.filter(
    (load) => load.billingReadiness === "Ready to invoice",
  );
  const needsCustomerUpdate = loads.filter(
    (load) => load.customerUpdateStatus === "Needed",
  );
  const exceptions = loads.filter((load) => getLoadRiskLevel(load).level !== 0);

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
      iconClass: "text-red-600",
      filter: "needs-carrier" as const,
    },
    {
      label: "Posted",
      value: posted.length.toString(),
      icon: Send,
      iconClass: "text-emerald-600",
      filter: "posted" as const,
    },
    {
      label: "Cust update",
      value: needsCustomerUpdate.length.toString(),
      icon: RefreshCcw,
      iconClass: "text-amber-600",
      filter: "customer-update" as const,
    },
    {
      label: "Needs POD",
      value: needsPod.length.toString(),
      icon: FileCheck2,
      iconClass: "text-amber-600",
      filter: "pod" as const,
    },
    {
      label: "Ready invoice",
      value: readyToInvoice.length.toString(),
      icon: DollarSign,
      iconClass: "text-emerald-600",
      filter: "ready-invoice" as const,
    },
    {
      label: "Exceptions",
      value: exceptions.length.toString(),
      icon: AlertTriangle,
      iconClass: "text-red-600",
      filter: "exceptions" as const,
    },
  ];
}

function matchesSearch(load: LoadView, search: string) {
  const normalized = search.trim().toLowerCase();

  if (!normalized) {
    return true;
  }

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
  if (filter === "all") {
    return true;
  }

  if (filter === "needs-carrier") {
    return load.carrier === "Carrier needed";
  }

  if (filter === "posted") {
    return getMarketplaceStatus(load).label !== "Not posted";
  }

  if (filter === "customer-update") {
    return load.customerUpdateStatus === "Needed";
  }

  if (filter === "pod") {
    return load.billingReadiness === "Needs POD";
  }

  if (filter === "ready-invoice") {
    return load.billingReadiness === "Ready to invoice";
  }

  return getLoadRiskLevel(load).level !== 0;
}

function sortLoads(a: LoadView, b: LoadView, sortKey: SortKey) {
  if (sortKey === "margin") {
    return b.margin - a.margin;
  }

  if (sortKey === "shipper") {
    return a.shipper.localeCompare(b.shipper);
  }

  if (sortKey === "status") {
    return a.status.localeCompare(b.status);
  }

  return getDateSortValue(a.pickup) - getDateSortValue(b.pickup);
}

function getDateSortValue(value: string) {
  if (!value || value === "Not set") {
    return Number.MAX_SAFE_INTEGER;
  }

  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? Number.MAX_SAFE_INTEGER : parsed;
}

function getCoverageLabel(load: LoadView) {
  if (load.carrier !== "Carrier needed") {
    return "Covered";
  }

  if (load.carrierQuotes.some((quote) => quote.status === "Received")) {
    return "Offer received";
  }

  if (load.carrierCandidates.length) {
    return "Working coverage";
  }

  return "Needs sourcing";
}

function getMarketplaceStatus(load: LoadView) {
  const latestPost = load.integrationLogs.find(
    (log) => log.action === "Load Post",
  );

  if (!latestPost) {
    return {
      label: "Not posted",
      detail: "Internal only",
      className: "bg-slate-100 text-slate-700",
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
      iconClass: "text-red-600",
      badgeClass: "bg-red-50 text-red-700",
    };
  }

  if (load.customerUpdateStatus === "Needed") {
    return {
      level: 2,
      label: "Update due",
      rowClass: "bg-amber-50/40",
      iconClass: "text-amber-600",
      badgeClass: "bg-amber-50 text-amber-700",
    };
  }

  if (load.rateConfirmationStatus !== "Signed") {
    return {
      level: 2,
      label: "Rate conf",
      rowClass: "bg-amber-50/30",
      iconClass: "text-amber-600",
      badgeClass: "bg-amber-50 text-amber-700",
    };
  }

  if (load.billingReadiness === "Needs POD") {
    return {
      level: 2,
      label: "POD needed",
      rowClass: "bg-amber-50/30",
      iconClass: "text-amber-600",
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
    iconClass: "text-emerald-600",
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
