import { createSupabaseAdmin } from "@/lib/supabase";
import type { Job } from "@/types/job";

/** 同一店舗の再配信クールダウン（5日 = 120時間） */
export const LINE_SHOP_DELIVERY_COOLDOWN_MS = 120 * 60 * 60 * 1000;

const AGGREGATE_BATCH_SHOP_NAMES = new Set(["毎日PickUp配信"]);

/**
 * 求人IDが違っても同一店舗として扱うための正規化キー。
 * （空白・全角半角の差を吸収）
 */
export function normalizeShopDeliveryKey(shopName: string): string {
  return shopName
    .normalize("NFKC")
    .trim()
    .replace(/\s+/g, "")
    .toLowerCase();
}

export function isShopKeyInDeliveryCooldown(
  shopName: string,
  cooldownKeys: ReadonlySet<string>,
): boolean {
  const key = normalizeShopDeliveryKey(shopName);
  if (!key) return false;
  return cooldownKeys.has(key);
}

export function filterJobsOutsideShopDeliveryCooldown(
  jobs: Job[],
  cooldownKeys: ReadonlySet<string>,
): Job[] {
  if (cooldownKeys.size === 0) return jobs;
  return jobs.filter(
    (job) => !isShopKeyInDeliveryCooldown(job.shopName, cooldownKeys),
  );
}

/**
 * 直近120時間以内に LINE 配信成功した店舗キーを返す。
 * 成功（status=sent / success_count>0）のみを対象にし、失敗は含めない。
 *
 * 利用テーブル（既存）:
 * - line_notification_logs（毎日PickUp）
 * - notification_logs（新着・お気に入り等の個別送信）
 * - line_notification_batches（バッチ成功）
 */
export async function fetchShopKeysInLineDeliveryCooldown(
  now: Date = new Date(),
): Promise<Set<string>> {
  const sinceIso = new Date(
    now.getTime() - LINE_SHOP_DELIVERY_COOLDOWN_MS,
  ).toISOString();
  const supabase = createSupabaseAdmin();
  const jobIds = new Set<string>();
  const keys = new Set<string>();

  const [dailyRes, notifRes, batchRes] = await Promise.all([
    supabase
      .from("line_notification_logs")
      .select("job_id")
      .eq("status", "sent")
      .gte("sent_at", sinceIso)
      .not("job_id", "is", null),
    supabase
      .from("notification_logs")
      .select("job_id")
      .eq("status", "sent")
      .gte("sent_at", sinceIso)
      .not("job_id", "is", null),
    supabase
      .from("line_notification_batches")
      .select("job_id, shop_name, success_count")
      .gt("success_count", 0)
      .gte("sent_at", sinceIso),
  ]);

  if (dailyRes.error) {
    console.error(
      "[line-shop-cooldown] line_notification_logs query failed",
      dailyRes.error,
    );
  }
  if (notifRes.error) {
    console.error(
      "[line-shop-cooldown] notification_logs query failed",
      notifRes.error,
    );
  }
  if (batchRes.error) {
    console.error(
      "[line-shop-cooldown] line_notification_batches query failed",
      batchRes.error,
    );
  }

  for (const row of dailyRes.data ?? []) {
    if (typeof row.job_id === "string" && row.job_id) {
      jobIds.add(row.job_id);
    }
  }
  for (const row of notifRes.data ?? []) {
    if (typeof row.job_id === "string" && row.job_id) {
      jobIds.add(row.job_id);
    }
  }
  for (const row of batchRes.data ?? []) {
    if (typeof row.job_id === "string" && row.job_id) {
      jobIds.add(row.job_id);
    }
    const shopName =
      typeof row.shop_name === "string" ? row.shop_name.trim() : "";
    if (shopName && !AGGREGATE_BATCH_SHOP_NAMES.has(shopName)) {
      keys.add(normalizeShopDeliveryKey(shopName));
    }
  }

  if (jobIds.size === 0) {
    return keys;
  }

  const idList = [...jobIds];
  // PostgREST .in() は長すぎると失敗しうるためチャンクする
  const chunkSize = 200;
  for (let i = 0; i < idList.length; i += chunkSize) {
    const chunk = idList.slice(i, i + chunkSize);
    const { data: jobs, error } = await supabase
      .from("jobs")
      .select("id, shop_name")
      .in("id", chunk);
    if (error) {
      console.error("[line-shop-cooldown] jobs shop_name lookup failed", error);
      continue;
    }
    for (const job of jobs ?? []) {
      if (typeof job.shop_name === "string" && job.shop_name.trim()) {
        keys.add(normalizeShopDeliveryKey(job.shop_name));
      }
    }
  }

  return keys;
}
