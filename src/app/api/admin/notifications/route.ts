import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getErrorMessage } from "@/lib/api-error";
import {
  listAdminNotifications,
  markAdminNotificationRead,
  markAllAdminNotificationsRead,
} from "@/lib/admin-notifications";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const limit = Number(searchParams.get("limit") ?? 50);
    const offset = Number(searchParams.get("offset") ?? 0);
    const unreadOnly = searchParams.get("unreadOnly") === "1";

    const result = await listAdminNotifications({
      limit: Number.isFinite(limit) ? limit : 50,
      offset: Number.isFinite(offset) ? offset : 0,
      unreadOnly,
    });

    return NextResponse.json({
      notifications: result.items,
      unreadCount: result.unreadCount,
    });
  } catch (error) {
    return NextResponse.json(
      { message: getErrorMessage(error, "通知一覧の取得に失敗しました。") },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as {
      id?: string;
      markAllRead?: boolean;
      isRead?: boolean;
    };

    if (body.markAllRead) {
      const count = await markAllAdminNotificationsRead();
      return NextResponse.json({ ok: true, updated: count });
    }

    if (!body.id || typeof body.id !== "string") {
      return NextResponse.json({ message: "id が必要です。" }, { status: 400 });
    }

    await markAdminNotificationRead(body.id, body.isRead !== false);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { message: getErrorMessage(error, "通知の更新に失敗しました。") },
      { status: 500 },
    );
  }
}
