import Link from "next/link";
import type { ReactNode } from "react";
import {
  ArrowRight,
  Building2,
  Mail,
  Phone,
  ShieldCheck,
  Star,
  UserCheck,
  Users,
} from "lucide-react";

import { InternalShell } from "@/components/internal-shell";
import { getContactListViews } from "@/lib/crm";

export const dynamic = "force-dynamic";

export default async function ContactsPage() {
  const contacts = await getContactListViews();
  const primary = contacts.filter((c) => c.isPrimary).length;
  const companies = new Set(contacts.map((c) => c.shipperId)).size;
  const withEmail = contacts.filter((c) => Boolean(c.email)).length;
  const withPhone = contacts.filter((c) => Boolean(c.phone)).length;
  const missingEmail = contacts.length - withEmail;
  const missingPrimary = Math.max(companies - primary, 0);
  const contactReadiness =
    contacts.length === 0
      ? {
          tone: "slate",
          label: "Build the contact file",
          body: "Add decision makers, dispatch contacts, AP contacts, and the best phone/email before relying on automated outreach.",
        }
      : missingPrimary > 0 || missingEmail > 0
        ? {
            tone: "amber",
            label: "Contact coverage needs cleanup",
            body: `${missingPrimary} companies need a primary contact and ${missingEmail} contacts need an email before portal and email workflows are fully reliable.`,
          }
        : {
            tone: "emerald",
            label: "Contact file is outreach-ready",
            body: "Primary contacts and email coverage are in place for the current customer file.",
          };
  const readinessClasses =
    contactReadiness.tone === "emerald"
      ? "border-emerald-200 bg-emerald-50 text-emerald-950"
      : contactReadiness.tone === "amber"
        ? "border-amber-200 bg-amber-50 text-amber-950"
        : "border-slate-200 bg-white text-slate-950";

  return (
    <InternalShell
      active="Contacts"
      eyebrow="People"
      title="Contacts"
      description="All shipper contacts across your customer base. Click a contact to view their detail, linked leads, and activity history."
      action={{ label: "Open Customers", href: "/shippers" }}
    >
      <section className="grid gap-4 md:grid-cols-4">
        <ContactMetric
          label="Total contacts"
          value={contacts.length.toString()}
          helper="People linked to shippers"
          icon={<Users className="h-4 w-4" />}
          accent="border-l-sky-400"
          iconClassName="bg-sky-50 text-sky-700"
        />
        <ContactMetric
          label="Primary contacts"
          value={primary.toString()}
          helper={`${missingPrimary} company gaps`}
          icon={<Star className="h-4 w-4" />}
          accent="border-l-amber-400"
          iconClassName="bg-amber-50 text-amber-700"
        />
        <ContactMetric
          label="Companies"
          value={companies.toString()}
          helper="Customer files represented"
          icon={<Building2 className="h-4 w-4" />}
          accent="border-l-emerald-400"
          iconClassName="bg-emerald-50 text-emerald-700"
        />
        <ContactMetric
          label="Email coverage"
          value={`${withEmail}/${contacts.length || 0}`}
          helper={`${missingEmail} missing email`}
          icon={<Mail className="h-4 w-4" />}
          accent="border-l-violet-400"
          iconClassName="bg-violet-50 text-violet-700"
        />
      </section>

      {contacts.length === 0 ? (
        <section className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-10 text-center">
          <Users className="mx-auto h-8 w-8 text-slate-400" />
          <p className="mt-4 font-semibold text-slate-700">No contacts yet</p>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Contacts are created from shipper records. Open a customer and add a
            contact from their detail page.
          </p>
          <Link
            href="/shippers"
            className="mt-4 inline-flex items-center gap-2 rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
          >
            Open Customers
          </Link>
        </section>
      ) : (
        <>
          <section className={`rounded-lg border p-5 shadow-sm ${readinessClasses}`}>
            <div className="grid gap-5 lg:grid-cols-[1fr_360px] lg:items-center">
              <div className="flex gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-white/70">
                  <ShieldCheck className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.24em] opacity-70">
                    Contact readiness
                  </p>
                  <h2 className="mt-2 text-2xl font-bold tracking-tight">
                    {contactReadiness.label}
                  </h2>
                  <p className="mt-2 max-w-3xl text-sm leading-6 opacity-80">
                    {contactReadiness.body}
                  </p>
                </div>
              </div>
              <div className="grid gap-2 rounded-lg border border-white/70 bg-white/70 p-3 text-slate-700">
                <ContactChecklistItem
                  label="Primary contacts"
                  value={`${primary}/${companies}`}
                />
                <ContactChecklistItem
                  label="Email-ready"
                  value={`${withEmail}/${contacts.length}`}
                />
                <ContactChecklistItem
                  label="Phone-ready"
                  value={`${withPhone}/${contacts.length}`}
                />
              </div>
            </div>
          </section>

          <section className="overflow-hidden rounded-lg border border-slate-100 bg-white shadow-md shadow-slate-950/5">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-slate-50 px-5 py-4">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-emerald-600" />
                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    Customer contact directory
                  </p>
                  <p className="text-xs text-slate-500">
                    Open a contact to review linked lead context and activity.
                  </p>
                </div>
              </div>
              <span className="rounded-full bg-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-600">
                {contacts.length} contacts
              </span>
            </div>
            <div className="divide-y divide-slate-100">
              {contacts.map((contact) => (
                <Link
                  key={contact.id}
                  href={`/contacts/${contact.id}`}
                  className="grid grid-cols-[1fr_auto] items-center gap-4 px-5 py-4 transition hover:bg-slate-50"
                >
                  <div className="grid gap-3 xl:grid-cols-[1.15fr_1fr_1fr_1fr] xl:items-center xl:gap-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-slate-950">
                          {contact.fullName}
                        </p>
                        {contact.isPrimary && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700">
                            <Star className="h-3 w-3" />
                            Primary
                          </span>
                        )}
                        {!contact.email && (
                          <span className="rounded-full bg-rose-50 px-2 py-0.5 text-xs font-semibold text-rose-700">
                            Email needed
                          </span>
                        )}
                      </div>
                      {contact.title && (
                        <p className="mt-1 text-xs text-slate-500">
                          {contact.title}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Building2 className="h-3.5 w-3.5 flex-none text-slate-400" />
                      <span className="truncate">{contact.company}</span>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Mail className="h-3.5 w-3.5 flex-none text-slate-400" />
                      <span className="truncate">
                        {contact.email || "No email"}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Phone className="h-3.5 w-3.5 flex-none text-slate-400" />
                      <span>{contact.phone || "No phone"}</span>
                    </div>
                  </div>

                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
                    View
                    <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </Link>
              ))}
            </div>
          </section>
        </>
      )}
    </InternalShell>
  );
}

function ContactMetric({
  label,
  value,
  helper,
  icon,
  accent,
  iconClassName,
}: {
  label: string;
  value: string;
  helper: string;
  icon: ReactNode;
  accent: string;
  iconClassName: string;
}) {
  return (
    <article
      className={`overflow-hidden rounded-lg border border-slate-100 border-l-[3px] bg-white shadow-md shadow-slate-950/5 ${accent}`}
    >
      <div className="p-5">
        <span
          className={`flex h-10 w-10 items-center justify-center rounded-lg ${iconClassName}`}
        >
          {icon}
        </span>
        <p className="mt-5 text-sm font-medium text-slate-600">{label}</p>
        <p className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
          {value}
        </p>
        <p className="mt-2 text-xs font-medium text-slate-400">{helper}</p>
      </div>
    </article>
  );
}

function ContactChecklistItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2">
      <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
        <UserCheck className="h-3.5 w-3.5 text-emerald-600" />
        {label}
      </span>
      <span className="text-sm font-bold text-slate-950">{value}</span>
    </div>
  );
}
