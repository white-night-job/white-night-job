"use client";

import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { CompactJobCard } from "@/components/CompactJobCard";
import { StoreImagesGallery } from "@/components/StoreImagesGallery";
import { resolveDistrictSeoPaths } from "@/lib/district-seo-paths";
import { formatLocation } from "@/lib/job-storage";
import { getDisplayStoreImages } from "@/lib/job-db";
import {
  UNCONTRACTED_DISCLAIMER,
  UNCONTRACTED_OWNER_NOTE,
  UNCONTRACTED_PUBLIC_LABEL,
} from "@/lib/job-plan";
import { IMAGE_ALT_BRAND } from "@/lib/site";
import type { Job } from "@/types/job";

function sanitizeExternalHref(value: string | undefined): string | null {
  const raw = value?.trim();
  if (!raw) return null;
  if (!/^https?:\/\//i.test(raw)) return null;
  return raw;
}

type StoreInfoViewProps = {
  job: Job;
  /** Same area / job-type stores for internal linking (paid preferred upstream). */
  relatedJobs?: Job[];
  /** Admin/shop preview: disable outbound actions */
  preview?: boolean;
};

/**
 * Public store-info page for uncontracted listings.
 * Never shows job apply CTAs, salary, verified badge, or girl reviews.
 */
export function StoreInfoView({
  job,
  relatedJobs = [],
  preview = false,
}: StoreInfoViewProps) {
  const storeImages = getDisplayStoreImages(job);
  const googleMapUrl = job.address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(job.address)}`
    : null;
  const seoPaths = resolveDistrictSeoPaths({
    district: job.district,
    jobType: job.jobType,
  });

  const socialLinks = [
    {
      label: "X",
      href: job.xUrl,
      className: "border-black bg-black text-white hover:bg-zinc-900",
    },
    {
      label: "Instagram",
      href: job.instagramUrl,
      className:
        "border-pink-400 bg-gradient-to-r from-pink-500 via-fuchsia-500 to-purple-600 text-white hover:brightness-110",
    },
    {
      label: "TikTok",
      href: job.tiktokUrl,
      className:
        "border-cyan-300 bg-[linear-gradient(135deg,#000_0%,#111_48%,#25f4ee_49%,#25f4ee_52%,#fe2c55_53%,#fe2c55_56%,#000_57%)] text-white hover:brightness-110",
    },
    {
      label: "YouTube",
      href: job.youtubeUrl,
      className: "border-red-600 bg-red-600 text-white hover:bg-red-700",
    },
    {
      label: "公式サイト",
      href: job.websiteUrl,
      className:
        "border-gold bg-gradient-to-r from-gold to-gold-dark text-white hover:brightness-110",
    },
  ].flatMap((link) => {
    const href = sanitizeExternalHref(link.href);
    return href
      ? [{ label: link.label, href, className: link.className }]
      : [];
  });

  const breadcrumbItems = [
    { label: "店舗一覧", href: preview ? undefined : "/jobs" },
    ...(!preview && seoPaths.areaPath
      ? [{ label: `${seoPaths.areaLabel}の夜職求人`, href: seoPaths.areaPath }]
      : []),
    ...(!preview && seoPaths.jobTypePath
      ? [
          {
            label: `${seoPaths.areaLabel}の${seoPaths.jobTypeLabel}`,
            href: seoPaths.jobTypePath,
          },
        ]
      : []),
    { label: `${job.shopName}の店舗情報` },
  ];

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
      {!preview && (
        <div className="mb-3">
          <Link
            href="/jobs"
            scroll={false}
            className="inline-flex min-h-10 items-center text-sm font-medium text-gold-dark"
          >
            ← 戻る
          </Link>
        </div>
      )}

      <Breadcrumbs items={breadcrumbItems} />

      <article className="overflow-hidden rounded-2xl border border-gold/25 bg-white shadow-gold">
        {job.imageUrl ? (
          <div className="overflow-hidden border-b border-gold/20">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={job.imageUrl}
              alt={`${job.shopName}｜${IMAGE_ALT_BRAND}`}
              className="h-52 w-full object-cover sm:h-64"
            />
          </div>
        ) : (
          <div className="relative flex h-52 w-full items-center justify-center overflow-hidden bg-gradient-to-br from-charcoal via-[#251c11] to-gold-dark sm:h-64">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(212,175,55,0.35),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(201,162,39,0.22),transparent_34%)]" />
            <div className="relative text-center">
              <p className="font-serif text-xl font-semibold tracking-[0.22em] text-gold-light">
                White Night
              </p>
              <p className="mt-2 text-xs tracking-[0.35em] text-gold-light/80">
                STORE INFO
              </p>
            </div>
          </div>
        )}

        <div className="border-b border-gold/20 px-5 py-6 sm:px-8">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-gold/35 bg-ivory px-2.5 py-1 text-xs font-semibold text-gold-dark">
              {UNCONTRACTED_PUBLIC_LABEL}
            </span>
            <p className="text-sm font-medium text-gold-dark">
              {formatLocation(job)} · {job.jobType}
            </p>
          </div>
          <h1 className="mt-2 font-serif text-xl font-semibold text-charcoal sm:text-2xl">
            {job.shopName}
          </h1>

          <div
            className="mt-4 rounded-2xl border border-amber-200/80 bg-amber-50 px-4 py-3 text-sm leading-relaxed text-amber-950"
            role="note"
          >
            {UNCONTRACTED_DISCLAIMER}
          </div>
        </div>

        <div className="space-y-6 px-5 py-6 sm:px-8">
          {storeImages.length > 0 ? (
            <StoreImagesGallery images={storeImages} shopName={job.shopName} />
          ) : null}

          <section className="rounded-3xl border border-gold/25 bg-gradient-to-br from-white to-ivory p-5 shadow-[0_8px_28px_rgba(201,169,98,0.12)]">
            <h2 className="mb-4 flex items-center gap-2 font-serif text-xl font-semibold text-charcoal">
              <span className="text-gold-dark">◆</span>
              店舗情報
            </h2>
            <div className="space-y-3">
              <div className="rounded-2xl border border-gold/20 bg-white px-4 py-3">
                <p className="text-xs font-medium text-muted">業種</p>
                {preview || !seoPaths.jobTypePath ? (
                  <p className="mt-1 text-sm font-medium text-charcoal">
                    {job.jobType}
                  </p>
                ) : (
                  <Link
                    href={seoPaths.jobTypePath}
                    className="mt-1 inline-flex text-sm font-medium text-gold-dark underline-offset-2 hover:underline"
                  >
                    {job.jobType}
                  </Link>
                )}
              </div>
              <div className="rounded-2xl border border-gold/20 bg-white px-4 py-3">
                <p className="text-xs font-medium text-muted">エリア</p>
                {preview || !seoPaths.areaPath ? (
                  <p className="mt-1 text-sm font-medium text-charcoal">
                    {formatLocation(job)}
                  </p>
                ) : (
                  <Link
                    href={seoPaths.areaPath}
                    className="mt-1 inline-flex text-sm font-medium text-gold-dark underline-offset-2 hover:underline"
                  >
                    {formatLocation(job)}
                  </Link>
                )}
              </div>
              {job.address ? (
                <div className="rounded-2xl border border-gold/20 bg-white px-4 py-3">
                  <p className="text-xs font-medium text-muted">住所</p>
                  {preview || !googleMapUrl ? (
                    <p className="mt-1 text-sm font-medium text-charcoal">
                      {job.address}
                    </p>
                  ) : (
                    <a
                      href={googleMapUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 flex min-h-11 flex-col justify-center rounded-xl border border-gold/25 bg-ivory px-3 py-2 text-sm font-medium text-charcoal transition hover:border-gold hover:bg-gold-light/20 sm:flex-row sm:items-center sm:justify-between sm:gap-3"
                    >
                      <span>{job.address}</span>
                      <span className="mt-1 shrink-0 font-semibold text-gold-dark sm:mt-0">
                        Googleマップで見る →
                      </span>
                    </a>
                  )}
                </div>
              ) : null}
            </div>
          </section>

          {socialLinks.length > 0 ? (
            <section className="rounded-2xl border border-gold/20 bg-gradient-to-br from-ivory to-white p-5">
              <h2 className="mb-3 text-base font-semibold text-charcoal">
                公式SNS・Web
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {socialLinks.map((link) =>
                  preview ? (
                    <span
                      key={link.label}
                      className={`flex min-h-12 items-center justify-center rounded-full border px-4 py-3 text-sm font-semibold opacity-70 ${link.className}`}
                    >
                      {link.label}
                    </span>
                  ) : (
                    <a
                      key={link.label}
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex min-h-12 items-center justify-center rounded-full border px-4 py-3 text-sm font-semibold shadow-md transition ${link.className}`}
                    >
                      {link.label}を見る
                    </a>
                  ),
                )}
              </div>
            </section>
          ) : null}

          {!preview ? (
            <section className="rounded-2xl border border-gold/20 bg-white p-5">
              <h2 className="mb-3 text-base font-semibold text-charcoal">
                関連ページ
              </h2>
              <ul className="flex flex-wrap gap-2 text-sm">
                <li>
                  <Link
                    href="/jobs"
                    className="inline-flex rounded-full border border-gold/30 bg-ivory px-3 py-1.5 font-medium text-gold-dark hover:bg-gold-light/30"
                  >
                    店舗一覧
                  </Link>
                </li>
                {seoPaths.areaPath ? (
                  <li>
                    <Link
                      href={seoPaths.areaPath}
                      className="inline-flex rounded-full border border-gold/30 bg-ivory px-3 py-1.5 font-medium text-gold-dark hover:bg-gold-light/30"
                    >
                      {seoPaths.areaLabel}の夜職求人
                    </Link>
                  </li>
                ) : null}
                {seoPaths.jobTypePath ? (
                  <li>
                    <Link
                      href={seoPaths.jobTypePath}
                      className="inline-flex rounded-full border border-gold/30 bg-ivory px-3 py-1.5 font-medium text-gold-dark hover:bg-gold-light/30"
                    >
                      {seoPaths.areaLabel}の{seoPaths.jobTypeLabel}
                    </Link>
                  </li>
                ) : null}
              </ul>
            </section>
          ) : null}

          <section className="rounded-2xl border border-gold/30 bg-ivory/70 p-5">
            <h2 className="font-serif text-lg font-semibold text-charcoal">
              店舗関係者の方へ
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              {UNCONTRACTED_OWNER_NOTE}
            </p>
            {preview ? (
              <span className="mt-4 inline-flex min-h-11 items-center justify-center rounded-full border border-gold/40 bg-white px-5 text-sm font-semibold text-gold-dark opacity-70">
                店舗情報を確認・修正する
              </span>
            ) : (
              <Link
                href="/for-shops/apply"
                className="mt-4 inline-flex min-h-11 items-center justify-center rounded-full bg-gradient-to-r from-gold to-gold-dark px-5 text-sm font-semibold text-white shadow-gold"
              >
                店舗情報を確認・修正する
              </Link>
            )}
          </section>
        </div>
      </article>

      {!preview && relatedJobs.length > 0 ? (
        <section className="mt-8">
          <h2 className="font-serif text-lg font-semibold text-charcoal">
            同じエリア・業種の店舗
          </h2>
          <p className="mt-1 text-sm text-muted">
            求人掲載店舗を優先して表示しています。
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {relatedJobs.map((related) => (
              <CompactJobCard key={related.id} job={related} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
