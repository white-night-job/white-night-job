import type { Job } from "@/types/job";

function hasBenefit(job: Job, label: string): boolean {
  return job.benefits.includes(label);
}

export type CompareRow = {
  label: string;
  values: string[];
};

export function buildCompareRows(jobs: Job[]): CompareRow[] {
  return [
    {
      label: "時給",
      values: jobs.map((job) => job.salary),
    },
    {
      label: "営業時間",
      values: jobs.map((job) => job.businessHours || job.workHours || "—"),
    },
    {
      label: "送り",
      values: jobs.map((job) => (hasBenefit(job, "送迎あり") ? "あり" : "—")),
    },
    {
      label: "未経験歓迎",
      values: jobs.map((job) =>
        hasBenefit(job, "未経験者大歓迎") ? "歓迎" : "—",
      ),
    },
    {
      label: "飲酒",
      values: jobs.map((job) =>
        hasBenefit(job, "お酒飲めなくてもOK") ? "飲めなくてもOK" : "要確認",
      ),
    },
    {
      label: "ノルマ",
      values: jobs.map((job) => (hasBenefit(job, "ノルマなし") ? "なし" : "—")),
    },
    {
      label: "罰金",
      values: jobs.map((job) => (hasBenefit(job, "罰金なし") ? "なし" : "—")),
    },
    {
      label: "衣装",
      values: jobs.map((job) => {
        if (hasBenefit(job, "衣装レンタルあり")) return "レンタルあり";
        if (hasBenefit(job, "私服OK")) return "私服OK";
        return "—";
      }),
    },
    {
      label: "交通費",
      values: jobs.map((job) =>
        hasBenefit(job, "交通費支給") ? "支給あり" : "—",
      ),
    },
    {
      label: "待遇",
      values: jobs.map((job) => {
        const items = [...job.benefits, ...(job.otherBenefits ?? [])];
        return items.length > 0 ? items.slice(0, 4).join("、") : "—";
      }),
    },
  ];
}
