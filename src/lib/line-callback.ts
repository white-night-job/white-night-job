import { NextResponse } from "next/server";
import {
  exchangeLineCodeForToken,
  fetchLineProfile,
} from "@/lib/line-auth";
import { createSupabaseAdmin } from "@/lib/supabase";
import {
  attachUserSessionCookie,
  clearLineStateCookieOnResponse,
  describeUserCookieOptions,
  getLineStateCookie,
  parseLineStateCookie,
  USER_COOKIE_NAME,
} from "@/lib/user-auth";

async function ensureUserNotificationSettings(userId: string) {
  const supabase = createSupabaseAdmin();
  const { error } = await supabase.from("user_notification_settings").upsert(
    {
      user_id: userId,
      notify_daily_pickup: false,
    },
    { onConflict: "user_id", ignoreDuplicates: true },
  );
  if (error) {
    console.error("[line-callback] notification settings upsert failed:", error);
  }
}

function resolvePostLoginRedirect(redirectPath: string): string {
  return redirectPath.trim() || "/";
}

function buildRedirectDestination(requestUrl: URL, redirectPath: string): URL {
  const resolved = resolvePostLoginRedirect(redirectPath);
  const destination = resolved.startsWith("http")
    ? new URL(resolved)
    : new URL(resolved, requestUrl.origin);
  destination.searchParams.set("lineLogin", "success");
  return destination;
}

export async function handleLineCallback(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const state = requestUrl.searchParams.get("state");

  console.log("[line-callback] start", {
    path: requestUrl.pathname,
    hasCode: Boolean(code),
    hasState: Boolean(state),
    host: requestUrl.host,
  });

  if (!code || !state) {
    console.log("[line-callback] abort: missing code or state");
    return NextResponse.redirect(new URL("/?lineLogin=failed", requestUrl.origin));
  }

  const stateCookie = await getLineStateCookie(request);
  console.log("[line-callback] state cookie", { hasStateCookie: Boolean(stateCookie) });
  if (!stateCookie) {
    console.log("[line-callback] abort: missing state cookie");
    return NextResponse.redirect(new URL("/?lineLogin=failed", requestUrl.origin));
  }

  const parsedState = parseLineStateCookie(stateCookie);
  if (!parsedState || parsedState.state !== state) {
    console.log("[line-callback] abort: state mismatch", {
      receivedState: state,
      parsedState,
    });
    const failed = NextResponse.redirect(
      new URL("/?lineLogin=failed", requestUrl.origin),
      { status: 303 },
    );
    return clearLineStateCookieOnResponse(failed, request);
  }

  try {
    const accessToken = await exchangeLineCodeForToken(code);
    console.log("[line-callback] LINE token acquired");

    const profile = await fetchLineProfile(accessToken);
    console.log("[line-callback] LINE profile", {
      lineUserId: profile.userId,
      displayName: profile.displayName,
      hasPicture: Boolean(profile.pictureUrl),
    });

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

    console.log("[line-callback] users saved", {
      userId: data.id,
      lineUserId: data.line_user_id,
    });

    await ensureUserNotificationSettings(data.id);

    const destination = buildRedirectDestination(requestUrl, parsedState.redirectPath);
    console.log("[line-callback] redirect destination", destination.toString());

    const response = NextResponse.redirect(destination, { status: 303 });
    clearLineStateCookieOnResponse(response, request);
    attachUserSessionCookie(response, data.id, request);

    const cookieOptions = describeUserCookieOptions(request);
    const setCookieHeader = response.headers.get("set-cookie");
    console.log("[line-callback] session cookie attached to redirect", {
      ...cookieOptions,
      hasSetCookieHeader: Boolean(setCookieHeader),
      includesUserCookie: Boolean(setCookieHeader?.includes(USER_COOKIE_NAME)),
      setCookiePreview: setCookieHeader?.slice(0, 240) ?? null,
    });

    return response;
  } catch (error) {
    console.error("[line-callback] LINE login failed:", error);
    const failed = NextResponse.redirect(
      new URL("/?lineLogin=failed", requestUrl.origin),
      { status: 303 },
    );
    return clearLineStateCookieOnResponse(failed, request);
  }
}
