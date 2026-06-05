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
      ? "border-white/10 bg-white/5 text-slate-300"
      : "border-slate-200 bg-white text-slate-700 shadow-sm";

  if (!clerkEnabled) {
    return (
      <div className={`rounded-md border px-3 py-2 text-xs font-semibold ${shellClass}`}>
        {fallbackLabel}
      </div>
    );
  }

  return (
    <div
      className={`flex items-center justify-between gap-3 rounded-md border px-3 py-2 text-xs font-semibold ${shellClass}`}
    >
      <span className="min-w-0">
        <span className="block truncate">{userName ?? "Account"}</span>
        {role ? <span className="block text-[11px] opacity-75">{role}</span> : null}
      </span>
      <UserButton />
    </div>
  );
}
