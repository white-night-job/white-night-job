import { unstable_cache } from "next/cache";
import { rowToJob } from "@/lib/job-db";
import { createSupabaseAdmin } from "@/lib/supabase";
import { SEO_JOBS_PAGE_SIZE } from "@/lib/susukino-seo";
import type { Job, JobType } from "@/types/job";

/** Columns needed to render public JobCard on SEO landings. */
const SEO_JOB_CARD_COLUMNS = [
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
  "introduction_text",
  "address",
  "benefits",
  "other_benefits",
  "requirements",
  "is_verified",
  "image_url",
  "line_url",
  "posted_at",
  "created_at",
  "updated_at",
  "pickup_enabled",
  "listing_priority",
  "plan",
].join(", ");

export type SeoJobsPageResult = {
  jobs: Job[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

async function fetchPublishedJobsPageUncached(params: {
  district: string;
  jobType?: JobType;
  page: number;
  pageSize: number;
}): Promise<SeoJobsPageResult> {
  const page = Math.max(1, params.page);
  const pageSize = Math.min(Math.max(1, params.pageSize), 24);
  const empty: SeoJobsPageResult = {
    jobs: [],
    total: 0,
    page,
    pageSize,
    totalPages: 0,
  };

  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY
  ) {
    return empty;
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const supabase = createSupabaseAdmin();
  let query = supabase
    .from("jobs")
    .select(SEO_JOB_CARD_COLUMNS, { count: "exact" })
    .eq("published", true)
    .eq("district", params.district)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (params.jobType) {
    query = query.eq("job_type", params.jobType);
  }

  const { data, error, count } = await query;
  if (error) {
    console.error("[seo-area-jobs] select failed", {
      district: params.district,
      jobType: params.jobType,
      message: error.message,
    });
    return empty;
  }

  const total = count ?? 0;
  const jobs = (data ?? []).map((row) =>
    rowToJob(row as unknown as Parameters<typeof rowToJob>[0]),
  );

  return {
    jobs,
    total,
    page,
    pageSize,
    totalPages: total === 0 ? 0 : Math.ceil(total / pageSize),
  };
}

export async function getPublishedSeoJobsPage(params: {
  district: string;
  jobType?: JobType;
  page?: number;
  pageSize?: number;
}): Promise<SeoJobsPageResult> {
  const page = Math.max(1, params.page ?? 1);
  const pageSize = params.pageSize ?? SEO_JOBS_PAGE_SIZE;
  const jobTypeKey = params.jobType ?? "all";

  return unstable_cache(
    () =>
      fetchPublishedJobsPageUncached({
        district: params.district,
        jobType: params.jobType,
        page,
        pageSize,
      }),
    ["seo-area-jobs", params.district, jobTypeKey, String(page), String(pageSize)],
    { revalidate: 120 },
  )();
}

export type SitemapJobEntry = {
  id: string;
  updatedAt: string | null;
};

async function listPublishedJobIdsUncached(): Promise<SitemapJobEntry[]> {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY
  ) {
    return [];
  }

  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from("jobs")
    .select("id, updated_at, posted_at")
    .eq("published", true)
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("[sitemap] published jobs select failed", error.message);
    return [];
  }

  return (data ?? []).map((row) => ({
    id: String(row.id),
    updatedAt: (row.updated_at as string | null) ?? (row.posted_at as string | null),
  }));
}

export async function listPublishedJobsForSitemap(): Promise<SitemapJobEntry[]> {
  return unstable_cache(listPublishedJobIdsUncached, ["sitemap-published-jobs"], {
    revalidate: 3600,
  })();
}
