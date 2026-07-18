import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase";
import {
  encodeLinePendingLogin,
  isLineOfficialAccountFriend,
  LINE_PENDING_LOGIN_COOKIE,
  PENDING_MAX_AGE_SEC,
  type LinePendingLoginPayload,
} from "@/lib/line-friendship";
import {
  attachUserSessionCookie,
  buildUserCookieOptions,
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
    console.error("[line-complete-login] notification settings upsert failed:", error);
  }
}

function withoutMaxAge(options: ReturnType<typeof buildUserCookieOptions>) {
  const { maxAge: _ignored, ...rest } = options;
  return rest;
}

export function attachLinePendingLoginCookie(
  response: NextResponse,
  payload: LinePendingLoginPayload,
  request?: Request,
): NextResponse {
  const options = buildUserCookieOptions(request);
  response.cookies.set(LINE_PENDING_LOGIN_COOKIE, encodeLinePendingLogin(payload), {
    ...withoutMaxAge(options),
    maxAge: PENDING_MAX_AGE_SEC,
  });
  return response;
}

export function clearLinePendingLoginCookie(
  response: NextResponse,
  request?: Request,
): NextResponse {
  const options = buildUserCookieOptions(request);
  response.cookies.set(LINE_PENDING_LOGIN_COOKIE, "", {
    ...withoutMaxAge(options),
    maxAge: 0,
  });
  return response;
}

export async function upsertLineUser(input: {
  lineUserId: string;
  displayName: string;
  pictureUrl?: string | null;
}): Promise<string> {
  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from("users")
    .upsert(
      {
        line_user_id: input.lineUserId,
        display_name: input.displayName,
        picture_url: input.pictureUrl ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "line_user_id" },
    )
    .select("id")
    .single();

  if (error || !data?.id) {
    console.error("[line-complete-login] users upsert failed:", error);
    throw error ?? new Error("ユーザー情報保存に失敗しました。");
  }

  await ensureUserNotificationSettings(data.id);
  return data.id;
}

/**
 * Redirect callback path: complete session only if Official Account is followed.
 */
export async function completeLineLoginRedirect(input: {
  lineUserId: string;
  displayName: string;
  pictureUrl?: string | null;
  accessToken?: string | null;
  redirectPath: string;
  request: Request;
  requestUrl: URL;
  beforeRedirect?: (response: NextResponse) => void;
}): Promise<NextResponse> {
  const friendship = await isLineOfficialAccountFriend({
    lineUserId: input.lineUserId,
    accessToken: input.accessToken,
  });

  console.log("[line-complete-login] friendship check", {
    lineUserId: input.lineUserId,
    isFriend: friendship.isFriend,
    method: friendship.method,
  });

  if (!friendship.isFriend) {
    const friendPage = new URL(
      "/auth/line/friend-required",
      input.requestUrl.origin,
    );
    const response = NextResponse.redirect(friendPage, { status: 303 });
    attachLinePendingLoginCookie(
      response,
      {
        lineUserId: input.lineUserId,
        displayName: input.displayName,
        pictureUrl: input.pictureUrl ?? null,
        redirectPath: input.redirectPath || "/",
        // Do not persist Login access token in cookies; Messaging API uses lineUserId.
        accessToken: null,
        createdAt: Date.now(),
      },
      input.request,
    );
    input.beforeRedirect?.(response);
    return response;
  }

  const userId = await upsertLineUser({
    lineUserId: input.lineUserId,
    displayName: input.displayName,
    pictureUrl: input.pictureUrl,
  });

  const resolved = (input.redirectPath || "/").trim() || "/";
  const destination = resolved.startsWith("http")
    ? new URL(resolved)
    : new URL(resolved, input.requestUrl.origin);
  destination.searchParams.set("lineLogin", "success");

  const response = NextResponse.redirect(destination, { status: 303 });
  clearLinePendingLoginCookie(response, input.request);
  attachUserSessionCookie(response, userId, input.request);
  input.beforeRedirect?.(response);
  return response;
}
