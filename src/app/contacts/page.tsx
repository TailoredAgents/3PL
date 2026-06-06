import Link from "next/link";
import { Building2, Mail, Phone, Star, Users } from "lucide-react";

import { InternalShell } from "@/components/internal-shell";
import { getContactListViews } from "@/lib/crm";

export const dynamic = "force-dynamic";

export default async function ContactsPage() {
  const contacts = await getContactListViews();
  const primary = contacts.filter((c) => c.isPrimary).length;

  return (
    <InternalShell
      active="Contacts"
      eyebrow="People"
      title="Contacts"
      description="All shipper contacts across your customer base. Click a contact to view their detail, linked leads, and activity history."
      action={{ label: "Open Customers", href: "/shippers" }}
    >
      <section className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Total contacts", value: contacts.length.toString(), border: "border-l-[3px] border-l-sky-400", icon: "bg-sky-50 text-sky-700" },
          { label: "Primary contacts", value: primary.toString(), border: "border-l-[3px] border-l-emerald-400", icon: "bg-emerald-50 text-emerald-700" },
          { label: "Companies", value: new Set(contacts.map((c) => c.shipperId)).size.toString(), border: "border-l-[3px] border-l-violet-400", icon: "bg-violet-50 text-violet-700" },
        ].map((item) => (
          <article
            key={item.label}
            className={`overflow-hidden rounded-lg border border-slate-100 bg-white shadow-md shadow-slate-950/5 ${item.border}`}
          >
            <div className="p-5">
              <p className="text-sm font-medium text-slate-600">{item.label}</p>
              <p className="mt-2 text-3xl font-bold tracking-tight text-slate-950">{item.value}</p>
            </div>
          </article>
        ))}
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
        <section className="overflow-hidden rounded-lg border border-slate-100 bg-white shadow-md shadow-slate-950/5">
          <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-5 py-3">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-slate-400" />
              <p className="text-sm font-semibold text-slate-700">All contacts</p>
            </div>
            <span className="rounded-full bg-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-600">
              {contacts.length}
            </span>
          </div>
          <div className="divide-y divide-slate-100">
            {contacts.map((contact) => (
              <Link
                key={contact.id}
                href={`/contacts/${contact.id}`}
                className="grid grid-cols-[1fr_auto] items-center gap-4 px-5 py-4 hover:bg-slate-50"
              >
                <div className="grid gap-1 sm:grid-cols-[1.2fr_1fr_1fr_1fr] sm:items-center sm:gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-slate-950">
                        {contact.fullName}
                      </p>
                      {contact.isPrimary && (
                        <Star className="h-3.5 w-3.5 flex-none text-amber-500" />
                      )}
                    </div>
                    {contact.title && (
                      <p className="mt-0.5 text-xs text-slate-500">
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

                <span className="text-xs font-semibold text-emerald-700">
                  View →
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </InternalShell>
  );
}
