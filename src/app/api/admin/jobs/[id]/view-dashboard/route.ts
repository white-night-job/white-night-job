import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { setAdminShopViewCookie } from "@/lib/admin-shop-view";
import { getErrorMessage } from "@/lib/api-error";
import { setShopCookie } from "@/lib/shop-auth";
import { createSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * Admin-only proxy access to a shop dashboard.
 * Verifies admin session, then sets the shop session cookie for the target job
 * plus an admin-view marker (no shop password involved).
 */
export async function POST(_request: Request, { params }: RouteContext) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ message: "ログインしてください。" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const jobId = id?.trim();
    if (!jobId) {
      return NextResponse.json({ message: "求人が見つかりません。" }, { status: 404 });
    }

    const supabase = createSupabaseAdmin();
    const { data: job, error } = await supabase
      .from("jobs")
      .select("id, shop_name")
      .eq("id", jobId)
      .maybeSingle();

    if (error) throw error;
    if (!job) {
      return NextResponse.json({ message: "求人が見つかりません。" }, { status: 404 });
    }

    await setShopCookie(job.id);
    await setAdminShopViewCookie(job.id);

    return NextResponse.json({
      ok: true,
      jobId: job.id,
      shopName: job.shop_name,
      redirectTo: "/shop-dashboard",
    });
  } catch (error) {
    return NextResponse.json(
      {
        message: getErrorMessage(
          error,
          "店舗ダッシュボードを開けませんでした。",
        ),
      },
      { status: 500 },
    );
  }
}
