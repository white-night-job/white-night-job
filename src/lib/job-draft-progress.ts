import type { Job } from "@/types/job";
import { getDisplayCastVoices, getDisplayStoreImages } from "@/lib/job-db";

type ProgressCheck = {
  key: string;
  label: string;
  filled: boolean;
};

function hasText(value: string | null | undefined): boolean {
  return Boolean(value && value.trim() && value.trim() !== "—");
}

/** Fields used to show draft completion progress in admin. */
export function getJobDraftProgressChecks(job: Job): ProgressCheck[] {
  const storeImages = getDisplayStoreImages(job);
  const castVoices = getDisplayCastVoices(job);
  const hasSns = [
    job.xUrl,
    job.instagramUrl,
    job.tiktokUrl,
    job.youtubeUrl,
    job.websiteUrl,
  ].some((v) => hasText(v));

  return [
    { key: "shopName", label: "店舗名", filled: hasText(job.shopName) },
    { key: "district", label: "エリア", filled: Boolean(job.district) },
    { key: "jobType", label: "業種", filled: Boolean(job.jobType) },
    { key: "salary", label: "時給", filled: hasText(job.salary) },
    {
      key: "businessHours",
      label: "営業時間",
      filled: hasText(job.businessHours) || hasText(job.workHours),
    },
    { key: "access", label: "アクセス", filled: hasText(job.access) },
    {
      key: "benefits",
      label: "待遇",
      filled: (job.benefits?.length ?? 0) > 0 || (job.otherBenefits?.length ?? 0) > 0,
    },
    {
      key: "introduction",
      label: "紹介文",
      filled: hasText(job.introductionText) || hasText(job.descriptionText),
    },
    {
      key: "images",
      label: "画像",
      filled: hasText(job.imageUrl) || storeImages.length > 0,
    },
    { key: "sns", label: "SNS", filled: hasSns },
    {
      key: "cast",
      label: "キャスト",
      filled: castVoices.some(
        (v) => hasText(v.name) || hasText(v.age) || hasText(v.comment),
      ),
    },
    { key: "lineUrl", label: "応募方法", filled: hasText(job.lineUrl) },
    {
      key: "recruiter",
      label: "担当者",
      filled: hasText(job.recruiterName) || hasText(job.recruiterMessage),
    },
  ];
}

export function computeJobDraftProgress(job: Job): {
  filled: number;
  total: number;
  percent: number;
  label: string;
} {
  const checks = getJobDraftProgressChecks(job);
  const filled = checks.filter((c) => c.filled).length;
  const total = checks.length;
  const percent = total === 0 ? 0 : Math.round((filled / total) * 100);
  return {
    filled,
    total,
    percent,
    label: `${filled}/${total}（${percent}%）`,
  };
}
