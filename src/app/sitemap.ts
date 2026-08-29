import type { MetadataRoute } from "next";
import { COLUMN_ARTICLES } from "@/data/column-articles";
import { DISTRICT_AREA_PAGES } from "@/lib/district-seo";
import { isUncontractedPlan } from "@/lib/job-plan";
import { listPublishedJobsForSitemap } from "@/lib/seo-area-jobs";
import { listPublishedSeoLandings } from "@/lib/seo-landing";
import { assertSeoLandingParity } from "@/lib/seo-landing/parity";
import { SITE_URL } from "@/lib/site";
import {
  SUSUKINO_AREA_PAGE,
  SUSUKINO_JOB_TYPE_PAGES,
} from "@/lib/susukino-seo";

const landingPaths = listPublishedSeoLandings().map((page) => ({
  path: page.path,
  changeFrequency: "daily" as const,
  priority: 0.9,
}));

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
  ...DISTRICT_AREA_PAGES.flatMap((area) =>
    area.jobTypePages.map((page) => ({
      path: page.path,
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
  ),
  ...landingPaths,
  { path: "/first-time-guide", changeFrequency: "monthly", priority: 0.7 },
  { path: "/faq", changeFrequency: "monthly", priority: 0.6 },
  { path: "/column", changeFrequency: "weekly", priority: 0.7 },
  { path: "/for-shops", changeFrequency: "monthly", priority: 0.5 },
  { path: "/company", changeFrequency: "yearly", priority: 0.3 },
  { path: "/contact", changeFrequency: "yearly", priority: 0.3 },
  { path: "/privacy", changeFrequency: "yearly", priority: 0.2 },
  { path: "/terms", changeFrequency: "yearly", priority: 0.2 },
  { path: "/terms-user", changeFrequency: "yearly", priority: 0.2 },
  { path: "/terms-shop", changeFrequency: "yearly", priority: 0.2 },
  { path: "/legal", changeFrequency: "yearly", priority: 0.2 },
  { path: "/report", changeFrequency: "monthly", priority: 0.4 },
  { path: "/cast-guide", changeFrequency: "monthly", priority: 0.5 },
  { path: "/staff-intro", changeFrequency: "monthly", priority: 0.4 },
  { path: "/shop-videos", changeFrequency: "monthly", priority: 0.4 },
  {
    path: "/pre-interview-consultation",
    changeFrequency: "monthly",
    priority: 0.4,
  },
  ...COLUMN_ARTICLES.map((article) => ({
    path: `/column/${article.slug}`,
    changeFrequency: "monthly" as const,
    priority: 0.55,
  })),
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (process.env.NODE_ENV !== "production") {
    const parityErrors = assertSeoLandingParity();
    if (parityErrors.length > 0) {
      console.warn("[seo-landing parity]", parityErrors.join(" | "));
    }
  }

  const now = new Date();
  const seen = new Set<string>();
  const staticEntries: MetadataRoute.Sitemap = [];
  for (const item of STATIC_PATHS) {
    if (seen.has(item.path)) continue;
    seen.add(item.path);
    staticEntries.push({
      url: `${SITE_URL}${item.path}`,
      lastModified: now,
      changeFrequency: item.changeFrequency,
      priority: item.priority,
    });
  }

  let jobEntries: MetadataRoute.Sitemap = [];
  try {
    const jobs = await listPublishedJobsForSitemap();
    jobEntries = jobs.map((job) => {
      const storeInfoOnly = isUncontractedPlan(job.plan);
      return {
        url: `${SITE_URL}/jobs/${job.id}`,
        lastModified: job.updatedAt ? new Date(job.updatedAt) : now,
        changeFrequency: "weekly" as const,
        // Paid job listings stay higher priority than store-info pages.
        priority: storeInfoOnly ? 0.55 : 0.8,
      };
    });
  } catch (error) {
    console.error("[sitemap] failed to load jobs", error);
  }

  return [...staticEntries, ...jobEntries];
}
