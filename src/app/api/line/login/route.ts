import { NextResponse } from "next/server";
import {
  buildLineLoginUrl,
  createLineLoginState,
} from "@/lib/line-auth";
import { attachLineStateCookie } from "@/lib/user-auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const redirect = url.searchParams.get("redirect") ?? "/mypage";
  const state = createLineLoginState();
  const response = NextResponse.redirect(buildLineLoginUrl(state), { status: 303 });
  return attachLineStateCookie(response, state, redirect, request);
}
