import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { sendLinePushMessage } from "@/lib/line-auth";
import { createSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

type NotificationType = "new_jobs" | "pickup_jobs" | "favorite_updates";

type NotificationRequest = {
  type?: NotificationType;
  jobId?: string;
  message?: string;
};

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ message: "認証が必要です。" }, { status: 401 });
  }

  const body = (await request.json()) as NotificationRequest;
  const type = body.type;
  const customMessage = body.message?.trim();
  if (!type) {
    return NextResponse.json({ message: "type is required" }, { status: 400 });
  }

  const supabase = createSupabaseAdmin();
  let userRows: Array<{ id: string; line_user_id: string; job_id?: string | null }> = [];

  if (type === "favorite_updates") {
    if (!body.jobId) {
      return NextResponse.json({ message: "jobId is required for favorite_updates" }, { status: 400 });
    }
    const { data: favorites, error } = await supabase
      .from("user_favorites")
      .select("user_id, job_id")
      .eq("job_id", body.jobId);
    if (error) {
      return NextResponse.json({ message: error.message }, { status: 500 });
    }
    const userIds = [...new Set((favorites ?? []).map((row) => row.user_id))];
    if (userIds.length > 0) {
      const { data: settingsRows, error: settingsError } = await supabase
        .from("user_notification_settings")
        .select("user_id")
        .eq("notify_favorite_updates", true)
        .in("user_id", userIds);
      if (settingsError) {
        return NextResponse.json({ message: settingsError.message }, { status: 500 });
      }
      const allowedUserIds = [...new Set((settingsRows ?? []).map((row) => row.user_id))];
      if (allowedUserIds.length > 0) {
        const { data: users, error: usersError } = await supabase
          .from("users")
          .select("id, line_user_id")
          .in("id", allowedUserIds);
        if (usersError) {
          return NextResponse.json({ message: usersError.message }, { status: 500 });
        }
        const favoriteByUserId = new Map(
          (favorites ?? []).map((row) => [row.user_id, row.job_id]),
        );
        userRows = (users ?? [])
          .filter((row) => Boolean(row.line_user_id))
          .map((row) => ({
            id: row.id,
            line_user_id: row.line_user_id,
            job_id: favoriteByUserId.get(row.id) ?? null,
          }));
      }
    }
  } else {
    const flag =
      type === "new_jobs" ? "notify_new_jobs" : "notify_pickup_jobs";
    const { data: settingsRows, error } = await supabase
      .from("user_notification_settings")
      .select("user_id")
      .eq(flag, true);
    if (error) {
      return NextResponse.json({ message: error.message }, { status: 500 });
    }
    const userIds = (settingsRows ?? []).map((row) => row.user_id);
    if (userIds.length > 0) {
      const { data: users, error: usersError } = await supabase
        .from("users")
        .select("id, line_user_id")
        .in("id", userIds);
      if (usersError) {
        return NextResponse.json({ message: usersError.message }, { status: 500 });
      }
      userRows = (users ?? [])
        .filter((row) => Boolean(row.line_user_id))
        .map((row) => ({
          id: row.id,
          line_user_id: row.line_user_id,
        }));
    }
  }

  const messageMap: Record<NotificationType, string> = {
    new_jobs:
      "White Night Jobに新着店舗が追加されました。気になる求人をチェックしてみてください。",
    pickup_jobs:
      "White Night JobのPICK UP店舗が更新されました。今すぐチェックできます。",
    favorite_updates:
      "お気に入り登録した店舗情報が更新されました。最新情報をご確認ください。",
  };
  const text = customMessage || messageMap[type];

  let sent = 0;
  let failed = 0;
  for (const user of userRows) {
    let status = "sent";
    try {
      await sendLinePushMessage(user.line_user_id, text);
      sent += 1;
    } catch {
      status = "failed";
      failed += 1;
    }
    await supabase.from("notification_logs").insert({
      user_id: user.id,
      job_id: body.jobId ?? user.job_id ?? null,
      type,
      status,
      sent_at: new Date().toISOString(),
    });
  }

  return NextResponse.json({ ok: true, sent, failed });
}
