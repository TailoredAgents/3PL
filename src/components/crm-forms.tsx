"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, PlayCircle, FileSearch } from "lucide-react";
import type { DocumentStructuredFields } from "@/lib/documents";

type FormState = {
  status: "idle" | "loading" | "success" | "error";
  message?: string;
};

type AgentResult = {
  summary: string;
  confidence: number;
  nextAction: string;
};

type UserOption = {
  id: string;
  name: string;
  email: string;
  role: string;
  clerkUserId?: string | null;
  invitationStatus?: string | null;
  invitationSentAt?: string | null;
  lastClerkSyncedAt?: string | null;
  deactivatedAt?: string | null;
};

type CommissionPlanFormValue = {
  managingUserPercent: number;
  customerOwnerPercent: number;
  houseOwnerPercent: number;
  companyPercent: number;
  houseOwnerUserId: string | null;
  notes: string | null;
};

async function submit(endpoint: string, form: HTMLFormElement, method: string) {
  const response = await fetch(endpoint, {
    method,
    body: new FormData(form),
  });
  const payload = (await response.json()) as {
    message?: string;
    error?: string;
    redirectTo?: string;
    agentResult?: AgentResult;
  };

  if (!response.ok) {
    throw new Error(payload.error ?? "Request failed.");
  }

  return {
    message: payload.message ?? "Saved.",
    redirectTo: payload.redirectTo,
    agentResult: payload.agentResult,
  };
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
      const { message, redirectTo } = await submit(endpoint, form, method);
      form.reset();
      setState({ status: "success", message });
      if (redirectTo) {
        router.push(redirectTo);
      } else {
        router.refresh();
      }
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
  "rounded-md border border-slate-200 bg-white px-3 py-2.5 font-normal text-slate-950 shadow-sm outline-none ring-0 focus:border-emerald-500 focus:shadow-md focus:shadow-emerald-950/5 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-emerald-400 dark:focus:shadow-emerald-950/20";

type QuoteFieldDefaults = Record<string, string | number | boolean | undefined>;

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
      <label className="grid gap-2 text-sm font-semibold text-slate-800 dark:text-slate-200">
        CSV file
        <input
          required
          name="csv"
          type="file"
          accept=".csv"
          className="rounded-md border border-dashed border-slate-300 bg-white px-3 py-3 text-sm font-normal shadow-sm file:mr-3 file:rounded-md file:border-0 file:bg-slate-950 file:px-3 file:py-2 file:text-white hover:border-emerald-300 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:file:bg-slate-100 dark:file:text-slate-950 dark:hover:border-emerald-500"
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

export function ShipperEditForm({
  shipperId,
  defaults,
}: {
  shipperId: string;
  defaults: {
    companyName: string;
    industry: string;
    website: string;
    status: string;
    notes: string;
    portalEnabled: boolean;
  };
}) {
  const { state, onSubmit } = useCrmSubmit(`/api/shippers/${shipperId}`, "PATCH");

  return (
    <form className="grid gap-3" onSubmit={onSubmit}>
      <Field name="companyName" label="Company name" required defaultValue={defaults.companyName} />
      <div className="grid gap-3 sm:grid-cols-2">
        <Field name="industry" label="Industry" defaultValue={defaults.industry} />
        <Field name="website" label="Website" defaultValue={defaults.website} />
      </div>
      <Select
        name="status"
        label="Status"
        options={["LEAD", "ACTIVE", "INACTIVE"]}
        defaultValue={defaults.status}
      />
      <Textarea name="notes" label="Notes / lane context" defaultValue={defaults.notes} />
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="portalEnabled" defaultChecked={defaults.portalEnabled} className="h-4 w-4" />
        Enable customer portal access
      </label>
      <FormFooter state={state} buttonLabel="Save shipper" />
    </form>
  );
}

export function ContactEditForm({
  contactId,
  defaults,
}: {
  contactId: string;
  defaults: {
    firstName: string;
    lastName: string;
    title: string;
    email: string;
    phone: string;
  };
}) {
  const { state, onSubmit } = useCrmSubmit(`/api/contacts/${contactId}`, "PATCH");

  return (
    <form className="grid gap-3" onSubmit={onSubmit}>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field name="firstName" label="First name" required defaultValue={defaults.firstName} />
        <Field name="lastName" label="Last name" defaultValue={defaults.lastName} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field name="title" label="Title" defaultValue={defaults.title} />
        <Field name="phone" label="Phone" defaultValue={defaults.phone} />
      </div>
      <Field name="email" label="Email" type="email" defaultValue={defaults.email} />
      <FormFooter state={state} buttonLabel="Save contact" />
    </form>
  );
}

export function LeadFollowUpCompleteForm({
  leadId,
  currentStage,
  currentPriority,
}: {
  leadId: string;
  currentStage: string;
  currentPriority: string;
}) {
  const { state, onSubmit } = useCrmSubmit(`/api/leads/${leadId}`, "PATCH");

  return (
    <form onSubmit={onSubmit} className="inline-flex">
      <input type="hidden" name="stage" value={enumValue(currentStage)} />
      <input type="hidden" name="priority" value={currentPriority} />
      <input type="hidden" name="nextFollowUpAt" value="" />
      <button
        type="submit"
        disabled={state.status === "loading"}
        className="inline-flex items-center gap-2 rounded-md bg-emerald-700 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-60"
      >
        {state.status === "loading" ? "Clearing..." : "Complete follow-up"}
      </button>
    </form>
  );
}

export function QuoteRequestCreateForm() {
  const { state, onSubmit } = useCrmSubmit("/api/quote-requests");

  return (
    <form className="grid gap-3" onSubmit={onSubmit}>
      <input type="hidden" name="intakeChannel" value="PHONE" />
      <QuoteRequestFieldset />
      <FormFooter state={state} buttonLabel="Create quote request" />
    </form>
  );
}

export function QuoteRequestEditForm({
  quoteId,
  defaults,
}: {
  quoteId: string;
  defaults: QuoteFieldDefaults;
}) {
  const { state, onSubmit } = useCrmSubmit(
    `/api/quote-requests/${quoteId}`,
    "PATCH",
  );

  return (
    <form className="grid gap-3" onSubmit={onSubmit}>
      <input type="hidden" name="intakeChannel" value={stringDefault(defaults.intakeChannel) ?? "PHONE"} />
      <QuoteRequestFieldset defaults={defaults} />
      <FormFooter state={state} buttonLabel="Save quote details" />
    </form>
  );
}

function QuoteRequestFieldset({ defaults = {} }: { defaults?: QuoteFieldDefaults }) {
  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field name="companyName" label="Company" required defaultValue={stringDefault(defaults.companyName)} />
        <Field name="contactName" label="Contact" defaultValue={stringDefault(defaults.contactName)} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field name="email" label="Email" type="email" defaultValue={stringDefault(defaults.email)} />
        <Field name="phone" label="Phone" defaultValue={stringDefault(defaults.phone)} />
      </div>
      <div className="grid gap-3 sm:grid-cols-4">
        <Field name="originCity" label="Origin city" required defaultValue={stringDefault(defaults.originCity)} />
        <Field name="originState" label="State" required placeholder="GA" defaultValue={stringDefault(defaults.originState)} />
        <Field name="destinationCity" label="Destination city" required defaultValue={stringDefault(defaults.destinationCity)} />
        <Field name="destinationState" label="State" required placeholder="TX" defaultValue={stringDefault(defaults.destinationState)} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field name="originAddress" label="Pickup address" defaultValue={stringDefault(defaults.originAddress)} />
        <Field name="destinationAddress" label="Delivery address" defaultValue={stringDefault(defaults.destinationAddress)} />
      </div>
      <div className="grid gap-3 sm:grid-cols-4">
        <Field name="pickupDate" label="Pickup" type="date" defaultValue={stringDefault(defaults.pickupDate)} />
        <Field name="pickupWindow" label="Pickup window" placeholder="0800-1200" defaultValue={stringDefault(defaults.pickupWindow)} />
        <Field name="deliveryDate" label="Delivery" type="date" defaultValue={stringDefault(defaults.deliveryDate)} />
        <Field name="deliveryWindow" label="Delivery window" placeholder="By appointment" defaultValue={stringDefault(defaults.deliveryWindow)} />
      </div>
      <div className="grid gap-3 sm:grid-cols-4">
        <Field name="equipmentType" label="Equipment" required defaultValue={stringDefault(defaults.equipmentType)} />
        <Field name="weight" label="Weight" type="number" defaultValue={stringDefault(defaults.weight)} />
        <Field name="palletCount" label="Pallets" type="number" defaultValue={stringDefault(defaults.palletCount)} />
        <Field name="pieceCount" label="Pieces" type="number" defaultValue={stringDefault(defaults.pieceCount)} />
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <Field name="commodity" label="Commodity" defaultValue={stringDefault(defaults.commodity)} />
        <Field name="dimensions" label="Dimensions" placeholder="48x40 pallets" defaultValue={stringDefault(defaults.dimensions)} />
        <Field name="temperatureRequirement" label="Temperature" placeholder="Frozen, 34-38F, none" defaultValue={stringDefault(defaults.temperatureRequirement)} />
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <Field name="customerReference" label="Customer ref / PO" defaultValue={stringDefault(defaults.customerReference)} />
        <Field name="urgency" label="Urgency" placeholder="Same day, this week" defaultValue={stringDefault(defaults.urgency)} />
        <Field name="targetMarginPercent" label="Target margin %" type="number" defaultValue={stringDefault(defaults.targetMarginPercent)} />
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <Checkbox name="hazmat" label="Hazmat" defaultChecked={Boolean(defaults.hazmat)} />
        <Checkbox name="appointmentRequired" label="Appointment required" defaultChecked={Boolean(defaults.appointmentRequired)} />
        <Checkbox name="quotedByPhone" label="Quoted by phone" defaultChecked={Boolean(defaults.quotedByPhone)} />
      </div>
      <Textarea name="accessorials" label="Accessorials" rows={2} defaultValue={stringDefault(defaults.accessorials)} />
      <Textarea name="pricingNotes" label="Pricing notes" rows={2} defaultValue={stringDefault(defaults.pricingNotes)} />
      <Textarea name="specialRequirements" label="Special requirements" defaultValue={stringDefault(defaults.specialRequirements)} />
    </>
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

export function LeadNoteForm({ leadId }: { leadId: string }) {
  const { state, onSubmit } = useCrmSubmit(`/api/leads/${leadId}/activities`);

  return (
    <form className="grid gap-3" onSubmit={onSubmit}>
      <input type="hidden" name="type" value="NOTE" />
      <input type="hidden" name="direction" value="INTERNAL" />
      <Field name="subject" label="Subject" defaultValue="Internal note" />
      <Textarea name="body" label="Note" rows={4} />
      <Field name="outcome" label="Outcome / next step" />
      <FormFooter state={state} buttonLabel="Add note" />
    </form>
  );
}

export function LeadClickToCallForm({
  leadId,
  defaultPhone,
}: {
  leadId: string;
  defaultPhone?: string;
}) {
  const { state, onSubmit } = useCrmSubmit(`/api/leads/${leadId}/outreach/call`);

  return (
    <form className="grid gap-3" onSubmit={onSubmit}>
      <Field
        name="toPhone"
        label="Call number"
        required
        defaultValue={defaultPhone}
      />
      <Textarea name="note" label="Call note" rows={2} />
      <FormFooter state={state} buttonLabel="Start click-to-call" />
    </form>
  );
}

export function LeadSmsForm({
  leadId,
  defaultPhone,
  defaultMessage,
}: {
  leadId: string;
  defaultPhone?: string;
  defaultMessage?: string;
}) {
  const { state, onSubmit } = useCrmSubmit(`/api/leads/${leadId}/outreach/sms`);

  return (
    <form className="grid gap-3" onSubmit={onSubmit}>
      <Field
        name="toPhone"
        label="SMS number"
        required
        defaultValue={defaultPhone}
      />
      <Textarea
        name="message"
        label="Message"
        rows={3}
        defaultValue={defaultMessage}
      />
      <FormFooter state={state} buttonLabel="Send SMS" />
    </form>
  );
}

export function LeadEmailForm({
  leadId,
  defaultEmail,
  defaultSubject,
  defaultBody,
}: {
  leadId: string;
  defaultEmail?: string;
  defaultSubject?: string;
  defaultBody?: string;
}) {
  const { state, onSubmit } = useCrmSubmit(
    `/api/leads/${leadId}/outreach/email`,
  );

  return (
    <form className="grid gap-3" onSubmit={onSubmit}>
      <Field
        name="toEmail"
        label="Email"
        type="email"
        required
        defaultValue={defaultEmail}
      />
      <Field
        name="subject"
        label="Subject"
        required
        defaultValue={defaultSubject}
      />
      <Textarea
        name="body"
        label="Message"
        rows={4}
        defaultValue={defaultBody}
      />
      <FormFooter state={state} buttonLabel="Send email" />
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
      <div className="grid gap-3 sm:grid-cols-3">
        <Field name="authorityStatus" label="Authority status" />
        <Field name="insuranceStatus" label="Insurance status" />
        <Field name="safetyRating" label="Safety rating" />
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <Field name="fraudRiskLevel" label="Fraud risk" />
        <Field name="lastVettedAt" label="Last vetted" type="date" />
        <Field name="approvedBy" label="Approved by" />
      </div>
      <Textarea name="complianceNotes" label="Compliance notes" rows={2} />
      <div className="grid gap-3 sm:grid-cols-2">
        <Field name="insuranceExpiration" label="Insurance expiration" type="date" />
        <Field name="paymentSetup" label="Payment setup (e.g. ACH, Factoring Co)" />
      </div>
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
      <div className="grid gap-3 sm:grid-cols-2">
        <Field name="originAddress" label="Pickup address" />
        <Field name="destinationAddress" label="Delivery address" />
      </div>
      <div className="grid gap-3 sm:grid-cols-4">
        <Field name="equipmentType" label="Equipment" required />
        <Field name="pickupDate" label="Pickup" type="date" />
        <Field name="pickupWindow" label="Pickup window" />
        <Field name="deliveryDate" label="Delivery" type="date" />
        <Field name="deliveryWindow" label="Delivery window" />
      </div>
      <div className="grid gap-3 sm:grid-cols-4">
        <Field name="commodity" label="Commodity" />
        <Field name="weight" label="Weight" type="number" />
        <Field name="palletCount" label="Pallets" type="number" />
        <Field name="pieceCount" label="Pieces" type="number" />
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <Field name="dimensions" label="Dimensions" />
        <Field name="temperatureRequirement" label="Temperature" />
        <Field name="customerReference" label="Customer ref / PO" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Checkbox name="hazmat" label="Hazmat" />
        <Checkbox name="appointmentRequired" label="Appointment required" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field name="customerRate" label="Customer rate" type="number" required />
        <Field name="carrierRate" label="Carrier rate" type="number" />
      </div>
      <Textarea name="accessorials" label="Accessorials" rows={2} />
      <Textarea name="notes" label="Load notes" />
      <FormFooter state={state} buttonLabel="Create load" />
    </form>
  );
}

export function LoadUpdateForm({
  loadId,
  currentStatus,
  currentCarrier,
  currentCarrierRate,
}: {
  loadId: string;
  currentStatus: string;
  currentCarrier?: string;
  currentCarrierRate?: number;
}) {
  const { state, onSubmit } = useCrmSubmit(`/api/loads/${loadId}`, "PATCH");

  return (
    <form className="grid gap-3" onSubmit={onSubmit}>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field
          name="carrierCompanyName"
          label="Carrier"
          defaultValue={
            currentCarrier && currentCarrier !== "Carrier needed"
              ? currentCarrier
              : undefined
          }
        />
        <Field
          name="carrierRate"
          label="Carrier rate"
          type="number"
          defaultValue={currentCarrierRate ? currentCarrierRate.toString() : undefined}
        />
      </div>
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
        <Field name="deliveryDate" label="Delivery date" type="date" />
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

export function QuoteConvertForm({
  quoteId,
  defaultCustomerRate,
  defaultCarrierRate,
}: {
  quoteId: string;
  defaultCustomerRate?: number;
  defaultCarrierRate?: number;
}) {
  const { state, onSubmit } = useCrmSubmit(
    `/api/quote-requests/${quoteId}/convert-to-load`,
  );

  return (
    <form className="grid gap-3" onSubmit={onSubmit}>
      <div className="grid gap-3 sm:grid-cols-3">
        <Field
          name="customerRate"
          label="Customer rate"
          type="number"
          required
          defaultValue={defaultCustomerRate?.toString()}
        />
        <Field name="carrierCompanyName" label="Carrier" />
        <Field
          name="carrierRate"
          label="Carrier rate"
          type="number"
          defaultValue={defaultCarrierRate?.toString()}
        />
      </div>
      <FormFooter state={state} buttonLabel="Convert to load" />
    </form>
  );
}

export function CustomerQuoteCreateForm({
  quoteId,
  defaultQuotedRate,
  defaultTargetCarrierCost,
}: {
  quoteId: string;
  defaultQuotedRate?: number;
  defaultTargetCarrierCost?: number;
}) {
  const { state, onSubmit } = useCrmSubmit(
    `/api/quote-requests/${quoteId}/customer-quotes`,
  );

  return (
    <form className="grid gap-3" onSubmit={onSubmit}>
      <div className="grid gap-3 sm:grid-cols-3">
        <Field
          name="quotedRate"
          label="Customer quote"
          type="number"
          required
          defaultValue={defaultQuotedRate?.toString()}
        />
        <Field
          name="targetCarrierCost"
          label="Target carrier cost"
          type="number"
          defaultValue={defaultTargetCarrierCost?.toString()}
        />
        <Field name="validUntil" label="Valid until" type="datetime-local" />
      </div>
      <Textarea name="notes" label="Quote notes / customer response" />
      <FormFooter state={state} buttonLabel="Save customer quote" />
    </form>
  );
}

export function QuoteStatusUpdateForm({
  quoteId,
  status,
  label,
  notePlaceholder,
}: {
  quoteId: string;
  status: "NEW" | "PRICING" | "QUOTED" | "ACCEPTED" | "REJECTED";
  label: string;
  notePlaceholder?: string;
}) {
  const { state, onSubmit } = useCrmSubmit(
    `/api/quote-requests/${quoteId}/status`,
    "PATCH",
  );

  return (
    <form className="grid gap-3" onSubmit={onSubmit}>
      <input type="hidden" name="status" value={status} />
      <Textarea
        name="note"
        label="Status note"
        placeholder={notePlaceholder}
        rows={2}
      />
      <FormFooter state={state} buttonLabel={label} />
    </form>
  );
}

export function QuoteEmailSendForm({
  quoteId,
  toEmail,
  subject,
  body,
}: {
  quoteId: string;
  toEmail: string;
  subject: string;
  body: string;
}) {
  const { state, onSubmit } = useCrmSubmit(
    `/api/quote-requests/${quoteId}/quote-email`,
  );

  return (
    <form className="grid gap-3" onSubmit={onSubmit}>
      <Field
        name="toEmail"
        label="To"
        type="email"
        required
        defaultValue={toEmail}
      />
      <Field name="subject" label="Subject" required defaultValue={subject} />
      <Textarea name="body" label="Email body" defaultValue={body} rows={10} />
      <FormFooter state={state} buttonLabel="Send / log quote email" />
    </form>
  );
}

export function RateBenchmarkCreateForm({ quoteId }: { quoteId: string }) {
  const { state, onSubmit } = useCrmSubmit(
    `/api/quote-requests/${quoteId}/rate-benchmarks`,
  );

  return (
    <form className="grid gap-3" onSubmit={onSubmit}>
      <div className="grid gap-3 sm:grid-cols-3">
        <Select
          name="source"
          label="Source"
          options={[
            "MANUAL",
            "INTERNAL_HISTORY",
            "DAT",
            "TRUCKSTOP",
            "CARRIER_QUOTE",
            "CUSTOMER_HISTORY",
            "OTHER",
          ]}
        />
        <Field name="sourceLabel" label="Source label" placeholder="DAT spot, broker note" />
        <Field name="confidence" label="Confidence 0-1" type="number" />
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <Field name="lowRate" label="Low rate" type="number" />
        <Field name="averageRate" label="Average rate" type="number" required />
        <Field name="highRate" label="High rate" type="number" />
      </div>
      <Textarea name="notes" label="Benchmark notes" rows={2} />
      <FormFooter state={state} buttonLabel="Save benchmark" />
    </form>
  );
}

export function MarketRateFetchForm({ quoteId }: { quoteId: string }) {
  const { state, onSubmit } = useCrmSubmit(
    `/api/quote-requests/${quoteId}/market-rates`,
  );

  return (
    <form onSubmit={onSubmit}>
      <FormFooter state={state} buttonLabel="Fetch DAT / Truckstop rates" />
    </form>
  );
}

export function PricingRecommendationCreateForm({
  quoteId,
  defaultCarrierCost,
  defaultCustomerRate,
  defaultTargetMarginPercent,
}: {
  quoteId: string;
  defaultCarrierCost?: number;
  defaultCustomerRate?: number;
  defaultTargetMarginPercent?: string;
}) {
  const { state, onSubmit } = useCrmSubmit(
    `/api/quote-requests/${quoteId}/pricing-recommendations`,
  );

  return (
    <form className="grid gap-3" onSubmit={onSubmit}>
      <input type="hidden" name="source" value="MANUAL" />
      <div className="grid gap-3 sm:grid-cols-3">
        <Field
          name="recommendedCarrierCost"
          label="Target carrier cost"
          type="number"
          required
          defaultValue={defaultCarrierCost?.toString()}
        />
        <Field
          name="recommendedCustomerRate"
          label="Recommended customer rate"
          type="number"
          required
          defaultValue={defaultCustomerRate?.toString()}
        />
        <Field
          name="targetMarginPercent"
          label="Target margin %"
          type="number"
          defaultValue={defaultTargetMarginPercent}
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field name="riskLevel" label="Risk level" placeholder="Low, medium, high" />
        <Field name="validForHours" label="Valid hours" type="number" />
      </div>
      <Textarea name="summary" label="Recommendation summary" rows={2} />
      <Textarea name="notes" label="Pricing notes" rows={2} />
      <FormFooter state={state} buttonLabel="Save recommendation" />
    </form>
  );
}

export function PricingRecommendationGenerateForm({ quoteId }: { quoteId: string }) {
  const { state, onSubmit } = useCrmSubmit(
    `/api/quote-requests/${quoteId}/pricing-recommendations/generate`,
  );

  return (
    <form onSubmit={onSubmit}>
      <FormFooter state={state} buttonLabel="Generate system recommendation" />
    </form>
  );
}

export function LaneQuoteTemplateCreateForm({
  shipperOptions,
}: {
  shipperOptions: { id: string; companyName: string }[];
}) {
  const { state, onSubmit } = useCrmSubmit("/api/lane-quote-templates");

  return (
    <form className="grid gap-3" onSubmit={onSubmit}>
      <Field name="name" label="Template name" required placeholder="Apex ATL to Nashville dry van" />
      <ShipperSelect shipperOptions={shipperOptions} />
      <div className="grid gap-3 sm:grid-cols-2">
        <Field name="originCity" label="Origin city" required />
        <Field name="originState" label="Origin state" required />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field name="destinationCity" label="Destination city" required />
        <Field name="destinationState" label="Destination state" required />
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <Field name="equipmentType" label="Equipment" required placeholder="Dry Van" />
        <Field name="targetCarrierCost" label="Target carrier cost" type="number" />
        <Field name="customerRate" label="Customer rate" type="number" />
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <Field name="targetMarginPercent" label="Target margin %" type="number" />
        <Field name="pickupWindow" label="Pickup window" />
        <Field name="deliveryWindow" label="Delivery window" />
      </div>
      <Field name="commodity" label="Commodity" />
      <Textarea name="accessorials" label="Accessorials" rows={2} />
      <Textarea name="notes" label="Template notes" rows={2} />
      <FormFooter state={state} buttonLabel="Save template" />
    </form>
  );
}

export function LaneMarginRuleCreateForm({
  shipperOptions,
}: {
  shipperOptions: { id: string; companyName: string }[];
}) {
  const { state, onSubmit } = useCrmSubmit("/api/lane-margin-rules");

  return (
    <form className="grid gap-3" onSubmit={onSubmit}>
      <Field name="name" label="Rule name" required placeholder="Default dry van margin" />
      <ShipperSelect shipperOptions={shipperOptions} />
      <div className="grid gap-3 sm:grid-cols-2">
        <Field name="originCity" label="Origin city" />
        <Field name="originState" label="Origin state" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field name="destinationCity" label="Destination city" />
        <Field name="destinationState" label="Destination state" />
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <Field name="equipmentType" label="Equipment" placeholder="Dry Van" />
        <Field name="urgency" label="Urgency" placeholder="Same day" />
        <Field name="priority" label="Priority 1-10" type="number" defaultValue="3" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field name="targetMarginPercent" label="Target margin %" type="number" required />
        <Field name="minimumMarginPercent" label="Minimum margin %" type="number" />
      </div>
      <Textarea name="notes" label="Rule notes" rows={2} />
      <FormFooter state={state} buttonLabel="Save rule" />
    </form>
  );
}

export function DocumentCreateForm({
  loadId,
  relatedEntityType,
  relatedEntityId,
}: {
  loadId?: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
}) {
  const endpoint = loadId ? `/api/loads/${loadId}/documents` : "/api/documents";
  const { state, onSubmit } = useCrmSubmit(endpoint);

  return (
    <form className="grid gap-3" onSubmit={onSubmit}>
      {relatedEntityType && relatedEntityId ? (
        <>
          <input type="hidden" name="relatedEntityType" value={relatedEntityType} />
          <input type="hidden" name="relatedEntityId" value={relatedEntityId} />
        </>
      ) : !loadId ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <Select
            name="relatedEntityType"
            label="Record type"
            options={["LOAD", "SHIPPER", "QUOTE_REQUEST", "CARRIER", "SAVINGS_AUDIT"]}
          />
          <Field name="relatedEntityId" label="Record ID" required />
        </div>
      ) : null}
      <div className="grid gap-3 sm:grid-cols-2">
        <Select
          name="type"
          label="Type"
          options={["BOL", "POD", "RATE_CONFIRMATION", "INVOICE", "AUDIT_UPLOAD", "W9", "CERTIFICATE_OF_INSURANCE", "BROKER_CARRIER_AGREEMENT", "OTHER"]}
        />
        <Field name="fileName" label="Document name" required />
      </div>
      <Field name="fileUrl" label="Document URL" placeholder="Optional if uploading a file" />
      <label className="grid gap-2 text-sm font-semibold text-slate-800 dark:text-slate-200">
        Upload file
        <input
          name="file"
          type="file"
          accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx,.csv,.xlsx"
          className="rounded-md border border-dashed border-slate-300 bg-white px-3 py-3 text-sm font-normal shadow-sm file:mr-3 file:rounded-md file:border-0 file:bg-slate-950 file:px-3 file:py-2 file:text-white hover:border-emerald-300 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:file:bg-slate-100 dark:file:text-slate-950 dark:hover:border-emerald-500"
        />
      </label>
      <Textarea name="extractedText" label="Notes / extracted text" />
      <FormFooter state={state} buttonLabel="Add document" />
    </form>
  );
}

function ShipperSelect({
  shipperOptions,
}: {
  shipperOptions: { id: string; companyName: string }[];
}) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-slate-800 dark:text-slate-200">
      Customer scope
      <select name="shipperId" className={inputClass} defaultValue="">
        <option value="">Any customer</option>
        {shipperOptions.map((shipper) => (
          <option key={shipper.id} value={shipper.id}>
            {shipper.companyName}
          </option>
        ))}
      </select>
    </label>
  );
}

export function InvoiceCreateForm({
  loadId,
  defaultAmount,
}: {
  loadId: string;
  defaultAmount: number;
}) {
  const { state, onSubmit } = useCrmSubmit(`/api/loads/${loadId}/invoice`);

  return (
    <form className="grid gap-3" onSubmit={onSubmit}>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field name="invoiceNumber" label="Invoice #" />
        <Field
          name="amount"
          label="Invoice amount"
          type="number"
          required
          defaultValue={defaultAmount.toString()}
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <Select
          name="status"
          label="Invoice status"
          options={["DRAFT", "SENT", "PARTIAL", "PAID", "OVERDUE"]}
        />
        <Field name="terms" label="Terms (e.g. Net 30)" />
        <Field name="dueDate" label="Due date" type="date" />
      </div>
      <FormFooter state={state} buttonLabel="Save invoice" />
    </form>
  );
}

export function CustomerUpdateForm({
  loadId,
  currentStatus,
}: {
  loadId: string;
  currentStatus: string;
}) {
  const { state, onSubmit } = useCrmSubmit(`/api/loads/${loadId}/customer-update`);

  return (
    <form className="grid gap-3" onSubmit={onSubmit}>
      <div className="grid gap-3 sm:grid-cols-2">
        <Select
          name="customerUpdateStatus"
          label="Customer update status"
          options={["NOT_NEEDED", "NEEDED", "SENT"]}
          defaultValue={enumValue(currentStatus)}
        />
        <Field name="sentAt" label="Sent at" type="datetime-local" />
      </div>
      <Textarea name="message" label="Customer update note" />
      <FormFooter state={state} buttonLabel="Save customer update" />
    </form>
  );
}

export function LoadExceptionCreateForm({ loadId }: { loadId: string }) {
  const { state, onSubmit } = useCrmSubmit(`/api/loads/${loadId}/exceptions`);

  return (
    <form className="grid gap-3" onSubmit={onSubmit}>
      <Field name="type" label="Exception type (e.g. PICKUP_RISK, MISSING_POD, LATE_DELIVERY)" required />
      <Textarea name="notes" label="Notes / details" />
      <FormFooter state={state} buttonLabel="Create exception" />
    </form>
  );
}

export function LoadExceptionUpdateForm({
  loadId,
  exceptionId,
  currentStatus,
}: {
  loadId: string;
  exceptionId: string;
  currentStatus: string;
}) {
  const { state, onSubmit } = useCrmSubmit(`/api/loads/${loadId}/exceptions`, "PATCH");

  return (
    <form className="grid gap-3" onSubmit={onSubmit}>
      <input type="hidden" name="exceptionId" value={exceptionId} />
      <Select
        name="status"
        label="Status"
        options={["OPEN", "ASSIGNED", "RESOLVED"]}
        defaultValue={currentStatus}
      />
      <Field name="ownerUserId" label="Assign to user ID (optional)" />
      <Textarea name="notes" label="Update notes" />
      <FormFooter state={state} buttonLabel="Update exception" />
    </form>
  );
}

export function RateConfirmationForm({
  loadId,
  currentStatus,
}: {
  loadId: string;
  currentStatus: string;
}) {
  const { state, onSubmit } = useCrmSubmit(
    `/api/loads/${loadId}/rate-confirmation`,
  );

  return (
    <form className="grid gap-3" onSubmit={onSubmit}>
      <Select
        name="rateConfirmationStatus"
        label="Rate confirmation status"
        options={["NOT_STARTED", "DRAFTED", "SENT", "SIGNED"]}
        defaultValue={enumValue(currentStatus)}
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <Field name="fileName" label="Document name" />
        <Field name="fileUrl" label="Document URL" />
      </div>
      <Textarea name="notes" label="Rate confirmation notes" rows={2} />
      <FormFooter state={state} buttonLabel="Update rate confirmation" />
    </form>
  );
}

export function RateConfirmationGenerateForm({ loadId }: { loadId: string }) {
  const { state, onSubmit } = useCrmSubmit(
    `/api/loads/${loadId}/rate-confirmation/generate`,
  );

  return (
    <form onSubmit={onSubmit}>
      <FormFooter state={state} buttonLabel="Draft rate confirmation" />
    </form>
  );
}

export function RateConfirmationSendForm({
  loadId,
  toEmail,
  subject,
  body,
}: {
  loadId: string;
  toEmail: string;
  subject: string;
  body: string;
}) {
  const { state, onSubmit } = useCrmSubmit(
    `/api/loads/${loadId}/rate-confirmation/send`,
  );

  return (
    <form className="grid gap-3" onSubmit={onSubmit}>
      <Field name="toEmail" label="Carrier dispatch email" defaultValue={toEmail} required />
      <Field name="subject" label="Subject" defaultValue={subject} required />
      <Textarea name="body" label="Carrier message" defaultValue={body} rows={7} />
      <FormFooter state={state} buttonLabel="Send rate confirmation" />
    </form>
  );
}

export function CarrierQuoteCreateForm({ loadId }: { loadId: string }) {
  const { state, onSubmit } = useCrmSubmit(`/api/loads/${loadId}/carrier-quotes`);

  return (
    <form className="grid gap-3" onSubmit={onSubmit}>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field name="carrierCompanyName" label="Carrier" required />
        <Field name="quotedRate" label="Carrier offer" type="number" required />
      </div>
      <Textarea name="notes" label="Offer notes / dispatch terms" />
      <FormFooter state={state} buttonLabel="Save carrier offer" />
    </form>
  );
}

export function CarrierCandidateCreateForm({ loadId }: { loadId: string }) {
  const { state, onSubmit } = useCrmSubmit(
    `/api/loads/${loadId}/carrier-candidates`,
  );

  return (
    <form className="grid gap-3" onSubmit={onSubmit}>
      <div className="grid gap-3 sm:grid-cols-3">
        <Select
          name="source"
          label="Source"
          options={[
            "MANUAL",
            "INTERNAL_HISTORY",
            "DAT",
            "TRUCKSTOP",
            "CARRIER_NETWORK",
            "OTHER",
          ]}
        />
        <Field name="companyName" label="Carrier" required />
        <Field name="suggestedRate" label="Target rate" type="number" />
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <Field name="contactName" label="Dispatch contact" />
        <Field name="phone" label="Phone" />
        <Field name="email" label="Email" type="email" />
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <Field name="mcNumber" label="MC number" />
        <Field name="dotNumber" label="DOT number" />
        <Field name="matchScore" label="Match 0-1" type="number" />
      </div>
      <Textarea
        name="complianceSnapshot"
        label="Compliance snapshot"
        rows={2}
      />
      <Textarea name="notes" label="Sourcing notes" rows={2} />
      <FormFooter state={state} buttonLabel="Save carrier candidate" />
    </form>
  );
}

export function CarrierCandidateGenerateForm({ loadId }: { loadId: string }) {
  const { state, onSubmit } = useCrmSubmit(
    `/api/loads/${loadId}/carrier-candidates/generate`,
  );

  return (
    <form onSubmit={onSubmit}>
      <input type="hidden" name="source" value="INTERNAL_HISTORY" />
      <FormFooter state={state} buttonLabel="Generate internal candidates" />
    </form>
  );
}

export function MarketplaceCapacitySearchForm({ loadId }: { loadId: string }) {
  const { state, onSubmit } = useCrmSubmit(
    `/api/loads/${loadId}/marketplace-capacity`,
  );

  return (
    <form onSubmit={onSubmit}>
      <FormFooter state={state} buttonLabel="Search DAT / Truckstop capacity" />
    </form>
  );
}

export function MarketplaceLoadPostForm({ loadId }: { loadId: string }) {
  const { state, onSubmit } = useCrmSubmit(
    `/api/loads/${loadId}/marketplace-posts`,
  );

  return (
    <form onSubmit={onSubmit}>
      <FormFooter state={state} buttonLabel="Post load to DAT / Truckstop" />
    </form>
  );
}

export function CarrierCandidateRequestQuoteForm({
  loadId,
  candidateId,
}: {
  loadId: string;
  candidateId: string;
}) {
  const { state, onSubmit } = useCrmSubmit(
    `/api/loads/${loadId}/carrier-candidates/${candidateId}/request-quote`,
  );

  return (
    <form className="grid gap-2" onSubmit={onSubmit}>
      <Field name="notes" label="Request note" />
      <FormFooter state={state} buttonLabel="Request quote" />
    </form>
  );
}

export function CarrierQuoteAcceptForm({
  loadId,
  carrierQuoteId,
}: {
  loadId: string;
  carrierQuoteId: string;
}) {
  const { state, onSubmit } = useCrmSubmit(
    `/api/loads/${loadId}/carrier-quotes/${carrierQuoteId}/accept`,
  );

  return (
    <form onSubmit={onSubmit}>
      <FormFooter state={state} buttonLabel="Accept offer" />
    </form>
  );
}

export function CarrierComplianceForm({
  carrierId,
  currentStatus,
}: {
  carrierId: string;
  currentStatus: string;
}) {
  const { state, onSubmit } = useCrmSubmit(`/api/carriers/${carrierId}`, "PATCH");

  return (
    <form className="grid gap-3" onSubmit={onSubmit}>
      <Select
        name="complianceStatus"
        label="Compliance"
        options={["PENDING", "APPROVED", "REJECTED", "EXPIRED"]}
        defaultValue={enumValue(currentStatus)}
      />
      <div className="grid gap-3 sm:grid-cols-3">
        <Field name="authorityStatus" label="Authority status" />
        <Field name="insuranceStatus" label="Insurance status" />
        <Field name="safetyRating" label="Safety rating" />
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <Field name="fraudRiskLevel" label="Fraud risk" />
        <Field name="lastVettedAt" label="Last vetted" type="date" />
        <Field name="approvedBy" label="Approved by" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field name="insuranceExpiration" label="Insurance expiration" type="date" />
        <Field name="w9ReceivedAt" label="W-9 received" type="date" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field name="agreementSignedAt" label="Broker-Carrier agreement signed" type="date" />
        <Field name="callbackVerifiedAt" label="Callback verified" type="date" />
      </div>
      <Field name="paymentSetup" label="Payment setup (ACH / Factoring)" />
      <Field name="blockedReason" label="Blocked reason (if any)" />
      <Textarea name="complianceNotes" label="Compliance notes" />
      <Textarea
        name="additionalContacts"
        label="Additional contacts (JSON array: [{name, title, phone, email}])"
        placeholder='[{"name":"Dispatch 2","phone":"555-1234"}]'
      />
      <Textarea name="callbackNotes" label="Callback verification notes" />
      <FormFooter state={state} buttonLabel="Update compliance" />
    </form>
  );
}

export function ShipperContactCreateForm({
  shipperId,
}: {
  shipperId: string;
}) {
  const { state, onSubmit } = useCrmSubmit(
    `/api/shippers/${shipperId}/contacts`,
    "POST",
  );

  return (
    <form className="grid gap-3" onSubmit={onSubmit}>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field name="firstName" label="First name" required />
        <Field name="lastName" label="Last name" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field name="title" label="Title / role" />
        <Field name="phone" label="Phone" />
      </div>
      <Field name="email" label="Email" type="email" />
      <label className="flex items-center gap-2 text-sm text-slate-700">
        <input type="checkbox" name="isPrimary" value="true" className="rounded" />
        Set as primary contact
      </label>
      <FormFooter state={state} buttonLabel="Add contact" />
    </form>
  );
}

export function ShipperLanesForm({
  shipperId,
  currentLanes,
}: {
  shipperId: string;
  currentLanes: string;
}) {
  const { state, onSubmit } = useCrmSubmit(
    `/api/shippers/${shipperId}/lanes`,
    "PATCH",
  );

  return (
    <form className="grid gap-3" onSubmit={onSubmit}>
      <Field
        name="lanes"
        label="Known lanes"
        defaultValue={currentLanes === "No lanes on file." ? "" : currentLanes}
        placeholder="Atlanta to Dallas; Savannah to Nashville"
      />
      <p className="text-xs text-slate-500">
        Separate multiple lanes with semicolons.
      </p>
      <FormFooter state={state} buttonLabel="Save lanes" />
    </form>
  );
}

export function SettingsForm({
  callRecordingDisclosure,
}: {
  callRecordingDisclosure: string;
}) {
  const { state, onSubmit } = useCrmSubmit("/api/settings", "PATCH");

  return (
    <form className="grid gap-3" onSubmit={onSubmit}>
      <Textarea
        name="callRecordingDisclosure"
        label="Call recording disclosure"
        defaultValue={callRecordingDisclosure}
        rows={5}
      />
      <FormFooter state={state} buttonLabel="Save settings" />
    </form>
  );
}

export function AdminUserForm() {
  const { state, onSubmit } = useCrmSubmit("/api/admin/users");

  return (
    <form className="grid gap-3" onSubmit={onSubmit}>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field name="name" label="Name" required />
        <Field name="email" label="Email" type="email" required />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Select
          name="role"
          label="Role"
          options={["OWNER", "ADMIN", "OPS", "SALES"]}
          required
        />
        <Field name="phone" label="Phone" />
      </div>
      <Checkbox
        name="sendInvite"
        label="Send or refresh Clerk invitation"
      />
      <FormFooter state={state} buttonLabel="Save user" />
    </form>
  );
}

export function CommissionPlanSettingsForm({
  plan,
  users,
}: {
  plan: CommissionPlanFormValue;
  users: UserOption[];
}) {
  const { state, onSubmit } = useCrmSubmit(
    "/api/admin/commission-plan",
    "PATCH",
  );

  return (
    <form className="grid gap-3" onSubmit={onSubmit}>
      <div className="grid gap-3 sm:grid-cols-4">
        <Field
          name="managingUserPercent"
          label="Manager %"
          type="number"
          defaultValue={plan.managingUserPercent.toString()}
          required
        />
        <Field
          name="customerOwnerPercent"
          label="Client owner %"
          type="number"
          defaultValue={plan.customerOwnerPercent.toString()}
          required
        />
        <Field
          name="houseOwnerPercent"
          label="Austin %"
          type="number"
          defaultValue={plan.houseOwnerPercent.toString()}
          required
        />
        <Field
          name="companyPercent"
          label="Company %"
          type="number"
          defaultValue={plan.companyPercent.toString()}
          required
        />
      </div>
      <UserSelect
        name="houseOwnerUserId"
        label="Austin / house owner user"
        users={users}
        defaultValue={plan.houseOwnerUserId ?? ""}
      />
      <Textarea
        name="notes"
        label="Commission notes"
        rows={2}
        defaultValue={plan.notes ?? undefined}
      />
      <FormFooter state={state} buttonLabel="Save commission plan" />
    </form>
  );
}

export function LoadCommissionAttributionForm({
  loadId,
  users,
  managingUserId,
  customerOwnerUserId,
}: {
  loadId: string;
  users: UserOption[];
  managingUserId?: string | null;
  customerOwnerUserId?: string | null;
}) {
  const { state, onSubmit } = useCrmSubmit(
    `/api/loads/${loadId}/commission-attribution`,
    "PATCH",
  );

  return (
    <form className="grid gap-3" onSubmit={onSubmit}>
      <div className="grid gap-3 sm:grid-cols-2">
        <UserSelect
          name="managingUserId"
          label="Load manager"
          users={users}
          defaultValue={managingUserId ?? ""}
        />
        <UserSelect
          name="customerOwnerUserId"
          label="Lifetime client owner"
          users={users}
          defaultValue={customerOwnerUserId ?? ""}
        />
      </div>
      <Checkbox
        name="applyToClient"
        label="Apply client owner to this shipper for future loads"
      />
      <FormFooter state={state} buttonLabel="Save attribution" />
    </form>
  );
}

export function QuoteEmailTemplateSettingsForm({
  subject,
  body,
}: {
  subject: string;
  body: string;
}) {
  const { state, onSubmit } = useCrmSubmit(
    "/api/settings/quote-email-template",
    "PATCH",
  );

  return (
    <form className="grid gap-3" onSubmit={onSubmit}>
      <Field name="subject" label="Subject template" defaultValue={subject} />
      <Textarea name="body" label="Body template" defaultValue={body} rows={12} />
      <FormFooter state={state} buttonLabel="Save quote email template" />
    </form>
  );
}

export function AiAgentRunForm({
  relatedEntityType,
  relatedEntityId,
  defaultAgent,
  agentOptions,
}: {
  relatedEntityType: "Lead" | "QuoteRequest" | "Load" | "Carrier";
  relatedEntityId: string;
  defaultAgent: string;
  agentOptions: string[];
}) {
  const [state, setState] = useState<FormState>({ status: "idle" });
  const [agentResult, setAgentResult] = useState<AgentResult | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setState({ status: "loading" });
    setAgentResult(null);

    try {
      const response = await submit("/api/agents/run", form, "POST");
      setState({ status: "success", message: response.message });
      setAgentResult(response.agentResult ?? null);
    } catch (error) {
      setState({
        status: "error",
        message: error instanceof Error ? error.message : "AI agent failed.",
      });
    }
  }

  return (
    <form className="grid gap-3" onSubmit={onSubmit}>
      <input type="hidden" name="relatedEntityType" value={relatedEntityType} />
      <input type="hidden" name="relatedEntityId" value={relatedEntityId} />
      <Select
        name="agentName"
        label="Agent"
        options={agentOptions}
        defaultValue={defaultAgent}
      />
      <FormFooter state={state} buttonLabel="Run AI agent" />
      {agentResult ? (
        <div className="rounded-md border border-emerald-100 bg-emerald-50 p-4 text-sm leading-6 text-emerald-950">
          <p className="font-semibold">Agent result</p>
          <p className="mt-2">{agentResult.summary}</p>
          <p className="mt-3 font-semibold">Next action</p>
          <p className="mt-1">{agentResult.nextAction}</p>
          <p className="mt-3 text-xs font-bold uppercase tracking-[0.14em] text-emerald-700">
            Confidence {Math.round(agentResult.confidence * 100)}%
          </p>
        </div>
      ) : null}
    </form>
  );
}

