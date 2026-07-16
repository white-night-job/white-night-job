import { NextResponse } from "next/server";
import { normalizeLiffId } from "@/lib/liff-login-intent";

export const dynamic = "force-dynamic";

/**
 * Runtime LIFF config for clients (and deploy verification).
 * LIFF ID is public (NEXT_PUBLIC_*); never log secrets here.
 */
export async function GET() {
  const liffId = normalizeLiffId(process.env.NEXT_PUBLIC_LIFF_ID);
  const configured = Boolean(liffId);

  console.info("[liff-debug] runtime_config", {
    liffIdConfigured: configured,
    liffIdLength: liffId ? liffId.length : 0,
    hasTrailingWhitespace: Boolean(
      process.env.NEXT_PUBLIC_LIFF_ID &&
        process.env.NEXT_PUBLIC_LIFF_ID !== process.env.NEXT_PUBLIC_LIFF_ID.trim(),
    ),
  });

  return NextResponse.json({
    configured,
    liffId,
    liffUrl: liffId ? `https://liff.line.me/${liffId}` : null,
    endpointUrl: "/auth/line/liff",
  });
}
