"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { CompareButton } from "@/components/CompareButton";
import { FavoriteButton } from "@/components/FavoriteButton";
import { JobHeroImage } from "@/components/JobHeroImage";
import { LineApplyButton, PhoneApplyButton } from "@/components/LineApplyButton";
import { SafetyBadge } from "@/components/SafetyBadge";
import { getBenefitCategoryGroups } from "@/data/benefits";
import {
  formatCastVoiceAge,
  getDisplayCastVoices,
  getDisplayStoreImages,
} from "@/lib/job-db";
import { formatLocation } from "@/lib/job-storage";
import { luxuryBtnPrimary } from "@/lib/luxury-styles";
import type { Job } from "@/types/job";

const StoreImagesGallery = dynamic(
  () =>
    import("@/components/StoreImagesGallery").then((mod) => mod.StoreImagesGallery),
  {
    ssr: false,
    loading: () => (
      <div className="h-36 animate-pulse rounded-2xl border border-gold/15 bg-ivory/70" />
    ),
  },
);

const RecruiterMessageSection = dynamic(
  () =>
    import("@/components/RecruiterMessageSection").then(
      (mod) => mod.RecruiterMessageSection,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="h-28 animate-pulse rounded-2xl border border-gold/15 bg-ivory/70" />
    ),
  },
);

function sanitizeExternalHref(raw: string | undefined): string | null {
  const value = String(raw ?? "").trim();
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.toString();
  } catch {
    return null;
  }
}

function PreviewBlockedButton({
  label,
  className,
  fullWidth,
  size = "md",
  onNotice,
}: {
  label: string;
  className?: string;
  fullWidth?: boolean;
  size?: "sm" | "md" | "lg";
  onNotice: () => void;
}) {
  const sizeClass =
    size === "lg"
      ? "px-8 py-4 text-lg"
      : size === "sm"
        ? "px-4 py-2 text-sm"
        : "px-6 py-3 text-base";

  return (
    <button
      type="button"
      onClick={onNotice}
      className={`inline-flex items-center justify-center gap-2 rounded-full font-semibold ${className ?? luxuryBtnPrimary} ${sizeClass} ${
        fullWidth ? "w-full" : ""
      }`}
    >
      {label}
    </button>
  );
}

