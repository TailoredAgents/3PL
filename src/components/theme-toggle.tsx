"use client";

import { Monitor, Moon, Sun } from "lucide-react";

import { useTheme, type ThemePreference } from "@/components/theme-provider";
import { cn } from "@/lib/utils";

const options: {
  value: ThemePreference;
  label: string;
  icon: typeof Sun;
}[] = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
];

export function ThemeToggle({ tone = "dark" }: { tone?: "dark" | "light" }) {
  const { preference, setPreference } = useTheme();

  return (
    <div
      aria-label="Theme preference"
      className={cn(
        "grid grid-cols-3 gap-1 rounded-md border p-1",
        tone === "dark"
          ? "border-white/10 bg-white/[0.04]"
          : "border-slate-200 bg-white shadow-md shadow-slate-950/5",
      )}
    >
      {options.map((option) => {
        const Icon = option.icon;
        const active = preference === option.value;

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => setPreference(option.value)}
            title={`${option.label} theme`}
            aria-pressed={active}
            className={cn(
              "inline-flex h-8 items-center justify-center rounded text-xs font-bold",
              tone === "dark"
                ? "text-slate-400 hover:bg-white/10 hover:text-white"
                : "text-slate-500 hover:bg-slate-100 hover:text-slate-950",
              active &&
                (tone === "dark"
                  ? "bg-white text-slate-950 shadow-sm"
                  : "bg-slate-950 text-white shadow-sm"),
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            <span className="sr-only">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
