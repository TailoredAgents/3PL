import Link from "next/link";
import { notFound } from "next/navigation";
import type { ComponentType, ReactNode } from "react";
import {
  ArrowLeft,
  ClipboardList,
  Mail,
  MapPinned,
  Pencil,
  Phone,
  Star,
  Truck,
  UserRound,
} from "lucide-react";

import { InternalShell } from "@/components/internal-shell";
import { getShipperDetailView } from "@/lib/crm";
import { toCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ShipperDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const shipper = await getShipperDetailView(id);

  if (!shipper) {
    notFound();
  }

  return (
    <InternalShell
      active="Shippers"
      eyebrow="Shipper account"
      title={shipper.company}
      description="One account file for contacts, lane context, sales opportunities, quote requests, and booked freight."
      action={{ label: "Back to Shippers", href: "/shippers" }}
    >
      <div className="flex items-center justify-between gap-4">
        <Link
          href="/shippers"
          className="inline-flex w-fit items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-950"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to shipper accounts
        </Link>
        <Link
          href={`/shippers/${shipper.id}/edit`}
          className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:border-emerald-300 hover:text-emerald-700"
        >
          <Pencil className="h-4 w-4" />
          Edit shipper
        </Link>
      </div>

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-2xl font-semibold">{shipper.primaryContact}</h2>
              <p className="mt-2 text-sm font-medium text-slate-600">
                {shipper.industry}
              </p>
            </div>
            <span className="w-fit rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-800">
              {shipper.status}
            </span>
          </div>

          <div className="mt-6 grid gap-3 text-sm text-slate-700">
            <div className="flex gap-3">
              <UserRound className="h-5 w-5 flex-none text-slate-400" />
              <span>{shipper.primaryContact}</span>
            </div>
            <div className="flex gap-3">
              <Mail className="h-5 w-5 flex-none text-slate-400" />
              <span>{shipper.email}</span>
            </div>
            <div className="flex gap-3">
              <Phone className="h-5 w-5 flex-none text-slate-400" />
              <span>{shipper.phone}</span>
            </div>
          </div>

          <div className="mt-6 rounded-md bg-slate-50 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <MapPinned className="h-4 w-4 text-emerald-600" />
              Known lanes
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {shipper.lanes.map((lane) => (
                <span
                  key={lane}
                  className="rounded-full bg-white px-3 py-1 text-sm font-medium text-slate-700"
                >
                  {lane}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-6 rounded-md border border-slate-200 p-4">
            <p className="text-sm font-semibold text-slate-700">Account notes</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {shipper.notes}
            </p>
          </div>
        </article>

        <div className="grid gap-4 md:grid-cols-3">
          <SummaryCard
            icon={ClipboardList}
            label="Open leads"
            value={shipper.leads.length.toString()}
          />
          <SummaryCard
            icon={MapPinned}
            label="Quote requests"
            value={shipper.quoteRequests.length.toString()}
          />
          <SummaryCard
            icon={Truck}
            label="Loads"
            value={shipper.loads.length.toString()}
          />
        </div>
      </section>

      {shipper.contacts.length > 0 && (
        <section className="rounded-lg border border-white bg-white p-5 shadow-lg shadow-slate-950/5">
          <h2 className="text-xl font-semibold">Contacts</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {shipper.contacts.map((contact) => (
              <Link
                key={contact.id}
                href={`/contacts/${contact.id}`}
                className="rounded-md border border-slate-100 bg-slate-50 p-4 hover:border-emerald-200 hover:bg-white"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-slate-950">{contact.fullName}</p>
                    {contact.title && (
                      <p className="mt-0.5 text-xs text-slate-500">{contact.title}</p>
                    )}
                  </div>
                  {contact.isPrimary && (
                    <Star className="h-3.5 w-3.5 flex-none text-emerald-600" />
                  )}
                </div>
                <div className="mt-3 grid gap-1 text-xs text-slate-600">
                  {contact.email && (
                    <span className="flex items-center gap-1.5">
                      <Mail className="h-3 w-3 text-slate-400" />
                      {contact.email}
                    </span>
                  )}
                  {contact.phone && (
                    <span className="flex items-center gap-1.5">
                      <Phone className="h-3 w-3 text-slate-400" />
                      {contact.phone}
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="grid gap-6 xl:grid-cols-3">
        <RelatedPanel title="Leads">
          {shipper.leads.length ? (
            shipper.leads.map((lead) => (
              <Link
                key={lead.id}
                href={`/leads/${lead.id}`}
                className="block rounded-md bg-slate-50 p-4 hover:bg-slate-100"
              >
                <p className="font-semibold">{lead.contact}</p>
                <p className="mt-1 text-sm text-slate-600">
                  {lead.stage} | {lead.nextFollowUp}
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {lead.pain}
                </p>
              </Link>
            ))
          ) : (
            <EmptyState message="No leads tied to this shipper yet." />
          )}
        </RelatedPanel>

        <RelatedPanel title="Quote requests">
          {shipper.quoteRequests.length ? (
            shipper.quoteRequests.map((quote) => (
              <Link
                key={quote.id}
                href={`/quote-requests/${quote.id}`}
                className="block rounded-md bg-slate-50 p-4 hover:bg-slate-100"
              >
                <p className="font-semibold">{quote.lane}</p>
                <p className="mt-1 text-sm text-slate-600">
                  {quote.status} | {quote.equipment} | {quote.pickup}
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {quote.details}
                </p>
              </Link>
            ))
          ) : (
            <EmptyState message="No quote requests tied to this shipper yet." />
          )}
        </RelatedPanel>

        <RelatedPanel title="Loads">
          {shipper.loads.length ? (
            shipper.loads.map((load) => (
              <Link
                key={load.id}
                href={`/loads/${load.id}`}
                className="block rounded-md bg-slate-50 p-4 hover:bg-slate-100"
              >
                <p className="font-semibold">{load.lane}</p>
                <p className="mt-1 text-sm text-slate-600">
                  {load.status} | {load.carrier}
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Margin: {toCurrency(load.margin)} ({load.marginPercent}%)
                </p>
              </Link>
            ))
          ) : (
            <EmptyState message="No loads tied to this shipper yet." />
          )}
        </RelatedPanel>
      </section>
    </InternalShell>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <Icon className="h-5 w-5 text-emerald-600" />
      <p className="mt-3 text-sm font-medium text-slate-600">{label}</p>
      <p className="mt-1 text-3xl font-semibold">{value}</p>
    </article>
  );
}

function RelatedPanel({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-2xl font-semibold">{title}</h2>
      <div className="mt-5 grid gap-3">{children}</div>
    </article>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <p className="rounded-md bg-slate-50 p-4 text-sm text-slate-600">
      {message}
    </p>
  );
}
