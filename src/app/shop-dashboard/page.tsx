"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  BENEFIT_CATEGORIES,
  getKnownBenefits,
  getUncategorizedBenefits,
} from "@/data/benefits";
import { MonthlyApplicationChart } from "@/components/MonthlyApplicationChart";
import { MonthlyViewChart } from "@/components/MonthlyViewChart";
import {
  aggregateMonthlyApplicationsForJob,
  type ApplicationRow,
  type JobApplicationDetail,
} from "@/lib/job-applications";
import {
  getDisplayCastVoices,
  getDisplayStoreImages,
  parseBenefits,
  sanitizeCastVoicesForSave,
  sanitizeStoreImagesForSave,
} from "@/lib/job-db";
import { JOBS_UPDATED_EVENT } from "@/lib/job-storage";
import { aggregateMonthlyViewsForJob, type ViewRow } from "@/lib/job-views";
import {
  FIXED_AREA,
  type CastVoiceEntry,
  type District,
  type Job,
  type JobType,
} from "@/types/job";

type ShopForm = {
  shopName: string;
  district: District;
  jobType: JobType;
  salary: string;
  access: string;
  businessHours: string;
  ageGroup: string;
  introductionText: string;
  descriptionText: string;
  castVoices: CastVoiceEntry[];
  storeImages: string[];
  benefits: string[];
  otherBenefits: string;
  phone: string;
  xUrl: string;
  instagramUrl: string;
  tiktokUrl: string;
  youtubeUrl: string;
  websiteUrl: string;
  lineUrl: string;
};

const emptyCastVoiceEntry = (): CastVoiceEntry => ({
  name: "",
  age: "",
  comment: "",
});

const inputClass =
  "w-full rounded-xl border border-gold/30 bg-ivory px-4 py-3 text-sm outline-none focus:border-gold focus:ring-2 focus:ring-gold/20";

const readonlyInputClass = `${inputClass} cursor-not-allowed bg-zinc-100 text-charcoal`;

const labelClass = "mb-1.5 block text-sm font-medium text-charcoal";

function toForm(job: Job): ShopForm {
  return {
    shopName: job.shopName,
    district: job.district,
    jobType: job.jobType,
    salary: job.salary,
    access: job.access ?? "",
    businessHours: job.businessHours ?? "",
    ageGroup: job.ageGroup ?? "",
    introductionText: job.introductionText ?? "",
    descriptionText: job.descriptionText ?? "",
    castVoices: getDisplayCastVoices(job).map((entry) => ({
      name: entry.name,
      age: entry.age,
      comment: entry.comment,
    })),
    storeImages: getDisplayStoreImages(job),
    benefits: getKnownBenefits(job.benefits),
    otherBenefits: [
      ...(job.otherBenefits ?? []),
      ...getUncategorizedBenefits(job.benefits),
    ].join("\n"),
    phone: job.phone ?? "",
    xUrl: job.xUrl ?? "",
    instagramUrl: job.instagramUrl ?? "",
    tiktokUrl: job.tiktokUrl ?? "",
    youtubeUrl: job.youtubeUrl ?? "",
    websiteUrl: job.websiteUrl ?? "",
    lineUrl: job.lineUrl,
  };
}

function toPayload(form: ShopForm) {
  return {
    salary: form.salary,
    access: form.access || undefined,
    businessHours: form.businessHours || undefined,
    ageGroup: form.ageGroup || undefined,
    introductionText: form.introductionText || undefined,
    descriptionText: form.descriptionText || undefined,
    castVoices: sanitizeCastVoicesForSave(form.castVoices),
    storeImages: sanitizeStoreImagesForSave(form.storeImages),
    benefits: form.benefits,
    otherBenefits: parseBenefits(form.otherBenefits),
    phone: form.phone || undefined,
    xUrl: form.xUrl || undefined,
    instagramUrl: form.instagramUrl || undefined,
    tiktokUrl: form.tiktokUrl || undefined,
    youtubeUrl: form.youtubeUrl || undefined,
    websiteUrl: form.websiteUrl || undefined,
    lineUrl: form.lineUrl,
  };
}

async function readJson<T>(response: Response): Promise<T> {
  const data = (await response.json()) as T & { message?: string };
  if (!response.ok) throw new Error(data.message ?? "通信に失敗しました。");
  return data;
}