export function AgentRunApproveForm({ runId }: { runId: string }) {
  const { state, onSubmit } = useCrmSubmit(`/api/agents/${runId}/approve`);

  return (
    <form className="grid gap-2" onSubmit={onSubmit}>
      <Textarea
        name="reviewNotes"
        label="Review notes"
        rows={2}
        placeholder="Optional approval notes"
      />
      <FormFooter state={state} buttonLabel="Approve run" />
    </form>
  );
}

export function AgentRunRejectForm({ runId }: { runId: string }) {
  const { state, onSubmit } = useCrmSubmit(`/api/agents/${runId}/reject`);

  return (
    <form className="grid gap-2" onSubmit={onSubmit}>
      <Textarea
        name="reviewNotes"
        label="Reject reason"
        rows={2}
        placeholder="Optional reason for rejecting this recommendation"
      />
      <FormFooter state={state} buttonLabel="Reject run" />
    </form>
  );
}

export function AgentRunRetryForm({ runId }: { runId: string }) {
  const { state, onSubmit } = useCrmSubmit(`/api/agents/${runId}/retry`);

  return (
    <form onSubmit={onSubmit}>
      <FormFooter state={state} buttonLabel="Retry run" />
    </form>
  );
}

export function DailyBriefGenerateForm() {
  const { state, onSubmit } = useCrmSubmit("/api/agents/daily-brief/generate");

  return (
    <form onSubmit={onSubmit}>
      <FormFooter state={state} buttonLabel="Generate daily brief" />
    </form>
  );
}

