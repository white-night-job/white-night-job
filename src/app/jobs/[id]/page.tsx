"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { FavoriteButton } from "@/components/FavoriteButton";
import { CompareButton } from "@/components/CompareButton";
import { LineApplyButton, PhoneApplyButton } from "@/components/LineApplyButton";
import { SafetyBadge } from "@/components/SafetyBadge";
import { getBenefitCategoryGroups } from "@/data/benefits";
import {
  formatCastVoiceAge,
  getDisplayCastVoices,
  getDisplayStoreImages,
} from "@/lib/job-db";
import { recordJobView } from "@/lib/job-view-storage";
import { recordUserViewHistory } from "@/lib/view-history-client";
import { fetchJobById, formatLocation, JOBS_UPDATED_EVENT } from "@/lib/job-storage";
import { IMAGE_ALT_BRAND } from "@/lib/site";
import { RecruiterMessageSection } from "@/components/RecruiterMessageSection";
import { StoreImagesGallery } from "@/components/StoreImagesGallery";
import type { Job } from "@/types/job";

function JobApplyButtons({ job }: { job: Job }) {
  return (
    <div className="space-y-3">
      <LineApplyButton jobId={job.id} lineUrl={job.lineUrl} fullWidth size="lg" />
      {job.phone && (
        <PhoneApplyButton jobId={job.id} phone={job.phone} fullWidth size="lg" />
      )}
    </div>
  );
}

