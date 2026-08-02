import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getErrorMessage } from "@/lib/api-error";
import {
  encryptPasswordForStorage,
  generateShopLoginPassword,
} from "@/lib/shop-credentials";
import { createSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }>;
};

/** 管理者が店舗ログインPWを再発行する（IDは維持）。新PWは応答で一度だけ平文返却。 */
export async function POST(_request: Request, { params }: RouteContext) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ message: "ログインしてください。" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const supabase = createSupabaseAdmin();
    const { data: job, error: fetchError } = await supabase
      .from("jobs")
      .select("id, shop_login_id")
      .eq("id", id)
      .maybeSingle();

    if (fetchError) throw fetchError;
    if (!job) {
      return NextResponse.json({ message: "求人が見つかりません。" }, { status: 404 });
    }
    if (!job.shop_login_id?.trim()) {
      return NextResponse.json(
        { message: "店舗ログインIDが未設定です。求人を再保存してIDを発行してください。" },
        { status: 400 },
      );
    }

    const plainPassword = generateShopLoginPassword();
    const { error: updateError } = await supabase
      .from("jobs")
      .update({
        shop_login_password: encryptPasswordForStorage(plainPassword),
        shop_login_failed_attempts: 0,
        shop_login_locked_until: null,
      })
      .eq("id", id);

    if (updateError) throw updateError;

    return NextResponse.json({
      ok: true,
      shopLoginId: job.shop_login_id,
      shopLoginPassword: plainPassword,
      message: "パスワードを再発行しました。店舗へ伝えてください。",
    });
  } catch (error) {
    return NextResponse.json(
      {
        message: getErrorMessage(
          error,
          "パスワードの再発行に失敗しました。",
        ),
      },
      { status: 500 },
    );
  }
}
