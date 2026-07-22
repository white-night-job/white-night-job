import { NextResponse } from "next/server";
import { getErrorMessage } from "@/lib/api-error";
import {
  fetchApplicationRowsForJob,
  type ApplicationRow,
} from "@/lib/job-applications";
import { rowToJob } from "@/lib/job-db";
import { countMatchingNotifyRecipients } from "@/lib/line-auto-notify";
import { getAuthenticatedShopJobId } from "@/lib/shop-auth";
import {
  getShopScopedCache,
  setShopScopedCache,
} from "@/lib/shop-scoped-cache";
import { createSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const DEFERRED_CACHE_TTL_MS = 15_000;

function twelveMonthsAgoIso(): string {
  const date = new Date();
  date.setMonth(date.getMonth() - 12);
  return date.toISOString();
}

type DeferredPayload = {
  applicationRows: ApplicationRow[];
  newJobNotifyCount: number;
  pickupNotifyCount: number;
};

export async function GET() {
  const startedAt = Date.now();
  const timings: Record<string, number> = {};
  const jobId = await getAuthenticatedShopJobId();
  if (!jobId) {
    return NextResponse.json({ message: "ログインしてください。" }, { status: 401 });
  }

  const cacheKey = `shop-dashboard-deferred:${jobId}`;
  const cached = getShopScopedCache<DeferredPayload>(cacheKey, jobId);
  if (cached) {
    console.info("[shop-dashboard/deferred] cache-hit", {
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

    let applicationRows: ApplicationRow[] = [];
    const appsStarted = Date.now();
    try {
      applicationRows = await fetchApplicationRowsForJob(supabase, jobId, {
        sinceIso: twelveMonthsAgoIso(),
      });
    } catch (error) {
      console.error("[shop-dashboard/deferred] applications failed", error);
      applicationRows = [];
    }
    timings.applicationsMs = Date.now() - appsStarted;

    let newJobNotifyCount = 0;
    let pickupNotifyCount = 0;
    const notifyStarted = Date.now();
    try {
      const { data: jobRow, error: jobError } = await supabase
        .from("jobs")
        .select("*")
        .eq("id", jobId)
        .maybeSingle();

      if (jobError) throw jobError;
      if (jobRow) {
        const job = rowToJob(jobRow);
        const counts = await countMatchingNotifyRecipients(job);
        newJobNotifyCount = counts.newJobNotifyCount;
        pickupNotifyCount = counts.pickupNotifyCount;
      }
    } catch (error) {
      console.error("[shop-dashboard/deferred] notify count failed", error);
    }
    timings.notifyMs = Date.now() - notifyStarted;
    timings.totalMs = Date.now() - startedAt;
    console.info("[shop-dashboard/deferred]", { jobId, timings });

    const payload: DeferredPayload = {
      applicationRows,
      newJobNotifyCount,
      pickupNotifyCount,
    };
    setShopScopedCache(cacheKey, jobId, payload, DEFERRED_CACHE_TTL_MS);

    return NextResponse.json({ ...payload, cache: "miss", timings });
  } catch (error) {
    return NextResponse.json(
      {
        message: getErrorMessage(
          error,
          "追加データの取得に失敗しました。",
        ),
      },
      { status: 500 },
    );
  }
}
