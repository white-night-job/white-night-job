import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase";
import {
  attachUserSessionCookie,
  clearLineStateCookieOnResponse,
} from "@/lib/user-auth";

export const dynamic = "force-dynamic";

type VerifiedLineUser = {
  lineUserId: string;
  displayName: string;
  pictureUrl: string | null;
};

function sanitizeRedirect(raw: unknown): string {
  if (typeof raw !== "string") return "/";
  const value = raw.trim() || "/";
  if (value.startsWith("/") && !value.startsWith("//")) return value;
  return "/";
}

async function verifyLineIdToken(idToken: string): Promise<VerifiedLineUser> {
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

  const data = (await response.json()) as {
    sub?: string;
    name?: string;
    picture?: string;
  };
  if (!data.sub) {
    throw new Error("LINE IDトークンに sub がありません。");
  }

  return {
    lineUserId: data.sub,
    displayName: data.name?.trim() || "LINEユーザー",
    pictureUrl: data.picture ?? null,
  };
}

async function verifyLineAccessToken(accessToken: string): Promise<VerifiedLineUser> {
  const verifyResponse = await fetch(
    `https://api.line.me/oauth2/v2.1/verify?access_token=${encodeURIComponent(accessToken)}`,
  );
  if (!verifyResponse.ok) {
    const errorBody = await verifyResponse.text();
    console.error("[liff-session] access token verify failed", {
      status: verifyResponse.status,
      errorBody,
    });
    throw new Error("LINEアクセストークンの検証に失敗しました。");
  }

  const channelId = process.env.LINE_LOGIN_CHANNEL_ID?.trim();
  if (channelId) {
    const verifyData = (await verifyResponse.json()) as { client_id?: string };
    if (verifyData.client_id && verifyData.client_id !== channelId) {
      throw new Error("アクセストークンの client_id が一致しません。");
    }
  }

  const profileResponse = await fetch("https://api.line.me/v2/profile", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!profileResponse.ok) {
    const errorBody = await profileResponse.text();
    console.error("[liff-session] profile fetch failed", {
      status: profileResponse.status,
      errorBody,
    });
    throw new Error("LINEプロフィールの取得に失敗しました。");
  }

  const profile = (await profileResponse.json()) as {
    userId?: string;
    displayName?: string;
    pictureUrl?: string;
  };
  if (!profile.userId) {
    throw new Error("LINEプロフィールに userId がありません。");
  }

  return {
    lineUserId: profile.userId,
    displayName: profile.displayName?.trim() || "LINEユーザー",
    pictureUrl: profile.pictureUrl ?? null,
  };
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as {
      idToken?: string;
      accessToken?: string;
      redirect?: string;
    };

    const idToken = payload.idToken?.trim();
    const accessToken = payload.accessToken?.trim();

    if (!idToken && !accessToken) {
      return NextResponse.json(
        { message: "idToken or accessToken is required" },
        { status: 400 },
      );
    }

    // Never trust client-sent profile/userId — verify with LINE official APIs only.
    const verified = idToken
      ? await verifyLineIdToken(idToken)
      : await verifyLineAccessToken(accessToken!);

    const supabase = createSupabaseAdmin();
    const { data, error } = await supabase
      .from("users")
      .upsert(
        {
          line_user_id: verified.lineUserId,
          display_name: verified.displayName,
          picture_url: verified.pictureUrl,
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
