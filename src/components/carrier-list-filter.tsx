"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Mail, MapPinned, Phone, ShieldCheck, Truck, TrendingUp } from "lucide-react";

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
    <div className="grid gap-6">
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

      {filtered.length === 0 ? (
        <p className="rounded-md border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
          No carriers match your search.
        </p>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {filtered.map((carrier) => (
            <Link
              key={carrier.id}
              href={`/carriers/${carrier.id}`}
              className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <Truck className="h-6 w-6 text-emerald-600" />
                    <h2 className="text-2xl font-semibold">{carrier.company}</h2>
                  </div>
                  <p className="mt-2 text-sm font-medium text-slate-600">
                    {carrier.mcNumber} | {carrier.dotNumber}
                  </p>
                </div>
                <span
                  className={`w-fit rounded-full px-3 py-1 text-sm font-semibold ${
                    carrier.complianceStatus === "Approved"
                      ? "bg-emerald-100 text-emerald-800"
                      : carrier.complianceStatus === "Pending"
                        ? "bg-amber-100 text-amber-800"
                        : "bg-slate-100 text-slate-700"
                  }`}
                >
                  {carrier.complianceStatus}
                </span>
              </div>

              <div className="mt-5 grid grid-cols-3 gap-3">
                <div className="rounded-md bg-slate-50 p-3 text-center">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                    Loads
                  </p>
                  <p className="mt-1 text-xl font-bold text-slate-900">
                    {carrier.loadCount}
                  </p>
                </div>
                <div className="rounded-md bg-slate-50 p-3 text-center">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                    Delivered
                  </p>
                  <p className="mt-1 text-xl font-bold text-slate-900">
                    {carrier.deliveredLoads}
                  </p>
                </div>
                <div className="rounded-md bg-slate-50 p-3 text-center">
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

              <div className="mt-4 grid gap-3 text-sm text-slate-700">
                <div className="flex gap-3">
                  <Mail className="h-5 w-5 flex-none text-slate-400" />
                  <span>{carrier.email}</span>
                </div>
                <div className="flex gap-3">
                  <Phone className="h-5 w-5 flex-none text-slate-400" />
                  <span>{carrier.phone}</span>
                </div>
              </div>

              <div className="mt-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <MapPinned className="h-4 w-4 text-emerald-600" />
                  Preferred lanes
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {carrier.preferredLanes.slice(0, 3).map((lane) => (
                    <span
                      key={lane}
                      className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700"
                    >
                      {lane}
                    </span>
                  ))}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
