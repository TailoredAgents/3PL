import Link from "next/link";
import {
  ArrowRight,
  Building2,
  Search,
  ShieldCheck,
  Truck,
  Users,
} from "lucide-react";

import { InternalShell } from "@/components/internal-shell";
import { getSearchResults } from "@/lib/crm";

export const dynamic = "force-dynamic";

const TYPE_STYLES: Record<string, { icon: typeof Truck; className: string }> = {
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
  },
  {
    icon: Users,
    type: "Leads",
    hint: "Company name or contact name",
    style: "bg-emerald-50 text-emerald-700 border-emerald-100",
    example: "Peachtree Building",
  },
  {
    icon: Building2,
    type: "Shippers",
    hint: "Company name",
    style: "bg-amber-50 text-amber-700 border-amber-100",
    example: "Southline Foods",
  },
  {
    icon: ShieldCheck,
    type: "Carriers",
    hint: "Company name or MC number",
    style: "bg-violet-50 text-violet-700 border-violet-100",
    example: "Blue Ridge Transport",
  },
];

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const results = q ? await getSearchResults(q) : [];

  return (
    <InternalShell
      active="Search"
      eyebrow="Command center"
      title="Search"
      description="Find any load, lead, shipper, or carrier by name, number, city, or MC."
      action={{ label: "Dashboard", href: "/dashboard" }}
    >
      {/* Search bar */}
      <form action="/search" method="GET">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              name="q"
              defaultValue={q ?? ""}
              placeholder="Search loads, leads, shippers, carriers..."
              autoFocus
              className="w-full rounded-lg border border-slate-200 bg-white py-3 pl-11 pr-4 text-slate-900 shadow-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <button
            type="submit"
            className="rounded-lg bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-700"
          >
            Search
          </button>
        </div>
      </form>

      {/* Results count */}
      {q && (
        <p className="text-sm font-semibold text-slate-600">
          {results.length
            ? `${results.length} result${results.length !== 1 ? "s" : ""} for "${q}"`
            : `No results for "${q}"`}
        </p>
      )}

      {/* Results */}
      {results.length > 0 && (
        <section className="grid gap-2">
          {results.map((result) => {
            const style = TYPE_STYLES[result.type] ?? TYPE_STYLES.Lead;
            const Icon = style.icon;

            return (
              <Link
                key={`${result.type}-${result.id}`}
                href={result.href}
                className="grid grid-cols-[auto_1fr_auto] items-center gap-4 rounded-lg border border-slate-100 bg-white p-4 shadow-sm hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md"
              >
                <div className={`flex h-9 w-9 items-center justify-center rounded-md ${style.className}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900">{result.title}</p>
                  <p className="mt-0.5 text-sm text-slate-500">{result.subtitle}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${style.className}`}>
                    {result.type}
                  </span>
                  <ArrowRight className="h-4 w-4 text-slate-300" />
                </div>
              </Link>
            );
          })}
        </section>
      )}

      {/* No results state */}
      {q && results.length === 0 && (
        <div className="rounded-lg border border-slate-100 bg-white px-6 py-10 text-center shadow-sm">
          <Search className="mx-auto h-8 w-8 text-slate-300" />
          <p className="mt-3 text-sm font-semibold text-slate-600">Nothing found for &ldquo;{q}&rdquo;</p>
          <p className="mt-1 text-sm text-slate-400">
            Try a company name, city, MC number, or load number like LD-0001.
          </p>
        </div>
      )}

      {/* Empty state — entity cards */}
      {!q && (
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {ENTITY_CARDS.map((card) => (
            <div
              key={card.type}
              className={`overflow-hidden rounded-lg border bg-white shadow-sm`}
            >
              <div className={`flex items-center gap-2 border-b px-4 py-3 ${card.style}`}>
                <card.icon className="h-4 w-4" />
                <p className="text-sm font-semibold">{card.type}</p>
              </div>
              <div className="p-4">
                <p className="text-sm text-slate-600">{card.hint}</p>
                <button
                  type="button"
                  onClick={undefined}
                  className="mt-3 text-xs font-semibold text-slate-400"
                >
                  e.g. &ldquo;{card.example}&rdquo;
                </button>
              </div>
            </div>
          ))}
        </section>
      )}
    </InternalShell>
  );
}