export function DocumentAutomationRunForm() {
  const { state, onSubmit } = useCrmSubmit("/api/documents/automation/run");

  return (
    <form onSubmit={onSubmit}>
      <FormFooter state={state} buttonLabel="Run pending extraction" />
    </form>
  );
}

export function AgentModeToggleForm({
  agentName,
  currentMode,
}: {
  agentName: string;
  currentMode: string;
}) {
  const { state, onSubmit } = useCrmSubmit("/api/settings/agent-mode", "PATCH");

  return (
    <form className="grid gap-3" onSubmit={onSubmit}>
      <input type="hidden" name="agentName" value={agentName} />
      <div className="flex gap-5">
        {(["approve_first", "autonomous"] as const).map((mode) => (
          <label
            key={mode}
            className="flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-700"
          >
            <input
              type="radio"
              name="mode"
              value={mode}
              defaultChecked={currentMode === mode}
              className="accent-emerald-600"
            />
            {mode === "approve_first" ? "Approve first" : "Autonomous"}
          </label>
        ))}
      </div>
      <FormFooter state={state} buttonLabel="Save" />
    </form>
  );
}

export function AgentPromptTemplateForm({
  agentName,
  systemPrompt,
  task,
  placeholderNextAction,
}: {
  agentName: string;
  systemPrompt: string;
  task: string;
  placeholderNextAction: string;
}) {
  const { state, onSubmit } = useCrmSubmit("/api/agents/prompts", "PATCH");

  return (
    <form className="grid gap-3" onSubmit={onSubmit}>
      <input type="hidden" name="agentName" value={agentName} />
      <Textarea
        name="systemPrompt"
        label="System prompt"
        defaultValue={systemPrompt}
        rows={4}
      />
      <Textarea name="task" label="Task" defaultValue={task} rows={3} />
      <Textarea
        name="placeholderNextAction"
        label="Fallback next action"
        defaultValue={placeholderNextAction}
        rows={3}
      />
      <Field
        name="changeReason"
        label="Change reason"
        placeholder="Optional reason for this prompt version"
      />
      <FormFooter state={state} buttonLabel="Save prompt" />
    </form>
  );
}

