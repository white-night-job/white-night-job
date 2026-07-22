import { NextResponse } from "next/server";
import { getErrorMessage } from "@/lib/api-error";
import { setShopCookie } from "@/lib/shop-auth";
import { createSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

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
      .select("id, shop_name, shop_login_id, shop_login_password, published, plan")
      .eq("shop_login_id", loginId)
      .maybeSingle();

    if (error) throw error;

    if (
      !job?.shop_login_id?.trim() ||
      !job.shop_login_password ||
      job.shop_login_password !== password
    ) {
      return NextResponse.json(
        { message: "ログインIDまたはパスワードが違います" },
        { status: 401 },
      );
    }

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
