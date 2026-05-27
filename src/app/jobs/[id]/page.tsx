"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { LineApplyButton, PhoneApplyButton } from "@/components/LineApplyButton";
import { SafetyBadge } from "@/components/SafetyBadge";
import { getBenefitCategoryGroups } from "@/data/benefits";
import { fetchJobById, formatLocation, JOBS_UPDATED_EVENT } from "@/lib/job-storage";
import type { Job } from "@/types/job";

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
  const socialLinks = [
    { label: "X", href: job.xUrl },
    { label: "Instagram", href: job.instagramUrl },
    { label: "TikTok", href: job.tiktokUrl },
    { label: "YouTube", href: job.youtubeUrl },
  ].filter((link): link is { label: string; href: string } => Boolean(link.href));

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
      <Link href="/" className="mb-6 inline-block text-sm text-muted hover:text-gold-dark">
        ← 求人一覧に戻る
      </Link>
      <article className="rounded-2xl border border-gold/25 bg-white shadow-gold">
        {job.imageUrl ? (
          <img
            src={job.imageUrl}
            alt={`${job.shopName}の店舗写真`}
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
          <h1 className="mt-1 font-serif text-xl font-semibold sm:text-2xl">{job.title}</h1>
          <p className="mt-2 text-muted">{job.shopName}</p>
          {job.isVerified && <div className="mt-3"><SafetyBadge /></div>}
        </div>
        <div className="space-y-6 px-5 py-6 sm:px-8">
          <p className="text-lg font-semibold text-gold-dark">{job.salary}</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-gold/20 bg-ivory px-4 py-3">
              <p className="text-xs font-medium text-muted">勤務時間</p>
              <p className="mt-1 text-sm font-medium text-charcoal">{job.workHours}</p>
            </div>
            {job.businessHours && (
              <div className="rounded-2xl border border-gold/20 bg-ivory px-4 py-3">
                <p className="text-xs font-medium text-muted">営業時間</p>
                <p className="mt-1 text-sm font-medium text-charcoal">
                  {job.businessHours}
                </p>
              </div>
            )}
            {job.ageGroup && (
              <div className="rounded-2xl border border-gold/20 bg-ivory px-4 py-3">
                <p className="text-xs font-medium text-muted">年齢層</p>
                <p className="mt-1 text-sm font-medium text-charcoal">{job.ageGroup}</p>
              </div>
            )}
          </div>
          {job.address && (
            <div className="rounded-2xl border border-gold/20 bg-ivory px-4 py-3">
              <p className="text-xs font-medium text-muted">住所</p>
              <p className="mt-1 text-sm font-medium text-charcoal">{job.address}</p>
            </div>
          )}
          {socialLinks.length > 0 && (
            <section className="rounded-2xl border border-gold/20 bg-gradient-to-br from-ivory to-white p-4">
              <h2 className="mb-3 text-base font-semibold text-charcoal">
                公式SNS
              </h2>
              <div className="grid gap-2 sm:grid-cols-2">
                {socialLinks.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    target="_blank"
                    rel="noreferrer"
                    className="flex min-h-12 items-center justify-center rounded-full border border-gold/40 bg-white px-4 py-3 text-sm font-semibold text-gold-dark shadow-sm transition hover:border-gold hover:bg-gold-light/20"
                  >
                    {link.label}を見る
                  </a>
                ))}
              </div>
            </section>
          )}
          <p className="leading-relaxed text-muted">{job.description}</p>
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
          <div className="space-y-3">
            <LineApplyButton lineUrl={job.lineUrl} fullWidth size="lg" />
            {job.phone && (
              <PhoneApplyButton phone={job.phone} fullWidth size="lg" />
            )}
          </div>
        </div>
      </article>
    </div>
  );
}
