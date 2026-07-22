import { NextResponse } from "next/server";
import { getErrorMessage } from "@/lib/api-error";
import { getAuthenticatedShopJobId } from "@/lib/shop-auth";
import {
  getShopScopedCache,
  setShopScopedCache,
  shopDashboardShellCacheKey,
} from "@/lib/shop-scoped-cache";
import { createSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const SHELL_CACHE_TTL_MS = 30_000;

type ShellPayload = {
  jobId: string;
  shopName: string;
  published: boolean;
  plan: string | null;
  district: string;
};

/**
 * Minimal authenticated shell for shop dashboard first paint.
 * Metrics / full job / charts load on separate endpoints.
 */
export async function GET() {
  const startedAt = Date.now();
  const jobId = await getAuthenticatedShopJobId();
  if (!jobId) {
    return NextResponse.json({ message: "ログインしてください。" }, { status: 401 });
  }

  const cacheKey = shopDashboardShellCacheKey(jobId);
  const cached = getShopScopedCache<ShellPayload>(cacheKey, jobId);
  if (cached) {
    console.info("[shop-dashboard/shell] cache-hit", {
      jobId,
      totalMs: Date.now() - startedAt,
    });
    return NextResponse.json({
      ...cached,
      cache: "hit",
      timings: { totalMs: Date.now() - startedAt, cache: "hit" },
    });
  }

  try {
    const supabase = createSupabaseAdmin();
    const { data, error } = await supabase
      .from("jobs")
      .select("id, shop_name, published, plan, district")
      .eq("id", jobId)
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      return NextResponse.json({ message: "求人が見つかりません。" }, { status: 404 });
    }

    const payload: ShellPayload = {
      jobId: data.id,
      shopName: data.shop_name,
      published: data.published ?? true,
      plan: data.plan ?? null,
      district: data.district,
    };

    setShopScopedCache(cacheKey, jobId, payload, SHELL_CACHE_TTL_MS);
    const timings = { totalMs: Date.now() - startedAt, cache: "miss" };
    console.info("[shop-dashboard/shell]", { jobId, timings });

    return NextResponse.json({ ...payload, cache: "miss", timings });
  } catch (error) {
    return NextResponse.json(
      { message: getErrorMessage(error, "ダッシュボードの取得に失敗しました。") },
      { status: 500 },
    );
  }
}
