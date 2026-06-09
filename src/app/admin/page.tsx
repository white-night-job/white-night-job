"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  BENEFIT_CATEGORIES,
  getKnownBenefits,
  getUncategorizedBenefits,
} from "@/data/benefits";
import { DISTRICTS } from "@/data/districts";
import { MonthlyApplicationChart } from "@/components/MonthlyApplicationChart";
import { MonthlyViewChart } from "@/components/MonthlyViewChart";
import {
  aggregateMonthlyApplications,
  aggregateMonthlyApplicationsForJob,
  emptyApplicationDetail,
  formatApplicationDateTime,
  getApplicationTypeLabel,
  matchesRegionFilter,
  matchesShopSearch,
  REGION_FILTER_OPTIONS,
  type ApplicationRow,
  type JobApplicationDetail,
} from "@/lib/job-applications";
import {
  aggregateMonthlyViews,
  aggregateMonthlyViewsForJob,
  aggregateViewCounts,
  type ViewRow,
} from "@/lib/job-views";
import { formatLocation, JOBS_UPDATED_EVENT } from "@/lib/job-storage";
import {
  getDisplayCastVoices,
  getDisplayStoreImages,
  parseBenefits,
  sanitizeCastVoicesForSave,
  sanitizeStoreImagesForSave,
} from "@/lib/job-db";
import {
  FIXED_AREA,
  JOB_TYPES,
  type CastVoiceEntry,
  type District,
  type Job,
  type JobType,
} from "@/types/job";

const emptyCastVoiceEntry = (): CastVoiceEntry => ({
  name: "",
  age: "",
  comment: "",
});

type JobForm = {
  shopName: string;
  district: District;
  jobType: JobType;
  salary: string;
  businessHours: string;
  ageGroup: string;
  customerPersonalityLevel: string;
  customerAgeLevel: string;
  customerRegularLevel: string;
  benefits: string[];
  otherBenefits: string;
  introductionText: string;
  descriptionText: string;
  castVoices: CastVoiceEntry[];
  imageUrl: string;
  storeImages: string[];
  phone: string;
  address: string;
  access: string;
  xUrl: string;
  instagramUrl: string;
  tiktokUrl: string;
  youtubeUrl: string;
  websiteUrl: string;
  lineUrl: string;
  shopLoginId: string;
  shopLoginPassword: string;
};

const emptyForm: JobForm = {
  shopName: "",
  district: "すすきの",
  jobType: "ニュークラ",
  salary: "",
  businessHours: "",
  ageGroup: "",
  customerPersonalityLevel: "",
  customerAgeLevel: "",
  customerRegularLevel: "",
  benefits: [],
  otherBenefits: "",
  introductionText: "",
  descriptionText: "",
  castVoices: [],
  imageUrl: "",
  storeImages: [],
  phone: "",
  address: "",
  access: "",
  xUrl: "",
  instagramUrl: "",
  tiktokUrl: "",
  youtubeUrl: "",
  websiteUrl: "",
  lineUrl: "",
  shopLoginId: "",
  shopLoginPassword: "",
};

const inputClass =
  "w-full rounded-xl border border-gold/30 bg-ivory px-4 py-3 text-sm outline-none focus:border-gold focus:ring-2 focus:ring-gold/20";

const labelClass = "mb-1.5 block text-sm font-medium text-charcoal";

const levelOptions = [
  { value: "", label: "未設定" },
  { value: "1", label: "1（左寄り）" },
  { value: "2", label: "2" },
  { value: "3", label: "3（中央）" },
  { value: "4", label: "4" },
  { value: "5", label: "5（右寄り）" },
];

function toPayload(form: JobForm) {
  return {
    shopName: form.shopName,
    district: form.district,
    jobType: form.jobType,
    salary: form.salary,
    businessHours: form.businessHours,
    ageGroup: form.ageGroup,
    customerPersonalityLevel: form.customerPersonalityLevel
      ? Number(form.customerPersonalityLevel)
      : undefined,
    customerAgeLevel: form.customerAgeLevel
      ? Number(form.customerAgeLevel)
      : undefined,
    customerRegularLevel: form.customerRegularLevel
      ? Number(form.customerRegularLevel)
      : undefined,
    benefits: form.benefits,
    otherBenefits: parseBenefits(form.otherBenefits),
    introductionText: form.introductionText || undefined,
    descriptionText: form.descriptionText || undefined,
    castVoices: sanitizeCastVoicesForSave(form.castVoices),
    imageUrl: form.imageUrl || undefined,
    storeImages: sanitizeStoreImagesForSave(form.storeImages),
    phone: form.phone || undefined,
    address: form.address || undefined,
    access: form.access || undefined,
    xUrl: form.xUrl || undefined,
    instagramUrl: form.instagramUrl || undefined,
    tiktokUrl: form.tiktokUrl || undefined,
    youtubeUrl: form.youtubeUrl || undefined,
    websiteUrl: form.websiteUrl || undefined,
    lineUrl: form.lineUrl,
    shop_login_id: form.shopLoginId.trim(),
    ...(form.shopLoginPassword.trim()
      ? { shop_login_password: form.shopLoginPassword }
      : {}),
  };
}

