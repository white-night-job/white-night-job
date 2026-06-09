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
    const { data: job, error } = await supabase
      .from("jobs")
      .select("id, shop_login_id, shop_login_password")
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
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { message: getErrorMessage(error, "ログインに失敗しました。") },
      { status: 500 },
    );
  }
}
