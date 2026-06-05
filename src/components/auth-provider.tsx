import { ClerkProvider } from "@clerk/nextjs";

import { isClerkAuthConfigured } from "@/lib/auth";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  if (!isClerkAuthConfigured()) {
    return <>{children}</>;
  }

  return (
    <ClerkProvider
      signInUrl="/login"
      signUpUrl="/login"
      afterSignOutUrl="/"
    >
      {children}
    </ClerkProvider>
  );
}
