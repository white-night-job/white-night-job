import { NextResponse } from "next/server";
import { getErrorMessage } from "@/lib/api-error";
import {
  formatTokyoDateTime,
  runDailyPickupDelivery,
} from "@/lib/line-daily-pickup";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

function authorizeCron(request: Request): {
  ok: boolean;
  reason: "ok" | "missing_env" | "invalid";
} {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) {
    return { ok: false, reason: "missing_env" };
  }

  const auth = request.headers.get("authorization");
  if (auth === `Bearer ${secret}`) return { ok: true, reason: "ok" };

  const headerSecret = request.headers.get("x-cron-secret");
  if (headerSecret === secret) return { ok: true, reason: "ok" };

  const url = new URL(request.url);
  if (url.searchParams.get("secret") === secret) return { ok: true, reason: "ok" };

  return { ok: false, reason: "invalid" };
}

async function handle(request: Request) {
  const now = new Date();
  const auth = authorizeCron(request);
  if (!auth.ok) {
    console.error("[cron/line-daily-pickup] unauthorized", {
      reason: auth.reason,
      executedAtUtc: now.toISOString(),
      executedAtJst: formatTokyoDateTime(now),
      hasAuthHeader: Boolean(request.headers.get("authorization")),
      hasXCronSecret: Boolean(request.headers.get("x-cron-secret")),
    });
    return NextResponse.json(
      {
        message:
          auth.reason === "missing_env"
            ? "CRON_SECRET is not configured"
            : "Unauthorized",
      },
      { status: 401 },
    );
  }

  const url = new URL(request.url);
  const dryRun =
    url.searchParams.get("dryRun") === "1" ||
    url.searchParams.get("dry-run") === "1";
  // 1ユーザー限定の手動確認用。本番Cronは onlyUserId 無しで全員配信。
  const onlyUserId = url.searchParams.get("onlyUserId")?.trim() || null;

  console.info("[cron/line-daily-pickup] authorized", {
    executedAtUtc: now.toISOString(),
    executedAtJst: formatTokyoDateTime(now),
    dryRun,
    onlyUserId: onlyUserId ? `${onlyUserId.slice(0, 8)}…` : null,
    method: request.method,
  });

  try {
    const result = await runDailyPickupDelivery({
      dryRun,
      onlyUserId,
      now,
    });
    console.info("[cron/line-daily-pickup] result", {
      scheduledDate: result.scheduledDate,
      batchStatus: result.batchStatus,
      batchId: result.batchId,
      targetUsers: result.targetUsers,
      sent: result.sent,
      failed: result.failed,
      skippedNoShop: result.skippedNoShop,
      skippedDuplicate: result.skippedDuplicate,
      lineHttpStatuses: result.lineHttpStatuses,
      messagingTokenConfigured: result.messagingTokenConfigured,
    });
    return NextResponse.json({
      ok: true,
      ...result,
    });
  } catch (error) {
    console.error("[cron/line-daily-pickup] failed", {
      executedAtUtc: now.toISOString(),
      executedAtJst: formatTokyoDateTime(now),
      message: getErrorMessage(error, "unknown"),
    });
    return NextResponse.json(
      { message: getErrorMessage(error, "毎日PickUp配信に失敗しました。") },
      { status: 500 },
    );
  }
}

export async function GET(request: Request) {
  return handle(request);
}

export async function POST(request: Request) {
  return handle(request);
}
