import Link from "next/link";
import { Activity, ExternalLink } from "lucide-react";

import { InternalAccount } from "@/components/internal-account";
import { ThemeToggle } from "@/components/theme-toggle";
import { isClerkAuthConfigured } from "@/lib/auth";
import { getCurrentInternalUser } from "@/lib/current-user";
import { internalNavGroups, platformName } from "@/lib/data";
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
  const visibleNavGroups = internalNavGroups
    .map((group) => ({
      ...group,
      items: group.items.filter(
        (item) =>
          !("allowedRoles" in item) ||
          !item.allowedRoles ||
          !clerkEnabled ||
          (internalUser && item.allowedRoles.includes(internalUser.role)),
      ),
    }))
    .filter((group) => group.items.length > 0);
  const visibleNavItems = visibleNavGroups.flatMap((group) => group.items);

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f8fafc_0%,#eef3f8_46%,#e3eaf2_100%)] text-slate-950">
      <aside className="fixed inset-y-0 left-0 hidden w-72 flex-col border-r border-slate-800/80 bg-[#070b16] p-4 text-white shadow-2xl shadow-slate-950/30 lg:flex">
        <div className="mb-5 shrink-0 rounded-lg border border-white/10 bg-white/[0.04] p-4 shadow-lg shadow-black/20">
          <Link href="/dashboard" className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-md bg-white text-sm font-black text-slate-950">
              DAO
            </span>
            <span className="min-w-0">
              <span className="block text-base font-bold tracking-normal">
                {platformName}
              </span>
              <span className="mt-0.5 block text-xs font-semibold text-slate-400">
                Freight Brokerage OS
              </span>
            </span>
          </Link>
        </div>
        <nav
          aria-label="Internal navigation"
          className="grid flex-1 content-start gap-4 overflow-y-auto pr-1 text-sm font-medium text-slate-300"
        >
          {visibleNavGroups.map((group) => (
            <div key={group.label}>
              <p className="px-3 text-[0.68rem] font-bold uppercase tracking-[0.18em] text-slate-500">
                {group.label}
              </p>
              <div className="mt-2 grid gap-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = item.label === active;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "group relative flex items-center gap-3 rounded-md px-3 py-2.5 text-slate-300 hover:bg-white/[0.07] hover:text-white",
                        isActive &&
                          "bg-white text-slate-950 shadow-lg shadow-black/25 hover:bg-white hover:text-slate-950",
                      )}
                    >
                      <span
                        className={cn(
                          "absolute left-0 h-5 w-0.5 rounded-full bg-transparent",
                          isActive && "bg-emerald-500",
                        )}
                      />
                      <span
                        className={cn(
                          "flex h-7 w-7 items-center justify-center rounded-md bg-white/[0.04] text-slate-400 group-hover:bg-white/10 group-hover:text-white",
                          isActive && "bg-slate-950 text-white",
                        )}
                      >
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="truncate">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
        <div className="mt-4 grid shrink-0 gap-2">
          <ThemeToggle />
          <InternalAccount
            clerkEnabled={clerkEnabled}
            fallbackLabel="Password gate active"
            userName={internalUser?.name}
            role={internalUser?.role}
          />
        </div>
      </aside>

      <section className="min-w-0 lg:pl-72">
        <div className="border-b border-slate-200/80 bg-white/95 px-4 py-3 shadow-sm backdrop-blur lg:hidden">
          <div className="flex items-center justify-between gap-4">
            <Link href="/dashboard" className="flex min-w-0 items-center gap-2 text-sm font-bold">
              <span className="flex h-8 w-8 items-center justify-center rounded-md bg-slate-950 text-[11px] text-white">
                DAO
              </span>
              <span className="truncate">{platformName}</span>
            </Link>
            <div className="flex min-w-0 shrink-0 items-center gap-2">
              {action ? (
                <Link
                  href={action.href}
                  className="inline-flex max-w-[44vw] items-center justify-center gap-2 truncate rounded-md bg-slate-950 px-3 py-2 text-xs font-semibold text-white shadow-lg shadow-slate-950/15 hover:bg-slate-800"
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
          <div className="mt-3 flex items-center justify-between gap-3">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
              Theme
            </p>
            <ThemeToggle tone="light" />
          </div>
          <nav
            aria-label="Mobile internal navigation"
            className="mt-3 flex gap-2 overflow-x-auto pb-1 text-sm font-medium text-slate-600"
          >
            {visibleNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex-none rounded-md border border-slate-200 bg-white px-3 py-1.5 shadow-sm",
                  item.label === active &&
                    "border-slate-950 bg-slate-950 text-white shadow-slate-950/15",
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <header className="border-b border-slate-200/80 bg-white/90 px-4 py-6 shadow-sm shadow-slate-950/5 backdrop-blur sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-[1600px] flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-emerald-800">
                  {eyebrow}
                </p>
                <span className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
                  <Activity className="h-3 w-3 text-emerald-600" />
                  Workspace
                </span>
              </div>
              <h1 className="mt-3 text-3xl font-bold tracking-normal text-slate-950 sm:text-4xl">
                {title}
              </h1>
              <p className="mt-2 max-w-4xl text-base leading-7 text-slate-600">
                {description}
              </p>
            </div>
            {action ? (
              <Link
                href={action.href}
                className="hidden shrink-0 items-center justify-center gap-2 rounded-md bg-slate-950 px-4 py-2.5 text-sm font-bold text-white shadow-xl shadow-slate-950/15 hover:-translate-y-0.5 hover:bg-slate-800 sm:inline-flex"
              >
                {action.label}
                <ExternalLink className="h-4 w-4" />
              </Link>
            ) : null}
          </div>
        </header>

        <div className="mx-auto grid max-w-[1600px] gap-6 px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </div>
      </section>
    </main>
  );
}
