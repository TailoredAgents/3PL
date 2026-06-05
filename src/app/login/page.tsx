import Link from "next/link";
import { SignIn } from "@clerk/nextjs";

import { InternalLoginForm } from "@/components/internal-login-form";
import { isClerkAuthConfigured } from "@/lib/auth";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const clerkEnabled = isClerkAuthConfigured();

  return (
    <main className="grid min-h-screen place-items-center bg-[radial-gradient(circle_at_top_left,#d1fae5_0,#f1f5f9_36%,#e2e8f0_100%)] px-5 text-slate-950">
      <section className="w-full max-w-md rounded-lg border border-white bg-white p-6 shadow-xl shadow-slate-950/10">
        <Link href="/" className="text-sm font-semibold text-slate-600">
          Back to public site
        </Link>
        <div className="mt-6 flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-400 text-lg font-black text-slate-950">
          AF
        </div>
        <h1 className="mt-5 text-3xl font-semibold tracking-tight">
          Team login
        </h1>
        <p className="mt-3 leading-7 text-slate-600">
          Access the internal CRM/TMS dashboard for sales, brokerage operations,
          and load execution.
        </p>
        {clerkEnabled ? (
          <div className="mt-6 flex justify-center">
            <SignIn
              fallbackRedirectUrl={next ?? "/dashboard"}
              signUpFallbackRedirectUrl={next ?? "/dashboard"}
              withSignUp
            />
          </div>
        ) : (
          <div className="mt-6">
            <InternalLoginForm nextPath={next ?? "/dashboard"} />
          </div>
        )}
      </section>
    </main>
  );
}
