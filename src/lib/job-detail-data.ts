import { unstable_cache } from "next/cache";
import { getErrorMessage } from "@/lib/api-error";
import { rowToJob } from "@/lib/job-db";
import { createSupabaseAdmin } from "@/lib/supabase";
import type { Job } from "@/types/job";

/** Public detail columns only — exclude shop credentials / admin-only fields. */
export const PUBLIC_JOB_DETAIL_COLUMNS = [
  "id",
  "shop_name",
  "area",
  "district",
  "job_type",
  "title",
  "salary",
  "work_hours",
  "business_hours",
  "age_group",
  "customer_personality_level",
  "customer_age_level",
  "customer_regular_level",
  "introduction_text",
  "description_text",
  "description",
  "cast_voices",
  "store_images",
  "requirements",
  "benefits",
  "other_benefits",
  "is_verified",
  "image_url",
  "recruiter_name",
  "recruiter_title",
  "recruiter_image",
  "recruiter_message",
  "manager_comment",
  "phone",
  "address",
  "access",
  "x_url",
  "instagram_url",
  "tiktok_url",
  "youtube_url",
  "website_url",
  "line_url",
  "posted_at",
  "created_at",
  "open_date",
  "pickup_enabled",
  "listing_priority",
  "plan",
].join(", ");

async function fetchPublishedJobDetailUncached(id: string): Promise<Job | null> {
  const startedAt = Date.now();
  try {
    const supabase = createSupabaseAdmin();
    const { data, error } = await supabase
      .from("jobs")
      .select(PUBLIC_JOB_DETAIL_COLUMNS)
      .eq("id", id)
      .eq("published", true)
      .maybeSingle();

    if (error) {
      console.error("[job-detail] supabase select failed", {
        jobId: id,
        code: (error as { code?: string }).code,
        message: getErrorMessage(error, "unknown supabase error"),
        ms: Date.now() - startedAt,
      });
      return null;
    }
    if (!data) return null;

    if (process.env.NODE_ENV === "development") {
      console.info("[job-detail] db fetch", {
        jobId: id,
        ms: Date.now() - startedAt,
      });
    }

    return rowToJob(data as unknown as Parameters<typeof rowToJob>[0]);
  } catch (error) {
    console.error("[job-detail] unexpected fetch failure", {
      jobId: id,
      message: getErrorMessage(error, "unknown error"),
      ms: Date.now() - startedAt,
    });
    return null;
  }
}

/** Short-lived cache per job id (revalidated on admin/shop update via tag). */
export async function getPublishedJobDetail(id: string): Promise<Job | null> {
  const safeId = String(id ?? "").trim();
  if (!safeId) return null;

  return unstable_cache(
    () => fetchPublishedJobDetailUncached(safeId),
    ["job-detail", safeId],
    {
      revalidate: 60,
      tags: [`job-detail:${safeId}`],
    },
  )();
}
