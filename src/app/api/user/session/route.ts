import { NextResponse } from "next/server";
import { getAuthenticatedUserId } from "@/lib/user-auth";
import { createSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
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
    return NextResponse.json({ authenticated: false });
  }

  return NextResponse.json({
    authenticated: true,
    user: {
      id: user.id,
      displayName: user.display_name,
      pictureUrl: user.picture_url,
    },
    notificationSettings: settings ?? null,
  });
}
