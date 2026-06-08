"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

type LoginState = {
  status: "idle" | "loading" | "error";
  message?: string;
};

export function InternalLoginForm({ nextPath }: { nextPath: string }) {
  const router = useRouter();
  const [state, setState] = useState<LoginState>({ status: "idle" });

  return (
    <form
      className="grid gap-4"
      onSubmit={async (event) => {
        event.preventDefault();
        const form = event.currentTarget;
        setState({ status: "loading" });

        const response = await fetch("/api/internal-login", {
          method: "POST",
          body: new FormData(form),
        });
        const payload = (await response.json()) as {
          message?: string;
          error?: string;
        };

        if (!response.ok) {
          setState({
            status: "error",
            message: payload.error ?? "Login failed.",
          });
          return;
        }

        router.replace(nextPath.startsWith("/") ? nextPath : "/dashboard");
        router.refresh();
      }}
    >
      <label className="grid gap-2 text-sm font-semibold text-slate-800 dark:text-slate-200">
        Password
        <input
          required
          type="password"
          name="password"
          className="rounded-md border border-slate-300 px-3 py-2 font-normal outline-none focus:border-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-emerald-400"
        />
      </label>
      {state.status === "error" ? (
        <p className="text-sm font-medium text-red-700">{state.message}</p>
      ) : null}
      <button
        type="submit"
        disabled={state.status === "loading"}
        className="inline-flex items-center justify-center gap-2 rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {state.status === "loading" ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : null}
        Enter CRM
      </button>
    </form>
  );
}
