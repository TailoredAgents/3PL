"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2 } from "lucide-react";

type FormState = {
  status: "idle" | "loading" | "success" | "error";
  message?: string;
};

type AgentResult = {
  summary: string;
  confidence: number;
  nextAction: string;
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
  "rounded-md border border-slate-200 bg-white px-3 py-2.5 font-normal text-slate-950 shadow-sm outline-none ring-0 focus:border-emerald-500 focus:shadow-md focus:shadow-emerald-950/5";

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
      <input type="hidden" name="intakeChannel" value="PHONE" />
      <QuoteRequestFieldset />
      <FormFooter state={state} buttonLabel="Create quote request" />
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
      <div className="grid gap-3 sm:grid-cols-3">
        <Field
          name="amount"
          label="Invoice amount"
          type="number"
          required
          defaultValue={defaultAmount.toString()}
        />
        <Select
          name="status"
          label="Invoice status"
          options={["DRAFT", "SENT", "PARTIAL", "PAID", "OVERDUE"]}
        />
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
      <Textarea name="complianceNotes" label="Compliance notes" />
      <FormFooter state={state} buttonLabel="Update compliance" />
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
    <label className="grid gap-2 text-sm font-semibold text-slate-800">
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
  defaultValue,
  rows = 3,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  rows?: number;
}) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-slate-800">
      {label}
      <textarea
        name={name}
        rows={rows}
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
    <label className="flex items-center gap-3 rounded-md border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-800 shadow-sm">
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
