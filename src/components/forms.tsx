"use client";

import { useState } from "react";
import { ArrowRight, CheckCircle2, Loader2 } from "lucide-react";

type SubmitState = {
  status: "idle" | "loading" | "success" | "error";
  message?: string;
};

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
        <label className="grid gap-2 text-sm font-semibold text-slate-800">
          Company
          <input
            required
            name="companyName"
            className="rounded-md border border-slate-300 px-3 py-2 font-normal outline-none focus:border-slate-900"
            placeholder="Acme Manufacturing"
          />
        </label>
        <label className="grid gap-2 text-sm font-semibold text-slate-800">
          Contact
          <input
            required
            name="contactName"
            className="rounded-md border border-slate-300 px-3 py-2 font-normal outline-none focus:border-slate-900"
            placeholder="Jordan Smith"
          />
        </label>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2 text-sm font-semibold text-slate-800">
          Email
          <input
            required
            type="email"
            name="email"
            className="rounded-md border border-slate-300 px-3 py-2 font-normal outline-none focus:border-slate-900"
            placeholder="jordan@company.com"
          />
        </label>
        <label className="grid gap-2 text-sm font-semibold text-slate-800">
          Phone
          <input
            required
            name="phone"
            className="rounded-md border border-slate-300 px-3 py-2 font-normal outline-none focus:border-slate-900"
            placeholder="(404) 555-0199"
          />
        </label>
      </div>
      <label className="grid gap-2 text-sm font-semibold text-slate-800">
        Common lanes
        <textarea
          required
          name="lanes"
          rows={3}
          className="rounded-md border border-slate-300 px-3 py-2 font-normal outline-none focus:border-slate-900"
          placeholder="Atlanta to Dallas, Savannah to Nashville, recurring dry van"
        />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2 text-sm font-semibold text-slate-800">
          Equipment
          <select
            required
            name="equipmentType"
            className="rounded-md border border-slate-300 px-3 py-2 font-normal outline-none focus:border-slate-900"
          >
            <option value="">Select equipment</option>
            <option>Dry van</option>
            <option>Reefer</option>
            <option>Flatbed</option>
            <option>Power only</option>
            <option>Other</option>
          </select>
        </label>
        <label className="grid gap-2 text-sm font-semibold text-slate-800">
          Monthly volume
          <input
            name="monthlyVolume"
            className="rounded-md border border-slate-300 px-3 py-2 font-normal outline-none focus:border-slate-900"
            placeholder="25 loads"
          />
        </label>
      </div>
      <label className="grid gap-2 text-sm font-semibold text-slate-800">
        Old invoices or rate confirmations
        <input
          required
          type="file"
          name="documents"
          multiple
          accept=".pdf,.png,.jpg,.jpeg"
          className="rounded-md border border-dashed border-slate-300 px-3 py-3 text-sm font-normal file:mr-3 file:rounded-md file:border-0 file:bg-slate-900 file:px-3 file:py-2 file:text-white"
        />
      </label>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <StatusMessage state={state} />
        <button
          type="submit"
          disabled={state.status === "loading"}
          className="inline-flex items-center justify-center gap-2 rounded-md bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
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
        <label className="grid gap-2 text-sm font-semibold text-slate-800">
          Company
          <input
            required
            name="companyName"
            className="rounded-md border border-slate-300 px-3 py-2 font-normal outline-none focus:border-slate-900"
            placeholder="Acme Manufacturing"
          />
        </label>
        <label className="grid gap-2 text-sm font-semibold text-slate-800">
          Email
          <input
            required
            type="email"
            name="email"
            className="rounded-md border border-slate-300 px-3 py-2 font-normal outline-none focus:border-slate-900"
            placeholder="shipping@company.com"
          />
        </label>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2 text-sm font-semibold text-slate-800">
          Origin
          <input
            required
            name="origin"
            className="rounded-md border border-slate-300 px-3 py-2 font-normal outline-none focus:border-slate-900"
            placeholder="Atlanta, GA"
          />
        </label>
        <label className="grid gap-2 text-sm font-semibold text-slate-800">
          Destination
          <input
            required
            name="destination"
            className="rounded-md border border-slate-300 px-3 py-2 font-normal outline-none focus:border-slate-900"
            placeholder="Dallas, TX"
          />
        </label>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <label className="grid gap-2 text-sm font-semibold text-slate-800">
          Pickup date
          <input
            type="date"
            name="pickupDate"
            className="rounded-md border border-slate-300 px-3 py-2 font-normal outline-none focus:border-slate-900"
          />
        </label>
        <label className="grid gap-2 text-sm font-semibold text-slate-800">
          Equipment
          <select
            required
            name="equipmentType"
            className="rounded-md border border-slate-300 px-3 py-2 font-normal outline-none focus:border-slate-900"
          >
            <option value="">Select</option>
            <option>Dry van</option>
            <option>Reefer</option>
            <option>Flatbed</option>
            <option>Power only</option>
          </select>
        </label>
        <label className="grid gap-2 text-sm font-semibold text-slate-800">
          Weight
          <input
            name="weight"
            inputMode="numeric"
            className="rounded-md border border-slate-300 px-3 py-2 font-normal outline-none focus:border-slate-900"
            placeholder="42,000"
          />
        </label>
      </div>
      <label className="grid gap-2 text-sm font-semibold text-slate-800">
        Freight details
        <textarea
          name="details"
          rows={4}
          className="rounded-md border border-slate-300 px-3 py-2 font-normal outline-none focus:border-slate-900"
          placeholder="Commodity, appointment windows, accessorials, temperature, special instructions"
        />
      </label>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <StatusMessage state={state} />
        <button
          type="submit"
          disabled={state.status === "loading"}
          className="inline-flex items-center justify-center gap-2 rounded-md bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Request quote
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </form>
  );
}
