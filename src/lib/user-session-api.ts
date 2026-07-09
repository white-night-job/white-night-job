import { NextResponse } from "next/server";
import {
  getAuthenticatedUserId,
  parseUserSessionValue,
  readUserSessionCookieValue,
  USER_COOKIE_NAME,
} from "@/lib/user-auth";
import { createSupabaseAdmin } from "@/lib/supabase";

export type MeResponse =
  | {
      authenticated: true;
      userId: string;
      user: {
        id: string;
        displayName: string | null;
        pictureUrl: string | null;
        lineUserId: string | null;
      };
      notificationSettings: {
        notify_new_jobs: boolean;
        notify_pickup_jobs: boolean;
        notify_favorite_updates: boolean;
      } | null;
    }
  | {
      authenticated: false;
      userId: null;
      reason:
        | "cookie_missing"
        | "cookie_invalid"
        | "user_not_found"
        | "db_error";
      cookieName: string;
      hasCookieHeader: boolean;
      hasCookieStore: boolean;
    };

export async function buildMeResponse(request: Request): Promise<MeResponse> {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const hasCookieHeader = cookieHeader.includes(USER_COOKIE_NAME);
  const rawCookie = await readUserSessionCookieValue(request);
  const hasCookieStore = Boolean(rawCookie);

  console.log("[api/me] cookie check", {
    cookieName: USER_COOKIE_NAME,
    hasCookieHeader,
    hasCookieStore,
    rawCookieLength: rawCookie?.length ?? 0,
  });

  if (!rawCookie) {
    console.log("[api/me] result: cookie_missing");
    return {
      authenticated: false,
      userId: null,
      reason: "cookie_missing",
      cookieName: USER_COOKIE_NAME,
      hasCookieHeader,
      hasCookieStore,
    };
  }

  const parsedUserId = parseUserSessionValue(rawCookie);
  if (!parsedUserId) {
    console.log("[api/me] result: cookie_invalid");
    return {
      authenticated: false,
      userId: null,
      reason: "cookie_invalid",
      cookieName: USER_COOKIE_NAME,
      hasCookieHeader,
      hasCookieStore,
    };
  }

  const userId = (await getAuthenticatedUserId(request)) ?? parsedUserId;
  if (!userId) {
    console.log("[api/me] result: cookie_invalid (getAuthenticatedUserId)");
    return {
      authenticated: false,
      userId: null,
      reason: "cookie_invalid",
      cookieName: USER_COOKIE_NAME,
      hasCookieHeader,
      hasCookieStore,
    };
  }

  const supabase = createSupabaseAdmin();
  const [{ data: user, error: userError }, { data: settings, error: settingsError }] =
    await Promise.all([
      supabase
        .from("users")
        .select("id, line_user_id, display_name, picture_url")
        .eq("id", userId)
        .maybeSingle(),
      supabase
        .from("user_notification_settings")
        .select(
          "notify_new_jobs, notify_pickup_jobs, notify_favorite_updates",
        )
        .eq("user_id", userId)
        .maybeSingle(),
    ]);

  if (userError || settingsError) {
    console.error("[api/me] db error", { userError, settingsError, userId });
    return {
      authenticated: false,
      userId: null,
      reason: "db_error",
      cookieName: USER_COOKIE_NAME,
      hasCookieHeader,
      hasCookieStore,
    };
  }

  if (!user) {
    console.log("[api/me] result: user_not_found", { userId });
    return {
      authenticated: false,
      userId: null,
      reason: "user_not_found",
      cookieName: USER_COOKIE_NAME,
      hasCookieHeader,
      hasCookieStore,
    };
  }

  console.log("[api/me] result: authenticated", {
    userId: user.id,
    lineUserId: user.line_user_id,
  });

  return {
    authenticated: true,
    userId: user.id,
    user: {
      id: user.id,
      displayName: user.display_name,
      pictureUrl: user.picture_url,
      lineUserId: user.line_user_id,
    },
    notificationSettings: settings ?? null,
  };
}

export async function meJsonResponse(request: Request) {
  const payload = await buildMeResponse(request);
  if (payload.authenticated) {
    return NextResponse.json(payload);
  }
  return NextResponse.json(payload, { status: 401 });
}
