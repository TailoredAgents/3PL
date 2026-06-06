"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Mail, MapPinned, Phone, Truck } from "lucide-react";

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
};

function complianceBorderClass(status: string) {
  if (status === "Approved") return "border-l-[3px] border-l-emerald-400";
  if (status === "Pending") return "border-l-[3px] border-l-amber-400";
  return "border-l-[3px] border-l-slate-300";
}

function complianceBadgeClass(status: string) {
  if (status === "Approved") return "bg-emerald-50 text-emerald-700";
  if (status === "Pending") return "bg-amber-50 text-amber-700";
  return "bg-slate-100 text-slate-600";
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
        c.preferredLanes.some((lane) => lane.toLowerCase().includes(q));
      const matchesStatus =
        statusFilter === "All" || c.complianceStatus === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [carriers, query, statusFilter]);

  return (
    <div className="grid gap-4">
      {/* Search + filter bar */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          type="search"
          placeholder="Search by name, MC number, or lane..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1 rounded-md border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
        <div className="flex gap-2">
          {statuses.map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                statusFilter === status
                  ? "bg-slate-950 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Count label */}
      <p className="text-xs font-semibold text-slate-500">
        {filtered.length} {filtered.length === 1 ? "carrier" : "carriers"}
        {statusFilter !== "All" ? ` · ${statusFilter}` : ""}
      </p>

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-slate-100 bg-white py-12 text-center shadow-sm">
          <Truck className="mx-auto h-8 w-8 text-slate-300" />
          <p className="mt-3 text-sm font-semibold text-slate-600">No carriers match your search</p>
          <p className="mt-1 text-sm text-slate-400">Try a different name, MC number, or lane.</p>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {filtered.map((carrier) => {
            const hasEmail = carrier.email && carrier.email.length > 0;
            const hasPhone = carrier.phone && carrier.phone.length > 0;
            const hasLanes = carrier.preferredLanes.length > 0;

            return (
              <Link
                key={carrier.id}
                href={`/carriers/${carrier.id}`}
                className={`overflow-hidden rounded-lg border border-slate-100 bg-white shadow-sm hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md ${complianceBorderClass(carrier.complianceStatus)}`}
              >
                <div className="p-5">
                  {/* Header row */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <Truck className="h-4 w-4 flex-none text-slate-400" />
                      <div>
                        <p className="font-semibold text-slate-900">{carrier.company}</p>
                        <p className="text-xs text-slate-500">
                          {carrier.mcNumber} · {carrier.dotNumber}
                        </p>
                      </div>
                    </div>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${complianceBadgeClass(carrier.complianceStatus)}`}>
                      {carrier.complianceStatus}
                    </span>
                  </div>

                  {/* Stats */}
                  <div className="mt-4 grid grid-cols-3 gap-2">
                    <div className="rounded-md bg-slate-50 p-2.5 text-center">
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                        Loads
                      </p>
                      <p className="mt-1 text-xl font-bold text-slate-900">
                        {carrier.loadCount}
                      </p>
                    </div>
                    <div className="rounded-md bg-slate-50 p-2.5 text-center">
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                        Delivered
                      </p>
                      <p className="mt-1 text-xl font-bold text-slate-900">
                        {carrier.deliveredLoads}
                      </p>
                    </div>
                    <div className="rounded-md bg-slate-50 p-2.5 text-center">
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                        Avg margin
                      </p>
                      <p
                        className={`mt-1 text-xl font-bold ${
                          carrier.avgMargin > 15
                            ? "text-emerald-700"
                            : carrier.avgMargin > 10
                              ? "text-amber-700"
                              : "text-slate-900"
                        }`}
                      >
                        {carrier.avgMargin > 0 ? `${carrier.avgMargin}%` : "—"}
                      </p>
                    </div>
                  </div>

                  {/* Contact info */}
                  {(hasEmail || hasPhone) && (
                    <div className="mt-3 grid gap-1.5 text-sm text-slate-600">
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

                  {/* Preferred lanes */}
                  {hasLanes && (
                    <div className="mt-3 flex flex-wrap items-center gap-1.5">
                      <MapPinned className="h-3.5 w-3.5 flex-none text-slate-400" />
                      {carrier.preferredLanes.slice(0, 3).map((lane) => (
                        <span
                          key={lane}
                          className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600"
                        >
                          {lane}
                        </span>
                      ))}
                      {carrier.preferredLanes.length > 3 && (
                        <span className="text-xs text-slate-400">
                          +{carrier.preferredLanes.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
