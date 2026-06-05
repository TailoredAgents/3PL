"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2 } from "lucide-react";

type FormState = {
  status: "idle" | "loading" | "success" | "error";
  message?: string;
};

async function submit(endpoint: string, form: HTMLFormElement, method: string) {
  const response = await fetch(endpoint, {
    method,
    body: new FormData(form),
  });
  const payload = (await response.json()) as { message?: string; error?: string };

  if (!response.ok) {
    throw new Error(payload.error ?? "Request failed.");
  }

  return payload.message ?? "Saved.";
}

function Status({ state }: { state: FormState }) {
  if (state.status === "idle") {
    return null;
  }

  if (state.status === "loading") {
    return (
      <p className="flex items-center gap-2 text-sm font-medium text-slate-600">
        <Loader2 className="h-4 w-4 animate-spin" />
        Saving...
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

function useCrmSubmit(endpoint: string, method = "POST") {
  const router = useRouter();
  const [state, setState] = useState<FormState>({ status: "idle" });

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setState({ status: "loading" });

    try {
      const message = await submit(endpoint, form, method);
      form.reset();
      setState({ status: "success", message });
      router.refresh();
    } catch (error) {
      setState({
        status: "error",
        message: error instanceof Error ? error.message : "Request failed.",
      });
    }
  }

  return { state, onSubmit };
}

const inputClass =
  "rounded-md border border-slate-200 bg-white px-3 py-2.5 font-normal text-slate-950 shadow-sm outline-none ring-0 focus:border-emerald-500 focus:shadow-md focus:shadow-emerald-950/5";

export function LeadCreateForm() {
  const { state, onSubmit } = useCrmSubmit("/api/leads");

  return (
    <form className="grid gap-3" onSubmit={onSubmit}>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field name="companyName" label="Company" required />
        <Field name="contactName" label="Contact" required />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field name="email" label="Email" type="email" />
        <Field name="phone" label="Phone" />
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <Select
          name="stage"
          label="Stage"
          options={["NEW", "CONTACTED", "QUALIFIED", "QUOTED", "WON", "LOST"]}
        />
        <Select
          name="source"
          label="Source"
          options={["MANUAL", "OUTBOUND", "AUDIT", "QUOTE_FORM", "REFERRAL"]}
        />
        <Select name="priority" label="Priority" options={["1", "2", "3", "4", "5"]} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field name="lanes" label="Lanes" placeholder="Atlanta -> Dallas" />
        <Field name="equipmentType" label="Equipment" placeholder="Dry van" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field name="monthlyVolume" label="Volume" placeholder="12 loads/mo" />
        <Field name="nextFollowUpAt" label="Next follow-up" type="datetime-local" />
      </div>
      <Textarea name="notes" label="Notes / pain point" />
      <FormFooter state={state} buttonLabel="Create lead" />
    </form>
  );
}

export function ContactImportForm() {
  const { state, onSubmit } = useCrmSubmit("/api/contact-import");

  return (
    <form className="grid gap-3" onSubmit={onSubmit}>
      <label className="grid gap-2 text-sm font-semibold text-slate-800">
        CSV file
        <input
          required
          name="csv"
          type="file"
          accept=".csv"
          className="rounded-md border border-dashed border-slate-300 bg-white px-3 py-3 text-sm font-normal shadow-sm file:mr-3 file:rounded-md file:border-0 file:bg-slate-950 file:px-3 file:py-2 file:text-white hover:border-emerald-300"
        />
      </label>
      <p className="text-sm leading-6 text-slate-600">
        Accepted headers include company, contact, email, phone, lanes,
        equipment, volume, and notes.
      </p>
      <FormFooter state={state} buttonLabel="Import contacts" />
    </form>
  );
}

export function ShipperCreateForm() {
  const { state, onSubmit } = useCrmSubmit("/api/shippers");

  return (
    <form className="grid gap-3" onSubmit={onSubmit}>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field name="companyName" label="Company" required />
        <Field name="industry" label="Industry" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field name="contactName" label="Primary contact" required />
        <Field name="title" label="Title" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field name="email" label="Email" type="email" />
        <Field name="phone" label="Phone" />
      </div>
      <Field name="lanes" label="Known lanes" placeholder="Atlanta -> Dallas; Savannah -> Nashville" />
      <Textarea name="notes" label="Notes" />
      <FormFooter state={state} buttonLabel="Create shipper" />
    </form>
  );
}

export function QuoteRequestCreateForm() {
  const { state, onSubmit } = useCrmSubmit("/api/quote-requests");

  return (
    <form className="grid gap-3" onSubmit={onSubmit}>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field name="companyName" label="Company" required />
        <Field name="contactName" label="Contact" />
      </div>
      <Field name="email" label="Email" type="email" />
      <div className="grid gap-3 sm:grid-cols-4">
        <Field name="originCity" label="Origin city" required />
        <Field name="originState" label="State" required placeholder="GA" />
        <Field name="destinationCity" label="Destination city" required />
        <Field name="destinationState" label="State" required placeholder="TX" />
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <Field name="pickupDate" label="Pickup" type="date" />
        <Field name="equipmentType" label="Equipment" required />
        <Field name="weight" label="Weight" type="number" />
      </div>
      <Field name="commodity" label="Commodity" />
      <Textarea name="specialRequirements" label="Special requirements" />
      <FormFooter state={state} buttonLabel="Create quote request" />
    </form>
  );
}

export function LeadUpdateForm({
  leadId,
  currentStage,
}: {
  leadId: string;
  currentStage: string;
}) {
  const { state, onSubmit } = useCrmSubmit(`/api/leads/${leadId}`, "PATCH");

  return (
    <form className="grid gap-3" onSubmit={onSubmit}>
      <div className="grid gap-3 sm:grid-cols-3">
        <Select
          name="stage"
          label="Stage"
          options={["NEW", "CONTACTED", "QUALIFIED", "QUOTED", "WON", "LOST"]}
          defaultValue={enumValue(currentStage)}
        />
        <Select
          name="priority"
          label="Priority"
          options={["1", "2", "3", "4", "5"]}
          defaultValue="3"
        />
        <Field name="nextFollowUpAt" label="Next follow-up" type="datetime-local" />
      </div>
      <Textarea name="notes" label="Updated notes / next action" />
      <FormFooter state={state} buttonLabel="Update lead" />
    </form>
  );
}

export function ActivityCreateForm({ leadId }: { leadId: string }) {
  const { state, onSubmit } = useCrmSubmit(`/api/leads/${leadId}/activities`);

  return (
    <form className="grid gap-3" onSubmit={onSubmit}>
      <div className="grid gap-3 sm:grid-cols-3">
        <Select
          name="type"
          label="Type"
          options={["CALL", "EMAIL", "SMS", "NOTE", "AI_TOUCH", "MEETING"]}
        />
        <Select
          name="direction"
          label="Direction"
          options={["INTERNAL", "OUTBOUND", "INBOUND"]}
        />
        <Field name="subject" label="Subject" />
      </div>
      <Textarea name="body" label="Activity note" />
      <Field name="outcome" label="Outcome" />
      <FormFooter state={state} buttonLabel="Add activity" />
    </form>
  );
}

export function CarrierCreateForm() {
  const { state, onSubmit } = useCrmSubmit("/api/carriers");

  return (
    <form className="grid gap-3" onSubmit={onSubmit}>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field name="companyName" label="Carrier company" required />
        <Field name="contactName" label="Dispatch contact" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field name="mcNumber" label="MC number" />
        <Field name="dotNumber" label="DOT number" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field name="email" label="Email" type="email" />
        <Field name="phone" label="Phone" />
      </div>
      <Select
        name="complianceStatus"
        label="Compliance"
        options={["PENDING", "APPROVED", "REJECTED", "EXPIRED"]}
      />
      <Field
        name="preferredLanes"
        label="Preferred lanes"
        placeholder="Atlanta -> Dallas; Atlanta -> Orlando"
      />
      <Textarea name="notes" label="Carrier notes" />
      <FormFooter state={state} buttonLabel="Create carrier" />
    </form>
  );
}

export function LoadCreateForm() {
  const { state, onSubmit } = useCrmSubmit("/api/loads");

  return (
    <form className="grid gap-3" onSubmit={onSubmit}>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field name="shipperCompanyName" label="Shipper" required />
        <Field name="carrierCompanyName" label="Carrier" />
      </div>
      <div className="grid gap-3 sm:grid-cols-4">
        <Field name="originCity" label="Origin city" required />
        <Field name="originState" label="State" required placeholder="GA" />
        <Field name="destinationCity" label="Destination city" required />
        <Field name="destinationState" label="State" required placeholder="TX" />
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <Field name="equipmentType" label="Equipment" required />
        <Field name="pickupDate" label="Pickup" type="date" />
        <Field name="deliveryDate" label="Delivery" type="date" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field name="customerRate" label="Customer rate" type="number" required />
        <Field name="carrierRate" label="Carrier rate" type="number" />
      </div>
      <Textarea name="notes" label="Load notes" />
      <FormFooter state={state} buttonLabel="Create load" />
    </form>
  );
}

export function LoadUpdateForm({
  loadId,
  currentStatus,
}: {
  loadId: string;
  currentStatus: string;
}) {
  const { state, onSubmit } = useCrmSubmit(`/api/loads/${loadId}`, "PATCH");

  return (
    <form className="grid gap-3" onSubmit={onSubmit}>
      <div className="grid gap-3 sm:grid-cols-2">
        <Select
          name="status"
          label="Status"
          options={[
            "TENDERED",
            "BOOKED",
            "PICKED_UP",
            "IN_TRANSIT",
            "DELIVERED",
            "POD_RECEIVED",
            "INVOICED",
            "PAID",
          ]}
          defaultValue={enumValue(currentStatus)}
        />
        <Field name="carrierRate" label="Carrier rate" type="number" />
      </div>
      <Textarea name="notes" label="Status note" />
      <FormFooter state={state} buttonLabel="Update load" />
    </form>
  );
}

export function ShipmentEventCreateForm({ loadId }: { loadId: string }) {
  const { state, onSubmit } = useCrmSubmit(`/api/loads/${loadId}/events`);

  return (
    <form className="grid gap-3" onSubmit={onSubmit}>
      <div className="grid gap-3 sm:grid-cols-3">
        <Select
          name="type"
          label="Type"
          options={[
            "PICKUP_CONFIRMED",
            "LOCATION_UPDATE",
            "DELAY",
            "DELIVERED",
            "POD_UPLOADED",
          ]}
        />
        <Field name="location" label="Location" />
        <Field name="occurredAt" label="Occurred at" type="datetime-local" />
      </div>
      <Textarea name="message" label="Tracking message" />
      <FormFooter state={state} buttonLabel="Add event" />
    </form>
  );
}

export function QuoteConvertForm({ quoteId }: { quoteId: string }) {
  const { state, onSubmit } = useCrmSubmit(
    `/api/quote-requests/${quoteId}/convert-to-load`,
  );

  return (
    <form className="grid gap-3" onSubmit={onSubmit}>
      <div className="grid gap-3 sm:grid-cols-3">
        <Field name="customerRate" label="Customer rate" type="number" required />
        <Field name="carrierCompanyName" label="Carrier" />
        <Field name="carrierRate" label="Carrier rate" type="number" />
      </div>
      <FormFooter state={state} buttonLabel="Convert to load" />
    </form>
  );
}

export function DocumentCreateForm({ loadId }: { loadId: string }) {
  const { state, onSubmit } = useCrmSubmit(`/api/loads/${loadId}/documents`);

  return (
    <form className="grid gap-3" onSubmit={onSubmit}>
      <div className="grid gap-3 sm:grid-cols-2">
        <Select
          name="type"
          label="Type"
          options={["POD", "RATE_CONFIRMATION", "INVOICE", "OTHER"]}
        />
        <Field name="fileName" label="Document name" required />
      </div>
      <Field name="fileUrl" label="File URL" placeholder="Optional until storage is wired" />
      <Textarea name="extractedText" label="Notes / extracted text" />
      <FormFooter state={state} buttonLabel="Add document" />
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  required = false,
  placeholder,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-slate-800">
      {label}
      <input
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        className={inputClass}
      />
    </label>
  );
}

function Textarea({ label, name }: { label: string; name: string }) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-slate-800">
      {label}
      <textarea name={name} rows={3} className={inputClass} />
    </label>
  );
}

function Select({
  label,
  name,
  options,
  defaultValue,
}: {
  label: string;
  name: string;
  options: string[];
  defaultValue?: string;
}) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-slate-800">
      {label}
      <select name={name} className={inputClass} defaultValue={defaultValue}>
        {options.map((option) => (
          <option key={option} value={option}>
            {option.replace("_", " ")}
          </option>
        ))}
      </select>
    </label>
  );
}

function enumValue(value: string) {
  return value.toUpperCase().replace(/\s+/g, "_");
}

function FormFooter({
  state,
  buttonLabel,
}: {
  state: FormState;
  buttonLabel: string;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <Status state={state} />
      <button
        type="submit"
        disabled={state.status === "loading"}
        className="rounded-md bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-slate-950/15 hover:-translate-y-0.5 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
      >
        {buttonLabel}
      </button>
    </div>
  );
}