export function CallTranscriptForm({
  callId,
  transcriptText,
}: {
  callId: string;
  transcriptText: string;
}) {
  const { state, onSubmit } = useCrmSubmit(`/api/calls/${callId}/transcript`, "PATCH");

  return (
    <form className="grid gap-3" onSubmit={onSubmit}>
      <Textarea
        name="transcriptText"
        label="Call transcript"
        defaultValue={transcriptText}
        rows={8}
      />
      <FormFooter state={state} buttonLabel="Save transcript" />
    </form>
  );
}

export function CallExtractionForm({ callId }: { callId: string }) {
  const [state, setState] = useState<FormState>({ status: "idle" });
  const [agentResult, setAgentResult] = useState<AgentResult | null>(null);
  const router = useRouter();

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setState({ status: "loading" });
    setAgentResult(null);

    try {
      const response = await submit(`/api/calls/${callId}/extract`, form, "POST");
      setState({ status: "success", message: response.message });
      setAgentResult(response.agentResult ?? null);
      router.refresh();
    } catch (error) {
      setState({
        status: "error",
        message:
          error instanceof Error ? error.message : "Call extraction failed.",
      });
    }
  }

  return (
    <form className="grid gap-3" onSubmit={onSubmit}>
      <FormFooter state={state} buttonLabel="Run call intake agent" />
      {agentResult ? (
        <div className="rounded-md border border-emerald-100 bg-emerald-50 p-4 text-sm leading-6 text-emerald-950">
          <p className="font-semibold">Extraction result</p>
          <p className="mt-2">{agentResult.summary}</p>
          <p className="mt-3 font-semibold">Next action</p>
          <p className="mt-1">{agentResult.nextAction}</p>
        </div>
      ) : null}
    </form>
  );
}

