"use client";

import { useState } from "react";
import { ArrowRight, CheckCircle2, Loader2 } from "lucide-react";

type SubmitState = {
  status: "idle" | "loading" | "success" | "error";
  message?: string;
};

const fieldClass =
  "rounded-md border border-slate-200 bg-white px-3 py-2.5 font-normal text-slate-950 shadow-sm outline-none focus:border-emerald-500 focus:shadow-md focus:shadow-emerald-950/5 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-emerald-400 dark:focus:shadow-emerald-950/20";

async function submitForm(endpoint: string, form: HTMLFormElement) {
  const formData = new FormData(form);
  const response = await fetch(endpoint, {
    method: "POST",
    body: formData,
  });

  const payload = (await response.json()) as { message?: string; error?: string };

  if (!response.ok) {
    throw new Error(payload.error ?? "The request could not be submitted.");
  }

  return payload.message ?? "Submitted successfully.";
}

function StatusMessage({ state }: { state: SubmitState }) {
  if (state.status === "idle") {
    return null;
  }

  if (state.status === "loading") {
    return (
      <p className="flex items-center gap-2 text-sm font-medium text-slate-600">
        <Loader2 className="h-4 w-4 animate-spin" />
        Submitting...
      </p>
    );
  }

  if (state.status === "success") {
    return (
      <p className="flex items-center gap-2 text-sm font-medium text-emerald-700">
        <CheckCircle2 className="h-4 w-4" />
        {state.message}
      </p>
    );
  }

  return <p className="text-sm font-medium text-red-700">{state.message}</p>;
}

export function SavingsAuditForm() {
  const [state, setState] = useState<SubmitState>({ status: "idle" });

  return (
    <form
      className="grid gap-4"
      onSubmit={async (event) => {
        event.preventDefault();
        const form = event.currentTarget;
        setState({ status: "loading" });

        try {
          const message = await submitForm("/api/freight-audit", form);
          form.reset();
          setState({ status: "success", message });
        } catch (error) {
          setState({
            status: "error",
            message:
              error instanceof Error
                ? error.message
                : "The audit could not be submitted.",
          });
        }
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2 text-sm font-semibold text-slate-800 dark:text-slate-200">
          Company
          <input
            required
            name="companyName"
            className={fieldClass}
            placeholder="Acme Manufacturing"
          />
        </label>
        <label className="grid gap-2 text-sm font-semibold text-slate-800 dark:text-slate-200">
          Contact
          <input
            required
            name="contactName"
            className={fieldClass}
            placeholder="Jordan Smith"
          />
        </label>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2 text-sm font-semibold text-slate-800 dark:text-slate-200">
          Email
          <input
            required
            type="email"
            name="email"
            className={fieldClass}
            placeholder="jordan@company.com"
          />
        </label>
        <label className="grid gap-2 text-sm font-semibold text-slate-800 dark:text-slate-200">
          Phone
          <input
            required
            name="phone"
            className={fieldClass}
            placeholder="(404) 555-0199"
          />
        </label>
      </div>
      <label className="grid gap-2 text-sm font-semibold text-slate-800 dark:text-slate-200">
        Common lanes
        <textarea
          required
          name="lanes"
          rows={3}
          className={fieldClass}
          placeholder="Atlanta to Dallas, Savannah to Nashville, recurring dry van"
        />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2 text-sm font-semibold text-slate-800 dark:text-slate-200">
          Equipment
          <select
            required
            name="equipmentType"
            className={fieldClass}
          >
            <option value="">Select equipment</option>
            <option>Dry van</option>
            <option>Reefer</option>
            <option>Flatbed</option>
            <option>Power only</option>
            <option>Other</option>
          </select>
        </label>
        <label className="grid gap-2 text-sm font-semibold text-slate-800 dark:text-slate-200">
          Monthly volume
          <input
            name="monthlyVolume"
            className={fieldClass}
            placeholder="25 loads"
          />
        </label>
      </div>
      <label className="grid gap-2 text-sm font-semibold text-slate-800 dark:text-slate-200">
        Old invoices or rate confirmations
        <input
          required
          type="file"
          name="documents"
          multiple
          accept=".pdf,.png,.jpg,.jpeg"
          className="rounded-md border border-dashed border-slate-300 bg-white px-3 py-3 text-sm font-normal shadow-sm file:mr-3 file:rounded-md file:border-0 file:bg-slate-900 file:px-3 file:py-2 file:text-white hover:border-emerald-300 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:file:bg-slate-100 dark:file:text-slate-950 dark:hover:border-emerald-500"
        />
      </label>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <StatusMessage state={state} />
        <button
          type="submit"
          disabled={state.status === "loading"}
          className="inline-flex items-center justify-center gap-2 rounded-md bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-950/15 hover:-translate-y-0.5 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
        >
          Generate audit request
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </form>
  );
}

export function QuoteForm() {
  const [state, setState] = useState<SubmitState>({ status: "idle" });

  return (
    <form
      className="grid gap-4"
      onSubmit={async (event) => {
        event.preventDefault();
        const form = event.currentTarget;
        setState({ status: "loading" });

        try {
          const message = await submitForm("/api/quote", form);
          form.reset();
          setState({ status: "success", message });
        } catch (error) {
          setState({
            status: "error",
            message:
              error instanceof Error
                ? error.message
                : "The quote request could not be submitted.",
          });
        }
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2 text-sm font-semibold text-slate-800 dark:text-slate-200">
          Company
          <input
            required
            name="companyName"
            className={fieldClass}
            placeholder="Acme Manufacturing"
          />
        </label>
        <label className="grid gap-2 text-sm font-semibold text-slate-800 dark:text-slate-200">
          Email
          <input
            required
            type="email"
            name="email"
            className={fieldClass}
            placeholder="shipping@company.com"
          />
        </label>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2 text-sm font-semibold text-slate-800 dark:text-slate-200">
          Origin
          <input
            required
            name="origin"
            className={fieldClass}
            placeholder="Atlanta, GA"
          />
        </label>
        <label className="grid gap-2 text-sm font-semibold text-slate-800 dark:text-slate-200">
          Destination
          <input
            required
            name="destination"
            className={fieldClass}
            placeholder="Dallas, TX"
          />
        </label>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <label className="grid gap-2 text-sm font-semibold text-slate-800 dark:text-slate-200">
          Pickup date
          <input
            type="date"
            name="pickupDate"
            className={fieldClass}
          />
        </label>
        <label className="grid gap-2 text-sm font-semibold text-slate-800 dark:text-slate-200">
          Equipment
          <select
            required
            name="equipmentType"
            className={fieldClass}
          >
            <option value="">Select</option>
            <option>Dry van</option>
            <option>Reefer</option>
            <option>Flatbed</option>
            <option>Power only</option>
          </select>
        </label>
        <label className="grid gap-2 text-sm font-semibold text-slate-800 dark:text-slate-200">
          Weight
          <input
            name="weight"
            inputMode="numeric"
            className={fieldClass}
            placeholder="42,000"
          />
        </label>
      </div>
      <label className="grid gap-2 text-sm font-semibold text-slate-800 dark:text-slate-200">
        Freight details
        <textarea
          name="details"
          rows={4}
          className={fieldClass}
          placeholder="Commodity, appointment windows, accessorials, temperature, special instructions"
        />
      </label>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <StatusMessage state={state} />
        <button
          type="submit"
          disabled={state.status === "loading"}
          className="inline-flex items-center justify-center gap-2 rounded-md bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-900/15 hover:-translate-y-0.5 hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
        >
          Request quote
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </form>
  );
}
