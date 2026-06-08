import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  Building2,
  CheckCircle2,
  Mail,
  Phone,
  Star,
  UserRound,
} from "lucide-react";

import { InternalShell } from "@/components/internal-shell";
import { ContactEditForm } from "@/components/crm-forms";
import { getContactDetailView } from "@/lib/crm";

export const dynamic = "force-dynamic";

export default async function ContactDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const contact = await getContactDetailView(id);

  if (!contact) {
    notFound();
  }

  const missingFields = [
    !contact.email ? "email" : null,
    !contact.phone ? "phone" : null,
    !contact.isPrimary ? "primary flag" : null,
  ].filter(Boolean);
  const isOutreachReady = Boolean(
    contact.email && contact.phone && contact.isPrimary,
  );

  return (
    <InternalShell
      active="Shippers"
      eyebrow="Contact record"
      title={contact.fullName}
      description="Contact details, linked leads, and activity history."
      action={{ label: "Back to account", href: `/shippers/${contact.shipperId}` }}
    >
      <Link
        href={`/shippers/${contact.shipperId}`}
        className="inline-flex w-fit items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-950"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to {contact.company}
      </Link>

      <section
        className={`rounded-lg border p-5 shadow-sm ${
          isOutreachReady
            ? "border-emerald-200 bg-emerald-50 text-emerald-950"
            : "border-amber-200 bg-amber-50 text-amber-950"
        }`}
      >
        <div className="flex gap-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-white/70">
            {isOutreachReady ? (
              <CheckCircle2 className="h-5 w-5" />
            ) : (
              <AlertTriangle className="h-5 w-5" />
            )}
          </span>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] opacity-70">
              Contact readiness
            </p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight">
              {isOutreachReady
                ? "Ready for customer outreach"
                : "Finish the contact record"}
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 opacity-80">
              {isOutreachReady
                ? "This contact has the key fields needed for phone, email, and customer follow-up workflows."
                : `Add ${missingFields.join(", ")} before relying on automated follow-up or portal communication.`}
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        {/* Contact info */}
        <article className="overflow-hidden rounded-lg border border-slate-100 bg-white shadow-md shadow-slate-950/5">
          <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-5 py-3">
            <div className="flex items-center gap-2">
              <UserRound className="h-4 w-4 text-slate-400" />
              <p className="text-sm font-semibold text-slate-700">{contact.fullName}</p>
            </div>
            {contact.isPrimary && (
              <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
                <Star className="h-3 w-3" />
                Primary
              </span>
            )}
          </div>
          <div className="p-5">
            {contact.title && (
              <p className="text-xs font-medium text-slate-500">{contact.title}</p>
            )}
            <div className="mt-4 grid gap-3 text-sm text-slate-700">
              <ContactFact
                icon={<Building2 className="h-4 w-4 flex-none text-slate-400" />}
                label="Company"
              >
                <Link
                  href={`/shippers/${contact.shipperId}`}
                  className="font-medium hover:text-emerald-700"
                >
                  {contact.company}
                </Link>
              </ContactFact>
              <ContactFact
                icon={<Mail className="h-4 w-4 flex-none text-slate-400" />}
                label="Email"
              >
                {contact.email || (
                  <span className="font-semibold text-amber-700">
                    Email needed
                  </span>
                )}
              </ContactFact>
              <ContactFact
                icon={<Phone className="h-4 w-4 flex-none text-slate-400" />}
                label="Phone"
              >
                {contact.phone || (
                  <span className="font-semibold text-amber-700">
                    Phone needed
                  </span>
                )}
              </ContactFact>
            </div>
          </div>
        </article>

        {/* Edit contact */}
        <article className="overflow-hidden rounded-lg border border-slate-100 bg-white shadow-md shadow-slate-950/5">
          <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-5 py-3">
            <UserRound className="h-4 w-4 text-slate-400" />
            <p className="text-sm font-semibold text-slate-700">Edit contact</p>
          </div>
          <div className="p-5">
            <ContactEditForm
              contactId={contact.id}
              defaults={{
                firstName: contact.firstName,
                lastName: contact.lastName,
                title: contact.title,
                email: contact.email,
                phone: contact.phone,
              }}
            />
          </div>
        </article>
      </section>

      {contact.leads.length > 0 && (
        <article className="overflow-hidden rounded-lg border border-slate-100 bg-white shadow-md shadow-slate-950/5">
          <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-5 py-3">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-slate-400" />
              <p className="text-sm font-semibold text-slate-700">Linked leads</p>
            </div>
            <span className="rounded-full bg-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-600">
              {contact.leads.length}
            </span>
          </div>
          <div className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-3">
            {contact.leads.map((lead) => (
              <Link
                key={lead.id}
                href={`/leads/${lead.id}`}
                className="rounded-md border border-slate-100 bg-slate-50 p-4 hover:border-emerald-200 hover:bg-white"
              >
                <p className="font-semibold text-slate-950">{lead.company}</p>
                <p className="mt-1 text-sm text-slate-600">
                  {lead.stage} · {lead.nextFollowUp}
                </p>
              </Link>
            ))}
          </div>
        </article>
      )}

      {contact.activities.length > 0 && (
        <article className="overflow-hidden rounded-lg border border-slate-100 bg-white shadow-md shadow-slate-950/5">
          <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-5 py-3">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-slate-400" />
              <p className="text-sm font-semibold text-slate-700">Activity history</p>
            </div>
            <span className="rounded-full bg-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-600">
              {contact.activities.length}
            </span>
          </div>
          <div className="divide-y divide-slate-100">
            {contact.activities.map((activity, i) => (
              <div key={i} className="px-5 py-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
                    {activity.type}
                  </span>
                  <span className="text-xs text-slate-400">{activity.time}</span>
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-700">{activity.detail}</p>
              </div>
            ))}
          </div>
        </article>
      )}
    </InternalShell>
  );
}

function ContactFact({
  icon,
  label,
  children,
}: {
  icon: ReactNode;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="grid gap-1 rounded-md bg-slate-50 px-3 py-2">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
        {label}
      </p>
      <div className="flex items-center gap-3">
        {icon}
        <div className="min-w-0 text-slate-700">{children}</div>
      </div>
    </div>
  );
}
