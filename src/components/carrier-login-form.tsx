"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function CarrierLoginForm({ nextPath }: { nextPath: string }) {
  const router = useRouter();
  const [state, setState] = useState<{ status: "idle" | "loading" | "error"; message?: string }>({ status: "idle" });

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    setState({ status: "loading" });

    try {
      const res = await fetch("/api/carrier-login", {
        method: "POST",
        body: new FormData(form),
      });
      const data = await res.json() as { error?: string; redirectTo?: string };
      if (!res.ok) throw new Error(data.error || "Login failed");
      setState({ status: "idle" });
      router.push(data.redirectTo || nextPath);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Request failed";
      setState({ status: "error", message });
    }
  }

  return (
    <form className="grid gap-3" onSubmit={onSubmit}>
      <input
        type="email"
        name="email"
        placeholder="dispatch@carrier.com"
        required
        className="rounded-md border border-slate-200 bg-white px-3 py-2.5 text-sm"
      />
      <button
        type="submit"
        disabled={state.status === "loading"}
        className="rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
      >
        {state.status === "loading" ? "Signing in..." : "Sign in to carrier portal"}
      </button>
      {state.status === "error" && <p className="text-sm text-red-600">{state.message}</p>}
      <p className="text-[10px] text-slate-500">Your broker must enable carrier portal access.</p>
    </form>
  );
}