function JobApplyButtons({
  job,
  preview,
  onPreviewNotice,
}: {
  job: Job;
  preview: boolean;
  onPreviewNotice: () => void;
}) {
  if (preview) {
    return (
      <div className="space-y-3">
        <PreviewBlockedButton
          label="LINEで相談・応募する"
          fullWidth
          size="lg"
          onNotice={onPreviewNotice}
        />
        {job.phone && (
          <PreviewBlockedButton
            label="電話で相談・応募する"
            fullWidth
            size="lg"
            className={`border border-gold/40 ${luxuryBtnPrimary}`}
            onNotice={onPreviewNotice}
          />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <LineApplyButton jobId={job.id} lineUrl={job.lineUrl} fullWidth size="lg" />
      {job.phone && (
        <PhoneApplyButton jobId={job.id} phone={job.phone} fullWidth size="lg" />
      )}
    </div>
  );
}

function FavoriteSlot({
  jobId,
  preview,
  onPreviewNotice,
  ready,
}: {
  jobId: string;
  preview: boolean;
  onPreviewNotice: () => void;
  ready: boolean;
}) {
  if (preview) {
    return (
      <button
        type="button"
        onClick={onPreviewNotice}
        className="rounded-full border border-gold/30 px-3 py-1.5 text-xs font-medium text-gold-dark"
      >
        ♡ お気に入り
      </button>
    );
  }
  if (!ready) {
    return (
      <span className="inline-flex min-h-8 min-w-[5.5rem] animate-pulse items-center justify-center rounded-full border border-gold/20 bg-ivory px-3 text-xs text-muted">
        …
      </span>
    );
  }
  return <FavoriteButton jobId={jobId} allowLineLoginRedirect />;
}

export function JobDetailView({
  job,
  preview = false,
  showBreadcrumbs = true,
}: {
  job: Job;
  preview?: boolean;
  showBreadcrumbs?: boolean;
}) {
  const [previewNotice, setPreviewNotice] = useState("");
  const [showExtras, setShowExtras] = useState(preview);
  const [favoritesReady, setFavoritesReady] = useState(preview);

  useEffect(() => {
    if (preview) return;
    let cancelled = false;
    const reveal = () => {
      if (!cancelled) setShowExtras(true);
    };
    const fav = () => {
      if (!cancelled) setFavoritesReady(true);
    };

    const extrasTimer = window.setTimeout(reveal, 0);
    const favTimer = window.setTimeout(fav, 120);

    return () => {
      cancelled = true;
      window.clearTimeout(extrasTimer);
      window.clearTimeout(favTimer);
    };
  }, [preview, job.id]);

  function showPreviewNotice(message = "プレビュー中のため、この操作はできません。") {
    setPreviewNotice(message);
    window.setTimeout(() => setPreviewNotice(""), 2200);
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
  ].flatMap((link) => {
    const href = sanitizeExternalHref(link.href);
    return href
      ? [{ label: link.label, href, className: link.className }]
      : [];
  });

  return (
    <div className="job-detail-shell mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
      {previewNotice && (
        <div className="fixed left-1/2 top-20 z-[120] w-[min(92vw,24rem)] -translate-x-1/2 rounded-2xl border border-gold/40 bg-charcoal px-4 py-3 text-center text-sm font-medium text-white shadow-2xl">
          {previewNotice}
        </div>
      )}

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

      {showBreadcrumbs && (
        <Breadcrumbs
          items={[
            { label: "求人一覧", href: preview ? undefined : "/jobs" },
            { label: job.shopName },
          ]}
        />
      )}
      <div className="job-detail-layout">
        <article className="job-detail-main rounded-2xl border border-gold/25 bg-white shadow-gold">
          <JobHeroImage shopName={job.shopName} imageUrl={job.imageUrl} />
          <div className="border-b border-gold/20 px-5 py-6 sm:px-8">
            <p className="text-sm font-medium text-gold-dark">
              {formatLocation(job)} · {job.jobType}
            </p>
            <div className="mt-1 flex items-start justify-between gap-3">
              <h1 className="font-serif text-xl font-semibold sm:text-2xl">
                {job.title}
              </h1>
              <div className="flex flex-col items-end gap-1">
                <FavoriteSlot
                  jobId={job.id}
                  preview={preview}
                  onPreviewNotice={() => showPreviewNotice()}
                  ready={favoritesReady}
                />
                {preview ? (
                  <button
                    type="button"
                    onClick={() => showPreviewNotice()}
                    className="rounded-full border border-gold/30 px-3 py-1.5 text-xs font-medium text-gold-dark"
                  >
                    比較
                  </button>
                ) : (
                  <CompareButton jobId={job.id} />
                )}
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
            {job.isVerified && (
              <div className="mt-3">
                <SafetyBadge />
              </div>
            )}
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
                    {preview ? (
                      <button
                        type="button"
                        onClick={() =>
                          showPreviewNotice(
                            "プレビュー中のため、地図への移動はできません。",
                          )
                        }
                        className="mt-1 flex min-h-11 w-full flex-col justify-center rounded-xl border border-gold/25 bg-ivory px-3 py-2 text-left text-sm font-medium text-charcoal sm:flex-row sm:items-center sm:justify-between sm:gap-3"
                      >
                        <span>{job.address}</span>
                        <span className="mt-1 shrink-0 font-semibold text-gold-dark sm:mt-0">
                          Googleマップで見る →
                        </span>
                      </button>
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
                      <p className="text-sm font-semibold text-charcoal">
                        {item.label}
                      </p>
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
              <JobApplyButtons
                job={job}
                preview={preview}
                onPreviewNotice={() => showPreviewNotice()}
              />
            </div>

            {showExtras ? (
              <>
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
                          rel="noopener noreferrer"
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
                    <h2 className="mb-3 text-base font-semibold text-charcoal">
                      どんなお店？
                    </h2>
                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-charcoal sm:text-base">
                      {job.descriptionText}
                    </p>
                  </section>
                )}
              </>
            ) : (
              <div className="space-y-3" aria-hidden>
                <div className="h-32 animate-pulse rounded-2xl border border-gold/15 bg-ivory/70" />
                <div className="h-24 animate-pulse rounded-2xl border border-gold/15 bg-ivory/70" />
              </div>
            )}

            <div className="job-detail-apply-inline">
              <JobApplyButtons
                job={job}
                preview={preview}
                onPreviewNotice={() => showPreviewNotice()}
              />
            </div>
          </div>
        </article>

        <aside className="job-detail-sticky-aside">
          <div className="rounded-2xl border border-gold/25 bg-white p-5 shadow-gold">
            <p className="font-serif text-lg font-semibold text-charcoal">
              {job.shopName}
            </p>
            <p className="mt-1 text-sm text-gold-dark">
              {formatLocation(job)} · {job.jobType}
            </p>
            <p className="mt-3 text-base font-semibold text-charcoal">
              {job.salary}
            </p>
            <div className="mt-4 flex items-center gap-2">
              <FavoriteSlot
                jobId={job.id}
                preview={preview}
                onPreviewNotice={() => showPreviewNotice()}
                ready={favoritesReady}
              />
              {preview ? (
                <button
                  type="button"
                  onClick={() => showPreviewNotice()}
                  className="rounded-full border border-gold/30 px-3 py-1.5 text-xs font-medium text-gold-dark"
                >
                  比較
                </button>
              ) : (
                <CompareButton jobId={job.id} />
              )}
            </div>
            <div className="mt-5">
              <JobApplyButtons
                job={job}
                preview={preview}
                onPreviewNotice={() => showPreviewNotice()}
              />
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
