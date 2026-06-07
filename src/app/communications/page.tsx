import Link from "next/link";
import {
  ArrowRight,
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

const CARD_ACCENTS = [
  { border: "border-l-[3px] border-l-emerald-400", icon: "bg-emerald-50 text-emerald-700" },
  { border: "border-l-[3px] border-l-sky-400", icon: "bg-sky-50 text-sky-700" },
  { border: "border-l-[3px] border-l-amber-400", icon: "bg-amber-50 text-amber-700" },
  { border: "border-l-[3px] border-l-red-400", icon: "bg-red-50 text-red-700" },
] as const;

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

  const metrics = [
    { icon: MessageSquareText, label: "Conversations", value: workspace.threads.length.toString(), href: "/communications" },
    { icon: ClipboardList, label: "New requests", value: intakeItems.length.toString(), href: "/quote-requests" },
    { icon: PhoneCall, label: "Call work", value: (needsTranscript + needsExtraction).toString(), href: "/calls" },
    { icon: Mail, label: "Email issues", value: emailDashboard.exceptionCount.toString(), href: "/email" },
  ];

  return (
    <InternalShell
      active="Communications"
      eyebrow="Sales & CRM"
      title="Communications"
      description="Customer conversations, call/SMS/email actions, and contact context in one workspace."
      action={{ label: "Settings", href: "/settings" }}
    >
      {/* Metrics */}
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((item, i) => (
          <Link
            key={item.label}
            href={item.href}
            className={`group overflow-hidden rounded-lg border border-slate-100 bg-white shadow-md shadow-slate-950/5 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-slate-950/10 ${CARD_ACCENTS[i].border}`}
          >
            <div className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div className={`flex h-9 w-9 items-center justify-center rounded-md ${CARD_ACCENTS[i].icon}`}>
                  <item.icon className="h-4 w-4" />
                </div>
                <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-emerald-600" />
              </div>
              <p className="mt-4 text-sm font-medium text-slate-600">{item.label}</p>
              <p className="mt-1 text-4xl font-bold tracking-tight text-slate-950">
                {item.value}
              </p>
            </div>
          </Link>
        ))}
      </section>

      <CommunicationsWorkspace workspace={workspace} />
    </InternalShell>
  );
}
