import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase";
import { getAuthenticatedUserId } from "@/lib/user-auth";
import {
  isNotificationArea,
  NOTIFICATION_AREA_OPTIONS,
} from "@/lib/notification-areas";
import {
  isJobType,
  MIN_HOURLY_WAGE_OPTIONS,
  NOTIFICATION_JOB_TYPE_OPTIONS,
} from "@/lib/notification-preferences";

export const dynamic = "force-dynamic";

type SettingsPayload = {
  notifyNewJobs?: boolean;
  notifyPickupJobs?: boolean;
  notifyFavoriteUpdates?: boolean;
  notificationAreas?: string[];
  notificationJobTypes?: string[];
  minHourlyWage?: number;
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
      min_hourly_wage: 0,
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

async function fetchNotificationJobTypes(userId: string) {
  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from("user_notification_job_types")
    .select("job_type")
    .eq("user_id", userId);
  if (error) {
    // テーブル未作成時は空配列
    console.error("[notification-settings] job types fetch failed", error);
    return [];
  }
  return (data ?? []).map((row) => row.job_type);
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

async function saveNotificationJobTypes(userId: string, jobTypes: string[]) {
  const supabase = createSupabaseAdmin();
  const valid = [...new Set(jobTypes.filter(isJobType))];

  const { error: deleteError } = await supabase
    .from("user_notification_job_types")
    .delete()
    .eq("user_id", userId);
  if (deleteError) throw deleteError;

  if (valid.length === 0) return [];

  const { error: insertError } = await supabase
    .from("user_notification_job_types")
    .insert(valid.map((jobType) => ({ user_id: userId, job_type: jobType })));
  if (insertError) throw insertError;
  return valid;
}

function normalizeMinWage(value: unknown): number {
  const n = Number(value ?? 0);
  if (!Number.isFinite(n) || n <= 0) return 0;
  if ((MIN_HOURLY_WAGE_OPTIONS as readonly number[]).includes(n)) return n;
  return 0;
}

export async function GET(request: Request) {
  const userId = await getAuthenticatedUserId(request);
  if (!userId) {
    return NextResponse.json({ message: "LINEログインが必要です。" }, { status: 401 });
  }
  try {
    const row = await ensureSettingsRow(userId);
    const [notificationAreas, notificationJobTypes] = await Promise.all([
      fetchNotificationAreas(userId),
      fetchNotificationJobTypes(userId),
    ]);
    return NextResponse.json({
      notifyNewJobs: row.notify_new_jobs,
      notifyPickupJobs: row.notify_pickup_jobs,
      notifyFavoriteUpdates: row.notify_favorite_updates,
      minHourlyWage: Number(row.min_hourly_wage ?? 0),
      notificationAreas,
      notificationJobTypes,
      areaOptions: NOTIFICATION_AREA_OPTIONS,
      jobTypeOptions: NOTIFICATION_JOB_TYPE_OPTIONS,
      minWageOptions: MIN_HOURLY_WAGE_OPTIONS,
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
  const minHourlyWage = normalizeMinWage(payload.minHourlyWage);

  const { data, error } = await supabase
    .from("user_notification_settings")
    .upsert(
      {
        user_id: userId,
        notify_new_jobs: payload.notifyNewJobs ?? true,
        notify_pickup_jobs: payload.notifyPickupJobs ?? true,
        notify_favorite_updates: payload.notifyFavoriteUpdates ?? true,
        min_hourly_wage: minHourlyWage,
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
    const [notificationAreas, notificationJobTypes] = await Promise.all([
      saveNotificationAreas(userId, payload.notificationAreas ?? []),
      saveNotificationJobTypes(userId, payload.notificationJobTypes ?? []),
    ]);
    return NextResponse.json({
      ok: true,
      notifyNewJobs: data.notify_new_jobs,
      notifyPickupJobs: data.notify_pickup_jobs,
      notifyFavoriteUpdates: data.notify_favorite_updates,
      minHourlyWage: Number(data.min_hourly_wage ?? 0),
      notificationAreas,
      notificationJobTypes,
    });
  } catch (areaError) {
    return NextResponse.json(
      {
        message:
          areaError instanceof Error ? areaError.message : "通知条件の保存に失敗しました。",
      },
      { status: 500 },
    );
  }
}
