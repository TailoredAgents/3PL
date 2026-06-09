"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, CheckCheck, Loader2, Phone } from "lucide-react";

import { cn } from "@/lib/utils";

const STAGE_ORDER = [
  "New",
  "Contacted",
  "Qualified",
  "Quoted",
  "Won",
  "Lost",
] as const;

type Props = {
  lead: {
    id: string;
    company: string;
    contact: string;
    priority: string;
    stage: string;
    lanes: string;
    nextFollowUp: string;
  };
};

export function LeadKanbanCard({ lead }: Props) {
  const router = useRouter();
  const [advancing, setAdvancing] = useState(false);
  const [logging, setLogging] = useState(false);
  const [done, setDone] = useState<"advance" | "call" | null>(null);

  const currentIdx = STAGE_ORDER.indexOf(
    lead.stage as (typeof STAGE_ORDER)[number],
  );
  const nextStage =
    currentIdx >= 0 && currentIdx < STAGE_ORDER.length - 2
      ? STAGE_ORDER[currentIdx + 1]
      : null;

  async function advanceStage() {
    if (!nextStage || advancing) return;
    setAdvancing(true);
    try {
      const fd = new FormData();
      fd.append("stage", nextStage.toUpperCase());
      fd.append("priority", lead.priority === "High" ? "1" : "3");
      await fetch(`/api/leads/${lead.id}`, { method: "PATCH", body: fd });
      setDone("advance");
      router.refresh();
    } finally {
      setAdvancing(false);
    }
  }

  async function logCall() {
    if (logging) return;
    setLogging(true);
    try {
      const fd = new FormData();
      fd.append("type", "CALL");
      fd.append("direction", "OUTBOUND");
      fd.append("subject", "Quick call");
      fd.append("body", "Called from pipeline board.");
      fd.append("outcome", "REACHED");
      await fetch(`/api/leads/${lead.id}/activities`, { method: "POST", body: fd });
      setDone("call");
      router.refresh();
    } finally {
      setLogging(false);
    }
  }

  return (
    <div className="rounded-md border border-slate-200 bg-white shadow-sm transition hover:border-emerald-200 hover:shadow-md dark:border-slate-800 dark:bg-slate-900/80 dark:shadow-black/20 dark:hover:border-emerald-700">
      <Link
        href={`/leads/${lead.id}`}
        className="block p-4 transition hover:-translate-y-0.5"
      >
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-sm font-bold leading-5">{lead.company}</p>
            <p className="mt-1 text-sm text-slate-600">{lead.contact}</p>
          </div>
          <span
            className={cn(
              "rounded-full px-2 py-1 text-xs font-semibold",
              lead.priority === "High"
                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-400/15 dark:text-emerald-200"
                : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
            )}
          >
            {lead.priority}
          </span>
        </div>
        <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">
          {lead.lanes}
        </p>
        <p className="mt-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
          {lead.nextFollowUp}
        </p>
      </Link>

      <div className="grid grid-cols-2 gap-1.5 border-t border-slate-100 px-3 py-2 dark:border-slate-800">
        {nextStage ? (
          <button
            onClick={advanceStage}
            disabled={advancing || done === "advance"}
            className="inline-flex min-h-8 items-center justify-center gap-1.5 rounded-md bg-emerald-50 px-2 py-1.5 text-xs font-semibold leading-tight text-emerald-800 hover:bg-emerald-100 disabled:opacity-60 dark:bg-emerald-400/15 dark:text-emerald-200 dark:hover:bg-emerald-400/20"
          >
            {advancing ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : done === "advance" ? (
              <CheckCheck className="h-3 w-3" />
            ) : (
              <ArrowRight className="h-3 w-3" />
            )}
            {done === "advance" ? "Moved" : nextStage}
          </button>
        ) : null}
        <button
          onClick={logCall}
          disabled={logging || done === "call"}
          className={cn(
            "inline-flex min-h-8 items-center justify-center gap-1.5 rounded-md bg-slate-50 px-2 py-1.5 text-xs font-semibold leading-tight text-slate-700 hover:bg-slate-100 disabled:opacity-60 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-800",
            !nextStage && "col-span-2",
          )}
        >
          {logging ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : done === "call" ? (
            <CheckCheck className="h-3 w-3 text-emerald-600" />
          ) : (
            <Phone className="h-3 w-3" />
          )}
          {done === "call" ? "Logged" : "Log call"}
        </button>
      </div>
    </div>
  );
}