export default function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [job, setJob] = useState<Job | null | undefined>(undefined);

  useEffect(() => {
    const load = () => {
      fetchJobById(id)
        .then(setJob)
        .catch(() => setJob(null));
    };
    load();
    window.addEventListener(JOBS_UPDATED_EVENT, load);
    return () => window.removeEventListener(JOBS_UPDATED_EVENT, load);
  }, [id]);

  useEffect(() => {
    // job_views + job_detail_click（一覧 impression とは別）
    void recordJobView(id);
    void recordUserViewHistory(id);
  }, [id]);

  if (job === undefined) {
    return <div className="mx-auto max-w-3xl p-8"><div className="h-64 animate-pulse rounded-2xl bg-white" /></div>;
  }

  if (!job) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="text-xl font-semibold">求人が見つかりません</h1>
        <Link href="/" className="mt-6 inline-block text-gold-dark">← 求人一覧へ</Link>
      </div>
    );
  }

  const benefitGroups = getBenefitCategoryGroups(job.benefits);
  const otherBenefits = job.otherBenefits ?? [];
  const displayCastVoices = getDisplayCastVoices(job);
  const displayStoreImages = getDisplayStoreImages(job);
  const googleMapUrl = job.address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(job.address)}`
    : null;
  const unsetLabel = "未設定";
  const sliderItems = [
    {
      label: "お店の雰囲気",
      leftLabel: "にぎやか",
      rightLabel: "落ち着いている",
      level: job.customerPersonalityLevel,
    },
    {
      label: "お客様の年齢層",
      leftLabel: "若い",
      rightLabel: "年配",
      level: job.customerAgeLevel,
    },
    {
      label: "来店傾向",
      leftLabel: "新規",
      rightLabel: "常連",
      level: job.customerRegularLevel,
    },
  ];
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
      label: "Webサイト",
      href: job.websiteUrl,
      className:
        "border-gold bg-gradient-to-r from-gold to-gold-dark text-white hover:brightness-110",
    },
  ].filter(
    (link): link is { label: string; href: string; className: string } =>
      Boolean(link.href),
  );

  return (
    <div className="job-detail-shell mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
      <Breadcrumbs
        items={[
          { label: "求人一覧", href: "/jobs" },
          { label: job.shopName },
        ]}
      />
      <div className="job-detail-layout">
      <article className="job-detail-main rounded-2xl border border-gold/25 bg-white shadow-gold">
        {job.imageUrl ? (
          <img
            src={job.imageUrl}
            alt={`${job.shopName}の求人｜${IMAGE_ALT_BRAND}`}
            className="h-64 w-full rounded-t-2xl object-cover sm:h-80"
          />
        ) : (
          <div className="relative flex h-64 w-full items-center justify-center overflow-hidden rounded-t-2xl bg-gradient-to-br from-charcoal via-[#2b2418] to-gold-dark sm:h-80">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(232,213,163,0.35),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(201,169,98,0.22),transparent_35%)]" />
            <div className="relative text-center">
              <p className="font-serif text-2xl font-semibold tracking-wide text-gold-light">
                White Night Job
              </p>
              <p className="mt-2 text-xs tracking-[0.3em] text-gold-light/80">
                VERIFIED SHOP
              </p>
            </div>
          </div>
        )}
        <div className="border-b border-gold/20 px-5 py-6 sm:px-8">
          <p className="text-sm font-medium text-gold-dark">
            {formatLocation(job)} · {job.jobType}
          </p>
          <div className="mt-1 flex items-start justify-between gap-3">
            <h1 className="font-serif text-xl font-semibold sm:text-2xl">{job.title}</h1>
            <div className="flex flex-col items-end gap-1">
              <FavoriteButton jobId={job.id} allowLineLoginRedirect />
              <CompareButton jobId={job.id} />
            </div>
          </div>
          <p className="mt-2 font-medium text-charcoal">{job.shopName}</p>
          {job.introductionText && (
            <p className="mt-2 text-sm leading-relaxed text-muted sm:text-base">
              {job.introductionText}
            </p>
          )}
          {job.managerComment && (
            <div className="mt-4 rounded-2xl border border-gold/25 bg-gradient-to-br from-white to-champagne/40 p-4">
              <p className="text-xs font-semibold tracking-wide text-gold-dark">
                店長から一言
              </p>
              <p className="mt-2 text-sm leading-relaxed text-charcoal sm:text-base">
                {job.managerComment}
              </p>
            </div>
          )}
          {job.isVerified && <div className="mt-3"><SafetyBadge /></div>}
        </div>
        <div className="space-y-6 px-5 py-6 sm:px-8">
          <p className="text-lg font-semibold text-gold-dark">{job.salary}</p>
          <section className="rounded-3xl border border-gold/25 bg-gradient-to-br from-white to-ivory p-5 shadow-[0_8px_28px_rgba(201,169,98,0.12)]">
            <h2 className="mb-4 flex items-center gap-2 font-serif text-xl font-semibold text-charcoal">
              <span className="text-gold-dark">◆</span>
              お店の基本情報
            </h2>
            <div className="space-y-3">
              <div className="rounded-2xl border border-gold/20 bg-white px-4 py-3">
                <p className="text-xs font-medium text-muted">営業時間</p>
                <p className="mt-1 text-sm font-medium text-charcoal">
                  {job.businessHours || unsetLabel}
                </p>
              </div>
              {job.address && googleMapUrl && (
                <div className="rounded-2xl border border-gold/20 bg-white px-4 py-3">
                  <p className="text-xs font-medium text-muted">住所</p>
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
                </div>
              )}
              {job.access && (
                <div className="rounded-2xl border border-gold/20 bg-white px-4 py-3">
                  <p className="text-xs font-medium text-muted">アクセス</p>
                  <p className="mt-1 whitespace-pre-wrap text-sm font-medium text-charcoal">
                    {job.access}
                  </p>
                </div>
              )}
              <div className="rounded-2xl border border-gold/20 bg-white px-4 py-3">
                <p className="text-xs font-medium text-muted">キャスト年齢</p>
                <p className="mt-1 text-sm font-medium text-charcoal">
                  {job.ageGroup || unsetLabel}
                </p>
              </div>
            </div>
            <div className="mt-5 space-y-5 rounded-2xl border border-gold/20 bg-white p-4">
              {sliderItems.map((item) => {
                const level = item.level;
                const hasLevel = typeof level === "number" && level >= 1;
                const markerPosition = hasLevel
                  ? `${((level - 1) / 4) * 100}%`
                  : "50%";

                return (
                  <div key={item.label}>
                    <p className="text-sm font-semibold text-charcoal">{item.label}</p>
                    <div className="relative mt-4 h-8">
                      <div className="absolute left-0 right-0 top-1/2 h-2 -translate-y-1/2 rounded-full bg-zinc-300">
                        <span className="absolute left-1/4 top-0 h-full w-px bg-white/70" />
                        <span className="absolute left-1/2 top-0 h-full w-px bg-white/70" />
                        <span className="absolute left-3/4 top-0 h-full w-px bg-white/70" />
                      </div>
                      {hasLevel ? (
                        <span
                          className="absolute top-1/2 flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-gradient-to-br from-gold-light to-gold text-base text-white shadow-[0_0_18px_rgba(201,169,98,0.45)]"
                          style={{ left: markerPosition }}
                        >
                          ★
                        </span>
                      ) : (
                        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-xs font-medium text-muted">
                          {unsetLabel}
                        </span>
                      )}
                    </div>
                    <div className="mt-1 flex justify-between text-sm font-semibold text-muted">
                      <span>{item.leftLabel}</span>
                      <span>{item.rightLabel}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
          <div className="job-detail-apply-inline">
            <JobApplyButtons job={job} />
          </div>
          {displayStoreImages.length > 0 && (
            <StoreImagesGallery
              images={displayStoreImages}
              shopName={job.shopName}
            />
          )}
          {displayCastVoices.length > 0 && (
            <section className="rounded-2xl border border-gold/20 bg-ivory p-4 sm:p-5">
              <h2 className="mb-4 text-base font-semibold text-charcoal">
                入店・在籍キャストの声
              </h2>
              <ul className="space-y-3">
                {displayCastVoices.map((entry, index) => {
                  const ageLabel = formatCastVoiceAge(entry.age);
                  const hasProfile = Boolean(entry.name || ageLabel);

                  return (
                    <li
                      key={`cast-voice-${index}-${entry.name}`}
                      className="rounded-xl border border-gold/25 bg-white px-4 py-4 shadow-gold"
                    >
                      {hasProfile && (
                        <p className="text-sm font-semibold text-gold-dark sm:text-base">
                          {entry.name}
                          {entry.name && ageLabel ? " / " : ""}
                          {ageLabel}
                        </p>
                      )}
                      {entry.comment && (
                        <p
                          className={`whitespace-pre-wrap text-sm leading-relaxed text-charcoal sm:text-base ${
                            hasProfile ? "mt-2" : ""
                          }`}
                        >
                          {entry.comment}
                        </p>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
          )}
          <RecruiterMessageSection job={job} />
          {socialLinks.length > 0 && (
            <section className="rounded-2xl border border-gold/20 bg-gradient-to-br from-ivory to-white p-5">
              <h2 className="mb-3 text-base font-semibold text-charcoal">
                公式SNS
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {socialLinks.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    target="_blank"
                    rel="noreferrer"
                    className={`flex min-h-12 items-center justify-center rounded-full border px-4 py-3 text-sm font-semibold shadow-md transition ${link.className}`}
                  >
                    {link.label}を見る
                  </a>
                ))}
              </div>
            </section>
          )}
          {benefitGroups.length > 0 && (
            <section className="space-y-4">
              <h2 className="text-base font-semibold text-charcoal">待遇</h2>
              {benefitGroups.map((group) => (
                <div
                  key={group.title}
                  className="rounded-2xl border border-gold/20 bg-ivory p-4"
                >
                  <h3 className="mb-3 text-sm font-semibold text-gold-dark">
                    {group.title}
                  </h3>
                  <ul className="flex flex-wrap gap-2">
                    {group.items.map((benefit) => (
                      <li
                        key={benefit}
                        className="rounded-full border border-gold/30 bg-white px-3 py-1.5 text-sm text-charcoal"
                      >
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </section>
          )}
          {otherBenefits.length > 0 && (
            <section className="rounded-2xl border border-gold/20 bg-ivory p-4">
              <h2 className="mb-3 text-base font-semibold text-charcoal">
                その他待遇
              </h2>
              <ul className="space-y-2">
                {otherBenefits.map((benefit) => (
                  <li
                    key={benefit}
                    className="rounded-xl border border-gold/20 bg-white px-3 py-2 text-sm text-charcoal"
                  >
                    {benefit}
                  </li>
                ))}
              </ul>
            </section>
          )}
          {job.descriptionText && (
            <section className="rounded-2xl border border-gold/20 bg-ivory p-4">
              <h2 className="mb-3 text-base font-semibold text-charcoal">どんなお店？</h2>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-charcoal sm:text-base">
                {job.descriptionText}
              </p>
            </section>
          )}
          <div className="job-detail-apply-inline">
            <JobApplyButtons job={job} />
          </div>
        </div>
      </article>

      <aside className="job-detail-sticky-aside">
        <div className="rounded-2xl border border-gold/25 bg-white p-5 shadow-gold">
          <p className="font-serif text-lg font-semibold text-charcoal">{job.shopName}</p>
          <p className="mt-1 text-sm text-gold-dark">
            {formatLocation(job)} · {job.jobType}
          </p>
          <p className="mt-3 text-base font-semibold text-charcoal">{job.salary}</p>
          <div className="mt-4 flex items-center gap-2">
            <FavoriteButton jobId={job.id} allowLineLoginRedirect />
            <CompareButton jobId={job.id} />
          </div>
          <div className="mt-5">
            <JobApplyButtons job={job} />
          </div>
          <p className="mt-4 text-xs leading-relaxed text-muted">
            LINE相談・電話応募はボタンからすぐできます。お気に入り登録で後から見返せます。
          </p>
        </div>
      </aside>
      </div>
    </div>
  );
}
