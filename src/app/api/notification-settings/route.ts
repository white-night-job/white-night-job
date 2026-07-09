import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase";
import { getAuthenticatedUserId } from "@/lib/user-auth";
import {
  isNotificationArea,
  NOTIFICATION_AREA_OPTIONS,
} from "@/lib/notification-areas";

export const dynamic = "force-dynamic";

type SettingsPayload = {
  notifyNewJobs?: boolean;
  notifyPickupJobs?: boolean;
  notifyFavoriteUpdates?: boolean;
  notificationAreas?: string[];
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

async function fetchNotificationAreas(userId: string) {
  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from("user_notification_areas")
    .select("area")
    .eq("user_id", userId);
  if (error) throw error;
  return (data ?? []).map((row) => row.area);
}

async function saveNotificationAreas(userId: string, areas: string[]) {
  const supabase = createSupabaseAdmin();
  const validAreas = [...new Set(areas.filter(isNotificationArea))];

  const { error: deleteError } = await supabase
    .from("user_notification_areas")
    .delete()
    .eq("user_id", userId);
  if (deleteError) throw deleteError;

  if (validAreas.length === 0) return [];

  const { error: insertError } = await supabase.from("user_notification_areas").insert(
    validAreas.map((area) => ({
      user_id: userId,
      area,
    })),
  );
  if (insertError) throw insertError;
  return validAreas;
}

export async function GET(request: Request) {
  const userId = await getAuthenticatedUserId(request);
  if (!userId) {
    return NextResponse.json({ message: "LINEログインが必要です。" }, { status: 401 });
  }
  try {
    const row = await ensureSettingsRow(userId);
    const notificationAreas = await fetchNotificationAreas(userId);
    return NextResponse.json({
      notifyNewJobs: row.notify_new_jobs,
      notifyPickupJobs: row.notify_pickup_jobs,
      notifyFavoriteUpdates: row.notify_favorite_updates,
      notificationAreas,
      areaOptions: NOTIFICATION_AREA_OPTIONS,
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

  try {
    const notificationAreas = await saveNotificationAreas(
      userId,
      payload.notificationAreas ?? [],
    );
    return NextResponse.json({
      ok: true,
      notifyNewJobs: data.notify_new_jobs,
      notifyPickupJobs: data.notify_pickup_jobs,
      notifyFavoriteUpdates: data.notify_favorite_updates,
      notificationAreas,
    });
  } catch (areaError) {
    return NextResponse.json(
      {
        message:
          areaError instanceof Error ? areaError.message : "通知エリアの保存に失敗しました。",
      },
      { status: 500 },
    );
  }
}
