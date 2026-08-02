import { NextResponse } from "next/server";
import { getErrorMessage } from "@/lib/api-error";
import { setShopCookie } from "@/lib/shop-auth";
import { shopPasswordsMatch } from "@/lib/shop-credentials";
import { createSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_MINUTES = 15;

function lockMessage(lockedUntil: Date): string {
  const minutes = Math.max(
    1,
    Math.ceil((lockedUntil.getTime() - Date.now()) / 60_000),
  );
  return `ログインに複数回失敗したため、約${minutes}分間ロックされています。`;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      loginId?: string;
      password?: string;
    };
    const loginId = body.loginId?.trim() ?? "";
    const password = body.password ?? "";

    if (!loginId || !password) {
      return NextResponse.json(
        { message: "ログインIDまたはパスワードが違います" },
        { status: 401 },
      );
    }

    const supabase = createSupabaseAdmin();
    const authStarted = Date.now();
    const { data: job, error } = await supabase
      .from("jobs")
      .select(
        "id, shop_name, shop_login_id, shop_login_password, published, plan, shop_login_failed_attempts, shop_login_locked_until",
      )
      .eq("shop_login_id", loginId)
      .maybeSingle();

    if (error) throw error;

    if (!job?.shop_login_id?.trim() || !job.shop_login_password) {
      return NextResponse.json(
        { message: "ログインIDまたはパスワードが違います" },
        { status: 401 },
      );
    }

    const lockedUntilRaw = job.shop_login_locked_until as string | null;
    if (lockedUntilRaw) {
      const lockedUntil = new Date(lockedUntilRaw);
      if (!Number.isNaN(lockedUntil.getTime()) && lockedUntil.getTime() > Date.now()) {
        return NextResponse.json(
          { message: lockMessage(lockedUntil) },
          { status: 423 },
        );
      }
    }

    if (!shopPasswordsMatch(job.shop_login_password, password)) {
      const failedAttempts =
        (Number(job.shop_login_failed_attempts) || 0) + 1;
      const updates: {
        shop_login_failed_attempts: number;
        shop_login_locked_until?: string | null;
      } = {
        shop_login_failed_attempts: failedAttempts,
      };

      if (failedAttempts >= MAX_FAILED_ATTEMPTS) {
        updates.shop_login_failed_attempts = 0;
        updates.shop_login_locked_until = new Date(
          Date.now() + LOCK_MINUTES * 60_000,
        ).toISOString();
      }

      await supabase.from("jobs").update(updates).eq("id", job.id);

      if (failedAttempts >= MAX_FAILED_ATTEMPTS) {
        return NextResponse.json(
          {
            message: `ログインに${MAX_FAILED_ATTEMPTS}回失敗したため、${LOCK_MINUTES}分間ロックされました。`,
          },
          { status: 423 },
        );
      }

      return NextResponse.json(
        { message: "ログインIDまたはパスワードが違います" },
        { status: 401 },
      );
    }

    await supabase
      .from("jobs")
      .update({
        shop_login_failed_attempts: 0,
        shop_login_locked_until: null,
      })
      .eq("id", job.id);

    await setShopCookie(job.id);
    console.info("[shop-login] auth-complete", {
      jobId: job.id,
      authMs: Date.now() - authStarted,
    });
    return NextResponse.json({
      ok: true,
      jobId: job.id,
      shopName: job.shop_name,
      published: job.published ?? true,
      plan: job.plan ?? null,
      timings: { authMs: Date.now() - authStarted },
    });
  } catch (error) {
    return NextResponse.json(
      { message: getErrorMessage(error, "ログインに失敗しました。") },
      { status: 500 },
    );
  }
}
