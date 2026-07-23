"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  BENEFIT_CATEGORIES,
  getKnownBenefits,
  getUncategorizedBenefits,
} from "@/data/benefits";
import { useScrollToTopAfterChange } from "@/hooks/useScrollToTopAfterChange";
import {
  aggregateMonthlyApplicationsForJob,
  emptyApplicationDetail,
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
import { buildPreviewJobFromShopForm } from "@/lib/job-preview";
import { toOpenDateInputValue } from "@/lib/job-listing";
import { JOBS_UPDATED_EVENT } from "@/lib/job-storage";
import {
  promoteTempImagesInPayload,
  uploadTempImage,
} from "@/lib/upload-temp-client";
import {
  FIXED_AREA,
  type CastVoiceEntry,
  type District,
  type Job,
  type JobType,
} from "@/types/job";
import {
  getPlanDefinition,
  getPlanFeatures,
  parseJobPlan,
  type JobPlan,
} from "@/lib/job-plan";

const MonthlyApplicationChart = dynamic(
  () =>
    import("@/components/MonthlyApplicationChart").then(
      (mod) => mod.MonthlyApplicationChart,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="mt-4 h-48 animate-pulse rounded-2xl border border-gold/15 bg-ivory/60" />
    ),
  },
);

const ShopAnalyticsSection = dynamic(
  () =>
    import("@/components/ShopAnalyticsSection").then(
      (mod) => mod.ShopAnalyticsSection,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="mb-8 h-64 animate-pulse rounded-2xl border border-gold/20 bg-white" />
    ),
  },
);

const JobListingPreview = dynamic(
  () =>
    import("@/components/JobListingPreview").then((mod) => mod.JobListingPreview),
  { ssr: false },
);

