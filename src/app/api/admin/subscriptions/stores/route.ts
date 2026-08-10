import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getErrorMessage } from "@/lib/api-error";
import { createSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export type AdminSubscriptionStoreOption = {
  id: string;
  shopName: string;
  district: string | null;
  listingStatus: string | null;
  /** すでに別の Stripe 契約が紐付いている場合 */
  linkedStripeSubscriptionId: string | null;
};

/**
 * 契約紐付け用の店舗一覧（店舗名検索可）。
 * GET /api/admin/subscriptions/stores?q=キーワード
 */
export async function GET(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim() ?? "";

    const supabase = createSupabaseAdmin();
    let jobsQuery = supabase
      .from("jobs")
      .select("id, shop_name, district, listing_status")
      .order("shop_name", { ascending: true })
      .limit(q ? 100 : 500);

    if (q) {
      jobsQuery = jobsQuery.ilike("shop_name", `%${q}%`);
    }

    const { data: jobs, error: jobsError } = await jobsQuery;
    if (jobsError) throw jobsError;

    const jobIds = (jobs ?? []).map((j) => j.id as string);
    const linkedByStore = new Map<string, string>();

    if (jobIds.length > 0) {
      const { data: subs, error: subsError } = await supabase
        .from("subscriptions")
        .select("store_id, stripe_subscription_id")
        .in("store_id", jobIds)
        .not("stripe_subscription_id", "is", null);
      if (subsError) throw subsError;
      for (const row of subs ?? []) {
        if (row.store_id && row.stripe_subscription_id) {
          linkedByStore.set(
            String(row.store_id),
            String(row.stripe_subscription_id),
          );
        }
      }
    }

    const stores: AdminSubscriptionStoreOption[] = (jobs ?? []).map((row) => ({
      id: row.id as string,
      shopName: (row.shop_name as string)?.trim() || "店舗名未設定",
      district: (row.district as string | null) ?? null,
      listingStatus: (row.listing_status as string | null) ?? null,
      linkedStripeSubscriptionId: linkedByStore.get(row.id as string) ?? null,
    }));

    return NextResponse.json({ stores });
  } catch (error) {
    return NextResponse.json(
      { message: getErrorMessage(error, "店舗一覧の取得に失敗しました。") },
      { status: 500 },
    );
  }
}