export default function ShopDashboardPage() {
  const router = useRouter();
  const storeImageInputRef = useRef<HTMLInputElement>(null);
  const [checking, setChecking] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [form, setForm] = useState<ShopForm | null>(null);
  const [applicationRows, setApplicationRows] = useState<ApplicationRow[]>([]);
  const [viewRows, setViewRows] = useState<ViewRow[]>([]);
  const [applicationDetail, setApplicationDetail] =
    useState<JobApplicationDetail | null>(null);
  const [viewCount, setViewCount] = useState(0);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploadingStoreImages, setUploadingStoreImages] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);

  async function loadDashboard() {
    const data = await readJson<{
      job: Job;
      applicationRows: ApplicationRow[];
      viewRows: ViewRow[];
      applicationDetail: JobApplicationDetail;
      viewCount: number;
    }>(
      await fetch("/api/shop-dashboard", {
        cache: "no-store",
        credentials: "include",
      }),
    );
    setForm(toForm(data.job));
    setJobId(data.job.id);
    setApplicationRows(data.applicationRows);
    setViewRows(data.viewRows);
    setApplicationDetail(data.applicationDetail);
    setViewCount(data.viewCount);
    setAuthenticated(true);
  }

  useEffect(() => {
    fetch("/api/shop-session", { cache: "no-store", credentials: "include" })
      .then((response) => response.json())
      .then((data: { authenticated?: boolean }) => {
        if (!data.authenticated) {
          router.replace("/shop-login");
          return;
        }
        return loadDashboard();
      })
      .catch(() => router.replace("/shop-login"))
      .finally(() => setChecking(false));
  }, [router]);

  const monthlyViewStats = useMemo(
    () => (jobId ? aggregateMonthlyViewsForJob(viewRows, jobId) : []),
    [jobId, viewRows],
  );

  const monthlyApplicationStats = useMemo(
    () =>
      jobId ? aggregateMonthlyApplicationsForJob(applicationRows, jobId) : [],
    [applicationRows, jobId],
  );

  function setField<K extends keyof ShopForm>(key: K, value: ShopForm[K]) {
    setForm((current) => (current ? { ...current, [key]: value } : current));
  }

  function toggleBenefit(benefit: string) {
    setForm((current) => {
      if (!current) return current;
      return {
        ...current,
        benefits: current.benefits.includes(benefit)
          ? current.benefits.filter((item) => item !== benefit)
          : [...current.benefits, benefit],
      };
    });
  }

  async function handleLogout() {
    await fetch("/api/shop-logout", { method: "POST", credentials: "include" });
    router.replace("/shop-login");
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form) return;
    setLoading(true);
    setMessage("");
    try {
      const { job } = await readJson<{ job: Job }>(
        await fetch("/api/shop-dashboard/job", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(toPayload(form)),
        }),
      );
      setForm(toForm(job));
      await loadDashboard();
      window.dispatchEvent(new Event(JOBS_UPDATED_EVENT));
      setMessage("求人情報を保存しました。");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "保存に失敗しました。");
    } finally {
      setLoading(false);
    }
  }

  async function handleStoreImagesUpload(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const files = event.target.files;
    if (!files?.length || !jobId || !form) return;
    setUploadingStoreImages(true);
    setMessage("");
    try {
      const uploadedUrls: string[] = [];
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("uploadType", "store-image");
        formData.append("jobId", jobId);
        const { publicUrl } = await readJson<{ publicUrl: string }>(
          await fetch("/api/upload", {
            method: "POST",
            credentials: "include",
            body: formData,
          }),
        );
        uploadedUrls.push(publicUrl);
      }
      setField("storeImages", [...form.storeImages, ...uploadedUrls]);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "画像アップロードに失敗しました。",
      );
    } finally {
      setUploadingStoreImages(false);
      event.target.value = "";
    }
  }

  if (checking || !authenticated || !form) {
    return (
      <div className="mx-auto max-w-4xl p-8">
        <div className="h-64 animate-pulse rounded-2xl bg-white" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-gold-dark">店舗ダッシュボード</p>
          <h1 className="mt-1 font-serif text-2xl font-semibold text-charcoal">
            {form.shopName}
          </h1>
          <p className="mt-1 text-sm text-muted">
            自店舗の求人情報と応募・表示回数を確認できます。
          </p>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="rounded-full border border-gold/35 px-4 py-2 text-sm font-medium text-gold-dark hover:bg-ivory"
        >
          ログアウト
        </button>
      </div>

      <form onSubmit={handleSubmit} className="mb-8 space-y-6 rounded-2xl border border-gold/25 bg-white p-5 shadow-gold sm:p-6">
        <h2 className="text-lg font-semibold text-charcoal">求人情報の編集</h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="shopName" className={labelClass}>店舗名</label>
            <input
              id="shopName"
              value={form.shopName}
              readOnly
              className={readonlyInputClass}
              aria-readonly="true"
            />
          </div>
          <div>
            <label htmlFor="area" className={labelClass}>エリア</label>
            <input
              id="area"
              value={FIXED_AREA}
              readOnly
              className={readonlyInputClass}
              aria-readonly="true"
            />
          </div>
          <div>
            <label htmlFor="district" className={labelClass}>地区</label>
            <input
              id="district"
              value={form.district}
              readOnly
              className={readonlyInputClass}
              aria-readonly="true"
            />
          </div>
          <div>
            <label htmlFor="jobType" className={labelClass}>職種</label>
            <input
              id="jobType"
              value={form.jobType}
              readOnly
              className={readonlyInputClass}
              aria-readonly="true"
            />
          </div>
          <div>
            <label htmlFor="salary" className={labelClass}>時給</label>
            <input id="salary" value={form.salary} onChange={(e) => setField("salary", e.target.value)} className={inputClass} required />
          </div>
          <div>
            <label htmlFor="access" className={labelClass}>アクセス</label>
            <input id="access" value={form.access} onChange={(e) => setField("access", e.target.value)} className={inputClass} />
          </div>
          <div>
            <label htmlFor="businessHours" className={labelClass}>営業時間</label>
            <input id="businessHours" value={form.businessHours} onChange={(e) => setField("businessHours", e.target.value)} className={inputClass} />
          </div>
          <div>
            <label htmlFor="ageGroup" className={labelClass}>キャスト年齢</label>
            <input id="ageGroup" value={form.ageGroup} onChange={(e) => setField("ageGroup", e.target.value)} className={inputClass} />
          </div>
        </div>

        <div>
          <label htmlFor="introductionText" className={labelClass}>紹介文</label>
          <textarea id="introductionText" value={form.introductionText} onChange={(e) => setField("introductionText", e.target.value)} rows={3} className={inputClass} />
        </div>

        <div>
          <label htmlFor="descriptionText" className={labelClass}>どんなお店？</label>
          <textarea id="descriptionText" value={form.descriptionText} onChange={(e) => setField("descriptionText", e.target.value)} rows={5} className={inputClass} />
        </div>

        <div className="rounded-2xl border border-gold/20 bg-ivory/40 p-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <p className={labelClass}>入店・在籍キャストの声</p>
            <button type="button" onClick={() => setField("castVoices", [...form.castVoices, emptyCastVoiceEntry()])} className="rounded-full border border-gold/35 px-3 py-1 text-xs font-medium text-gold-dark">
              追加
            </button>
          </div>
          {form.castVoices.length === 0 ? (
            <p className="text-sm text-muted">まだ登録されていません。</p>
          ) : (
            <ul className="space-y-3">
              {form.castVoices.map((entry, index) => (
                <li key={index} className="rounded-xl border border-gold/20 bg-white p-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <input value={entry.name} onChange={(e) => setField("castVoices", form.castVoices.map((item, i) => i === index ? { ...item, name: e.target.value } : item))} placeholder="名前" className={inputClass} />
                    <input value={entry.age} onChange={(e) => setField("castVoices", form.castVoices.map((item, i) => i === index ? { ...item, age: e.target.value } : item))} placeholder="年齢" className={inputClass} />
                  </div>
                  <textarea value={entry.comment} onChange={(e) => setField("castVoices", form.castVoices.map((item, i) => i === index ? { ...item, comment: e.target.value } : item))} rows={3} placeholder="コメント" className={`${inputClass} mt-3`} />
                  <button type="button" onClick={() => setField("castVoices", form.castVoices.filter((_, i) => i !== index))} className="mt-2 text-xs text-muted hover:text-charcoal">削除</button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-2xl border border-gold/20 bg-ivory/40 p-4">
          <p className={labelClass}>店内画像</p>
          <input ref={storeImageInputRef} type="file" accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp" multiple className="hidden" onChange={handleStoreImagesUpload} />
          <button type="button" onClick={() => storeImageInputRef.current?.click()} disabled={uploadingStoreImages} className="rounded-full border border-gold/40 bg-white px-4 py-2 text-sm font-medium text-gold-dark">
            {uploadingStoreImages ? "アップロード中..." : "写真を選択"}
          </button>
          {form.storeImages.length > 0 && (
            <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {form.storeImages.map((imageUrl, index) => (
                <li key={`${imageUrl}-${index}`} className="overflow-hidden rounded-xl border border-gold/25 bg-white">
                  <img src={imageUrl} alt={`店内画像 ${index + 1}`} className="aspect-[4/3] w-full object-cover" />
                  <button type="button" onClick={() => setField("storeImages", form.storeImages.filter((_, i) => i !== index))} className="w-full px-2 py-2 text-xs text-muted hover:text-charcoal">削除</button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="space-y-4 rounded-2xl border border-gold/20 bg-ivory p-4">
          <p className="text-sm font-semibold text-gold-dark">公式SNS</p>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              ["xUrl", "X"],
              ["instagramUrl", "Instagram"],
              ["tiktokUrl", "TikTok"],
              ["youtubeUrl", "YouTube"],
              ["websiteUrl", "Webサイト"],
            ].map(([key, label]) => (
              <div key={key}>
                <label className={labelClass}>{label}</label>
                <input
                  type="url"
                  value={form[key as keyof ShopForm] as string}
                  onChange={(e) => setField(key as keyof ShopForm, e.target.value as never)}
                  className={inputClass}
                />
              </div>
            ))}
          </div>
        </div>

        <div>
          <p className={labelClass}>待遇</p>
          <div className="space-y-4">
            {BENEFIT_CATEGORIES.map((category) => (
              <div key={category.title}>
                <p className="mb-2 text-xs font-semibold text-gold-dark">{category.title}</p>
                <div className="flex flex-wrap gap-2">
                  {category.items.map((benefit) => (
                    <label key={benefit} className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-gold/25 bg-white px-3 py-1.5 text-sm">
                      <input type="checkbox" checked={form.benefits.includes(benefit)} onChange={() => toggleBenefit(benefit)} />
                      {benefit}
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <textarea value={form.otherBenefits} onChange={(e) => setField("otherBenefits", e.target.value)} rows={3} placeholder="その他待遇（1行1項目）" className={`${inputClass} mt-3`} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="phone" className={labelClass}>電話番号</label>
            <input id="phone" type="tel" value={form.phone} onChange={(e) => setField("phone", e.target.value)} className={inputClass} />
          </div>
          <div>
            <label htmlFor="lineUrl" className={labelClass}>LINE URL</label>
            <input id="lineUrl" type="url" value={form.lineUrl} onChange={(e) => setField("lineUrl", e.target.value)} className={inputClass} required />
          </div>
        </div>

        {message && (
          <p className={`rounded-xl px-3 py-2 text-sm ${message.includes("保存しました") ? "border border-green-200 bg-green-50 text-green-800" : "border border-red-200 bg-red-50 text-red-700"}`}>
            {message}
          </p>
        )}

        <button type="submit" disabled={loading} className="w-full rounded-full bg-gradient-to-r from-gold to-gold-dark px-6 py-3 text-sm font-semibold text-white shadow-gold disabled:opacity-60 sm:w-auto">
          {loading ? "保存中..." : "保存する"}
        </button>
      </form>

      <section className="space-y-6">
        <h2 className="text-lg font-semibold text-charcoal">応募・表示回数</h2>

        <dl className="grid gap-3 rounded-2xl border border-gold/20 bg-white p-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <dt className="text-xs text-muted">LINE応募数</dt>
            <dd className="text-lg font-semibold text-[#047a3b]">
              {applicationDetail?.line ?? 0}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted">電話応募数</dt>
            <dd className="text-lg font-semibold text-gold-dark">
              {applicationDetail?.phone ?? 0}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted">合計応募数</dt>
            <dd className="text-lg font-semibold text-charcoal">
              {applicationDetail?.total ?? 0}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted">表示回数</dt>
            <dd className="text-lg font-semibold text-charcoal">{viewCount}</dd>
          </div>
        </dl>

        <MonthlyViewChart data={monthlyViewStats} title="月間表示回数" />

        <MonthlyApplicationChart data={monthlyApplicationStats} />
      </section>

      <p className="mt-6 text-center text-xs text-muted">
        <Link href="/" className="text-gold-dark hover:underline">トップページへ</Link>
      </p>
    </div>
  );
}
