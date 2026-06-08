import type { ComponentType } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Building2,
  ClipboardList,
  FileText,
  Search,
  ShieldCheck,
  Truck,
  Users,
} from "lucide-react";

import { InternalShell } from "@/components/internal-shell";
import { getSearchResults } from "@/lib/crm";

export const dynamic = "force-dynamic";

type SearchIcon = ComponentType<{ className?: string }>;

const TYPE_STYLES: Record<string, { icon: SearchIcon; className: string }> = {
  Load: { icon: Truck, className: "bg-sky-50 text-sky-700" },
  Lead: { icon: Users, className: "bg-emerald-50 text-emerald-700" },
  Shipper: { icon: Building2, className: "bg-amber-50 text-amber-700" },
  Carrier: { icon: ShieldCheck, className: "bg-violet-50 text-violet-700" },
};

const ENTITY_CARDS = [
  {
    icon: Truck,
    type: "Loads",
    hint: "Shipper name, origin/destination city, or load number",
    style: "bg-sky-50 text-sky-700 border-sky-100",
    example: "Atlanta → Nashville",
    action: "Find open freight and tracking records",
  },
  {
    icon: Users,
    type: "Leads",
    hint: "Company name or contact name",
    style: "bg-emerald-50 text-emerald-700 border-emerald-100",
    example: "Peachtree Building",
    action: "Jump into prospect follow-up work",
  },
  {
    icon: Building2,
    type: "Shippers",
    hint: "Company name",
    style: "bg-amber-50 text-amber-700 border-amber-100",
    example: "Southline Foods",
    action: "Open customer files and lane history",
  },
  {
    icon: ShieldCheck,
    type: "Carriers",
    hint: "Company name or MC number",
    style: "bg-violet-50 text-violet-700 border-violet-100",
    example: "Blue Ridge Transport",
    action: "Review compliance and coverage options",
  },
];

