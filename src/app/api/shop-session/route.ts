import { NextResponse } from "next/server";
import { getAuthenticatedShopJobId } from "@/lib/shop-auth";
import {
  getShopScopedCache,
  setShopScopedCache,
  shopSessionCacheKey,
} from "@/lib/shop-scoped-cache";
import { createSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const SESSION_CACHE_TTL_MS = 20_000;

type SessionPayload = {
  authenticated: true;
  jobId: string;
  shopName: string;
  published?: boolean;
  plan?: string | null;
};

export async function GET() {
  const startedAt = Date.now();
  const jobId = await getAuthenticatedShopJobId();
  if (!jobId) {
    return NextResponse.json({ authenticated: false });
  }

  const cacheKey = shopSessionCacheKey(jobId);
  const cached = getShopScopedCache<SessionPayload>(cacheKey, jobId);
  if (cached) {
    return NextResponse.json({
      ...cached,
      timings: { totalMs: Date.now() - startedAt, cache: "hit" },
    });
  }

  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from("jobs")
    .select("id, shop_name, published, plan")
    .eq("id", jobId)
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json({ authenticated: false });
  }

  const payload: SessionPayload = {
    authenticated: true,
    jobId: data.id,
    shopName: data.shop_name,
    published: data.published ?? true,
    plan: data.plan ?? null,
  };

  setShopScopedCache(cacheKey, jobId, payload, SESSION_CACHE_TTL_MS);

  return NextResponse.json({
    ...payload,
    timings: { totalMs: Date.now() - startedAt, cache: "miss" },
  });
}