export function CallQuoteCreateForm({
  callId,
  defaults,
}: {
  callId: string;
  defaults: QuoteFieldDefaults;
}) {
  const { state, onSubmit } = useCrmSubmit(`/api/calls/${callId}/quote-request`);

  return (
    <form className="grid gap-3" onSubmit={onSubmit}>
      <input type="hidden" name="intakeChannel" value="PHONE_AI_REVIEW" />
      <QuoteRequestFieldset defaults={defaults} />
      <FormFooter state={state} buttonLabel="Create quote from call" />
    </form>
  );
}

// ─── Quick Quote (Communications workspace) ────────────────────────────────

type QuickQuoteState = {
  status: "idle" | "loading" | "success" | "error";
  message?: string;
  quoteRequestId?: string;
  pricingSummary?: string;
};

function useQuickQuoteSubmit(leadId: string) {
  const router = useRouter();
  const [state, setState] = useState<QuickQuoteState>({ status: "idle" });

  function reset() {
    setState({ status: "idle" });
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setState({ status: "loading" });

    try {
      const response = await fetch(`/api/leads/${leadId}/quick-quote`, {
        method: "POST",
        body: new FormData(form),
      });
      const payload = (await response.json()) as {
        message?: string;
        error?: string;
        quoteRequestId?: string;
        pricingSummary?: string | null;
      };

      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to create quote.");
      }

      form.reset();
      setState({
        status: "success",
        message: payload.message ?? "Quote created.",
        quoteRequestId: payload.quoteRequestId,
        pricingSummary: payload.pricingSummary ?? undefined,
      });
      router.refresh();
    } catch (error) {
      setState({
        status: "error",
        message: error instanceof Error ? error.message : "Failed to create quote.",
      });
    }
  }

  return { state, onSubmit, reset };
}

