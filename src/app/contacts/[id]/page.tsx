import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Building2, Mail, Phone, Star } from "lucide-react";

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
      active="Companies"
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
        <article className="rounded-lg border border-white bg-white p-5 shadow-lg shadow-slate-950/5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-2xl font-semibold">{contact.fullName}</h2>
              {contact.title && (
                <p className="mt-1 text-sm font-medium text-slate-600">{contact.title}</p>
              )}
            </div>
            {contact.isPrimary && (
              <span className="flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
                <Star className="h-3 w-3" />
                Primary
              </span>
            )}
          </div>

          <div className="mt-5 grid gap-3 text-sm text-slate-700">
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
        </article>

        <article className="rounded-lg border border-white bg-white p-5 shadow-lg shadow-slate-950/5">
          <h2 className="text-xl font-semibold">Edit contact</h2>
          <div className="mt-4">
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
        <section className="rounded-lg border border-white bg-white p-5 shadow-lg shadow-slate-950/5">
          <h2 className="text-xl font-semibold">Linked leads</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
        </section>
      )}

      {contact.activities.length > 0 && (
        <section className="rounded-lg border border-white bg-white p-5 shadow-lg shadow-slate-950/5">
          <h2 className="text-xl font-semibold">Activity history</h2>
          <div className="mt-4 grid gap-3">
            {contact.activities.map((activity, i) => (
              <div
                key={i}
                className="rounded-md border border-slate-100 bg-slate-50 p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
                    {activity.type}
                  </span>
                  <span className="text-xs text-slate-500">{activity.time}</span>
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-700">{activity.detail}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </InternalShell>
  );
}
