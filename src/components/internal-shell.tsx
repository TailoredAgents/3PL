import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";

import { internalNavItems, platformName } from "@/lib/data";
import { cn } from "@/lib/utils";

type InternalShellProps = {
  active: string;
  eyebrow: string;
  title: string;
  description: string;
  action?: {
    label: string;
    href: string;
  };
  children: React.ReactNode;
};

export function InternalShell({
  active,
  eyebrow,
  title,
  description,
  action,
  children,
}: InternalShellProps) {
  return (
    <main className="min-h-screen bg-slate-100 text-slate-950">
      <aside className="fixed inset-y-0 left-0 hidden w-72 border-r border-slate-200 bg-white p-5 lg:block">
        <Link href="/" className="flex items-center gap-2 text-sm font-semibold">
          <ArrowLeft className="h-4 w-4" />
          Public site
        </Link>
        <div className="mt-8">
          <p className="text-xl font-semibold tracking-tight">{platformName}</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Internal CRM/TMS command center for sales, brokerage operations, AI
            agents, and operating performance.
          </p>
        </div>
        <nav className="mt-8 grid gap-1 text-sm font-medium text-slate-700">
          {internalNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "rounded-md px-3 py-2 hover:bg-slate-100 hover:text-slate-950",
                item.label === active &&
                  "bg-slate-950 text-white hover:bg-slate-950 hover:text-white",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      <section className="lg:pl-72">
        <header className="border-b border-slate-200 bg-white px-5 py-5">
          <div className="mx-auto flex max-w-7xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">
                {eyebrow}
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight">
                {title}
              </h1>
              <p className="mt-2 max-w-3xl leading-7 text-slate-600">
                {description}
              </p>
            </div>
            {action ? (
              <Link
                href={action.href}
                className="inline-flex items-center justify-center gap-2 rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
              >
                {action.label}
                <ExternalLink className="h-4 w-4" />
              </Link>
            ) : null}
          </div>
        </header>

        <div className="mx-auto grid max-w-7xl gap-6 px-5 py-8">{children}</div>
      </section>
    </main>
  );
}
