import Link from "next/link";
import { ArrowLeft, ExternalLink, Sparkles } from "lucide-react";

import { InternalAccount } from "@/components/internal-account";
import { isClerkAuthConfigured } from "@/lib/auth";
import { getCurrentInternalUser } from "@/lib/current-user";
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

export async function InternalShell({
  active,
  eyebrow,
  title,
  description,
  action,
  children,
}: InternalShellProps) {
  const clerkEnabled = isClerkAuthConfigured();
  const internalUser = clerkEnabled ? await getCurrentInternalUser() : null;

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#d1fae5_0,#f1f5f9_34%,#e2e8f0_100%)] text-slate-950">
      <aside className="fixed inset-y-0 left-0 hidden w-72 border-r border-white/10 bg-slate-950 p-5 text-white shadow-2xl lg:block">
        <Link
          href="/"
          className="flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-slate-200 hover:bg-white/10 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Public site
        </Link>
        <div className="mt-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-950/30">
            <Sparkles className="h-6 w-6" />
          </div>
          <p className="mt-5 text-xl font-semibold tracking-tight">
            {platformName}
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Internal CRM/TMS command center for sales, brokerage operations, AI
            agents, and operating performance.
          </p>
        </div>
        <nav className="mt-8 grid gap-1 text-sm font-medium text-slate-300">
          {internalNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "rounded-md px-3 py-2 hover:bg-white/10 hover:text-white",
                item.label === active &&
                  "bg-white text-slate-950 shadow-lg shadow-black/20 hover:bg-white hover:text-slate-950",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="absolute bottom-5 left-5 right-5">
          <InternalAccount
            clerkEnabled={clerkEnabled}
            fallbackLabel="Password gate active"
            userName={internalUser?.name}
            role={internalUser?.role}
          />
        </div>
      </aside>

      <section className="lg:pl-72">
        <div className="border-b border-slate-200/70 bg-white/90 px-5 py-3 backdrop-blur lg:hidden">
          <div className="flex items-center justify-between gap-4">
            <Link href="/" className="text-sm font-semibold">
              {platformName}
            </Link>
            <div className="flex items-center gap-2">
              {action ? (
                <Link
                  href={action.href}
                  className="inline-flex items-center justify-center gap-2 rounded-md bg-slate-950 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800"
                >
                  {action.label}
                </Link>
              ) : null}
              <InternalAccount
                clerkEnabled={clerkEnabled}
                fallbackLabel="Password gate"
                userName={internalUser?.name}
                role={internalUser?.role}
                tone="light"
              />
            </div>
          </div>
          <nav className="mt-3 flex gap-2 overflow-x-auto pb-1 text-sm font-medium text-slate-600">
            {internalNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex-none rounded-full border border-slate-200 bg-white px-3 py-1.5",
                  item.label === active &&
                    "border-slate-950 bg-slate-950 text-white",
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <header className="border-b border-white/60 bg-white/75 px-5 py-7 shadow-sm backdrop-blur">
          <div className="mx-auto flex max-w-[1500px] flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-700">
                {eyebrow}
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                {title}
              </h1>
              <p className="mt-2 max-w-3xl leading-7 text-slate-600">
                {description}
              </p>
            </div>
            {action ? (
              <Link
                href={action.href}
                className="hidden items-center justify-center gap-2 rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-slate-950/15 hover:bg-slate-800 sm:inline-flex"
              >
                {action.label}
                <ExternalLink className="h-4 w-4" />
              </Link>
            ) : null}
          </div>
        </header>

        <div className="mx-auto grid max-w-[1500px] gap-6 px-5 py-8">
          {children}
        </div>
      </section>
    </main>
  );
}
