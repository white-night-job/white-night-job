import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase";
import { getAuthenticatedUserId } from "@/lib/user-auth";

export const dynamic = "force-dynamic";

type SettingsPayload = {
  notifyNewJobs?: boolean;
  notifyPickupJobs?: boolean;
  notifyFavoriteUpdates?: boolean;
};

async function ensureSettingsRow(userId: string) {
  const supabase = createSupabaseAdmin();
  const { data: existing } = await supabase
    .from("user_notification_settings")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (existing) return existing;

  const { data, error } = await supabase
    .from("user_notification_settings")
    .insert({
      user_id: userId,
      notify_new_jobs: true,
      notify_pickup_jobs: true,
      notify_favorite_updates: true,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function GET(request: Request) {
  const userId = await getAuthenticatedUserId(request);
  if (!userId) {
    return NextResponse.json({ message: "LINEログインが必要です。" }, { status: 401 });
  }
  try {
    const row = await ensureSettingsRow(userId);
    return NextResponse.json({
      notifyNewJobs: row.notify_new_jobs,
      notifyPickupJobs: row.notify_pickup_jobs,
      notifyFavoriteUpdates: row.notify_favorite_updates,
    });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "設定取得に失敗しました。" },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  const userId = await getAuthenticatedUserId(request);
  if (!userId) {
    return NextResponse.json({ message: "LINEログインが必要です。" }, { status: 401 });
  }
  const payload = (await request.json()) as SettingsPayload;
  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from("user_notification_settings")
    .upsert(
      {
        user_id: userId,
        notify_new_jobs: payload.notifyNewJobs ?? true,
        notify_pickup_jobs: payload.notifyPickupJobs ?? true,
        notify_favorite_updates: payload.notifyFavoriteUpdates ?? true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    )
    .select("*")
    .single();
  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
  return NextResponse.json({
    ok: true,
    notifyNewJobs: data.notify_new_jobs,
    notifyPickupJobs: data.notify_pickup_jobs,
    notifyFavoriteUpdates: data.notify_favorite_updates,
  });
}
