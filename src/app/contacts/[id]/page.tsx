import Link from "next/link";
import { notFound } from "next/navigation";
import { Activity, ArrowLeft, Building2, Mail, Phone, Star, UserRound } from "lucide-react";

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
              <div className="flex items-center gap-3">
                <Building2 className="h-4 w-4 flex-none text-slate-400" />
                <Link
                  href={`/shippers/${contact.shipperId}`}
                  className="font-medium hover:text-emerald-700"
                >
                  {contact.company}
                </Link>
              </div>
              {contact.email && (
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 flex-none text-slate-400" />
                  <span>{contact.email}</span>
                </div>
              )}
              {contact.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 flex-none text-slate-400" />
                  <span>{contact.phone}</span>
                </div>
              )}
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
