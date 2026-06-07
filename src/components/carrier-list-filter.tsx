"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Mail,
  MapPinned,
  Phone,
  Search,
  ShieldAlert,
  ShieldCheck,
  Truck,
} from "lucide-react";

import { cn } from "@/lib/utils";

type CarrierItem = {
  id: string;
  company: string;
  mcNumber: string;
  dotNumber: string;
  contact: string;
  phone: string;
  email: string;
  complianceStatus: string;
  preferredLanes: string[];
  notes: string;
  loadCount: number;
  deliveredLoads: number;
  avgMargin: number;
  authorityStatus?: string;
  insuranceStatus?: string;
  safetyRating?: string;
  fraudRiskLevel?: string;
  lastVettedAt?: string;
  callbackVerifiedAt?: string;
  blockedReason?: string;
  onTimePickupRate?: number | null;
  issuesCount?: number;
};

function complianceBorderClass(status: string) {
  if (status === "Approved") return "border-l-[3px] border-l-emerald-400";
  if (status === "Pending") return "border-l-[3px] border-l-amber-400";
  if (["Blocked", "Rejected"].includes(status)) return "border-l-[3px] border-l-red-400";
  return "border-l-[3px] border-l-slate-300";
}

function complianceBadgeClass(status: string) {
  if (status === "Approved") return "bg-emerald-50 text-emerald-700";
  if (status === "Pending") return "bg-amber-50 text-amber-700";
  if (["Blocked", "Rejected"].includes(status)) return "bg-red-50 text-red-700";
  return "bg-slate-100 text-slate-600";
}

function getReadiness(carrier: CarrierItem) {
  if (carrier.blockedReason || ["Blocked", "Rejected"].includes(carrier.complianceStatus)) {
    return {
      icon: ShieldAlert,
      label: "Do not tender",
      detail: carrier.blockedReason || "Compliance has not cleared this carrier.",
      className: "border-red-100 bg-red-50 text-red-800",
    };
  }

  if (carrier.complianceStatus === "Approved") {
    return {
      icon: ShieldCheck,
      label: "Tender ready",
      detail: `Approved carrier${carrier.lastVettedAt ? ` · vetted ${carrier.lastVettedAt}` : ""}`,
      className: "border-emerald-100 bg-emerald-50 text-emerald-800",
    };
  }

  return {
    icon: AlertTriangle,
    label: "Needs vetting",
    detail: "Finish authority, insurance, fraud, and callback checks before booking.",
    className: "border-amber-100 bg-amber-50 text-amber-800",
  };
}

function fieldValue(value: string | undefined, fallback: string) {
  return value && value.trim().length ? value : fallback;
}