function toForm(job: Job): JobForm {
  return {
    shopName: job.shopName,
    district: job.district,
    jobType: job.jobType,
    salary: job.salary,
    businessHours: job.businessHours ?? "",
    ageGroup: job.ageGroup ?? "",
    customerPersonalityLevel: job.customerPersonalityLevel
      ? String(job.customerPersonalityLevel)
      : "",
    customerAgeLevel: job.customerAgeLevel ? String(job.customerAgeLevel) : "",
    customerRegularLevel: job.customerRegularLevel
      ? String(job.customerRegularLevel)
      : "",
    benefits: getKnownBenefits(job.benefits),
    otherBenefits: [
      ...(job.otherBenefits ?? []),
      ...getUncategorizedBenefits(job.benefits),
    ].join("\n"),
    introductionText: job.introductionText ?? "",
    descriptionText: job.descriptionText ?? "",
    castVoices: getDisplayCastVoices(job).map((entry) => ({
      name: entry.name,
      age: entry.age,
      comment: entry.comment,
    })),
    imageUrl: job.imageUrl ?? "",
    storeImages: getDisplayStoreImages(job),
    phone: job.phone ?? "",
    address: job.address ?? "",
    access: job.access ?? "",
    xUrl: job.xUrl ?? "",
    instagramUrl: job.instagramUrl ?? "",
    tiktokUrl: job.tiktokUrl ?? "",
    youtubeUrl: job.youtubeUrl ?? "",
    websiteUrl: job.websiteUrl ?? "",
    lineUrl: job.lineUrl,
    shopLoginId: job.shopLoginId ?? "",
    shopLoginPassword: "",
  };
}

async function readJson<T>(response: Response): Promise<T> {
  const data = (await response.json()) as T & { message?: string };
  if (!response.ok) throw new Error(data.message ?? "通信に失敗しました。");
  return data;
}

