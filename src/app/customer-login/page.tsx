import Link from "next/link";
import { ArrowLeft, FileText, LockKeyhole, PackageCheck, ShieldCheck } from "lucide-react";

import { CustomerLoginForm } from "@/components/customer-login-form";

export default async function CustomerLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <main className="grid min-h-screen place-items-center bg-[radial-gradient(circle_at_top_left,#d1fae5_0,#f8fafc_36%,#e2e8f0_100%)] px-5 py-8 text-slate-950">
      <section className="grid w-full max-w-4xl overflow-hidden rounded-lg border border-white bg-white shadow-xl shadow-slate-950/10 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="bg-slate-950 p-8 text-white">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-300 hover:text-white">
            <ArrowLeft className="h-4 w-4" />
            Public site
          </Link>
          <div className="mt-8 flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-400 text-lg font-black text-slate-950">
            DAO
          </div>
          <p className="mt-8 text-xs font-black uppercase tracking-[0.18em] text-emerald-300">
            Secure customer access
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-tight">
            Customer portal login
          </h1>
          <p className="mt-4 text-sm leading-7 text-slate-300">
            Access quotes, shipment visibility, invoices, and documents shared by your brokerage team.
          </p>
          <div className="mt-8 grid gap-3">
            <LoginBenefit icon={PackageCheck} label="Track active freight" />
            <LoginBenefit icon={FileText} label="Review quotes and documents" />
            <LoginBenefit icon={ShieldCheck} label="Account-scoped access" />
          </div>
        </div>

        <div className="p-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
            <LockKeyhole className="h-6 w-6" />
          </div>
          <h2 className="mt-5 text-2xl font-black tracking-tight">
            Sign in with your work email
          </h2>
          <p className="mt-3 leading-7 text-slate-600">
            Your broker must enable portal access for your company before this login will open your customer workspace.
          </p>
          <div className="mt-6">
            <CustomerLoginForm nextPath={next ?? "/portal"} />
          </div>
          <div className="mt-6 rounded-lg border border-slate-100 bg-slate-50 p-4 text-sm leading-6 text-slate-600">
            Public tracking links still work separately when your broker sends a shipment-specific tracking URL.
          </div>
        </div>
      </section>
    </main>
  );
}

function LoginBenefit({
  icon: Icon,
  label,
}: {
  icon: typeof PackageCheck;
  label: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-slate-200">
      <Icon className="h-4 w-4 text-emerald-300" />
      {label}
    </div>
  );
}
