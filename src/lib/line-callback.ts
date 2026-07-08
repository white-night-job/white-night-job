import { NextResponse } from "next/server";
import {
  exchangeLineCodeForToken,
  fetchLineProfile,
} from "@/lib/line-auth";
import { createSupabaseAdmin } from "@/lib/supabase";
import {
  attachUserSessionCookie,
  clearLineStateCookieOnResponse,
  getLineStateCookie,
  parseLineStateCookie,
  USER_COOKIE_NAME,
} from "@/lib/user-auth";

async function ensureUserNotificationSettings(userId: string) {
  const supabase = createSupabaseAdmin();
  const { error } = await supabase.from("user_notification_settings").upsert(
    { user_id: userId },
    { onConflict: "user_id", ignoreDuplicates: true },
  );
  if (error) {
    console.error("[line-callback] notification settings upsert failed:", error);
  }
}

function buildRedirectDestination(requestUrl: URL, redirectPath: string): URL {
  const destination = redirectPath.startsWith("http")
    ? new URL(redirectPath)
    : new URL(redirectPath || "/", requestUrl.origin);
  destination.searchParams.set("lineLogin", "success");
  return destination;
}

export async function handleLineCallback(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const state = requestUrl.searchParams.get("state");
  if (!code || !state) {
    console.error("[line-callback] missing code or state");
    return NextResponse.redirect(new URL("/?lineLogin=failed", requestUrl.origin));
  }

  const stateCookie = await getLineStateCookie();
  if (!stateCookie) {
    console.error("[line-callback] missing state cookie");
    return NextResponse.redirect(new URL("/?lineLogin=failed", requestUrl.origin));
  }

  const parsedState = parseLineStateCookie(stateCookie);
  if (!parsedState || parsedState.state !== state) {
    console.error("[line-callback] state mismatch", {
      receivedState: state,
      parsedState,
    });
    const failed = NextResponse.redirect(
      new URL("/?lineLogin=failed", requestUrl.origin),
      { status: 303 },
    );
    return clearLineStateCookieOnResponse(failed);
  }

  try {
    const accessToken = await exchangeLineCodeForToken(code);
    const profile = await fetchLineProfile(accessToken);
    const supabase = createSupabaseAdmin();

    const { data, error } = await supabase
      .from("users")
      .upsert(
        {
          line_user_id: profile.userId,
          display_name: profile.displayName,
          picture_url: profile.pictureUrl ?? null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "line_user_id" },
      )
      .select("id, line_user_id")
      .single();

    if (error || !data?.id) {
      console.error("[line-callback] users upsert failed:", error);
      throw error ?? new Error("ユーザー情報保存に失敗しました。");
    }

    await ensureUserNotificationSettings(data.id);

    const destination = buildRedirectDestination(requestUrl, parsedState.redirectPath);
    const response = NextResponse.redirect(destination, { status: 303 });
    clearLineStateCookieOnResponse(response);
    attachUserSessionCookie(response, data.id, request);

    const setCookieHeader = response.headers.get("set-cookie");
    if (!setCookieHeader?.includes(USER_COOKIE_NAME)) {
      console.error("[line-callback] session cookie was not attached to redirect");
    }

    return response;
  } catch (error) {
    console.error("[line-callback] LINE login failed:", error);
    const failed = NextResponse.redirect(
      new URL("/?lineLogin=failed", requestUrl.origin),
      { status: 303 },
    );
    return clearLineStateCookieOnResponse(failed);
  }
}
