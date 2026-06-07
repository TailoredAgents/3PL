import Link from "next/link";
import { notFound } from "next/navigation";
import type { ComponentType, ReactNode } from "react";
import {
  ArrowLeft,
  Building2,
  ClipboardList,
  Download,
  FileText,
  Mail,
  MapPinned,
  Package,
  Pencil,
  Phone,
  Star,
  Truck,
  UserRound,
} from "lucide-react";

import {
  ShipperContactCreateForm,
  ShipperLanesForm,
} from "@/components/crm-forms";
import { InternalShell } from "@/components/internal-shell";
import { getShipperDetailView } from "@/lib/crm";
import { toCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

const CARD_ACCENTS = [
  { border: "border-l-[3px] border-l-sky-400", icon: "bg-sky-50 text-sky-700" },
  { border: "border-l-[3px] border-l-emerald-400", icon: "bg-emerald-50 text-emerald-700" },
  { border: "border-l-[3px] border-l-violet-400", icon: "bg-violet-50 text-violet-700" },
] as const;

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

  const summaryCards = [
    { icon: ClipboardList, label: "Open leads", value: shipper.leads.length.toString() },
    { icon: MapPinned, label: "Quote requests", value: shipper.quoteRequests.length.toString() },
    { icon: Truck, label: "Loads", value: shipper.loads.length.toString() },
  ];

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
        {/* Profile card */}
        <article className="overflow-hidden rounded-lg border border-slate-100 bg-white shadow-md shadow-slate-950/5">
          <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-5 py-3">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-slate-400" />
              <p className="text-sm font-semibold text-slate-700">{shipper.company}</p>
            </div>
            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
              {shipper.status}
            </span>
            {Boolean((shipper as Record<string, unknown>).portalEnabled) && (
              <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-800">
                Portal enabled
              </span>
            )}
          </div>
          <div className="p-5">
            <p className="text-xs font-medium text-slate-500">{shipper.industry}</p>
            <div className="mt-4 grid gap-3 text-sm text-slate-700">
              <div className="flex gap-3">
                <UserRound className="h-4 w-4 flex-none text-slate-400" />
                <span>{shipper.primaryContact}</span>
              </div>
              <div className="flex gap-3">
                <Mail className="h-4 w-4 flex-none text-slate-400" />
                <span>{shipper.email}</span>
              </div>
              <div className="flex gap-3">
                <Phone className="h-4 w-4 flex-none text-slate-400" />
                <span>{shipper.phone}</span>
              </div>
            </div>

            <div className="mt-5 rounded-md bg-slate-50 p-4">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                <MapPinned className="h-3.5 w-3.5" />
                Known lanes
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {shipper.lanes.length ? (
                  shipper.lanes.map((lane) => (
                    <span
                      key={lane}
                      className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700"
                    >
                      {lane}
                    </span>
                  ))
                ) : (
                  <p className="text-xs text-slate-400">No lanes on file.</p>
                )}
              </div>
            </div>

            {shipper.notes && (
              <div className="mt-4 rounded-md border border-slate-100 bg-slate-50 p-4">
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Account notes</p>
                <p className="mt-2 text-sm leading-6 text-slate-700">{shipper.notes}</p>
              </div>
            )}
          </div>
        </article>

        {/* Summary metric cards */}
        <div className="grid content-start gap-4 md:grid-cols-3 xl:grid-cols-1 xl:grid-rows-3">
          {summaryCards.map((card, i) => (
            <article
              key={card.label}
              className={`overflow-hidden rounded-lg border border-slate-100 bg-white shadow-md shadow-slate-950/5 ${CARD_ACCENTS[i].border}`}
            >
              <div className="p-5">
                <div className={`flex h-9 w-9 items-center justify-center rounded-md ${CARD_ACCENTS[i].icon}`}>
                  <card.icon className="h-4 w-4" />
                </div>
                <p className="mt-4 text-sm font-medium text-slate-600">{card.label}</p>
                <p className="mt-1 text-3xl font-bold tracking-tight text-slate-950">{card.value}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Contacts */}
      {shipper.contacts.length > 0 && (
        <article className="overflow-hidden rounded-lg border border-slate-100 bg-white shadow-md shadow-slate-950/5">
          <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-5 py-3">
            <div className="flex items-center gap-2">
              <UserRound className="h-4 w-4 text-slate-400" />
              <p className="text-sm font-semibold text-slate-700">Contacts</p>
            </div>
            <span className="rounded-full bg-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-600">
              {shipper.contacts.length}
            </span>
          </div>
          <div className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-3">
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
        </article>
      )}

      {/* Documents */}
      <article className="overflow-hidden rounded-lg border border-slate-100 bg-white shadow-md shadow-slate-950/5">
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-5 py-3">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-slate-400" />
            <p className="text-sm font-semibold text-slate-700">Documents</p>
          </div>
          <Link
            href={`/documents`}
            className="text-xs font-semibold text-emerald-700 hover:text-emerald-900"
          >
            Open document center
          </Link>
        </div>
        {shipper.documents.length ? (
          <div className="grid gap-3 p-5 md:grid-cols-2 xl:grid-cols-4">
            {shipper.documents.map((document) => (
              <div key={document.id} className="rounded-md border border-slate-100 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-950">{document.fileName}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {document.type} · {document.storageState}
                </p>
                {document.downloadHref ? (
                  <Link
                    href={document.downloadHref}
                    target="_blank"
                    className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-900"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Download
                  </Link>
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          <p className="px-5 py-8 text-center text-sm text-slate-400">
            No shipper-level documents logged yet.
          </p>
        )}
      </article>

      {/* Add contact + manage lanes */}
      <section className="grid gap-6 xl:grid-cols-2">
        <article className="overflow-hidden rounded-lg border border-slate-100 bg-white shadow-md shadow-slate-950/5">
          <details className="group">
            <summary className="flex cursor-pointer list-none items-center gap-2 border-b border-slate-100 bg-slate-50 px-5 py-3">
              <UserRound className="h-4 w-4 text-slate-400" />
              <p className="flex-1 text-sm font-semibold text-slate-700">Add contact</p>
              <span className="text-xs text-slate-400 group-open:hidden">Expand</span>
              <span className="hidden text-xs text-slate-400 group-open:inline">Collapse</span>
            </summary>
            <div className="p-5">
              <ShipperContactCreateForm shipperId={shipper.id} />
            </div>
          </details>
        </article>

        <article className="overflow-hidden rounded-lg border border-slate-100 bg-white shadow-md shadow-slate-950/5">
          <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-5 py-3">
            <MapPinned className="h-4 w-4 text-slate-400" />
            <p className="text-sm font-semibold text-slate-700">Manage lanes</p>
          </div>
          <div className="p-5">
            <ShipperLanesForm
              shipperId={shipper.id}
              currentLanes={shipper.lanes.join("; ")}
            />
          </div>
        </article>
      </section>

      {/* Related: leads, quotes, loads */}
      <section className="grid gap-6 xl:grid-cols-3">
        <RelatedPanel
          title="Leads"
          icon={ClipboardList}
          count={shipper.leads.length}
        >
          {shipper.leads.length ? (
            shipper.leads.map((lead) => (
              <Link
                key={lead.id}
                href={`/leads/${lead.id}`}
                className="block px-5 py-4 hover:bg-slate-50"
              >
                <p className="font-semibold text-slate-900">{lead.contact}</p>
                <p className="mt-1 text-sm text-slate-600">
                  {lead.stage} | {lead.nextFollowUp}
                </p>
                <p className="mt-1.5 text-sm leading-6 text-slate-600">
                  {lead.pain}
                </p>
              </Link>
            ))
          ) : (
            <p className="py-8 text-center text-sm text-slate-400">No leads tied to this shipper yet.</p>
          )}
        </RelatedPanel>

        <RelatedPanel
          title="Quote requests"
          icon={Package}
          count={shipper.quoteRequests.length}
        >
          {shipper.quoteRequests.length ? (
            shipper.quoteRequests.map((quote) => (
              <Link
                key={quote.id}
                href={`/quote-requests/${quote.id}`}
                className="block px-5 py-4 hover:bg-slate-50"
              >
                <p className="font-semibold text-slate-900">{quote.lane}</p>
                <p className="mt-1 text-sm text-slate-600">
                  {quote.status} | {quote.equipment} | {quote.pickup}
                </p>
                <p className="mt-1.5 text-sm leading-6 text-slate-600">
                  {quote.details}
                </p>
              </Link>
            ))
          ) : (
            <p className="py-8 text-center text-sm text-slate-400">No quote requests tied to this shipper yet.</p>
          )}
        </RelatedPanel>

        <RelatedPanel
          title="Loads"
          icon={Truck}
          count={shipper.loads.length}
        >
          {shipper.loads.length ? (
            shipper.loads.map((load) => (
              <Link
                key={load.id}
                href={`/loads/${load.id}`}
                className="block px-5 py-4 hover:bg-slate-50"
              >
                <p className="font-semibold text-slate-900">{load.lane}</p>
                <p className="mt-1 text-sm text-slate-600">
                  {load.status} | {load.carrier}
                </p>
                <p className="mt-1.5 text-sm text-slate-600">
                  Margin: {toCurrency(load.margin)} ({load.marginPercent}%)
                </p>
              </Link>
            ))
          ) : (
            <p className="py-8 text-center text-sm text-slate-400">No loads tied to this shipper yet.</p>
          )}
        </RelatedPanel>
      </section>
    </InternalShell>
  );
}

function RelatedPanel({
  title,
  icon: Icon,
  count,
  children,
}: {
  title: string;
  icon: ComponentType<{ className?: string }>;
  count: number;
  children: ReactNode;
}) {
  return (
    <article className="overflow-hidden rounded-lg border border-slate-100 bg-white shadow-md shadow-slate-950/5">
      <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-5 py-3">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-slate-400" />
          <p className="text-sm font-semibold text-slate-700">{title}</p>
        </div>
        <span className="rounded-full bg-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-600">
          {count}
        </span>
      </div>
      <div className="divide-y divide-slate-100">{children}</div>
    </article>
  );
}