export function QuickQuoteForm({
  leadId,
  companyName,
  contactName,
}: {
  leadId: string;
  companyName: string;
  contactName?: string;
}) {
  const { state, onSubmit, reset } = useQuickQuoteSubmit(leadId);

  if (state.status === "success") {
    return (
      <div className="grid gap-3">
        <div className="rounded-md border border-emerald-100 bg-emerald-50 p-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-emerald-800">
            <CheckCircle2 className="h-4 w-4" />
            Quote created &amp; priced
          </p>
          {state.pricingSummary && (
            <p className="mt-2 text-sm leading-6 text-emerald-900">{state.pricingSummary}</p>
          )}
          {state.quoteRequestId && (
            <a
              href={`/quote-requests/${state.quoteRequestId}`}
              className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-800"
            >
              Open full quote →
            </a>
          )}
        </div>
        <button
          type="button"
          onClick={reset}
          className="text-xs font-semibold text-slate-500 hover:text-slate-700 text-left"
        >
          + Create another quote
        </button>
      </div>
    );
  }

  return (
    <form className="grid gap-2" onSubmit={onSubmit}>
      <input type="hidden" name="companyName" value={companyName} />
      {contactName && <input type="hidden" name="contactName" value={contactName} />}
      <input type="hidden" name="intakeChannel" value="COMMS" />
      <div className="grid grid-cols-2 gap-2">
        <Field name="originCity" label="Origin city" required />
        <Field name="originState" label="State" required placeholder="GA" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Field name="destinationCity" label="Dest city" required />
        <Field name="destinationState" label="State" required placeholder="TX" />
      </div>
      <Select
        name="equipmentType"
        label="Equipment"
        options={["Dry Van", "Reefer", "Flatbed", "Step Deck", "RGN", "Power Only", "Conestoga"]}
        required
      />
      <div className="grid grid-cols-2 gap-2">
        <Field name="pickupDate" label="Pickup date" type="date" />
        <Field name="weight" label="Weight (lbs)" type="number" />
      </div>
      <Field name="commodity" label="Commodity" placeholder="General freight" />
      {state.status === "error" && (
        <p className="text-xs font-medium text-red-600">{state.message}</p>
      )}
      <button
        type="submit"
        disabled={state.status === "loading"}
        className="mt-1 inline-flex items-center justify-center gap-2 rounded-md bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
      >
        {state.status === "loading" ? (
          <>
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Pricing...
          </>
        ) : (
          "Create & price quote"
        )}
      </button>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  required = false,
  placeholder,
  defaultValue,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  defaultValue?: string;
}) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-slate-800 dark:text-slate-200">
      {label}
      <input
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        defaultValue={defaultValue}
        className={inputClass}
      />
    </label>
  );
}

