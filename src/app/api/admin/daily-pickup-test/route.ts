import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getErrorMessage } from "@/lib/api-error";
import {
  diagnoseDailyPickupUser,
  runDailyPickupDelivery,
} from "@/lib/line-daily-pickup";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * 管理画面からの毎日PickUp安全テスト。
 * - userId 必須（1ユーザーのみ）
 * - dryRun=true なら送信せず診断
 * - 本番の全員再送はできない
 */
export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json().catch(() => ({}))) as {
      userId?: string;
      dryRun?: boolean;
    };
    const userId = body.userId?.trim();
    if (!userId) {
      return NextResponse.json(
        {
          message:
            "userId（users.id）を指定してください。全員への一斉送信はできません。",
        },
        { status: 400 },
      );
    }

    const dryRun = body.dryRun === true;
    const diagnosis = await diagnoseDailyPickupUser(userId);

    if (dryRun) {
      return NextResponse.json({
        ok: true,
        mode: "diagnose",
        diagnosis,
        hint:
          diagnosis.reasons.length > 0
            ? diagnosis.reasons.join(" / ")
            : "配信条件を満たしています（dry-run）",
      });
    }

    if (!diagnosis.eligible) {
      return NextResponse.json(
        {
          message: "配信条件を満たしていないため送信しませんでした。",
          diagnosis,
        },
        { status: 400 },
      );
    }

    if (diagnosis.alreadySentToday) {
      return NextResponse.json(
        {
          message:
            "本日分は既に送信（または予約）済みです。二重送信を防ぐため再送しません。明日、または失敗ログの確認後に再試行してください。",
          diagnosis,
        },
        { status: 409 },
      );
    }

    if (diagnosis.matchingTopShopCount === 0) {
      return NextResponse.json(
        {
          message:
            "設定地域に一致する最優先店舗がないため送信できません。",
          diagnosis,
        },
        { status: 400 },
      );
    }

    const result = await runDailyPickupDelivery({
      dryRun: false,
      onlyUserId: userId,
    });

    return NextResponse.json({
      ok: true,
      mode: "send",
      diagnosis,
      result: {
        scheduledDate: result.scheduledDate,
        executedAtUtc: result.executedAtUtc,
        executedAtJst: result.executedAtJst,
        targetUsers: result.targetUsers,
        sent: result.sent,
        failed: result.failed,
        skippedNoShop: result.skippedNoShop,
        skippedDuplicate: result.skippedDuplicate,
        lineHttpStatuses: result.lineHttpStatuses,
        failures: result.failures,
        deliveredJobIds: result.deliveredJobIds,
        previews: result.previews,
      },
    });
  } catch (error) {
    console.error("[admin/daily-pickup-test]", {
      message: getErrorMessage(error, "unknown"),
    });
    return NextResponse.json(
      {
        message: getErrorMessage(
          error,
          "毎日PickUpテスト送信に失敗しました。",
        ),
      },
      { status: 500 },
    );
  }
}
