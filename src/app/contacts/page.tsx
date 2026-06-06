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
          { label: "Total contacts", value: contacts.length.toString() },
          { label: "Primary contacts", value: primary.toString() },
          {
            label: "Companies",
            value: new Set(contacts.map((c) => c.shipperId)).size.toString(),
          },
        ].map((item) => (
          <article
            key={item.label}
            className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
          >
            <p className="text-sm font-medium text-slate-600">{item.label}</p>
            <p className="mt-2 text-3xl font-semibold">{item.value}</p>
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
        <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4">
            <p className="text-sm font-semibold text-slate-700">
              {contacts.length} contacts
            </p>
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