function Textarea({
  label,
  name,
  placeholder,
  defaultValue,
  rows = 3,
}: {
  label: string;
  name: string;
  placeholder?: string;
  defaultValue?: string;
  rows?: number;
}) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-slate-800 dark:text-slate-200">
      {label}
      <textarea
        name={name}
        rows={rows}
        placeholder={placeholder}
        defaultValue={defaultValue}
        className={inputClass}
      />
    </label>
  );
}

function Checkbox({
  label,
  name,
  defaultChecked = false,
}: {
  label: string;
  name: string;
  defaultChecked?: boolean;
}) {
  return (
    <label className="flex items-center gap-3 rounded-md border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-800 shadow-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200">
      <input
        name={name}
        type="checkbox"
        value="true"
        defaultChecked={defaultChecked}
        className="h-4 w-4 rounded border-slate-300 text-emerald-600"
      />
      {label}
    </label>
  );
}

function stringDefault(value: string | number | boolean | undefined) {
  if (value === undefined || typeof value === "boolean") {
    return undefined;
  }

  return String(value);
}

function Select({
  label,
  name,
  options,
  defaultValue,
  required = false,
}: {
  label: string;
  name: string;
  options: string[];
  defaultValue?: string;
  required?: boolean;
}) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-slate-800 dark:text-slate-200">
      {label}
      <select name={name} className={inputClass} defaultValue={defaultValue} required={required}>
        {options.map((option) => (
          <option key={option} value={option}>
            {option.replace("_", " ")}
          </option>
        ))}
      </select>
    </label>
  );
}

