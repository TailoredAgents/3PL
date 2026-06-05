import { redirect } from "next/navigation";

export default async function InternalLoginRedirectPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const target = next
    ? `/login?next=${encodeURIComponent(next)}`
    : "/login";

  redirect(target);
}
