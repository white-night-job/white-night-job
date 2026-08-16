import { unstable_cache } from "next/cache";
import { rowToJob } from "@/lib/job-db";
import { listingDisplayGroupRank } from "@/lib/shop-boosts";
import { createSupabaseAdmin } from "@/lib/supabase";
import type { Job, JobType } from "@/types/job";

export const SEO_JOBS_PAGE_SIZE = 12;

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

  const supabase = createSupabaseAdmin();
  let query = supabase
    .from("jobs")
    .select(SEO_JOB_CARD_COLUMNS)
    .eq("published", true)
    .eq("district", params.district)
    .order("created_at", { ascending: false });

  if (params.jobType) {
    query = query.eq("job_type", params.jobType);
  }

  const { data, error } = await query;
  if (error) {
    console.error("[seo-area-jobs] select failed", {
      district: params.district,
      jobType: params.jobType,
      message: error.message,
    });
    return empty;
  }

  // Paid job listings first, then store-info (uncontracted); newest within group.
  const sorted = (data ?? [])
    .map((row) => rowToJob(row as unknown as Parameters<typeof rowToJob>[0]))
    .sort((a, b) => {
      const rankDiff =
        listingDisplayGroupRank(b.plan, false) -
        listingDisplayGroupRank(a.plan, false);
      if (rankDiff !== 0) return rankDiff;
      return String(b.postedAt).localeCompare(String(a.postedAt));
    });

  const total = sorted.length;
  const from = (page - 1) * pageSize;
  const jobs = sorted.slice(from, from + pageSize);

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

/** Related published stores for internal linking (paid listings preferred). */
export async function listRelatedPublishedJobs(params: {
  district: string;
  jobType: JobType;
  excludeId: string;
  limit?: number;
}): Promise<Job[]> {
  const limit = Math.min(Math.max(params.limit ?? 6, 1), 12);
  const result = await getPublishedSeoJobsPage({
    district: params.district,
    jobType: params.jobType,
    page: 1,
    pageSize: limit + 4,
  });

  return result.jobs
    .filter((job) => job.id !== params.excludeId)
    .slice(0, limit);
}

export async function countPublishedJobs(params: {
  district: string;
  jobType?: JobType;
}): Promise<number> {
  const result = await getPublishedSeoJobsPage({
    district: params.district,
    jobType: params.jobType,
    page: 1,
    pageSize: 1,
  });
  return result.total;
}

async function listPublishedJobTypesForDistrictUncached(
  district: string,
): Promise<JobType[]> {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY
  ) {
    return [];
  }

  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from("jobs")
    .select("job_type")
    .eq("published", true)
    .eq("district", district);

  if (error) {
    console.error("[seo-area-jobs] job_type list failed", error.message);
    return [];
  }

  const set = new Set<string>();
  for (const row of data ?? []) {
    if (typeof row.job_type === "string" && row.job_type) {
      set.add(row.job_type);
    }
  }
  return [...set] as JobType[];
}

export async function listPublishedJobTypesForDistrict(
  district: string,
): Promise<JobType[]> {
  return unstable_cache(
    () => listPublishedJobTypesForDistrictUncached(district),
    ["seo-district-job-types", district],
    { revalidate: 300 },
  )();
}

export type SitemapJobEntry = {
  id: string;
  updatedAt: string | null;
  plan: string | null;
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
    .select("id, updated_at, posted_at, plan")
    .eq("published", true)
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("[sitemap] published jobs select failed", error.message);
    return [];
  }

  return (data ?? []).map((row) => ({
    id: String(row.id),
    updatedAt: (row.updated_at as string | null) ?? (row.posted_at as string | null),
    plan: (row.plan as string | null) ?? null,
  }));
}

export async function listPublishedJobsForSitemap(): Promise<SitemapJobEntry[]> {
  return unstable_cache(listPublishedJobIdsUncached, ["sitemap-published-jobs"], {
    revalidate: 3600,
  })();
}
