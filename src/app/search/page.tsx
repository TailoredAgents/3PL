import Link from "next/link";
import {
  ArrowRight,
  Package,
  Search,
  ShieldCheck,
  Truck,
  Users,
} from "lucide-react";

import { InternalShell } from "@/components/internal-shell";
import { getSearchResults } from "@/lib/crm";

export const dynamic = "force-dynamic";

const TYPE_STYLES: Record<
  string,
  { icon: typeof Truck; className: string }
> = {
  Load: { icon: Truck, className: "bg-sky-100 text-sky-800" },
  Lead: { icon: Users, className: "bg-emerald-100 text-emerald-800" },
  Shipper: { icon: Package, className: "bg-amber-100 text-amber-800" },
  Carrier: { icon: ShieldCheck, className: "bg-purple-100 text-purple-800" },
};

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
      eyebrow="Global search"
      title="Search"
      description="Find any load, lead, shipper, or carrier by name, number, city, or MC."
      action={{ label: "Dashboard", href: "/dashboard" }}
    >
      <form action="/search" method="GET">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              name="q"
              defaultValue={q ?? ""}
              placeholder="Search loads, leads, shippers, carriers..."
              autoFocus
              className="w-full rounded-lg border border-slate-200 bg-white py-3 pl-10 pr-4 text-slate-900 shadow-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <button
            type="submit"
            className="rounded-lg bg-slate-950 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800"
          >
            Search
          </button>
        </div>
      </form>

      {q && (
        <div>
          <p className="text-sm font-medium text-slate-600">
            {results.length
              ? `${results.length} result${results.length !== 1 ? "s" : ""} for "${q}"`
              : `No results for "${q}"`}
          </p>
        </div>
      )}

      {results.length > 0 && (
        <section className="grid gap-3">
          {results.map((result) => {
            const style = TYPE_STYLES[result.type] ?? TYPE_STYLES.Lead;
            const Icon = style.icon;

            return (
              <Link
                key={`${result.type}-${result.id}`}
                href={result.href}
                className="grid grid-cols-[auto_1fr_auto] items-center gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md"
              >
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-md ${style.className}`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold text-slate-950">{result.title}</p>
                  <p className="mt-0.5 text-sm text-slate-600">
                    {result.subtitle}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-bold ${style.className}`}
                  >
                    {result.type}
                  </span>
                  <ArrowRight className="h-4 w-4 text-slate-400" />
                </div>
              </Link>
            );
          })}
        </section>
      )}

      {!q && (
        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold text-slate-700">
            What you can search
          </p>
          <div className="mt-4 grid gap-3 text-sm leading-6 text-slate-600 sm:grid-cols-2">
            <p>Loads by shipper name, origin/destination city, or LD-XXXX number</p>
            <p>Leads by company name or contact name</p>
            <p>Shippers by company name</p>
            <p>Carriers by company name or MC number</p>
          </div>
        </section>
      )}
    </InternalShell>
  );
}
