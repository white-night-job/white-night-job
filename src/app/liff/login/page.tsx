import { redirect } from "next/navigation";

/**
 * Legacy LIFF path — keep for old Endpoint URL / bookmarks.
 * Canonical Endpoint / redirectUri is /auth/line/liff.
 */
export default async function LegacyLiffLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>;
}) {
  const params = await searchParams;
  const redirectTo = params.redirect?.trim();
  const qs =
    redirectTo && redirectTo.startsWith("/") && !redirectTo.startsWith("//")
      ? `?redirect=${encodeURIComponent(redirectTo)}`
      : "";
  redirect(`/auth/line/liff${qs}`);
}
