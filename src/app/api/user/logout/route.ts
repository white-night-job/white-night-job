import { NextResponse } from "next/server";
import { clearUserSessionCookie } from "@/lib/user-auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const response = NextResponse.json({ ok: true });
  return clearUserSessionCookie(response, request);
}
