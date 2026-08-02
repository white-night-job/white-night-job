import { formatLocation } from "@/lib/job-storage";
import type { Job } from "@/types/job";

function hasBenefit(job: Job, label: string): boolean {
  const all = [...job.benefits, ...(job.otherBenefits ?? [])];
  return all.includes(label);
}

function formatSliderLabel(
  level: number | undefined,
  left: string,
  right: string,
): string {
  if (!level || level < 1 || level > 5) return "—";
  if (level <= 2) return `${left}寄り`;
  if (level >= 4) return `${right}寄り`;
  return "バランス";
}

export type CompareBoolTone = "good" | "bad" | "neutral";

export type CompareCell =
  | { type: "text"; text: string }
  | { type: "image"; src?: string; alt: string }
  | {
      type: "bool";
      present: boolean | null;
      yesLabel?: string;
      noLabel?: string;
      toneWhenYes?: CompareBoolTone;
      toneWhenNo?: CompareBoolTone;
    }
  | { type: "line"; jobId: string; lineUrl?: string; shopName: string };

export type CompareRow = {
  label: string;
  cells: CompareCell[];
};

export function buildCompareRows(jobs: Job[]): CompareRow[] {
  return [
    {
      label: "店舗画像",
      cells: jobs.map((job) => ({
        type: "image" as const,
        src: job.imageUrl,
        alt: `${job.shopName}の店舗画像`,
      })),
    },
    {
      label: "店舗名",
      cells: jobs.map((job) => ({ type: "text" as const, text: job.shopName })),
    },
    {
      label: "地域",
      cells: jobs.map((job) => ({
        type: "text" as const,
        text: formatLocation(job),
      })),
    },
    {
      label: "職種",
      cells: jobs.map((job) => ({ type: "text" as const, text: job.jobType })),
    },
    {
      label: "時給",
      cells: jobs.map((job) => ({ type: "text" as const, text: job.salary || "—" })),
    },
    {
      label: "バック",
      cells: jobs.map((job) => ({
        type: "bool" as const,
        present: hasBenefit(job, "バックあり"),
        yesLabel: "あり",
        noLabel: "—",
        toneWhenYes: "good",
        toneWhenNo: "neutral",
      })),
    },
    {
      label: "営業時間",
      cells: jobs.map((job) => ({
        type: "text" as const,
        text: job.businessHours || job.workHours || "—",
      })),
    },
    {
      label: "客層",
      cells: jobs.map((job) => ({
        type: "text" as const,
        text: formatSliderLabel(
          job.customerPersonalityLevel,
          "にぎやか",
          "落ち着き",
        ),
      })),
    },
    {
      label: "キャスト年齢",
      cells: jobs.map((job) => ({
        type: "text" as const,
        text: job.ageGroup?.trim() || "—",
      })),
    },
    {
      label: "未経験歓迎",
      cells: jobs.map((job) => ({
        type: "bool" as const,
        present: hasBenefit(job, "未経験者大歓迎"),
        yesLabel: "○",
        noLabel: "×",
        toneWhenYes: "good",
        toneWhenNo: "neutral",
      })),
    },
    {
      label: "ノルマ",
      cells: jobs.map((job) => ({
        type: "bool" as const,
        present: hasBenefit(job, "ノルマなし"),
        yesLabel: "なし",
        noLabel: "要確認",
        toneWhenYes: "good",
        toneWhenNo: "bad",
      })),
    },
    {
      label: "罰金",
      cells: jobs.map((job) => ({
        type: "bool" as const,
        present: hasBenefit(job, "罰金なし"),
        yesLabel: "なし",
        noLabel: "要確認",
        toneWhenYes: "good",
        toneWhenNo: "bad",
      })),
    },
    {
      label: "送迎",
      cells: jobs.map((job) => ({
        type: "bool" as const,
        present: hasBenefit(job, "送迎あり"),
        yesLabel: "○",
        noLabel: "×",
        toneWhenYes: "good",
        toneWhenNo: "neutral",
      })),
    },
    {
      label: "終電上がり",
      cells: jobs.map((job) => ({
        type: "bool" as const,
        present: hasBenefit(job, "終電上がりOK"),
        yesLabel: "○",
        noLabel: "×",
        toneWhenYes: "good",
        toneWhenNo: "neutral",
      })),
    },
    {
      label: "私服OK",
      cells: jobs.map((job) => ({
        type: "bool" as const,
        present: hasBenefit(job, "私服OK"),
        yesLabel: "○",
        noLabel: "×",
        toneWhenYes: "good",
        toneWhenNo: "neutral",
      })),
    },
    {
      label: "衣装レンタル",
      cells: jobs.map((job) => ({
        type: "bool" as const,
        present: hasBenefit(job, "衣装レンタルあり"),
        yesLabel: "○",
        noLabel: "×",
        toneWhenYes: "good",
        toneWhenNo: "neutral",
      })),
    },
    {
      label: "お酒NG",
      cells: jobs.map((job) => ({
        type: "bool" as const,
        present: hasBenefit(job, "お酒飲めなくてもOK"),
        yesLabel: "対応可",
        noLabel: "要確認",
        toneWhenYes: "good",
        toneWhenNo: "neutral",
      })),
    },
    {
      label: "タトゥーOK",
      cells: jobs.map((job) => ({
        type: "bool" as const,
        present: hasBenefit(job, "タトゥーOK"),
        yesLabel: "○",
        noLabel: "×",
        toneWhenYes: "good",
        toneWhenNo: "neutral",
      })),
    },
    {
      label: "AIおすすめ表示",
      cells: jobs.map((job) => ({
        type: "bool" as const,
        present: Boolean(job.chatRecommend?.enabled),
        yesLabel: "対象",
        noLabel: "—",
        toneWhenYes: "good",
        toneWhenNo: "neutral",
      })),
    },
    {
      label: "LINE応募",
      cells: jobs.map((job) => ({
        type: "line" as const,
        jobId: job.id,
        lineUrl: job.lineUrl,
        shopName: job.shopName,
      })),
    },
  ];
}
