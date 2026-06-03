import Link from "next/link";

import { InternalLoginForm } from "@/components/internal-login-form";

export default async function InternalLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <main className="grid min-h-screen place-items-center bg-slate-100 px-5 text-slate-950">
      <section className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <Link href="/" className="text-sm font-semibold text-slate-600">
          Back to public site
        </Link>
        <h1 className="mt-6 text-3xl font-semibold tracking-tight">
          Internal access
        </h1>
        <p className="mt-3 leading-7 text-slate-600">
          Temporary password gate for the CRM/TMS while Clerk authentication is
          being added.
        </p>
        <div className="mt-6">
          <InternalLoginForm nextPath={next ?? "/dashboard"} />
        </div>
      </section>
    </main>
  );
}
