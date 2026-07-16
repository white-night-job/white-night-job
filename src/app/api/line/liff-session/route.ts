import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase";
import {
  attachUserSessionCookie,
  clearLineStateCookieOnResponse,
} from "@/lib/user-auth";

export const dynamic = "force-dynamic";

type VerifyIdTokenResponse = {
  sub: string;
  name?: string;
  picture?: string;
};

function sanitizeRedirect(raw: unknown): string {
  if (typeof raw !== "string") return "/";
  const value = raw.trim() || "/";
  if (value.startsWith("/") && !value.startsWith("//")) return value;
  return "/";
}

async function verifyLineIdToken(idToken: string): Promise<VerifyIdTokenResponse> {
  const channelId = process.env.LINE_LOGIN_CHANNEL_ID?.trim();
  if (!channelId) {
    throw new Error("LINE_LOGIN_CHANNEL_ID is not set.");
  }

  const body = new URLSearchParams({
    id_token: idToken,
    client_id: channelId,
  });
  const response = await fetch("https://api.line.me/oauth2/v2.1/verify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!response.ok) {
    const errorBody = await response.text();
    console.error("[liff-session] id token verify failed", {
      status: response.status,
      errorBody,
    });
    throw new Error("LINE IDトークンの検証に失敗しました。");
  }
  return (await response.json()) as VerifyIdTokenResponse;
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as {
      idToken?: string;
      redirect?: string;
    };
    const idToken = payload.idToken?.trim();
    if (!idToken) {
      return NextResponse.json({ message: "idToken is required" }, { status: 400 });
    }

    const verified = await verifyLineIdToken(idToken);
    if (!verified.sub) {
      return NextResponse.json({ message: "invalid token" }, { status: 401 });
    }

    const supabase = createSupabaseAdmin();
    const { data, error } = await supabase
      .from("users")
      .upsert(
        {
          line_user_id: verified.sub,
          display_name: verified.name ?? "LINEユーザー",
          picture_url: verified.picture ?? null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "line_user_id" },
      )
      .select("id")
      .single();

    if (error || !data?.id) {
      console.error("[liff-session] users upsert failed:", error);
      return NextResponse.json({ message: "user save failed" }, { status: 500 });
    }

    await supabase.from("user_notification_settings").upsert(
      {
        user_id: data.id,
        notify_daily_pickup: false,
      },
      { onConflict: "user_id", ignoreDuplicates: true },
    );

    const fromBody = sanitizeRedirect(payload.redirect);
    const cookieHeader = request.headers.get("cookie") ?? "";
    let fromCookie = "/";
    for (const part of cookieHeader.split(";")) {
      const [rawName, ...rest] = part.trim().split("=");
      if (rawName === "white-night-liff-redirect") {
        fromCookie = sanitizeRedirect(decodeURIComponent(rest.join("=")));
        break;
      }
    }
    const redirectPath = fromBody !== "/" ? fromBody : fromCookie;

    const response = NextResponse.json({ ok: true, redirectPath });
    clearLineStateCookieOnResponse(response, request);
    response.cookies.set("white-night-liff-redirect", "", {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });
    attachUserSessionCookie(response, data.id, request);
    return response;
  } catch (error) {
    console.error("[liff-session] failed:", error);
    return NextResponse.json({ message: "LIFF login failed" }, { status: 500 });
  }
}