export function CarrierListFilter({ carriers }: { carriers: CarrierItem[] }) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const statuses = useMemo(() => {
    const set = new Set(carriers.map((c) => c.complianceStatus));
    return ["All", ...Array.from(set).sort()];
  }, [carriers]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return carriers.filter((c) => {
      const matchesQuery =
        !q ||
        c.company.toLowerCase().includes(q) ||
        c.mcNumber.toLowerCase().includes(q) ||
        c.dotNumber.toLowerCase().includes(q) ||
        c.contact.toLowerCase().includes(q) ||
        c.preferredLanes.some((lane) => lane.toLowerCase().includes(q));
      const matchesStatus =
        statusFilter === "All" || c.complianceStatus === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [carriers, query, statusFilter]);

  return (
    <div className="grid gap-4">
      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-emerald-700">
              Carrier desk
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-600">
              Search capacity, confirm compliance, then open the carrier file before tendering.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row xl:min-w-[820px] xl:justify-end">
            <label className="relative block flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                placeholder="Search carrier, MC, DOT, contact, or lane"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="h-11 w-full rounded-md border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm font-medium text-slate-950 placeholder:text-slate-400 outline-none focus:border-emerald-400 focus:bg-white"
              />
            </label>
            <div className="flex flex-wrap gap-2">
              {statuses.map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setStatusFilter(status)}
                  className={cn(
                    "rounded-md px-3 py-2 text-xs font-black transition-colors",
                    statusFilter === status
                      ? "bg-slate-950 text-white"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200",
                  )}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
          {filtered.length} {filtered.length === 1 ? "carrier" : "carriers"}
          {statusFilter !== "All" ? ` · ${statusFilter}` : ""}
        </p>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-slate-100 bg-white py-12 text-center shadow-sm">
          <Truck className="mx-auto h-8 w-8 text-slate-300" />
          <p className="mt-3 text-sm font-semibold text-slate-600">No carriers match your search</p>
          <p className="mt-1 text-sm text-slate-400">Try a different name, MC number, DOT number, contact, or lane.</p>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {filtered.map((carrier) => {
            const readiness = getReadiness(carrier);
            const ReadinessIcon = readiness.icon;
            const hasEmail = carrier.email && carrier.email.length > 0 && carrier.email !== "No email";
            const hasPhone = carrier.phone && carrier.phone.length > 0 && carrier.phone !== "No phone";
            const hasLanes = carrier.preferredLanes.length > 0;
            const onTime = carrier.onTimePickupRate ?? null;

            return (
              <article
                key={carrier.id}
                className={cn(
                  "overflow-hidden rounded-lg border border-slate-100 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md",
                  complianceBorderClass(carrier.complianceStatus),
                )}
              >
                <div className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2.5">
                        <Truck className="h-4 w-4 flex-none text-slate-400" />
                        <Link
                          href={`/carriers/${carrier.id}`}
                          className="truncate font-black text-slate-950 hover:text-emerald-700"
                        >
                          {carrier.company}
                        </Link>
                      </div>
                      <p className="mt-1 text-xs font-semibold text-slate-500">
                        {carrier.mcNumber} · {carrier.dotNumber}
                      </p>
                    </div>
                    <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-black ${complianceBadgeClass(carrier.complianceStatus)}`}>
                      {carrier.complianceStatus}
                    </span>
                  </div>

                  <div className={`mt-4 rounded-lg border p-3 ${readiness.className}`}>
                    <div className="flex items-start gap-2">
                      <ReadinessIcon className="mt-0.5 h-4 w-4 shrink-0" />
                      <div>
                        <p className="text-sm font-black">{readiness.label}</p>
                        <p className="mt-1 text-xs leading-5 opacity-85">{readiness.detail}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-2">
                    <ScoreTile label="Loads" value={carrier.loadCount.toString()} />
                    <ScoreTile label="Delivered" value={carrier.deliveredLoads.toString()} />
                    <ScoreTile
                      label="Avg margin"
                      value={carrier.avgMargin > 0 ? `${carrier.avgMargin}%` : "-"}
                      valueClassName={
                        carrier.avgMargin > 15
                          ? "text-emerald-700"
                          : carrier.avgMargin > 10
                            ? "text-amber-700"
                            : "text-slate-900"
                      }
                    />
                  </div>

                  <div className="mt-4 grid gap-2 rounded-lg border border-slate-100 bg-slate-50 p-3 text-xs">
                    <ComplianceFact label="Authority" value={fieldValue(carrier.authorityStatus, "Check needed")} />
                    <ComplianceFact label="Insurance" value={fieldValue(carrier.insuranceStatus, "Check needed")} />
                    <ComplianceFact label="Safety" value={fieldValue(carrier.safetyRating, "Rating needed")} />
                    <ComplianceFact label="Fraud" value={fieldValue(carrier.fraudRiskLevel, "Check needed")} />
                    <ComplianceFact
                      label="Callback"
                      value={carrier.callbackVerifiedAt ? `Verified ${carrier.callbackVerifiedAt}` : "Verification needed"}
                    />
                    <ComplianceFact
                      label="On-time"
                      value={onTime === null ? "No history yet" : `${onTime}% pickup score`}
                    />
                  </div>

                  {(hasEmail || hasPhone) && (
                    <div className="mt-4 grid gap-1.5 text-sm text-slate-600">
                      {hasEmail && (
                        <div className="flex items-center gap-2">
                          <Mail className="h-3.5 w-3.5 flex-none text-slate-400" />
                          <span className="truncate">{carrier.email}</span>
                        </div>
                      )}
                      {hasPhone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-3.5 w-3.5 flex-none text-slate-400" />
                          <span>{carrier.phone}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {hasLanes && (
                    <div className="mt-4 flex flex-wrap items-center gap-1.5">
                      <MapPinned className="h-3.5 w-3.5 flex-none text-slate-400" />
                      {carrier.preferredLanes.slice(0, 3).map((lane) => (
                        <span
                          key={lane}
                          className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-600"
                        >
                          {lane}
                        </span>
                      ))}
                      {carrier.preferredLanes.length > 3 && (
                        <span className="text-xs font-semibold text-slate-400">
                          +{carrier.preferredLanes.length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                      {carrier.issuesCount ? `${carrier.issuesCount} issue${carrier.issuesCount === 1 ? "" : "s"}` : "No open internal issues"}
                    </div>
                    <Link
                      href={`/carriers/${carrier.id}`}
                      className="inline-flex items-center gap-1.5 rounded-md bg-slate-950 px-3 py-2 text-xs font-black text-white hover:bg-slate-800"
                    >
                      Open file
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ScoreTile({
  label,
  value,
  valueClassName,
}: {
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div className="rounded-md bg-slate-50 p-2.5 text-center">
      <p className="text-[11px] font-black uppercase tracking-[0.12em] text-slate-500">
        {label}
      </p>
      <p className={cn("mt-1 text-xl font-black text-slate-900", valueClassName)}>
        {value}
      </p>
    </div>
  );
}

function ComplianceFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="font-black uppercase tracking-[0.12em] text-slate-400">{label}</span>
      <span className="text-right font-semibold text-slate-700">{value}</span>
    </div>
  );
}
