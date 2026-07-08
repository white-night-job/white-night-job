import { NextResponse } from "next/server";
import {
  getAuthenticatedUserId,
  parseUserSessionValue,
  USER_COOKIE_NAME,
} from "@/lib/user-auth";
import { createSupabaseAdmin } from "@/lib/supabase";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export async function GET() {
  const cookieStore = await cookies();
  const rawCookie = cookieStore.get(USER_COOKIE_NAME)?.value;

  if (!rawCookie) {
    console.error("[user/session] cookie missing:", USER_COOKIE_NAME);
    return NextResponse.json({ authenticated: false });
  }

  const parsedUserId = parseUserSessionValue(rawCookie);
  if (!parsedUserId) {
    console.error("[user/session] cookie token invalid");
    return NextResponse.json({ authenticated: false });
  }

  const userId = await getAuthenticatedUserId();
  if (!userId) {
    console.error("[user/session] getAuthenticatedUserId returned null");
    return NextResponse.json({ authenticated: false });
  }

  const supabase = createSupabaseAdmin();
  const [{ data: user }, { data: settings }] = await Promise.all([
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

  if (!user) {
    console.error("[user/session] user not found in DB", { userId });
    return NextResponse.json({ authenticated: false });
  }

  return NextResponse.json({
    authenticated: true,
    user: {
      id: user.id,
      displayName: user.display_name,
      pictureUrl: user.picture_url,
      lineUserId: user.line_user_id,
    },
    notificationSettings: settings ?? null,
  });
}
