import type { MetadataRoute } from "next";
import { COLUMN_ARTICLES } from "@/data/column-articles";
import {
  DISTRICT_AREA_PAGES,
  jobTypeSlugFromJobType,
} from "@/lib/district-seo";
import {
  listPublishedJobTypesForDistrict,
  listPublishedJobsForSitemap,
} from "@/lib/seo-area-jobs";
import { SITE_URL } from "@/lib/site";
import {
  SUSUKINO_AREA_PAGE,
  SUSUKINO_JOB_TYPE_PAGES,
} from "@/lib/susukino-seo";

const STATIC_PATHS: Array<{
  path: string;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  priority: number;
}> = [
  { path: "/", changeFrequency: "daily", priority: 1 },
  { path: "/jobs", changeFrequency: "daily", priority: 0.9 },
  { path: SUSUKINO_AREA_PAGE.path, changeFrequency: "daily", priority: 0.95 },
  ...SUSUKINO_JOB_TYPE_PAGES.map((page) => ({
    path: page.path,
    changeFrequency: "daily" as const,
    priority: 0.85,
  })),
  ...DISTRICT_AREA_PAGES.map((page) => ({
    path: page.path,
    changeFrequency: "daily" as const,
    priority: 0.9,
  })),
  { path: "/first-time-guide", changeFrequency: "monthly", priority: 0.7 },
  { path: "/faq", changeFrequency: "monthly", priority: 0.6 },
  { path: "/column", changeFrequency: "weekly", priority: 0.7 },
  { path: "/for-shops", changeFrequency: "monthly", priority: 0.5 },
  { path: "/company", changeFrequency: "yearly", priority: 0.3 },
  { path: "/contact", changeFrequency: "yearly", priority: 0.3 },
  { path: "/privacy", changeFrequency: "yearly", priority: 0.2 },
  { path: "/terms", changeFrequency: "yearly", priority: 0.2 },
  { path: "/cast-guide", changeFrequency: "monthly", priority: 0.5 },
  ...COLUMN_ARTICLES.map((article) => ({
    path: `/column/${article.slug}`,
    changeFrequency: "monthly" as const,
    priority: 0.55,
  })),
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const staticEntries: MetadataRoute.Sitemap = STATIC_PATHS.map((item) => ({
    url: `${SITE_URL}${item.path}`,
    lastModified: now,
    changeFrequency: item.changeFrequency,
    priority: item.priority,
  }));

  const districtJobTypeEntries: MetadataRoute.Sitemap = [];
  for (const area of DISTRICT_AREA_PAGES) {
    try {
      const types = await listPublishedJobTypesForDistrict(area.district);
      for (const jobType of types) {
        const slug = jobTypeSlugFromJobType(jobType);
        if (!slug) continue;
        if (!area.jobTypePages.some((page) => page.slug === slug)) continue;
        districtJobTypeEntries.push({
          url: `${SITE_URL}${area.path}/${slug}`,
          lastModified: now,
          changeFrequency: "daily",
          priority: 0.8,
        });
      }
    } catch (error) {
      console.error("[sitemap] district job types failed", {
        district: area.district,
        error,
      });
    }
  }

  let jobEntries: MetadataRoute.Sitemap = [];
  try {
    const jobs = await listPublishedJobsForSitemap();
    jobEntries = jobs.map((job) => ({
      url: `${SITE_URL}/jobs/${job.id}`,
      lastModified: job.updatedAt ? new Date(job.updatedAt) : now,
      changeFrequency: "weekly",
      priority: 0.8,
    }));
  } catch (error) {
    console.error("[sitemap] failed to load jobs", error);
  }

  return [...staticEntries, ...districtJobTypeEntries, ...jobEntries];
}
