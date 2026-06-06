import Link from "next/link";
import {
  ClipboardList,
  Mail,
  MessageSquareText,
  PhoneCall,
} from "lucide-react";

import { CommunicationsWorkspace } from "@/components/communications-workspace";
import { InternalShell } from "@/components/internal-shell";
import { getCallViews } from "@/lib/calls";
import {
  getCommunicationWorkspaceView,
  getEmailEventDashboardView,
  getIntakeViews,
} from "@/lib/crm";

export const dynamic = "force-dynamic";

export default async function CommunicationsPage() {
  const [workspace, intakeItems, calls, emailDashboard] = await Promise.all([
    getCommunicationWorkspaceView(),
    getIntakeViews(),
    getCallViews(),
    getEmailEventDashboardView(),
  ]);
  const needsTranscript = calls.filter(
    (call) => call.transcriptStatus !== "Completed",
  ).length;
  const needsExtraction = calls.filter(
    (call) =>
      call.transcriptStatus === "Completed" &&
      call.extractionStatus === "Not Started",
  ).length;

  return (
    <InternalShell
      active="Communications"
      eyebrow="Customer contact"
      title="Communications"
      description="A CRM-style workspace for customer conversations, call/SMS/email actions, internal notes, and customer context."
      action={{ label: "Settings", href: "/settings" }}
    >
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          {
            icon: MessageSquareText,
            label: "Conversations",
            value: workspace.threads.length.toString(),
            note: "Customer communication threads",
            href: "/communications",
          },
          {
            icon: ClipboardList,
            label: "New requests",
            value: intakeItems.length.toString(),
            note: "Audits and quote forms",
            href: "/quote-requests",
          },
          {
            icon: PhoneCall,
            label: "Call work",
            value: (needsTranscript + needsExtraction).toString(),
            note: "Transcripts and AI extraction",
            href: "/calls",
          },
          {
            icon: Mail,
            label: "Email issues",
            value: emailDashboard.exceptionCount.toString(),
            note: "Bounces and complaints",
            href: "/email",
          },
        ].map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className="rounded-lg border border-white bg-white p-5 shadow-lg shadow-slate-950/5 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-slate-950/10"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-emerald-50 text-emerald-700">
              <item.icon className="h-5 w-5" />
            </div>
            <p className="mt-5 text-sm font-medium text-slate-600">
              {item.label}
            </p>
            <p className="mt-2 text-3xl font-semibold">{item.value}</p>
            <p className="mt-3 text-sm leading-6 text-slate-600">{item.note}</p>
          </Link>
        ))}
      </section>

      <CommunicationsWorkspace workspace={workspace} />

      <section className="grid gap-4 lg:grid-cols-3">
        {[
          {
            title: "Calls",
            body: "Click-to-call starts a Twilio call, creates a call record, records when configured, and logs the result to the customer timeline.",
            href: "/calls",
          },
          {
            title: "SMS",
            body: "SMS sends through Twilio from the active customer thread and is logged as outbound activity for that customer.",
            href: "/customers",
          },
          {
            title: "Email",
            body: "Customer emails send through Resend with suppression checks. Quote emails still live on quote records.",
            href: "/email",
          },
        ].map((item) => (
          <Link
            key={item.title}
            href={item.href}
            className="rounded-lg border border-white bg-white p-5 shadow-lg shadow-slate-950/5 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-slate-950/10"
          >
            <h2 className="text-xl font-semibold">{item.title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">{item.body}</p>
          </Link>
        ))}
      </section>
    </InternalShell>
  );
}
