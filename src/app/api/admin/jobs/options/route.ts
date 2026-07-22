import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getErrorMessage } from "@/lib/api-error";
import { createSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export type AdminJobOption = {
  id: string;
  shopName: string;
  district: string;
};

/** Lightweight shop list for LINE broadcast selectors (no full job payload). */
export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ message: "ログインしてください。" }, { status: 401 });
  }

  try {
    const supabase = createSupabaseAdmin();
    const { data, error } = await supabase
      .from("jobs")
      .select("id, shop_name, district")
      .eq("published", true)
      .order("shop_name", { ascending: true });

    if (error) throw error;

    const jobs: AdminJobOption[] = (data ?? []).map((row) => ({
      id: row.id,
      shopName: row.shop_name,
      district: row.district,
    }));

    return NextResponse.json({ jobs });
  } catch (error) {
    return NextResponse.json(
      { message: getErrorMessage(error, "店舗一覧の取得に失敗しました。") },
      { status: 500 },
    );
  }
}
