import { NextResponse } from "next/server";
import {
  buildLineLoginUrl,
  createLineLoginState,
} from "@/lib/line-auth";
import { setLineStateCookie } from "@/lib/user-auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const redirect = url.searchParams.get("redirect") ?? "/";
  const state = createLineLoginState();
  await setLineStateCookie(`${state}:${redirect}`);
  return NextResponse.redirect(buildLineLoginUrl(state));
}