export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [password, setPassword] = useState("");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [form, setForm] = useState<JobForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingStoreImages, setUploadingStoreImages] = useState(false);
  const [draftJobId, setDraftJobId] = useState(() => crypto.randomUUID());
  const storeImageInputRef = useRef<HTMLInputElement>(null);
  const [applicationDetails, setApplicationDetails] = useState<
    Record<string, JobApplicationDetail>
  >({});
  const [sortByApplications, setSortByApplications] = useState(false);
  const [shopSearchQuery, setShopSearchQuery] = useState("");
  const [regionFilter, setRegionFilter] = useState("all");
  const [applicationRows, setApplicationRows] = useState<ApplicationRow[]>([]);
  const [viewRows, setViewRows] = useState<ViewRow[]>([]);
  const [viewCounts, setViewCounts] = useState<Record<string, number>>({});
  const [expandedHistoryJobIds, setExpandedHistoryJobIds] = useState<
    Set<string>
  >(new Set());

  async function loadJobs() {
    const jobsResponse = await fetch("/api/jobs", {
      cache: "no-store",
      credentials: "include",
    });
    const jobsData = await readJson<{ jobs: Job[] }>(jobsResponse);
    setJobs(jobsData.jobs);

    const statsResponse = await fetch("/api/admin/application-stats", {
      cache: "no-store",
      credentials: "include",
    });
    if (statsResponse.ok) {
      const statsData = await readJson<{
        details?: Record<string, JobApplicationDetail>;
        stats?: Record<string, JobApplicationDetail>;
        applicationRows?: ApplicationRow[];
        viewRows?: ViewRow[];
        viewCounts?: Record<string, number>;
      }>(statsResponse);
      setApplicationDetails(statsData.details ?? statsData.stats ?? {});
      setApplicationRows(statsData.applicationRows ?? []);
      setViewRows(statsData.viewRows ?? []);
      setViewCounts(statsData.viewCounts ?? {});
      return;
    }

    setApplicationDetails({});
    setApplicationRows([]);
    setViewRows([]);
    setViewCounts({});
  }

  function toggleApplicationHistory(jobId: string) {
    setExpandedHistoryJobIds((current) => {
      const next = new Set(current);
      if (next.has(jobId)) next.delete(jobId);
      else next.add(jobId);
      return next;
    });
  }

  const hasActiveFilters =
    shopSearchQuery.trim().length > 0 || regionFilter !== "all";

  const jobsMatchingFilters = useMemo(
    () =>
      jobs.filter(
        (job) =>
          matchesShopSearch(job.shopName, shopSearchQuery) &&
          matchesRegionFilter(job, regionFilter),
      ),
    [jobs, regionFilter, shopSearchQuery],
  );

  const filteredJobIds = useMemo(
    () => new Set(jobsMatchingFilters.map((job) => job.id)),
    [jobsMatchingFilters],
  );

  const monthlyApplicationStats = useMemo(
    () => aggregateMonthlyApplications(applicationRows, filteredJobIds),
    [applicationRows, filteredJobIds],
  );

  const monthlyViewStats = useMemo(
    () => aggregateMonthlyViews(viewRows, filteredJobIds),
    [viewRows, filteredJobIds],
  );

  const resolvedViewCounts = useMemo(() => {
    const fromRows = aggregateViewCounts(viewRows);
    return { ...viewCounts, ...fromRows };
  }, [viewCounts, viewRows]);

  const chartFilterDescription = useMemo(() => {
    const parts: string[] = [];
    if (regionFilter !== "all") {
      parts.push(`地域: ${REGION_FILTER_OPTIONS.find((o) => o.value === regionFilter)?.label ?? regionFilter}`);
    }
    if (shopSearchQuery.trim()) {
      parts.push(`店舗名: ${shopSearchQuery.trim()}`);
    }
    if (parts.length === 0) return "全店舗の応募を表示中";
    return `${parts.join(" · ")} で絞り込み中`;
  }, [regionFilter, shopSearchQuery]);

  const displayedJobs = useMemo(() => {
    const list = [...jobsMatchingFilters];

    if (sortByApplications) {
      list.sort((a, b) => {
        const totalA = applicationDetails[a.id]?.total ?? 0;
        const totalB = applicationDetails[b.id]?.total ?? 0;
        if (totalB !== totalA) return totalB - totalA;
        return a.shopName.localeCompare(b.shopName, "ja");
      });
    }

    return list;
  }, [applicationDetails, jobsMatchingFilters, sortByApplications]);

  useEffect(() => {
    fetch("/api/admin/session", { cache: "no-store" })
      .then((response) => response.json())
      .then((data: { authenticated: boolean }) => {
        setAuthenticated(data.authenticated);
        if (data.authenticated) return loadJobs();
      })
      .catch(() => setAuthenticated(false))
      .finally(() => setCheckingSession(false));
  }, []);

  function setField<K extends keyof JobForm>(key: K, value: JobForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function toggleBenefit(benefit: string) {
    setForm((current) => ({
      ...current,
      benefits: current.benefits.includes(benefit)
        ? current.benefits.filter((item) => item !== benefit)
        : [...current.benefits, benefit],
    }));
  }

  function addCastVoice() {
    setForm((current) => ({
      ...current,
      castVoices: [...current.castVoices, emptyCastVoiceEntry()],
    }));
  }

  function removeCastVoice(index: number) {
    setForm((current) => ({
      ...current,
      castVoices: current.castVoices.filter((_, itemIndex) => itemIndex !== index),
    }));
  }

  function updateCastVoice(
    index: number,
    key: keyof CastVoiceEntry,
    value: string,
  ) {
    setForm((current) => ({
      ...current,
      castVoices: current.castVoices.map((entry, itemIndex) =>
        itemIndex === index ? { ...entry, [key]: value } : entry,
      ),
    }));
  }

  function removeStoreImage(index: number) {
    setForm((current) => ({
      ...current,
      storeImages: current.storeImages.filter((_, itemIndex) => itemIndex !== index),
    }));
  }

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
    setIsAddFormOpen(false);
    setDraftJobId(crypto.randomUUID());
  }

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      await readJson<{ ok: boolean }>(
        await fetch("/api/admin/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password }),
        }),
      );
      setAuthenticated(true);
      setPassword("");
      await loadJobs();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "ログインに失敗しました。");
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    setAuthenticated(false);
    setJobs([]);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      const url = editingId ? `/api/jobs/${editingId}` : "/api/jobs";
      const method = editingId ? "PUT" : "POST";
      const payload = toPayload(form);
      const { job: savedJob } = await readJson<{ job: Job }>(
        await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        }),
      );
      const savedStoreImageCount = getDisplayStoreImages(savedJob).length;
      const storeImageNote =
        savedStoreImageCount > 0
          ? `（店内画像 ${savedStoreImageCount}枚）`
          : payload.storeImages && payload.storeImages.length > 0
            ? "（店内画像の保存に失敗した可能性があります。Supabaseの store_images カラムを確認してください）"
            : "";
      const shopLoginNote = savedJob.shopLoginId
        ? `（店舗ログインID: ${savedJob.shopLoginId}）`
        : "";
      setMessage(
        editingId
          ? `求人を更新しました。${storeImageNote}${shopLoginNote}`
          : `求人を追加しました。${storeImageNote}${shopLoginNote}`,
      );
      await loadJobs();
      window.dispatchEvent(new Event(JOBS_UPDATED_EVENT));
      if (editingId) {
        setEditingId(savedJob.id);
        setForm(toForm(savedJob));
        setIsAddFormOpen(false);
      } else {
        resetForm();
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "保存に失敗しました。");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(job: Job) {
    if (!window.confirm(`「${job.shopName}」を削除しますか？`)) return;
    setLoading(true);
    setMessage("");
    try {
      await readJson<{ ok: boolean }>(
        await fetch(`/api/jobs/${job.id}`, { method: "DELETE" }),
      );
      if (editingId === job.id) resetForm();
      setMessage("求人を削除しました。");
      await loadJobs();
      window.dispatchEvent(new Event(JOBS_UPDATED_EVENT));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "削除に失敗しました。");
    } finally {
      setLoading(false);
    }
  }

  async function handleImageUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setMessage("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const data = await readJson<{ imageUrl: string }>(
        await fetch("/api/upload", {
          method: "POST",
          credentials: "include",
          body: formData,
        }),
      );
      setField("imageUrl", data.imageUrl);
      setMessage("店舗写真をアップロードしました。");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "画像アップロードに失敗しました。",
      );
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  async function handleStoreImagesUpload(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploadingStoreImages(true);
    setMessage("");
    const ownerJobId = editingId ?? draftJobId;

    try {
      const uploadedUrls: string[] = [];
      const failedFiles: string[] = [];

      for (const file of Array.from(files)) {
        try {
          const formData = new FormData();
          formData.append("file", file);
          formData.append("uploadType", "store-image");
          formData.append("jobId", ownerJobId);

          const data = await readJson<{ imageUrl?: string; publicUrl?: string }>(
            await fetch("/api/upload", {
              method: "POST",
              credentials: "include",
              body: formData,
            }),
          );
          const imageUrl = (data.imageUrl ?? data.publicUrl ?? "").trim();
          if (!imageUrl) {
            throw new Error("公開URLの取得に失敗しました。");
          }
          uploadedUrls.push(imageUrl);
        } catch (error) {
          failedFiles.push(
            `${file.name}: ${
              error instanceof Error ? error.message : "アップロード失敗"
            }`,
          );
        }
      }

      if (uploadedUrls.length > 0) {
        setForm((current) => ({
          ...current,
          storeImages: sanitizeStoreImagesForSave([
            ...current.storeImages,
            ...uploadedUrls,
          ]),
        }));
      }

      if (uploadedUrls.length > 0 && failedFiles.length === 0) {
        setMessage(`${uploadedUrls.length}枚の店内画像をアップロードしました。`);
      } else if (uploadedUrls.length > 0) {
        setMessage(
          `${uploadedUrls.length}枚をアップロードしました。失敗: ${failedFiles.join(" / ")}`,
        );
      } else {
        setMessage(
          failedFiles.join(" / ") ||
            "店内画像のアップロードに失敗しました。",
        );
      }
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "店内画像のアップロードに失敗しました。",
      );
    } finally {
      setUploadingStoreImages(false);
      event.target.value = "";
    }
  }

  function handleEdit(job: Job) {
    setEditingId(job.id);
    setForm(toForm(job));
    setIsAddFormOpen(false);
    setMessage("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const isFormVisible = editingId !== null || isAddFormOpen;

  if (checkingSession) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16">
        <div className="h-40 animate-pulse rounded-2xl bg-white" />
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="mx-auto max-w-md px-4 py-16">
        <form
          onSubmit={handleLogin}
          className="space-y-4 rounded-2xl border border-gold/25 bg-white p-6 shadow-gold"
        >
          <div>
            <h1 className="font-serif text-2xl font-semibold text-charcoal">
              管理画面ログイン
            </h1>
            <p className="mt-1 text-sm text-muted">
              .env.local の ADMIN_PASSWORD を入力してください。
            </p>
          </div>
          {message && <p className="text-sm text-red-600">{message}</p>}
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className={inputClass}
            placeholder="管理パスワード"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-gradient-to-r from-gold to-gold-dark px-6 py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            {loading ? "確認中..." : "ログイン"}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-charcoal sm:text-3xl">
            求人管理
          </h1>
          <p className="mt-1 text-sm text-muted">
            求人情報と店舗写真はSupabaseに保存されます。
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/"
            className="rounded-full border border-gold/40 px-4 py-2 text-sm font-medium text-gold-dark hover:bg-ivory"
          >
            サイトを見る
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-full border border-gold/40 px-4 py-2 text-sm font-medium text-muted hover:text-charcoal"
          >
            ログアウト
          </button>
        </div>
      </div>

      {message && (
        <p className="mb-4 rounded-xl border border-gold/30 bg-gold-light/20 px-4 py-3 text-sm text-charcoal">
          {message}
        </p>
      )}

      <section className="rounded-2xl border border-gold/25 bg-white p-5 shadow-gold sm:p-6">
        {!editingId && (
          <button
            type="button"
            onClick={() => setIsAddFormOpen((open) => !open)}
            aria-expanded={isAddFormOpen}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-gold/35 bg-ivory/50 px-4 py-3 text-sm font-semibold text-gold-dark transition hover:bg-ivory"
          >
            {isAddFormOpen ? "− 求人追加フォームを閉じる" : "＋ 求人を追加"}
          </button>
        )}

        {isFormVisible && (
          <form
            onSubmit={handleSubmit}
            className={`space-y-4 ${editingId ? "" : "mt-4"}`}
          >
            {editingId && (
              <h2 className="text-lg font-semibold text-charcoal">求人を編集</h2>
            )}

        <div>
          <label htmlFor="shopName" className={labelClass}>
            店名
          </label>
          <input
            id="shopName"
            value={form.shopName}
            onChange={(event) => setField("shopName", event.target.value)}
            className={inputClass}
            placeholder="例：ニュークラブ ロゼッタ"
            required
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>エリア</label>
            <select
              value={form.district}
              onChange={(event) => setField("district", event.target.value as District)}
              className={inputClass}
            >
              {DISTRICTS.map((district) => (
                <option key={district} value={district}>
                  {FIXED_AREA} / {district}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClass}>業種</label>
            <select
              value={form.jobType}
              onChange={(event) => setField("jobType", event.target.value as JobType)}
              className={inputClass}
            >
              {JOB_TYPES.map((jobType) => (
                <option key={jobType} value={jobType}>
                  {jobType}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="salary" className={labelClass}>
            時給
          </label>
          <input
            id="salary"
            value={form.salary}
            onChange={(event) => setField("salary", event.target.value)}
            className={inputClass}
            placeholder="例：時給 4,000円〜"
            required
          />
        </div>

        <div>
          <label htmlFor="businessHours" className={labelClass}>
            営業時間
          </label>
          <input
            id="businessHours"
            value={form.businessHours}
            onChange={(event) => setField("businessHours", event.target.value)}
            className={inputClass}
            placeholder="例：20:00〜LAST"
          />
        </div>

        <div>
          <label htmlFor="access" className={labelClass}>
            アクセス
          </label>
          <input
            id="access"
            value={form.access}
            onChange={(event) => setField("access", event.target.value)}
            className={inputClass}
            placeholder="例：すすきの駅から徒歩3分"
          />
        </div>

        <div>
          <label htmlFor="ageGroup" className={labelClass}>
            キャスト年齢
          </label>
          <input
            id="ageGroup"
            value={form.ageGroup}
            onChange={(event) => setField("ageGroup", event.target.value)}
            className={inputClass}
            placeholder="例：キャスト年齢 20代前半〜30代前半"
          />
        </div>

        <div className="space-y-4 rounded-2xl border border-gold/20 bg-ivory p-4">
          <div>
            <p className="text-sm font-semibold text-gold-dark">お店の基本情報</p>
            <p className="mt-1 text-xs text-muted">
              1〜5で選択してください。未設定の項目は表示されません。
            </p>
          </div>
          <div>
            <label htmlFor="customerPersonalityLevel" className={labelClass}>
              お店の雰囲気
            </label>
            <select
              id="customerPersonalityLevel"
              value={form.customerPersonalityLevel}
              onChange={(event) =>
                setField("customerPersonalityLevel", event.target.value)
              }
              className={inputClass}
            >
              {levelOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-muted">1: にぎやか / 5: 落ち着いている</p>
          </div>
          <div>
            <label htmlFor="customerAgeLevel" className={labelClass}>
              お客様の年齢層
            </label>
            <select
              id="customerAgeLevel"
              value={form.customerAgeLevel}
              onChange={(event) => setField("customerAgeLevel", event.target.value)}
              className={inputClass}
            >
              {levelOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-muted">1: 若い / 5: 年配</p>
          </div>
          <div>
            <label htmlFor="customerRegularLevel" className={labelClass}>
              来店傾向
            </label>
            <select
              id="customerRegularLevel"
              value={form.customerRegularLevel}
              onChange={(event) =>
                setField("customerRegularLevel", event.target.value)
              }
              className={inputClass}
            >
              {levelOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-muted">1: 新規 / 5: 常連</p>
          </div>
        </div>

        <div>
          <p className={labelClass}>待遇</p>
          <div className="space-y-4 rounded-2xl border border-gold/20 bg-ivory p-4">
            {BENEFIT_CATEGORIES.map((category) => (
              <div key={category.title}>
                <p className="mb-2 text-sm font-semibold text-gold-dark">
                  {category.title}
                </p>
                <div className="flex flex-wrap gap-2">
                  {category.items.map((benefit) => {
                    const selected = form.benefits.includes(benefit);
                    return (
                      <button
                        key={benefit}
                        type="button"
                        onClick={() => toggleBenefit(benefit)}
                        className={`rounded-full border px-4 py-2.5 text-sm font-medium transition-all ${
                          selected
                            ? "border-gold bg-gradient-to-r from-gold to-gold-dark text-white shadow-md"
                            : "border-gold/30 bg-white text-muted hover:border-gold hover:text-gold-dark"
                        }`}
                      >
                        {benefit}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
            <div>
              <label
                htmlFor="otherBenefits"
                className="mb-2 block text-sm font-semibold text-gold-dark"
              >
                その他
              </label>
              <textarea
                id="otherBenefits"
                value={form.otherBenefits}
                onChange={(event) => setField("otherBenefits", event.target.value)}
                className={inputClass}
                rows={4}
                placeholder={"完全自由シフト\n顔出しNG対応\n待機カットなし"}
              />
              <p className="mt-1 text-xs text-muted">
                1行に1つ、または「、」で区切って自由に入力できます。
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label htmlFor="introductionText" className={labelClass}>
              紹介文
            </label>
            <textarea
              id="introductionText"
              value={form.introductionText}
              onChange={(event) =>
                setField("introductionText", event.target.value)
              }
              className={inputClass}
              rows={3}
              placeholder="求人一覧・詳細ページの店名下に表示される短い紹介文"
            />
            <p className="mt-1 text-xs text-muted">
              2〜3行程度の短い文章を入力してください。
            </p>
          </div>

          <div>
            <label htmlFor="descriptionText" className={labelClass}>
              説明文
            </label>
            <textarea
              id="descriptionText"
              value={form.descriptionText}
              onChange={(event) =>
                setField("descriptionText", event.target.value)
              }
              className={inputClass}
              rows={10}
              placeholder="求人詳細ページの「その他待遇」の下に表示される詳しい説明文"
            />
            <p className="mt-1 text-xs text-muted">
              お店の雰囲気や仕事内容など、詳しく記載できます。
            </p>
          </div>

          <div className="rounded-2xl border border-gold/20 bg-ivory/40 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className={labelClass}>入店・在籍キャストの声</p>
              <button
                type="button"
                onClick={addCastVoice}
                className="rounded-full border border-gold/40 bg-white px-4 py-2 text-sm font-medium text-gold-dark transition hover:bg-ivory"
              >
                キャストの声を追加
              </button>
            </div>
            <p className="mb-3 text-xs text-muted">
              名前・年齢・コメントを入力してください。すべて空の行は保存されません。
            </p>
            {form.castVoices.length === 0 ? (
              <p className="rounded-xl border border-dashed border-gold/25 bg-white px-3 py-4 text-center text-sm text-muted">
                「キャストの声を追加」から登録できます
              </p>
            ) : (
              <ul className="space-y-4">
                {form.castVoices.map((entry, index) => (
                  <li
                    key={`cast-voice-${index}`}
                    className="rounded-xl border border-gold/25 bg-white p-4 shadow-gold"
                  >
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-charcoal">
                        キャスト {index + 1}
                      </p>
                      <button
                        type="button"
                        onClick={() => removeCastVoice(index)}
                        className="rounded-full border border-charcoal/20 px-3 py-1 text-xs font-medium text-muted transition hover:border-charcoal/40 hover:text-charcoal"
                      >
                        削除
                      </button>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <label
                          htmlFor={`cast-name-${index}`}
                          className={labelClass}
                        >
                          名前
                        </label>
                        <input
                          id={`cast-name-${index}`}
                          type="text"
                          value={entry.name}
                          onChange={(event) =>
                            updateCastVoice(index, "name", event.target.value)
                          }
                          className={inputClass}
                          placeholder="例: りな"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor={`cast-age-${index}`}
                          className={labelClass}
                        >
                          年齢
                        </label>
                        <input
                          id={`cast-age-${index}`}
                          type="text"
                          inputMode="numeric"
                          value={entry.age}
                          onChange={(event) =>
                            updateCastVoice(index, "age", event.target.value)
                          }
                          className={inputClass}
                          placeholder="例: 22"
                        />
                      </div>
                    </div>
                    <div className="mt-3">
                      <label
                        htmlFor={`cast-comment-${index}`}
                        className={labelClass}
                      >
                        コメント
                      </label>
                      <textarea
                        id={`cast-comment-${index}`}
                        value={entry.comment}
                        onChange={(event) =>
                          updateCastVoice(index, "comment", event.target.value)
                        }
                        className={inputClass}
                        rows={5}
                        placeholder="例: 未経験で不安でしたが、スタッフさんが優しく教えてくれて安心して働けました。"
                      />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div>
          <label htmlFor="imageFile" className={labelClass}>
            店舗写真アップロード
          </label>
          <input
            id="imageFile"
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className={inputClass}
          />
          {uploading && <p className="mt-1 text-xs text-muted">アップロード中...</p>}
          {form.imageUrl && (
            <img
              src={form.imageUrl}
              alt="アップロード済み店舗写真"
              className="mt-3 h-40 w-full rounded-xl object-cover"
            />
          )}
        </div>

        <div className="rounded-2xl border border-gold/20 bg-ivory/40 p-4">
          <p className={labelClass}>店内画像</p>
          <p className="mb-3 text-xs text-muted">
            求人詳細の「公式SNS」の上に表示されます。JPG / PNG / WebP
            に対応しています。
          </p>
          <input
            ref={storeImageInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
            multiple
            className="hidden"
            onChange={handleStoreImagesUpload}
          />
          <button
            type="button"
            onClick={() => storeImageInputRef.current?.click()}
            disabled={uploadingStoreImages}
            className="rounded-full border border-gold/40 bg-white px-4 py-2 text-sm font-medium text-gold-dark transition hover:bg-ivory disabled:opacity-60"
          >
            {uploadingStoreImages ? "アップロード中..." : "写真を選択"}
          </button>
          {uploadingStoreImages && (
            <p className="mt-2 text-xs text-muted">アップロード中...</p>
          )}
          {form.storeImages.length === 0 ? (
            <p className="mt-3 rounded-xl border border-dashed border-gold/25 bg-white px-3 py-4 text-center text-sm text-muted">
              「写真を選択」から店内画像を追加できます
            </p>
          ) : (
            <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {form.storeImages.map((imageUrl, index) => (
                <li
                  key={`${imageUrl}-${index}`}
                  className="overflow-hidden rounded-xl border border-gold/25 bg-white shadow-gold"
                >
                  <img
                    src={imageUrl}
                    alt={`店内画像プレビュー ${index + 1}`}
                    className="aspect-[4/3] w-full object-cover"
                  />
                  <div className="flex items-center justify-between gap-2 px-2 py-2">
                    <p className="text-xs font-medium text-muted">
                      画像 {index + 1}
                    </p>
                    <button
                      type="button"
                      onClick={() => removeStoreImage(index)}
                      disabled={uploadingStoreImages}
                      className="rounded-full border border-charcoal/20 px-2.5 py-1 text-xs font-medium text-muted transition hover:border-charcoal/40 hover:text-charcoal disabled:opacity-60"
                    >
                      削除
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <label htmlFor="lineUrl" className={labelClass}>
            LINE URL
          </label>
          <input
            id="lineUrl"
            type="url"
            value={form.lineUrl}
            onChange={(event) => setField("lineUrl", event.target.value)}
            className={inputClass}
            placeholder="https://line.me/R/ti/p/@xxxx"
            required
          />
        </div>

        <div className="space-y-4 rounded-2xl border border-gold/20 bg-ivory p-4">
          <div>
            <p className="text-sm font-semibold text-gold-dark">SNSリンク</p>
            <p className="mt-1 text-xs text-muted">
              入力したSNSだけ求人詳細ページに表示されます。
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="xUrl" className={labelClass}>
                Xリンク
              </label>
              <input
                id="xUrl"
                type="url"
                value={form.xUrl}
                onChange={(event) => setField("xUrl", event.target.value)}
                className={inputClass}
                placeholder="https://x.com/xxxx"
              />
            </div>
            <div>
              <label htmlFor="instagramUrl" className={labelClass}>
                Instagramリンク
              </label>
              <input
                id="instagramUrl"
                type="url"
                value={form.instagramUrl}
                onChange={(event) => setField("instagramUrl", event.target.value)}
                className={inputClass}
                placeholder="https://www.instagram.com/xxxx"
              />
            </div>
            <div>
              <label htmlFor="tiktokUrl" className={labelClass}>
                TikTokリンク
              </label>
              <input
                id="tiktokUrl"
                type="url"
                value={form.tiktokUrl}
                onChange={(event) => setField("tiktokUrl", event.target.value)}
                className={inputClass}
                placeholder="https://www.tiktok.com/@xxxx"
              />
            </div>
            <div>
              <label htmlFor="youtubeUrl" className={labelClass}>
                YouTubeリンク
              </label>
              <input
                id="youtubeUrl"
                type="url"
                value={form.youtubeUrl}
                onChange={(event) => setField("youtubeUrl", event.target.value)}
                className={inputClass}
                placeholder="https://www.youtube.com/@xxxx"
              />
            </div>
            <div>
              <label htmlFor="websiteUrl" className={labelClass}>
                WebサイトURL
              </label>
              <input
                id="websiteUrl"
                type="url"
                value={form.websiteUrl}
                onChange={(event) => setField("websiteUrl", event.target.value)}
                className={inputClass}
                placeholder="https://example.com"
              />
            </div>
          </div>
        </div>

        <div>
          <label htmlFor="phone" className={labelClass}>
            電話番号
          </label>
          <input
            id="phone"
            type="tel"
            value={form.phone}
            onChange={(event) => setField("phone", event.target.value)}
            className={inputClass}
            placeholder="011-000-0000"
          />
          <p className="mt-1 text-xs text-muted">
            入力した場合のみ、求人詳細ページに電話応募ボタンが表示されます。
          </p>
        </div>

        <div className="space-y-4 rounded-2xl border border-gold/20 bg-ivory p-4">
          <div>
            <p className="text-sm font-semibold text-gold-dark">店舗ログイン情報</p>
            <p className="mt-1 text-xs text-muted">
              店舗担当者が /shop-login からログインするためのIDとPWです。
              パスワードは平文保存の簡易実装です（将来ハッシュ化推奨）。
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="shopLoginId" className={labelClass}>
                店舗ログインID
              </label>
              <input
                id="shopLoginId"
                type="text"
                value={form.shopLoginId}
                onChange={(event) =>
                  setField("shopLoginId", event.target.value)
                }
                className={inputClass}
                placeholder="例: rosetta-shop"
                autoComplete="off"
              />
            </div>
            <div>
              <label htmlFor="shopLoginPassword" className={labelClass}>
                店舗ログインPW
              </label>
              <input
                id="shopLoginPassword"
                type="password"
                value={form.shopLoginPassword}
                onChange={(event) =>
                  setField("shopLoginPassword", event.target.value)
                }
                className={inputClass}
                placeholder={editingId ? "変更時のみ入力" : "初期パスワード"}
                autoComplete="new-password"
              />
              {editingId && (
                <p className="mt-1 text-xs text-muted">
                  空欄のまま保存すると、現在のパスワードを維持します。
                </p>
              )}
            </div>
          </div>
        </div>

        <div>
          <label htmlFor="address" className={labelClass}>
            住所
          </label>
          <input
            id="address"
            value={form.address}
            onChange={(event) => setField("address", event.target.value)}
            className={inputClass}
            placeholder="例：北海道札幌市中央区南○条西○丁目"
          />
        </div>

        <div className="flex flex-wrap gap-3 pt-2">
          <button
            type="submit"
            disabled={loading || uploading || uploadingStoreImages}
            className="rounded-full bg-gradient-to-r from-gold to-gold-dark px-6 py-3 text-sm font-semibold text-white shadow-md disabled:opacity-60"
          >
            {loading ? "保存中..." : editingId ? "更新する" : "保存する"}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="rounded-full border border-gold/40 px-6 py-3 text-sm font-medium text-muted hover:text-charcoal"
            >
              キャンセル
            </button>
          )}
        </div>
          </form>
        )}
      </section>

      <section className="mt-8">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-charcoal">
            求人一覧
            {hasActiveFilters ? (
              <span className="ml-1 text-base font-normal text-muted">
                （{displayedJobs.length}件 / 全{jobs.length}件）
              </span>
            ) : (
              <span className="ml-1 text-base font-normal text-muted">
                （{jobs.length}件）
              </span>
            )}
          </h2>
          <button
            type="button"
            onClick={() => setSortByApplications((current) => !current)}
            className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
              sortByApplications
                ? "border-gold bg-gold-light/30 text-gold-dark"
                : "border-gold/40 text-muted hover:text-charcoal"
            }`}
          >
            {sortByApplications ? "合計応募数順 ✓" : "合計応募数順で並べ替え"}
          </button>
        </div>

        <div className="mb-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="region-filter" className={labelClass}>
              地域で絞り込み
            </label>
            <select
              id="region-filter"
              value={regionFilter}
              onChange={(event) => setRegionFilter(event.target.value)}
              className={inputClass}
            >
              {REGION_FILTER_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-muted">
              エリア（{FIXED_AREA}）または地区で絞り込みます。
            </p>
          </div>
          <div>
            <label htmlFor="shop-search" className={labelClass}>
              店舗名で検索
            </label>
            <input
              id="shop-search"
              type="search"
              value={shopSearchQuery}
              onChange={(event) => setShopSearchQuery(event.target.value)}
              placeholder="例：ロゼッタ、ろぜったあ、ROSETTA"
              className={inputClass}
            />
            <p className="mt-1 text-xs text-muted">
              ひらがな・カタカナ・英字に対応した部分一致で絞り込みます。
            </p>
          </div>
        </div>

        <div className="mb-4">
          <MonthlyViewChart
            data={monthlyViewStats}
            filterDescription={chartFilterDescription}
          />
        </div>

        <div className="mb-4">
          <MonthlyApplicationChart
            data={monthlyApplicationStats}
            filterDescription={chartFilterDescription}
          />
        </div>

        <section className="mb-4 rounded-2xl border border-gold/25 bg-gradient-to-br from-ivory/80 to-white p-4 shadow-gold sm:p-5">
          <h3 className="text-base font-semibold text-charcoal">
            店舗別 月別グラフ
          </h3>
          <p className="mt-1 text-xs text-muted">
            各店舗カードで直近12ヶ月の表示回数・応募数の推移を確認できます（日本時間）
          </p>
          {hasActiveFilters && (
            <p className="mt-3 text-xs font-medium text-gold-dark">
              {chartFilterDescription}
            </p>
          )}
        </section>

        {displayedJobs.length === 0 ? (
          <div className="rounded-2xl border border-gold/20 bg-white px-4 py-10 text-center text-sm text-muted">
            {hasActiveFilters
              ? "検索・絞り込み条件に一致する店舗がありません。"
              : "掲載中の求人がありません。"}
          </div>
        ) : (
          <ul className="space-y-3">
            {displayedJobs.map((job) => {
              const detail =
                applicationDetails[job.id] ?? emptyApplicationDetail();
              const historyOpen = expandedHistoryJobIds.has(job.id);
              const monthlyViewStatsForJob = aggregateMonthlyViewsForJob(
                viewRows,
                job.id,
              );
              const monthlyApplicationStatsForJob =
                aggregateMonthlyApplicationsForJob(applicationRows, job.id);
              const viewCount = resolvedViewCounts[job.id] ?? 0;

              return (
                <li
                  key={job.id}
                  className="rounded-2xl border border-gold/20 bg-white p-4 shadow-gold sm:p-5"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-gold-dark">
                        {formatLocation(job)} · {job.jobType}
                      </p>
                      <p className="mt-1 text-lg font-semibold text-charcoal">
                        {job.shopName}
                      </p>
                      <p className="mt-0.5 text-sm text-muted">{job.salary}</p>
                      <p className="mt-0.5 text-xs text-muted">
                        写真: {job.imageUrl ? "設定済み" : "未設定"}
                      </p>

                      <dl className="mt-3 space-y-1 rounded-xl border border-gold/15 bg-ivory/40 px-3 py-3 text-sm">
                        <div className="flex flex-wrap gap-x-2">
                          <dt className="font-medium text-muted">LINE応募数:</dt>
                          <dd className="font-semibold text-[#047a3b]">
                            {detail.line}
                          </dd>
                        </div>
                        <div className="flex flex-wrap gap-x-2">
                          <dt className="font-medium text-muted">電話応募数:</dt>
                          <dd className="font-semibold text-gold-dark">
                            {detail.phone}
                          </dd>
                        </div>
                        <div className="flex flex-wrap gap-x-2">
                          <dt className="font-medium text-muted">合計応募数:</dt>
                          <dd className="font-semibold text-charcoal">
                            {detail.total}
                          </dd>
                        </div>
                        <div className="flex flex-wrap gap-x-2">
                          <dt className="font-medium text-muted">表示回数:</dt>
                          <dd className="font-semibold text-charcoal">
                            {viewCount}
                          </dd>
                        </div>
                        <div className="flex flex-wrap gap-x-2">
                          <dt className="font-medium text-muted">最新応募日:</dt>
                          <dd className="font-medium text-charcoal">
                            {detail.latestAt
                              ? formatApplicationDateTime(detail.latestAt)
                              : "応募なし"}
                          </dd>
                        </div>
                      </dl>

                      <div className="mt-3 rounded-xl border border-gold/15 bg-white px-3 py-3">
                        <MonthlyViewChart
                          data={monthlyViewStatsForJob}
                          title="月別表示回数（折れ線）"
                          compact
                        />
                      </div>

                      <div className="mt-3 rounded-xl border border-gold/15 bg-white px-3 py-3">
                        <MonthlyApplicationChart
                          data={monthlyApplicationStatsForJob}
                          compact
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => toggleApplicationHistory(job.id)}
                        className="mt-3 rounded-full border border-gold/35 px-4 py-2 text-sm font-medium text-gold-dark transition hover:bg-ivory"
                      >
                        {historyOpen ? "応募履歴を閉じる" : "応募履歴を見る"}
                      </button>

                      {historyOpen && (
                        <div className="mt-3 rounded-xl border border-gold/20 bg-white px-3 py-3">
                          <p className="text-xs font-semibold text-gold-dark">
                            応募履歴
                          </p>
                          {detail.history.length === 0 ? (
                            <p className="mt-2 text-sm text-muted">応募なし</p>
                          ) : (
                            <ul className="mt-2 space-y-2">
                              {detail.history.map((entry, index) => (
                                <li
                                  key={`${entry.createdAt}-${entry.type}-${index}`}
                                  className="rounded-lg border border-gold/15 bg-ivory/50 px-3 py-2 text-sm text-charcoal"
                                >
                                  <p className="font-medium">{job.shopName}</p>
                                  <p className="mt-0.5 text-muted">
                                    {formatApplicationDateTime(entry.createdAt)}
                                  </p>
                                  <p className="mt-0.5 font-medium text-gold-dark">
                                    {getApplicationTypeLabel(entry.type)}
                                  </p>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex shrink-0 gap-2 lg:flex-col lg:items-end">
                      <button
                        type="button"
                        onClick={() => handleEdit(job)}
                        className="rounded-full border border-gold/40 px-4 py-2 text-sm font-medium text-gold-dark hover:bg-ivory"
                      >
                        編集
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(job)}
                        disabled={loading}
                        className="rounded-full border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-60"
                      >
                        削除
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