type ShopForm = {
  shopName: string;
  district: District;
  jobType: JobType;
  imageUrl: string;
  salary: string;
  access: string;
  businessHours: string;
  openDate: string;
  ageGroup: string;
  introductionText: string;
  descriptionText: string;
  castVoices: CastVoiceEntry[];
  recruiterName: string;
  recruiterTitle: string;
  recruiterImage: string;
  recruiterMessage: string;
  managerComment: string;
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
  "w-full rounded-xl border border-gold/30 bg-ivory px-4 py-3 text-base outline-none focus:border-gold focus:ring-2 focus:ring-gold/20";

const readonlyInputClass = `${inputClass} cursor-not-allowed bg-zinc-100 text-charcoal`;

const labelClass = "mb-1.5 block text-sm font-medium text-charcoal";

function toForm(job: Job): ShopForm {
  return {
    shopName: job.shopName,
    district: job.district,
    jobType: job.jobType,
    imageUrl: job.imageUrl ?? "",
    salary: job.salary,
    access: job.access ?? "",
    businessHours: job.businessHours ?? "",
    openDate: toOpenDateInputValue(job.openDate),
    ageGroup: job.ageGroup ?? "",
    introductionText: job.introductionText ?? "",
    descriptionText: job.descriptionText ?? "",
    castVoices: getDisplayCastVoices(job).map((entry) => ({
      name: entry.name,
      age: entry.age,
      comment: entry.comment,
    })),
    recruiterName: job.recruiterName ?? "",
    recruiterTitle: job.recruiterTitle ?? "",
    recruiterImage: job.recruiterImage ?? "",
    recruiterMessage: job.recruiterMessage ?? "",
    managerComment: job.managerComment ?? "",
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
    imageUrl: form.imageUrl,
    salary: form.salary,
    access: form.access || undefined,
    businessHours: form.businessHours || undefined,
    openDate: form.openDate.trim() || null,
    ageGroup: form.ageGroup || undefined,
    introductionText: form.introductionText || undefined,
    descriptionText: form.descriptionText || undefined,
    castVoices: sanitizeCastVoicesForSave(form.castVoices),
    recruiterName: form.recruiterName || undefined,
    recruiterTitle: form.recruiterTitle || undefined,
    recruiterImage: form.recruiterImage,
    recruiterMessage: form.recruiterMessage || undefined,
    managerComment: form.managerComment || undefined,
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
  const topImageInputRef = useRef<HTMLInputElement>(null);
  const recruiterImageInputRef = useRef<HTMLInputElement>(null);
  const storeImageInputRef = useRef<HTMLInputElement>(null);
  const [authenticated, setAuthenticated] = useState(false);
  const [shellShopName, setShellShopName] = useState("");
  const [shellPublished, setShellPublished] = useState<boolean | null>(null);
  const [shellDistrict, setShellDistrict] = useState("");
  const [metricsLoading, setMetricsLoading] = useState(true);
  const [jobLoading, setJobLoading] = useState(true);
  const [deferredLoading, setDeferredLoading] = useState(true);
  const shellTimedRef = useRef(false);
  const [form, setForm] = useState<ShopForm | null>(null);
  const [publishedJob, setPublishedJob] = useState<Job | null>(null);
  const [applicationRows, setApplicationRows] = useState<ApplicationRow[]>([]);
  const [applicationDetail, setApplicationDetail] =
    useState<JobApplicationDetail | null>(null);
  const [viewCount, setViewCount] = useState(0);
  const [message, setMessage] = useState("");
  const [boostMessage, setBoostMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [boostLoading, setBoostLoading] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const publishLockRef = useRef(false);
  const requestScrollToTop = useScrollToTopAfterChange([showPreview]);
  const [uploadingTopImage, setUploadingTopImage] = useState(false);
  const [uploadingRecruiterImage, setUploadingRecruiterImage] = useState(false);
  const [uploadingStoreImages, setUploadingStoreImages] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [districtRank, setDistrictRank] = useState(1);
  const [districtTotal, setDistrictTotal] = useState(1);
  const [boostRemaining, setBoostRemaining] = useState(5);
  const [boostLimit, setBoostLimit] = useState(5);
  const [newJobNotifyCount, setNewJobNotifyCount] = useState(0);
  const [pickupNotifyCount, setPickupNotifyCount] = useState(0);
  const [jobPlan, setJobPlan] = useState<JobPlan>("light");

  function markShellReady() {
    if (shellTimedRef.current) return;
    shellTimedRef.current = true;
    console.timeEnd("shop-dashboard:auth-to-shell");
  }

  async function loadShell() {
    console.time("shop-dashboard:shell-fetch");
    const data = await readJson<{
      jobId: string;
      shopName: string;
      published: boolean;
      plan: string | null;
      district: string;
      timings?: Record<string, number>;
    }>(
      await fetch("/api/shop-dashboard", {
        cache: "no-store",
        credentials: "include",
      }),
    );
    console.timeEnd("shop-dashboard:shell-fetch");
    if (data.timings) {
      console.info("[shop-dashboard] shell timings", data.timings);
    }
    setJobId(data.jobId);
    setShellShopName(data.shopName);
    setShellPublished(data.published);
    setShellDistrict(data.district);
    setJobPlan(parseJobPlan(data.plan));
    setAuthenticated(true);
    markShellReady();
  }

  async function loadMetrics() {
    setMetricsLoading(true);
    console.time("shop-dashboard:metrics-fetch");
    try {
      const data = await readJson<{
        applicationDetail: JobApplicationDetail;
        viewCount: number;
        districtRank: number;
        districtTotal: number;
        boostRemaining: number;
        boostLimit: number;
        district?: string;
        timings?: Record<string, number>;
      }>(
        await fetch("/api/shop-dashboard/metrics", {
          cache: "no-store",
          credentials: "include",
        }),
      );
      console.timeEnd("shop-dashboard:metrics-fetch");
      if (data.timings) {
        console.info("[shop-dashboard] metrics timings", data.timings);
      }
      setApplicationDetail(data.applicationDetail);
      setViewCount(data.viewCount);
      setDistrictRank(data.districtRank ?? 1);
      setDistrictTotal(data.districtTotal ?? 1);
      setBoostRemaining(data.boostRemaining ?? 5);
      setBoostLimit(data.boostLimit ?? 5);
      if (data.district) setShellDistrict(data.district);
    } catch (error) {
      console.timeEnd("shop-dashboard:metrics-fetch");
      console.error("[shop-dashboard] metrics failed", error);
      setApplicationDetail(emptyApplicationDetail());
    } finally {
      setMetricsLoading(false);
    }
  }

  async function loadJobDetails() {
    setJobLoading(true);
    console.time("shop-dashboard:job-fetch");
    try {
      const data = await readJson<{ job: Job; timings?: Record<string, number> }>(
        await fetch("/api/shop-dashboard/job", {
          cache: "no-store",
          credentials: "include",
        }),
      );
      console.timeEnd("shop-dashboard:job-fetch");
      if (data.timings) {
        console.info("[shop-dashboard] job timings", data.timings);
      }
      setForm(toForm(data.job));
      setPublishedJob(data.job);
      setJobId(data.job.id);
      setShellShopName(data.job.shopName);
      setShellDistrict(data.job.district);
      setJobPlan(parseJobPlan(data.job.plan));
    } catch (error) {
      console.timeEnd("shop-dashboard:job-fetch");
      throw error;
    } finally {
      setJobLoading(false);
    }
  }

  async function loadDeferredDashboard() {
    setDeferredLoading(true);
    console.time("shop-dashboard:deferred-fetch");
    try {
      const data = await readJson<{
        applicationRows: ApplicationRow[];
        newJobNotifyCount?: number;
        pickupNotifyCount?: number;
        timings?: Record<string, number>;
      }>(
        await fetch("/api/shop-dashboard/deferred", {
          cache: "no-store",
          credentials: "include",
        }),
      );
      console.timeEnd("shop-dashboard:deferred-fetch");
      if (data.timings) {
        console.info("[shop-dashboard] deferred timings", data.timings);
      }
      setApplicationRows(data.applicationRows ?? []);
      setNewJobNotifyCount(data.newJobNotifyCount ?? 0);
      setPickupNotifyCount(data.pickupNotifyCount ?? 0);
    } catch (error) {
      console.timeEnd("shop-dashboard:deferred-fetch");
      console.error("[shop-dashboard] deferred load failed", error);
    } finally {
      setDeferredLoading(false);
    }
  }

  async function refreshAfterSave() {
    await Promise.all([loadJobDetails(), loadMetrics(), loadDeferredDashboard()]);
  }

  useEffect(() => {
    let cancelled = false;
    console.time("shop-dashboard:auth-to-shell");

    try {
      const raw = sessionStorage.getItem("wnj-shop-bootstrap");
      if (raw) {
        const bootstrap = JSON.parse(raw) as {
          shopName?: string;
          jobId?: string;
          plan?: string;
          published?: boolean;
        };
        if (bootstrap.shopName) {
          setShellShopName(bootstrap.shopName);
          setAuthenticated(true);
          markShellReady();
        }
        if (bootstrap.jobId) setJobId(bootstrap.jobId);
        if (bootstrap.plan) setJobPlan(parseJobPlan(bootstrap.plan));
        if (typeof bootstrap.published === "boolean") {
          setShellPublished(bootstrap.published);
        }
      }
    } catch {
      // ignore
    }

    void (async () => {
      try {
        // Shell first (auth + name), then heavy data in parallel — never block redirect.
        await loadShell();
        if (cancelled) return;
        void Promise.all([
          loadMetrics(),
          loadJobDetails().catch((error) => {
            console.error("[shop-dashboard] job details failed", error);
          }),
          loadDeferredDashboard(),
        ]);
      } catch {
        if (!cancelled) {
          router.replace("/shop-login");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount-once bootstrap
  }, [router]);

  const monthlyApplicationStats = useMemo(
    () =>
      jobId ? aggregateMonthlyApplicationsForJob(applicationRows, jobId) : [],
    [applicationRows, jobId],
  );

  const planDefinition = getPlanDefinition(jobPlan);
  const planFeatures = getPlanFeatures(jobPlan);
  const analyticsEnabled = planFeatures.analytics;

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
    try {
      sessionStorage.removeItem("wnj-shop-bootstrap");
    } catch {
      // ignore
    }
    await fetch("/api/shop-logout", { method: "POST", credentials: "include" });
    router.replace("/shop-login");
  }

  async function handleBoost() {
    if (!jobId || boostRemaining <= 0) return;
    setBoostLoading(true);
    setBoostMessage("");
    try {
      const response = await fetch("/api/shop-dashboard/boost", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ jobId }),
      });
      const data = (await response.json()) as {
        message?: string;
        districtRank?: number;
        districtTotal?: number;
        boostRemaining?: number;
        boostLimit?: number;
      };

      if (!response.ok) {
        if (typeof data.boostRemaining === "number") {
          setBoostRemaining(data.boostRemaining);
        }
        if (typeof data.boostLimit === "number") {
          setBoostLimit(data.boostLimit);
        }
        throw new Error(data.message ?? "上位表示の適用に失敗しました。");
      }

      setDistrictRank(data.districtRank ?? districtRank);
      setDistrictTotal(data.districtTotal ?? districtTotal);
      setBoostRemaining(data.boostRemaining ?? boostRemaining);
      setBoostLimit(data.boostLimit ?? boostLimit);
      setBoostMessage(data.message ?? "上位表示を適用しました。");
      window.dispatchEvent(new Event(JOBS_UPDATED_EVENT));
    } catch (error) {
      setBoostMessage(
        error instanceof Error
          ? error.message
          : "上位表示の適用に失敗しました。",
      );
    } finally {
      setBoostLoading(false);
    }
  }

  async function persistForm(nextForm: ShopForm) {
    const promoted = await promoteTempImagesInPayload(toPayload(nextForm));
    const { job } = await readJson<{ job: Job }>(
      await fetch("/api/shop-dashboard/job", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(promoted),
      }),
    );
    setForm(toForm(job));
    setPublishedJob(job);
    window.dispatchEvent(new Event(JOBS_UPDATED_EVENT));
    return job;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form) return;
    setMessage("");
    if (!form.salary.trim() || !form.lineUrl.trim()) {
      setMessage("時給とLINE URLは必須です。");
      return;
    }
    requestScrollToTop();
    setShowPreview(true);
  }

  async function handleConfirmPublish() {
    if (!form || publishLockRef.current || loading) return;
    publishLockRef.current = true;
    setLoading(true);
    setMessage("");
    try {
      await persistForm(form);
      await refreshAfterSave();
      requestScrollToTop();
      setShowPreview(false);
      setMessage("求人情報を更新しました。");
    } catch (error) {
      requestScrollToTop();
      setShowPreview(false);
      setMessage(error instanceof Error ? error.message : "保存に失敗しました。");
    } finally {
      setLoading(false);
      publishLockRef.current = false;
    }
  }

  async function handleTopImageUpload(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0];
    if (!file || !jobId || !form) return;
    setUploadingTopImage(true);
    setMessage("");
    try {
      const imageUrl = await uploadTempImage({
        file,
        uploadType: "top-image",
        ownerId: jobId,
      });
      setForm({ ...form, imageUrl });
      setMessage("店舗トップ画像を選択しました（確定まで公開反映されません）。");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "店舗トップ画像のアップロードに失敗しました。",
      );
    } finally {
      setUploadingTopImage(false);
      event.target.value = "";
    }
  }

  async function handleTopImageRemove() {
    if (!form || !form.imageUrl) return;
    if (!window.confirm("店舗トップ画像を削除しますか？（確定するまで公開内容は変わりません）")) {
      return;
    }
    setForm({ ...form, imageUrl: "" });
    setMessage("店舗トップ画像を削除候補にしました（確定まで公開反映されません）。");
  }

  async function handleRecruiterImageUpload(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0];
    if (!file || !jobId || !form) return;
    setUploadingRecruiterImage(true);
    setMessage("");
    try {
      const imageUrl = await uploadTempImage({
        file,
        uploadType: "recruiter-image",
        ownerId: jobId,
      });
      setForm({ ...form, recruiterImage: imageUrl });
      setMessage("採用担当者の顔写真を選択しました（確定まで公開反映されません）。");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "採用担当者の顔写真のアップロードに失敗しました。",
      );
    } finally {
      setUploadingRecruiterImage(false);
      event.target.value = "";
    }
  }

  async function handleRecruiterImageRemove() {
    if (!form || !form.recruiterImage) return;
    setForm({ ...form, recruiterImage: "" });
    setMessage("採用担当者の顔写真を削除候補にしました（確定まで公開反映されません）。");
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
        const publicUrl = await uploadTempImage({
          file,
          uploadType: "store-image",
          ownerId: jobId,
        });
        uploadedUrls.push(publicUrl);
      }
      setField("storeImages", [...form.storeImages, ...uploadedUrls]);
      setMessage(
        `${uploadedUrls.length}枚の店舗ギャラリー画像を追加しました（確定まで公開反映されません）。`,
      );
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "店舗ギャラリー画像の追加に失敗しました。",
      );
    } finally {
      setUploadingStoreImages(false);
      event.target.value = "";
    }
  }

  if (showPreview && publishedJob && form) {
    const previewJob = buildPreviewJobFromShopForm(form, publishedJob);
    return (
      <JobListingPreview
        job={previewJob}
        mode="edit"
        submitting={loading}
        onBack={() => {
          requestScrollToTop();
          setShowPreview(false);
        }}
        onConfirm={() => {
          void handleConfirmPublish();
        }}
      />
    );
  }

  // Soft loading shell while auth cookie is being verified (no long white screen).
  if (!authenticated && !shellShopName) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <div className="mb-6">
          <p className="text-sm font-medium text-gold-dark">店舗ダッシュボード</p>
          <h1 className="mt-1 font-serif text-2xl font-semibold text-charcoal">
            読み込み中…
          </h1>
        </div>
        <div className="space-y-4">
          <div className="h-16 animate-pulse rounded-2xl border border-gold/20 bg-white" />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((key) => (
              <div
                key={key}
                className="h-20 animate-pulse rounded-xl border border-gold/20 bg-white"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const displayShopName = form?.shopName ?? shellShopName ?? "店舗";
  const displayDistrict = form?.district ?? shellDistrict;
  const isPublished = shellPublished ?? true;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-gold-dark">店舗ダッシュボード</p>
          <h1 className="mt-1 font-serif text-2xl font-semibold text-charcoal">
            {displayShopName}
          </h1>
          <p className="mt-1 text-sm text-muted">
            自店舗の求人情報と応募・表示回数を確認できます。
          </p>
          <p className="mt-2 inline-flex items-center gap-2 text-xs font-medium">
            <span
              className={`rounded-full px-2.5 py-1 ${
                isPublished
                  ? "bg-[#047a3b]/10 text-[#047a3b]"
                  : "bg-zinc-200 text-muted"
              }`}
            >
              {isPublished ? "公開中" : "非公開"}
            </span>
            <span className="rounded-full border border-gold/30 bg-ivory px-2.5 py-1 text-gold-dark">
              {planDefinition.label}
            </span>
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

      {message && (
        <p
          className={`mb-4 rounded-xl px-3 py-2 text-sm ${
            message.includes("保存しました") ||
            message.includes("更新しました") ||
            message.includes("アップロードしました") ||
            message.includes("選択しました") ||
            message.includes("追加しました") ||
            message.includes("削除しました") ||
            message.includes("削除候補")
              ? "border border-green-200 bg-green-50 text-green-800"
              : "border border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {message}
        </p>
      )}

      <div className="mb-8 overflow-hidden rounded-2xl border border-gold/25 bg-white shadow-gold">
        <button
          type="button"
          onClick={() => {
            if (!form) return;
            setIsFormOpen((current) => !current);
          }}
          disabled={!form || jobLoading}
          className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left transition hover:bg-ivory/60 disabled:cursor-wait disabled:opacity-70 sm:px-6"
          aria-expanded={isFormOpen}
        >
          <span className="text-lg font-semibold text-charcoal">
            {jobLoading && !form ? "求人情報を読み込み中…" : "求人情報の編集"}
          </span>
          <span className="text-sm text-gold-dark" aria-hidden="true">
            {isFormOpen ? "▲" : "▼"}
          </span>
        </button>

        {isFormOpen && form && (
          <form
            onSubmit={handleSubmit}
            className="space-y-6 border-t border-gold/15 px-5 py-5 sm:px-6 sm:py-6"
          >
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
            <label htmlFor="openDate" className={labelClass}>オープン日</label>
            <input
              id="openDate"
              type="date"
              value={form.openDate}
              onChange={(e) => setField("openDate", e.target.value)}
              className={inputClass}
            />
            <p className="mt-1 text-xs text-muted">
              入力するとオープン日から6か月間、トップの「新規オープン店舗」に表示されます。未入力の場合は対象外です。
            </p>
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
          <p className={labelClass}>採用担当からのメッセージ</p>
          <p className="mb-4 text-xs text-muted">
            求人詳細ページの「入店・在籍キャストの声」の下に表示されます。
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="recruiterName" className={labelClass}>採用担当者名</label>
              <input
                id="recruiterName"
                value={form.recruiterName}
                onChange={(e) => setField("recruiterName", e.target.value)}
                className={inputClass}
                placeholder="例: 田中 花子"
              />
            </div>
            <div>
              <label htmlFor="recruiterTitle" className={labelClass}>役職</label>
              <input
                id="recruiterTitle"
                value={form.recruiterTitle}
                onChange={(e) => setField("recruiterTitle", e.target.value)}
                className={inputClass}
                placeholder="例: 店長 / 採用担当"
                list="shop-recruiter-title-options"
              />
              <datalist id="shop-recruiter-title-options">
                <option value="店長" />
                <option value="採用担当" />
                <option value="オーナー" />
                <option value="マネージャー" />
              </datalist>
            </div>
          </div>
          <div className="mt-4">
            <p className={labelClass}>顔写真</p>
            <input
              ref={recruiterImageInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
              className="hidden"
              onChange={handleRecruiterImageUpload}
            />
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => recruiterImageInputRef.current?.click()}
                disabled={uploadingRecruiterImage}
                className="rounded-full border border-gold/40 bg-white px-4 py-2 text-sm font-medium text-gold-dark disabled:opacity-60"
              >
                {uploadingRecruiterImage ? "処理中..." : "写真を選択"}
              </button>
              {form.recruiterImage && (
                <button
                  type="button"
                  onClick={handleRecruiterImageRemove}
                  disabled={uploadingRecruiterImage}
                  className="rounded-full border border-charcoal/20 bg-white px-4 py-2 text-sm font-medium text-muted hover:text-charcoal disabled:opacity-60"
                >
                  写真を削除
                </button>
              )}
            </div>
            {form.recruiterImage && (
              <img
                src={form.recruiterImage}
                alt="採用担当者プレビュー"
                loading="lazy"
                decoding="async"
                className="mt-4 h-24 w-24 rounded-full border-4 border-gold/30 object-cover"
              />
            )}
          </div>
          <div className="mt-4">
            <label htmlFor="recruiterMessage" className={labelClass}>採用担当からのメッセージ</label>
            <textarea
              id="recruiterMessage"
              value={form.recruiterMessage}
              onChange={(e) => setField("recruiterMessage", e.target.value)}
              rows={6}
              className={inputClass}
              placeholder="応募を迷っている方へのメッセージを入力してください"
            />
          </div>
          <div className="mt-4">
            <label htmlFor="managerComment" className={labelClass}>店長から一言</label>
            <textarea
              id="managerComment"
              value={form.managerComment}
              onChange={(e) => setField("managerComment", e.target.value)}
              rows={4}
              className={inputClass}
              placeholder="LINE配信や店舗詳細に表示されます"
            />
          </div>
        </div>

        <div className="rounded-2xl border border-gold/20 bg-ivory/40 p-4">
          <p className={labelClass}>店舗トップ画像</p>
          <p className="mb-3 text-xs text-muted">
            求人一覧カードと求人詳細ページ最上部に表示するメイン画像です。1枚のみ設定でき、差し替えも可能です。
          </p>
          <input
            ref={topImageInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
            className="hidden"
            onChange={handleTopImageUpload}
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => topImageInputRef.current?.click()}
              disabled={uploadingTopImage}
              className="rounded-full border border-gold/40 bg-white px-4 py-2 text-sm font-medium text-gold-dark disabled:opacity-60"
            >
              {uploadingTopImage ? "処理中..." : "写真を選択"}
            </button>
            {form.imageUrl && (
              <button
                type="button"
                onClick={handleTopImageRemove}
                disabled={uploadingTopImage}
                className="rounded-full border border-charcoal/20 bg-white px-4 py-2 text-sm font-medium text-muted hover:text-charcoal disabled:opacity-60"
              >
                画像を削除
              </button>
            )}
          </div>
          {form.imageUrl ? (
            <img
              src={form.imageUrl}
              alt="店舗トップ画像プレビュー"
              loading="lazy"
              decoding="async"
              className="mt-4 h-40 w-full rounded-xl object-cover"
            />
          ) : (
            <p className="mt-3 rounded-xl border border-dashed border-gold/25 bg-white px-3 py-4 text-center text-sm text-muted">
              「写真を選択」から店舗トップ画像を登録できます
            </p>
          )}
        </div>

        <div className="rounded-2xl border border-gold/20 bg-ivory/40 p-4">
          <p className={labelClass}>店舗ギャラリー</p>
          <p className="mb-3 text-xs text-muted">
            求人詳細ページで店舗の雰囲気が分かる写真を複数枚表示します。
          </p>
          <input ref={storeImageInputRef} type="file" accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp" multiple className="hidden" onChange={handleStoreImagesUpload} />
          <button type="button" onClick={() => storeImageInputRef.current?.click()} disabled={uploadingStoreImages} className="rounded-full border border-gold/40 bg-white px-4 py-2 text-sm font-medium text-gold-dark">
            {uploadingStoreImages ? "追加中..." : "画像追加"}
          </button>
          {form.storeImages.length === 0 ? (
            <p className="mt-3 rounded-xl border border-dashed border-gold/25 bg-white px-3 py-4 text-center text-sm text-muted">
              「画像追加」から店舗ギャラリーに写真を登録できます
            </p>
          ) : (
            <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {form.storeImages.map((imageUrl, index) => (
                <li key={`${imageUrl}-${index}`} className="overflow-hidden rounded-xl border border-gold/25 bg-white">
                  <img
                    src={imageUrl}
                    alt={`店舗ギャラリー ${index + 1}`}
                    loading="lazy"
                    decoding="async"
                    className="aspect-[4/3] w-full object-cover"
                  />
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

        <button type="submit" disabled={loading || uploadingTopImage || uploadingRecruiterImage || uploadingStoreImages} className="w-full rounded-full bg-gradient-to-r from-gold to-gold-dark px-6 py-3 text-sm font-semibold text-white shadow-gold disabled:opacity-60 sm:w-auto">
          変更内容を確認する
        </button>
          </form>
        )}
      </div>

      <section className="mb-8 space-y-3">
        <h2 className="text-lg font-semibold text-charcoal">応募・表示回数（累計）</h2>
        <dl className="grid gap-3 rounded-2xl border border-gold/20 bg-white p-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <dt className="text-xs text-muted">LINE応募数</dt>
            <dd className="text-lg font-semibold text-[#047a3b]">
              {metricsLoading ? (
                <span className="mt-1 inline-block h-6 w-16 animate-pulse rounded bg-gold/20" />
              ) : (
                applicationDetail?.line ?? 0
              )}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted">電話応募数</dt>
            <dd className="text-lg font-semibold text-gold-dark">
              {metricsLoading ? (
                <span className="mt-1 inline-block h-6 w-16 animate-pulse rounded bg-gold/20" />
              ) : (
                applicationDetail?.phone ?? 0
              )}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted">合計応募数</dt>
            <dd className="text-lg font-semibold text-charcoal">
              {metricsLoading ? (
                <span className="mt-1 inline-block h-6 w-16 animate-pulse rounded bg-gold/20" />
              ) : (
                applicationDetail?.total ?? 0
              )}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted">詳細ページ表示（累計）</dt>
            <dd className="text-lg font-semibold text-charcoal">
              {metricsLoading ? (
                <span className="mt-1 inline-block h-6 w-16 animate-pulse rounded bg-gold/20" />
              ) : (
                viewCount
              )}
            </dd>
          </div>
        </dl>
      </section>

      <section className="mb-8 rounded-2xl border border-gold/30 bg-gradient-to-br from-charcoal via-[#1f1a12] to-[#2d2618] p-5 shadow-gold sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-gold-light/90">
              {displayDistrict || "—"}エリア内 表示順位
            </p>
            {metricsLoading ? (
              <div className="mt-2 h-10 w-28 animate-pulse rounded bg-white/20" />
            ) : (
              <p className="mt-1 font-serif text-3xl font-semibold text-white">
                {districtRank}
                <span className="ml-1 text-lg font-medium text-gold-light">位</span>
              </p>
            )}
            <p className="mt-1 text-xs text-gold-light/70">
              {metricsLoading
                ? "順位を計算中…"
                : `全${districtTotal}店舗中（本日の上位表示・更新順で算出）`}
            </p>
            <p className="mt-2 inline-flex rounded-full border border-gold/40 bg-black/25 px-3 py-1 text-xs font-medium text-gold-light">
              掲載プラン：{planDefinition.label}（{planDefinition.priceLabel}）
            </p>
          </div>
          <div className="flex flex-col items-stretch gap-2 sm:items-end">
            <p className="text-center text-sm font-medium text-gold-light sm:text-right">
              本日の上位表示
            </p>
            {metricsLoading ? (
              <div className="h-8 w-40 animate-pulse rounded bg-white/20" />
            ) : (
              <p
                className="text-center font-serif text-lg tracking-wide text-white sm:text-right"
                aria-label={`本日の上位表示 ${boostLimit - boostRemaining} / ${boostLimit}回`}
              >
                {"★".repeat(Math.max(0, boostLimit - boostRemaining))}
                {"☆".repeat(Math.max(0, boostRemaining))}
                <span className="ml-2 text-sm font-sans font-medium text-gold-light">
                  {boostLimit - boostRemaining} / {boostLimit}回
                </span>
              </p>
            )}
            <p className="text-center text-xs text-gold-light/80 sm:text-right">
              {metricsLoading
                ? "読み込み中…"
                : `残り${boostRemaining}回（毎日0:00にリセット）`}
            </p>
            <button
              type="button"
              onClick={handleBoost}
              disabled={boostLoading || metricsLoading || boostRemaining <= 0}
              className="rounded-full border border-gold/50 bg-gradient-to-r from-gold to-gold-dark px-5 py-2.5 text-sm font-semibold text-charcoal shadow-gold transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {boostLoading ? "適用中..." : "上位表示する"}
            </button>
          </div>
        </div>
        {boostMessage && (
          <p
            className={`mt-4 rounded-xl px-3 py-2 text-sm ${
              boostMessage.includes("使い切り") || boostMessage.includes("失敗")
                ? "border border-red-300/40 bg-red-950/40 text-red-100"
                : "border border-gold/30 bg-black/20 text-gold-light"
            }`}
          >
            {boostMessage}
          </p>
        )}
        {boostRemaining <= 0 && !boostMessage && (
          <p className="mt-4 rounded-xl border border-red-300/40 bg-red-950/40 px-3 py-2 text-sm text-red-100">
            本日の上位表示回数を使い切りました
          </p>
        )}
      </section>

      <section className="mb-8 rounded-2xl border border-gold/25 bg-white p-5 shadow-gold sm:p-6">
        <h2 className="font-serif text-lg font-semibold text-charcoal">
          通知対象人数
        </h2>
        <p className="mt-1 text-xs text-muted">
          現在の求人内容・ユーザー希望条件から算出した、実際に送信される想定人数です。
        </p>
        <dl className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-gold/20 bg-ivory/60 p-4">
            <dt className="text-xs text-muted">新着求人通知予定</dt>
            <dd className="mt-1 font-serif text-2xl font-semibold text-charcoal">
              {deferredLoading ? (
                <span className="inline-block h-8 w-24 animate-pulse rounded bg-gold/20" />
              ) : (
                <>約{newJobNotifyCount.toLocaleString("ja-JP")}人</>
              )}
            </dd>
          </div>
          <div className="rounded-xl border border-gold/20 bg-ivory/60 p-4">
            <dt className="text-xs text-muted">PickUp通知予定</dt>
            <dd className="mt-1 font-serif text-2xl font-semibold text-charcoal">
              {deferredLoading ? (
                <span className="inline-block h-8 w-24 animate-pulse rounded bg-gold/20" />
              ) : (
                <>約{pickupNotifyCount.toLocaleString("ja-JP")}人</>
              )}
            </dd>
          </div>
        </dl>
      </section>

      {analyticsEnabled ? (
        <ShopAnalyticsSection />
      ) : (
        <section className="mb-8 rounded-2xl border border-gold/25 bg-white p-5 shadow-gold sm:p-6">
          <h2 className="font-serif text-lg font-semibold text-charcoal">
            アクセス・応募分析
          </h2>
          <p className="mt-2 text-sm text-muted">
            応募分析はスタンダード以上のプランでご利用いただけます。現在のプランは
            {planDefinition.label}です。プラン変更は運営までご連絡ください。
          </p>
        </section>
      )}

      <section className="space-y-6">
        <h2 className="text-lg font-semibold text-charcoal">応募推移</h2>
        <p className="text-xs text-muted">
          {analyticsEnabled
            ? "月次の応募推移です。期間別の詳細は上の「アクセス・応募分析」をご覧ください。"
            : "月次の応募推移です。"}
        </p>

        {deferredLoading ? (
          <div className="mt-4 h-48 animate-pulse rounded-2xl border border-gold/15 bg-ivory/60" />
        ) : (
          <MonthlyApplicationChart data={monthlyApplicationStats} />
        )}
      </section>

      <p className="mt-6 text-center text-xs text-muted">
        <Link href="/" className="text-gold-dark hover:underline">トップページへ</Link>
      </p>
    </div>
  );
}