const QUICK_LINKS = [
  {
    icon: Truck,
    label: "Load Board",
    href: "/loads",
    detail: "Carrier coverage, status, POD, margin",
  },
  {
    icon: Users,
    label: "Leads",
    href: "/leads",
    detail: "Call list, pipeline, sales next actions",
  },
  {
    icon: Building2,
    label: "Shippers",
    href: "/shippers",
    detail: "Accounts, contacts, lanes, load history",
  },
  {
    icon: ShieldCheck,
    label: "Carriers",
    href: "/carriers",
    detail: "Authority, compliance, preferred lanes",
  },
  {
    icon: ClipboardList,
    label: "Quotes",
    href: "/quote-requests",
    detail: "Price requests and quote conversion",
  },
  {
    icon: FileText,
    label: "Documents",
    href: "/documents",
    detail: "PODs, BOLs, invoices, rate confirmations",
  },
];

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const results = q ? await getSearchResults(q) : [];
  const resultCounts = results.reduce<Record<string, number>>((counts, result) => {
    counts[result.type] = (counts[result.type] ?? 0) + 1;
    return counts;
  }, {});

  return (
    <InternalShell
      active="Search"
      eyebrow="Command center"
      title="Search"
      description="Find any load, lead, shipper, or carrier by name, number, city, or MC."
      action={{ label: "Dashboard", href: "/dashboard" }}
    >
      <section className="rounded-lg border border-slate-100 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
              <Search className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-black uppercase tracking-[0.18em] text-emerald-700">
                Command search
              </p>
              <p className="mt-1 max-w-2xl text-sm text-slate-500">
                Use this as the fast jump point when a salesperson or operator knows a name,
                lane, load number, city, or carrier identifier.
              </p>
            </div>
          </div>
          <div className="rounded-lg border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            <span className="font-semibold text-slate-900">Best matches first.</span>{" "}
            Results open directly into the active work record.
          </div>
        </div>

        <form action="/search" method="GET" className="mt-5">
          <div className="flex flex-col gap-3 lg:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                name="q"
                defaultValue={q ?? ""}
                placeholder="Search loads, leads, shippers, carriers..."
                autoFocus
                className="w-full rounded-lg border border-slate-200 bg-white py-4 pl-11 pr-4 text-base text-slate-900 shadow-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <button
              type="submit"
              className="rounded-lg bg-slate-950 px-7 py-4 text-sm font-bold text-white shadow-lg shadow-slate-900/15 hover:bg-slate-800"
            >
              Search
            </button>
          </div>
          <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-slate-500">
            <span className="rounded-full bg-slate-50 px-3 py-1.5">LD-0001</span>
            <span className="rounded-full bg-slate-50 px-3 py-1.5">Atlanta to Dallas</span>
            <span className="rounded-full bg-slate-50 px-3 py-1.5">Peachtree</span>
            <span className="rounded-full bg-slate-50 px-3 py-1.5">MC-482913</span>
          </div>
        </form>
      </section>

      {q && (
        <section className="rounded-lg border border-slate-100 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
                Search results
              </p>
              <h2 className="mt-1 text-xl font-black text-slate-950">
                {results.length
                  ? `${results.length} match${results.length !== 1 ? "es" : ""} for "${q}"`
                  : `No matches for "${q}"`}
              </h2>
            </div>
            {results.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {Object.entries(resultCounts).map(([type, count]) => {
                  const style = TYPE_STYLES[type] ?? TYPE_STYLES.Lead;

                  return (
                    <span
                      key={type}
                      className={`rounded-full px-3 py-1 text-xs font-bold ${style.className}`}
                    >
                      {count} {type}
                    </span>
                  );
                })}
              </div>
            )}
          </div>

          {results.length > 0 ? (
            <div className="grid gap-2 p-4">
              {results.map((result) => {
                const style = TYPE_STYLES[result.type] ?? TYPE_STYLES.Lead;
                const Icon = style.icon;

                return (
                  <Link
                    key={`${result.type}-${result.id}`}
                    href={result.href}
                    className="grid grid-cols-[auto_1fr_auto] items-center gap-4 rounded-lg border border-slate-100 bg-slate-50 p-4 transition hover:-translate-y-0.5 hover:border-emerald-200 hover:bg-white hover:shadow-md"
                  >
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-lg ${style.className}`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">{result.title}</p>
                      <p className="mt-0.5 text-sm text-slate-500">{result.subtitle}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-semibold ${style.className}`}
                      >
                        {result.type}
                      </span>
                      <ArrowRight className="h-4 w-4 text-slate-300" />
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="px-6 py-12 text-center">
              <Search className="mx-auto h-9 w-9 text-slate-300" />
              <p className="mt-3 text-sm font-semibold text-slate-700">
                Nothing matched that search.
              </p>
              <p className="mx-auto mt-1 max-w-md text-sm text-slate-400">
                Try a shorter company name, origin city, destination city, MC number, or load
                number like LD-0001.
              </p>
            </div>
          )}
        </section>
      )}

      {!q && (
        <>
          <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
            <div className="rounded-lg border border-slate-100 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
                    Quick jumps
                  </p>
                  <h2 className="mt-1 text-xl font-black text-slate-950">
                    Open the workspace first, search second.
                  </h2>
                </div>
                <ArrowRight className="h-5 w-5 text-slate-300" />
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {QUICK_LINKS.map((link) => (
                  <Link
                    key={link.label}
                    href={link.href}
                    className="rounded-lg border border-slate-100 bg-slate-50 p-4 transition hover:-translate-y-0.5 hover:border-emerald-200 hover:bg-white hover:shadow-md"
                  >
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-slate-500 shadow-sm">
                        <link.icon className="h-4 w-4" />
                      </div>
                      <p className="font-bold text-slate-900">{link.label}</p>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-slate-500">{link.detail}</p>
                  </Link>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-5 shadow-sm">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
                Search discipline
              </p>
              <h2 className="mt-1 text-xl font-black text-slate-950">
                Start broad, then narrow.
              </h2>
              <div className="mt-5 grid gap-3">
                <div className="rounded-lg bg-white/75 p-4">
                  <p className="font-semibold text-slate-900">Use names before full phrases.</p>
                  <p className="mt-1 text-sm text-slate-600">
                    A customer, carrier, city, or load number usually gets the fastest jump.
                  </p>
                </div>
                <div className="rounded-lg bg-white/75 p-4">
                  <p className="font-semibold text-slate-900">Search is record-focused.</p>
                  <p className="mt-1 text-sm text-slate-600">
                    Documents, emails, and calls should still be opened from their workspaces.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {ENTITY_CARDS.map((card) => (
              <div
                key={card.type}
                className="overflow-hidden rounded-lg border border-slate-100 bg-white shadow-sm"
              >
                <div className={`flex items-center gap-2 border-b px-4 py-3 ${card.style}`}>
                  <card.icon className="h-4 w-4" />
                  <p className="text-sm font-bold">{card.type}</p>
                </div>
                <div className="p-4">
                  <p className="text-sm font-semibold text-slate-900">{card.action}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{card.hint}</p>
                  <p className="mt-3 text-xs font-semibold text-slate-400">
                    e.g. &ldquo;{card.example}&rdquo;
                  </p>
                </div>
              </div>
            ))}
          </section>
        </>
      )}
    </InternalShell>
  );
}
