"use client";

import { UserButton } from "@clerk/nextjs";

type InternalAccountProps = {
  clerkEnabled: boolean;
  fallbackLabel: string;
  userName?: string;
  role?: string;
  tone?: "dark" | "light";
};

export function InternalAccount({
  clerkEnabled,
  fallbackLabel,
  userName,
  role,
  tone = "dark",
}: InternalAccountProps) {
  const shellClass =
    tone === "dark"
      ? "border-white/10 bg-white/[0.04] text-slate-300 shadow-lg shadow-black/15"
      : "border-slate-200 bg-white text-slate-700 shadow-md shadow-slate-950/5 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:shadow-black/20";

  if (!clerkEnabled) {
    return (
      <div className={`rounded-md border px-3 py-2 text-xs font-bold ${shellClass}`}>
        {fallbackLabel}
      </div>
    );
  }

  return (
    <div
      className={`flex items-center justify-between gap-3 rounded-md border px-3 py-2 text-xs font-bold ${shellClass}`}
    >
      <span className="min-w-0">
        <span className="block truncate">{userName ?? "Account"}</span>
        {role ? <span className="block text-[11px] opacity-75">{role}</span> : null}
      </span>
      <UserButton />
    </div>
  );
}