function UserSelect({
  label,
  name,
  users,
  defaultValue,
}: {
  label: string;
  name: string;
  users: UserOption[];
  defaultValue?: string;
}) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-slate-800 dark:text-slate-200">
      {label}
      <select name={name} className={inputClass} defaultValue={defaultValue}>
        <option value="">Unassigned</option>
        {users.map((user) => (
          <option key={user.id} value={user.id}>
            {user.name} ({user.role})
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

export function DocumentExtractionControl({
  documentId,
  extractionStatus,
  extractedText,
  extractedFields,
}: {
  documentId: string;
  extractionStatus: string;
  extractedText?: string | null;
  extractedFields?: DocumentStructuredFields | null;
}) {
  const [state, setState] = useState<FormState>({ status: "idle" });
  const [localText, setLocalText] = useState<string>(extractedText ?? "");
  const [localFields, setLocalFields] = useState<DocumentStructuredFields>(extractedFields ?? {});
  const [showReview, setShowReview] = useState<boolean>(false);
  const router = useRouter();

  const normalizedStatus = (extractionStatus || "Not Requested").toLowerCase();
  const hasText = Boolean(extractedText && extractedText.trim().length > 0);
  const hasStructured = extractedFields && Object.keys(extractedFields).length > 0;
  const canReview = hasText || hasStructured || normalizedStatus.includes("completed") || normalizedStatus.includes("pending");

  async function postExtract(body: { extractedText?: string; extractedFields?: DocumentStructuredFields } | null) {
    setState({ status: "loading" });
    try {
      const res = await fetch(`/api/documents/${documentId}/extract`, {
        method: "POST",
        headers: body ? { "Content-Type": "application/json" } : {},
        body: body ? JSON.stringify(body) : undefined,
      });
      const payload = (await res.json()) as {
        message?: string;
        error?: string;
        status?: string;
        extractedFields?: DocumentStructuredFields;
      };
      if (!res.ok) {
        throw new Error(payload.error ?? "Extraction request failed.");
      }
      setState({ status: "success", message: payload.message ?? "Done." });
      if (body?.extractedText !== undefined) {
        setLocalText(body.extractedText ?? "");
      }
      if (body?.extractedFields) {
        setLocalFields(body.extractedFields);
      }
      router.refresh();
    } catch (error) {
      setState({
        status: "error",
        message: error instanceof Error ? error.message : "Extraction failed.",
      });
    }
  }

  async function handleAutoExtract(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await postExtract(null);
  }

  async function handleSaveReview(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await postExtract({
      extractedText: localText,
      extractedFields: localFields
    });
    setShowReview(false);
  }

  // Helper to update a field in the structured review
  function updateField(key: keyof DocumentStructuredFields, value: string | number | null) {
    setLocalFields(prev => ({ ...prev, [key]: value === "" ? null : value }));
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        {normalizedStatus.includes("not requested") || normalizedStatus.includes("failed") ? (
          <form onSubmit={handleAutoExtract}>
            <button
              type="submit"
              disabled={state.status === "loading"}
              className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
            >
              <PlayCircle className="h-3.5 w-3.5" />
              {state.status === "loading" ? "Running..." : "Run extraction"}
            </button>
          </form>
        ) : null}

        {canReview ? (
          <button
            type="button"
            onClick={() => setShowReview((s) => !s)}
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            <FileSearch className="h-3.5 w-3.5" />
            {showReview ? "Hide review" : (hasStructured ? "Review structured" : hasText ? "Review text" : "Review")}
          </button>
        ) : null}
      </div>

      {state.message ? (
        <p className="text-[11px] text-slate-600">{state.message}</p>
      ) : null}

      {showReview ? (
        <form onSubmit={handleSaveReview} className="grid gap-3 rounded-md border border-slate-200 bg-white p-3">
          {/* Raw text review (existing) */}
          <div>
            <label className="text-xs font-semibold text-slate-700">Raw extracted text</label>
            <textarea
              value={localText}
              onChange={(e) => setLocalText(e.target.value)}
              rows={3}
              className="mt-1 w-full rounded-md border border-slate-200 bg-white p-2 text-xs font-mono text-slate-800 focus:border-emerald-400 focus:outline-none"
              placeholder="Edit raw text..."
            />
          </div>

          {/* Structured fields review (new for Phase 2.2) */}
          <div>
            <label className="text-xs font-semibold text-slate-700">Structured fields (review before use in loads/billing)</label>
            <div className="mt-1 grid grid-cols-2 gap-2 text-xs">
              {[
                ["bolNumber", "BOL #"],
                ["proNumber", "PRO #"],
                ["pieces", "Pieces"],
                ["weightLbs", "Weight (lbs)"],
                ["originCity", "Origin City"],
                ["originState", "Origin ST"],
                ["destinationCity", "Dest City"],
                ["destinationState", "Dest ST"],
                ["commodity", "Commodity"],
                ["rate", "Rate"],
                ["carrierName", "Carrier"],
                ["customerReference", "Cust Ref"],
              ].map(([key, label]) => (
                <label key={key} className="grid gap-0.5">
                  <span className="text-[10px] text-slate-600">{label}</span>
                  <input
                    type="text"
                    value={String((localFields as Record<string, unknown>)[key] ?? "")}
                    onChange={(e) => updateField(key as keyof DocumentStructuredFields, e.target.value)}
                    className="rounded border border-slate-200 px-1.5 py-0.5 text-xs"
                  />
                </label>
              ))}
            </div>
            <p className="mt-1 text-[10px] text-amber-700">
              These fields are for review only. They are not automatically applied to loads or invoices.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={state.status === "loading"}
              className="rounded-md bg-emerald-700 px-3 py-1 text-xs font-semibold text-white hover:bg-emerald-800 disabled:opacity-60"
            >
              Save reviewed text + fields
            </button>
            <button
              type="button"
              onClick={() => {
                setShowReview(false);
                setLocalText(extractedText ?? "");
                setLocalFields(extractedFields ?? {});
              }}
              className="rounded-md border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
          </div>
          <p className="text-[10px] text-slate-500">
            Saving marks status COMPLETED. Human review is required before any downstream automation uses these values.
          </p>
        </form>
      ) : null}
    </div>
  );
}
