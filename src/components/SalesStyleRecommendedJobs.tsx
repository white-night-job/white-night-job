"use client";

import Link from "next/link";
import { Store } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { FavoriteButton } from "@/components/FavoriteButton";
import { JobImpressionTracker } from "@/components/JobImpressionTracker";
import { buildJobCardConditions } from "@/lib/job-card-conditions";
import { isUncontractedPlan } from "@/lib/job-plan";
import { emptyJobFilters } from "@/lib/job-filters";
import { fetchJobs, formatLocation } from "@/lib/job-storage";
import { dedupeJobsByShop, formatPreferredAreaList } from "@/lib/preferred-areas";
import { usePreferredAreas } from "@/lib/preferred-areas-client";
import { SALES_STYLE_PROFILES, type SalesStyleType } from "@/lib/sales-style-diagnosis";
import { IMAGE_ALT_BRAND } from "@/lib/site";
import type { Job } from "@/types/job";

const INITIAL_COUNT = 4;
const PAGE_SIZE = 4;
/** 希望エリア内の件数がこれ未満なら、エリア外の同職種求人を「近い条件」として添える */
const NEARBY_THRESHOLD = 3;

function jobTypeLabel(jobType: string): string {
  return jobType === "ニュークラ" ? "ニュークラブ" : jobType;
}

function SalesStyleShopCard({ job }: { job: Job }) {
  const storeInfoOnly = isUncontractedPlan(job.plan);
  const tags = storeInfoOnly ? [] : buildJobCardConditions(job).tags.slice(0, 3);

  return (
    <JobImpressionTracker jobId={job.id}>
      <article className="ss-shop-card">
        <div className="ss-shop-fav">
          <FavoriteButton jobId={job.id} allowLineLoginRedirect />
        </div>
        <Link href={`/jobs/${job.id}`} prefetch className="ss-shop-link">
          <div className="ss-shop-thumb">
            {job.imageUrl ? (
              <img
                src={job.imageUrl}
                alt={`${job.shopName}の求人｜${IMAGE_ALT_BRAND}`}
                loading="lazy"
              />
            ) : (
              <span className="font-serif">White Night</span>
            )}
          </div>
          <div className="ss-shop-body">
            <h4 className="ss-shop-name font-serif">{job.shopName}</h4>
            <p className="ss-shop-meta">
              {formatLocation(job)}
              <span aria-hidden> ／ </span>
              {jobTypeLabel(job.jobType)}
            </p>
            {!storeInfoOnly && job.salary ? (
              <p className="ss-shop-salary">{job.salary}</p>
            ) : null}
            {tags.length > 0 ? (
              <ul className="ss-shop-tags">
                {tags.map((tag) => (
                  <li key={tag.key}>{tag.label}</li>
                ))}
              </ul>
            ) : null}
            <span className="ss-shop-cta">
              {storeInfoOnly ? "店舗情報を見る" : "詳細・応募はこちら"}
            </span>
          </div>
        </Link>
      </article>
    </JobImpressionTracker>
  );
}

export function SalesStyleRecommendedJobs({
  type,
  sectionId,
}: {
  type: SalesStyleType;
  sectionId: string;
}) {
  const profile = SALES_STYLE_PROFILES[type];
  const { areas, configured, ready: areasReady } = usePreferredAreas();
  const jobTypes = useMemo(
    () => profile.jobTypes.map((jobType) => jobType.value),
    [profile],
  );
  const [jobs, setJobs] = useState<Job[]>([]);
  const [nearbyJobs, setNearbyJobs] = useState<Job[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [visibleCount, setVisibleCount] = useState(INITIAL_COUNT);

  useEffect(() => {
    if (!areasReady) return;
    let cancelled = false;
    setStatus("loading");
    setVisibleCount(INITIAL_COUNT);

    async function load() {
      // API の並び（既存ランキング・プラン順位）を維持する
      const primary = dedupeJobsByShop(
        await fetchJobs({
          ...emptyJobFilters(),
          jobTypes,
          districts: configured ? [...areas] : [],
        }),
      );
      let nearby: Job[] = [];
      if (configured && primary.length < NEARBY_THRESHOLD) {
        const primaryIds = new Set(primary.map((job) => job.id));
        const primaryShops = new Set(primary.map((job) => job.shopName.trim().toLowerCase()));
        nearby = dedupeJobsByShop(
          await fetchJobs({ ...emptyJobFilters(), jobTypes }),
        ).filter(
          (job) =>
            !primaryIds.has(job.id) &&
            !primaryShops.has(job.shopName.trim().toLowerCase()),
        );
      }
      return { primary, nearby };
    }

    load()
      .then(({ primary, nearby }) => {
        if (cancelled) return;
        setJobs(primary);
        setNearbyJobs(nearby);
        setStatus("ready");
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, [areas, areasReady, configured, jobTypes]);

  const combined = useMemo(
    () => [
      ...jobs.map((job) => ({ job, nearby: false })),
      ...nearbyJobs.map((job) => ({ job, nearby: true })),
    ],
    [jobs, nearbyJobs],
  );
  const visible = combined.slice(0, visibleCount);
  const firstNearbyIndex = visible.findIndex((item) => item.nearby);
  const jobTypeText = profile.jobTypes.map((jobType) => jobType.label).join("・");

  return (
    <section
      id={sectionId}
      className="ss-section ss-shops-section"
      aria-labelledby={`${sectionId}-heading`}
    >
      <div className="ss-section-head">
        <span className="ss-section-icon" aria-hidden>
          <Store size={16} strokeWidth={1.8} />
        </span>
        <div>
          <p className="ss-section-eyebrow">Recommend</p>
          <h3 id={`${sectionId}-heading`} className="ss-section-title font-serif">
            あなたに合う店舗
          </h3>
        </div>
      </div>
      <p className="ss-section-lead">
        {configured
          ? `希望エリア（${formatPreferredAreaList(areas)}）の、${jobTypeText}の掲載中求人です。`
          : `相性の良い職種（${jobTypeText}）の掲載中求人です。`}
      </p>

      {status === "loading" ? (
        <div className="ss-shop-list" aria-busy="true">
          {[0, 1].map((key) => (
            <div key={key} className="ss-shop-skeleton" />
          ))}
        </div>
      ) : status === "error" ? (
        <p className="ss-empty">求人を読み込めませんでした。時間をおいて再度お試しください。</p>
      ) : combined.length === 0 ? (
        <p className="ss-empty">現在、条件に合う求人を準備中です。</p>
      ) : (
        <>
          {jobs.length === 0 ? (
            <p className="ss-empty">
              希望エリアで条件に合う求人は準備中です。近い条件のお店をご紹介します。
            </p>
          ) : null}
          <div className="ss-shop-list">
            {visible.map((item, index) => (
              <div key={item.job.id}>
                {index === firstNearbyIndex && jobs.length > 0 ? (
                  <p className="ss-shop-nearby-label">近い条件のお店（希望エリア外）</p>
                ) : null}
                <SalesStyleShopCard job={item.job} />
              </div>
            ))}
          </div>
          {visibleCount < combined.length ? (
            <button
              type="button"
              onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
              className="ss-more-btn"
            >
              もっと見る（残り{combined.length - visibleCount}件）
            </button>
          ) : null}
        </>
      )}
    </section>
  );
}
