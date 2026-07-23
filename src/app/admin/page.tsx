"use client";

import Link from "next/link";
import { LineBroadcastPanel } from "@/components/admin/LineBroadcastPanel";
import { LineNotificationHistoryPanel } from "@/components/admin/LineNotificationHistoryPanel";
import { JobListingPreview } from "@/components/JobListingPreview";
import { useEffect, useRef, useState } from "react";
import { useScrollToTopAfterChange } from "@/hooks/useScrollToTopAfterChange";
import {
  BENEFIT_CATEGORIES,
  getKnownBenefits,
  getUncategorizedBenefits,
} from "@/data/benefits";
import { DISTRICTS } from "@/data/districts";
import {
  emptyApplicationDetail,
  formatApplicationDateTime,
  getApplicationTypeLabel,
  REGION_FILTER_OPTIONS,
  type JobApplicationDetail,
} from "@/lib/job-applications";
import { formatLocation, JOBS_UPDATED_EVENT } from "@/lib/job-storage";
import type { BroadcastJobOption } from "@/components/admin/LineBroadcastPanel";
import {
  getDisplayCastVoices,
  getDisplayStoreImages,
  parseBenefits,
  sanitizeCastVoicesForSave,
  sanitizeStoreImagesForSave,
} from "@/lib/job-db";
import { buildPreviewJobFromAdminForm } from "@/lib/job-preview";
import {
  promoteTempImagesInPayload,
  uploadTempImage,
} from "@/lib/upload-temp-client";
import {
  FIXED_AREA,
  JOB_TYPES,
  type CastVoiceEntry,
  type District,
  type Job,
  type JobType,
} from "@/types/job";
import {
  formatNewListingEndDate,
  getNewListingDays,
  toOpenDateInputValue,
  toPostedAtDateInputValue,
} from "@/lib/job-listing";
import {
  getEnabledFeatureLabels,
  getPlanFeatures,
  JOB_PLAN_DEFINITIONS,
  JOB_PLANS,
  parseJobPlan,
  planToFormPatch,
  type JobPlan,
} from "@/lib/job-plan";

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
  recruiterName: string;
  recruiterTitle: string;
  recruiterImage: string;
  recruiterMessage: string;
  managerComment: string;
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
  plan: JobPlan;
  postedAt: string;
  openDate: string;
  newListingEnabled: boolean;
  lineRecommendNotify: boolean;
  chatRecommendEnabled: boolean;
  chatRecommendPriority: string;
  pickupEnabled: boolean;
  listingPriority: "normal" | "priority" | "top";
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
  recruiterName: "",
  recruiterTitle: "",
  recruiterImage: "",
  recruiterMessage: "",
  managerComment: "",
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
  ...planToFormPatch("light"),
  postedAt: toPostedAtDateInputValue(),
  openDate: "",
};

const inputClass =
  "w-full rounded-xl border border-gold/30 bg-ivory px-4 py-3 text-base outline-none focus:border-gold focus:ring-2 focus:ring-gold/20";

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
    recruiterName: form.recruiterName || undefined,
    recruiterTitle: form.recruiterTitle || undefined,
    recruiterImage: form.recruiterImage || undefined,
    recruiterMessage: form.recruiterMessage || undefined,
    managerComment: form.managerComment || undefined,
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
    chat_recommend_enabled: form.chatRecommendEnabled,
    chat_recommend_priority: Number(form.chatRecommendPriority) || 0,
    pickup_enabled: form.pickupEnabled,
    listing_priority: form.listingPriority,
    plan: form.plan,
    posted_at: form.postedAt,
    open_date: form.openDate.trim() || null,
    line_recommend_notify: form.lineRecommendNotify,
    new_listing_enabled: form.newListingEnabled,
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
    recruiterName: job.recruiterName ?? "",
    recruiterTitle: job.recruiterTitle ?? "",
    recruiterImage: job.recruiterImage ?? "",
    recruiterMessage: job.recruiterMessage ?? "",
    managerComment: job.managerComment ?? "",
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
    shopLoginPassword: job.shopLoginPassword ?? "",
    plan: parseJobPlan(job.plan),
    postedAt: toPostedAtDateInputValue(job.postedAt),
    openDate: toOpenDateInputValue(job.openDate),
    newListingEnabled: job.newListingEnabled ?? true,
    lineRecommendNotify: job.lineRecommendNotify ?? false,
    chatRecommendEnabled: job.chatRecommend?.enabled ?? true,
    chatRecommendPriority: String(job.chatRecommend?.priority ?? 0),
    pickupEnabled: job.pickupEnabled ?? false,
    listingPriority:
      job.listingPriority === "priority" || job.listingPriority === "top"
        ? job.listingPriority
        : "normal",
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
  const [broadcastJobs, setBroadcastJobs] = useState<BroadcastJobOption[]>([]);
  const [form, setForm] = useState<JobForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingStoreImages, setUploadingStoreImages] = useState(false);
  const [uploadingRecruiterImage, setUploadingRecruiterImage] = useState(false);
  const [draftJobId, setDraftJobId] = useState(() => crypto.randomUUID());
  const storeImageInputRef = useRef<HTMLInputElement>(null);
  const recruiterImageInputRef = useRef<HTMLInputElement>(null);
  const [applicationDetails, setApplicationDetails] = useState<
    Record<string, JobApplicationDetail>
  >({});
  const [shopSearchQuery, setShopSearchQuery] = useState("");
  const [regionFilter, setRegionFilter] = useState("all");
  const [viewCounts, setViewCounts] = useState<Record<string, number>>({});
  const [expandedHistoryJobIds, setExpandedHistoryJobIds] = useState<
    Set<string>
  >(new Set());
  const [isShopSearchOpen, setIsShopSearchOpen] = useState(false);
  const [isBroadcastOpen, setIsBroadcastOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historyMounted, setHistoryMounted] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const publishLockRef = useRef(false);
  const requestScrollToTop = useScrollToTopAfterChange([showPreview]);
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchPage, setSearchPage] = useState(1);
  const [searchTotal, setSearchTotal] = useState(0);
  const [searchHasMore, setSearchHasMore] = useState(false);
  const SEARCH_LIMIT = 20;
  const [monthlySummary, setMonthlySummary] = useState<{
    periodLabel: string;
    previousPeriodLabel: string;
    publishedJobCount: number;
    views: { current: number; previous: number; changePercent: number | null };
    applications: {
      current: number;
      previous: number;
      changePercent: number | null;
    };
  } | null>(null);
  const [monthlySummaryLoading, setMonthlySummaryLoading] = useState(true);
  const [broadcastMounted, setBroadcastMounted] = useState(false);

  async function loadMonthlySummary() {
    setMonthlySummaryLoading(true);
    console.time("admin:monthly-summary");
    try {
      const data = await readJson<{
        periodLabel: string;
        previousPeriodLabel: string;
        publishedJobCount: number;
        views: { current: number; previous: number; changePercent: number | null };
        applications: {
          current: number;
          previous: number;
          changePercent: number | null;
        };
      }>(
        await fetch("/api/admin/monthly-summary", {
          cache: "no-store",
          credentials: "include",
        }),
      );
      setMonthlySummary(data);
      console.timeEnd("admin:monthly-summary");
    } catch (error) {
      console.timeEnd("admin:monthly-summary");
      console.error("[admin] monthly summary failed", error);
    } finally {
      setMonthlySummaryLoading(false);
    }
  }

  async function loadBroadcastOptions() {
    try {
      const data = await readJson<{ jobs: BroadcastJobOption[] }>(
        await fetch("/api/admin/jobs/options", {
          cache: "no-store",
          credentials: "include",
        }),
      );
      setBroadcastJobs(data.jobs);
    } catch (error) {
      console.error("[admin] broadcast options failed", error);
    }
  }

  async function runShopSearch(page = 1, append = false) {
    const q = shopSearchQuery.trim();
    if (!q && regionFilter === "all") {
      setSearchPerformed(false);
      setJobs([]);
      setSearchTotal(0);
      setSearchHasMore(false);
      setSearchPage(1);
      setApplicationDetails({});
      setViewCounts({});
      setMessage("店舗名やエリアを入力して検索してください");
      return;
    }

    setSearchLoading(true);
    setMessage("");
    console.time("admin:shop-search");
    try {
      const params = new URLSearchParams({
        q,
        region: regionFilter,
        page: String(page),
        limit: String(SEARCH_LIMIT),
      });
      const data = await readJson<{
        jobs: Job[];
        total: number;
        page: number;
        hasMore: boolean;
        details: Record<string, JobApplicationDetail>;
        viewCounts: Record<string, number>;
        searched?: boolean;
        message?: string;
      }>(
        await fetch(`/api/admin/jobs/search?${params.toString()}`, {
          cache: "no-store",
          credentials: "include",
        }),
      );

      setSearchPerformed(Boolean(data.searched));
      setSearchTotal(data.total);
      setSearchHasMore(data.hasMore);
      setSearchPage(data.page);
      setJobs((current) => (append ? [...current, ...data.jobs] : data.jobs));
      setApplicationDetails((current) =>
        append ? { ...current, ...data.details } : data.details,
      );
      setViewCounts((current) =>
        append ? { ...current, ...data.viewCounts } : data.viewCounts,
      );
      console.timeEnd("admin:shop-search");
    } catch (error) {
      console.timeEnd("admin:shop-search");
      setMessage(error instanceof Error ? error.message : "検索に失敗しました。");
    } finally {
      setSearchLoading(false);
    }
  }

  async function refreshAfterMutation() {
    await loadMonthlySummary();
    if (broadcastMounted || isBroadcastOpen) {
      await loadBroadcastOptions();
    }
    if (shopSearchQuery.trim() || regionFilter !== "all") {
      await runShopSearch(1, false);
    }
  }

  function toggleApplicationHistory(jobId: string) {
    setExpandedHistoryJobIds((current) => {
      const next = new Set(current);
      if (next.has(jobId)) next.delete(jobId);
      else next.add(jobId);
      return next;
    });
  }

  useEffect(() => {
    console.time("admin:basic-ui");
    // Shell paints on next frame; session check does not block basic UI.
    requestAnimationFrame(() => {
      console.timeEnd("admin:basic-ui");
    });

    fetch("/api/admin/session", { cache: "no-store" })
      .then((response) => response.json())
      .then((data: { authenticated: boolean }) => {
        setAuthenticated(data.authenticated);
        if (data.authenticated) {
          void loadMonthlySummary();
        } else {
          setMonthlySummaryLoading(false);
        }
      })
      .catch(() => {
        setAuthenticated(false);
        setMonthlySummaryLoading(false);
      })
      .finally(() => setCheckingSession(false));
  }, []);

  useEffect(() => {
    if (isBroadcastOpen && broadcastJobs.length === 0) {
      console.time("admin:broadcast-options");
      void loadBroadcastOptions().finally(() => {
        console.timeEnd("admin:broadcast-options");
      });
    }
  }, [isBroadcastOpen, broadcastJobs.length]);

  function setField<K extends keyof JobForm>(key: K, value: JobForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function applyPlan(plan: JobPlan) {
    setForm((current) => ({
      ...current,
      ...planToFormPatch(plan),
    }));
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
    setShowPreview(false);
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
      await refreshAfterMutation();
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
    setBroadcastJobs([]);
    setMonthlySummary(null);
    setSearchPerformed(false);
    setApplicationDetails({});
    setViewCounts({});
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    if (!form.shopName.trim() || !form.salary.trim() || !form.lineUrl.trim()) {
      setMessage("店舗名・時給・LINE URLは必須です。");
      return;
    }
    requestScrollToTop();
    setShowPreview(true);
  }

  async function handleConfirmPublish() {
    if (publishLockRef.current || loading) return;
    publishLockRef.current = true;
    setLoading(true);
    setMessage("");
    try {
      const url = editingId ? `/api/jobs/${editingId}` : "/api/jobs";
      const method = editingId ? "PUT" : "POST";
      const payload = await promoteTempImagesInPayload(toPayload(form));
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
          ? `（店舗ギャラリー ${savedStoreImageCount}枚）`
          : payload.storeImages && payload.storeImages.length > 0
            ? "（店舗ギャラリーの保存に失敗した可能性があります。Supabaseの store_images カラムを確認してください）"
            : "";
      const shopLoginNote = savedJob.shopLoginId
        ? `（店舗ログインID: ${savedJob.shopLoginId}）`
        : "";
      setMessage(
        editingId
          ? `求人を更新しました。${storeImageNote}${shopLoginNote}`
          : `求人を追加しました。${storeImageNote}${shopLoginNote}`,
      );
      await refreshAfterMutation();
      window.dispatchEvent(new Event(JOBS_UPDATED_EVENT));
      requestScrollToTop();
      setShowPreview(false);
      if (editingId) {
        setEditingId(savedJob.id);
        setForm(toForm(savedJob));
        setIsAddFormOpen(false);
      } else {
        resetForm();
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "保存に失敗しました。");
      requestScrollToTop();
      setShowPreview(false);
    } finally {
      setLoading(false);
      publishLockRef.current = false;
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
      await refreshAfterMutation();
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
      const imageUrl = await uploadTempImage({
        file,
        uploadType: "shop",
        ownerId: editingId ?? draftJobId,
      });
      setField("imageUrl", imageUrl);
      setMessage("店舗トップ画像をアップロードしました（確定まで公開反映されません）。");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "画像アップロードに失敗しました。",
      );
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  async function handleRecruiterImageUpload(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploadingRecruiterImage(true);
    setMessage("");
    const ownerJobId = editingId ?? draftJobId;

    try {
      const imageUrl = await uploadTempImage({
        file,
        uploadType: "recruiter-image",
        ownerId: ownerJobId,
      });
      setField("recruiterImage", imageUrl);
      setMessage("採用担当者の顔写真をアップロードしました（確定まで公開反映されません）。");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "採用担当者の顔写真アップロードに失敗しました。",
      );
    } finally {
      setUploadingRecruiterImage(false);
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
          const imageUrl = await uploadTempImage({
            file,
            uploadType: "store-image",
            ownerId: ownerJobId,
          });
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
        setMessage(
          `${uploadedUrls.length}枚の店舗ギャラリー画像を追加しました（確定まで公開反映されません）。`,
        );
      } else if (uploadedUrls.length > 0) {
        setMessage(
          `${uploadedUrls.length}枚をアップロードしました。失敗: ${failedFiles.join(" / ")}`,
        );
      } else {
        setMessage(
          failedFiles.join(" / ") ||
            "店舗ギャラリー画像の追加に失敗しました。",
        );
      }
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "店舗ギャラリー画像の追加に失敗しました。",
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
    setShowPreview(false);
    setMessage("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const isFormVisible = editingId !== null || isAddFormOpen;

  // Show login only after session check finishes. While checking, paint the shell.
  if (!checkingSession && !authenticated) {
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

  if (showPreview) {
    const previewJob = buildPreviewJobFromAdminForm(form, {
      id: editingId ?? draftJobId,
    });
    return (
      <JobListingPreview
        job={previewJob}
        mode={editingId ? "edit" : "create"}
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

  return (
    <div className="admin-shell mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
      <aside className="admin-sidebar" aria-label="管理メニュー">
        <a href="#admin-jobs" className="admin-sidebar-link">
          掲載店舗検索
        </a>
        <a href="#admin-broadcast" className="admin-sidebar-link">
          LINE配信
        </a>
        <a href="#admin-history" className="admin-sidebar-link">
          通知履歴
        </a>
        <Link href="/" className="admin-sidebar-link">
          サイトを見る
        </Link>
      </aside>

      <div className="admin-main">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-charcoal sm:text-3xl">
            求人管理
          </h1>
          <p className="mt-1 text-sm text-muted">
            求人情報と画像はSupabaseに保存されます。
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

      <section className="mb-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-gold/25 bg-white p-5 shadow-gold">
          <p className="text-sm font-medium text-muted">今月の表示回数</p>
          {monthlySummaryLoading && !monthlySummary ? (
            <div className="mt-3 h-10 w-32 animate-pulse rounded bg-gold/20" />
          ) : (
            <>
              <p className="mt-2 font-serif text-3xl font-semibold text-charcoal">
                {(monthlySummary?.views.current ?? 0).toLocaleString("ja-JP")}
                <span className="ml-1 text-base font-sans font-medium text-muted">
                  回
                </span>
              </p>
              {monthlySummary?.views.changePercent != null && (
                <p
                  className={`mt-2 text-xs font-medium ${
                    monthlySummary.views.changePercent >= 0
                      ? "text-[#047a3b]"
                      : "text-red-600"
                  }`}
                >
                  前月比{" "}
                  {monthlySummary.views.changePercent > 0 ? "+" : ""}
                  {monthlySummary.views.changePercent}%
                  <span className="ml-1 text-muted">
                    （{monthlySummary.previousPeriodLabel}:{" "}
                    {monthlySummary.views.previous.toLocaleString("ja-JP")}回）
                  </span>
                </p>
              )}
            </>
          )}
        </div>
        <div className="rounded-2xl border border-gold/25 bg-white p-5 shadow-gold">
          <p className="text-sm font-medium text-muted">今月の応募回数</p>
          {monthlySummaryLoading && !monthlySummary ? (
            <div className="mt-3 h-10 w-32 animate-pulse rounded bg-gold/20" />
          ) : (
            <>
              <p className="mt-2 font-serif text-3xl font-semibold text-charcoal">
                {(monthlySummary?.applications.current ?? 0).toLocaleString(
                  "ja-JP",
                )}
                <span className="ml-1 text-base font-sans font-medium text-muted">
                  回
                </span>
              </p>
              {monthlySummary?.applications.changePercent != null && (
                <p
                  className={`mt-2 text-xs font-medium ${
                    monthlySummary.applications.changePercent >= 0
                      ? "text-[#047a3b]"
                      : "text-red-600"
                  }`}
                >
                  前月比{" "}
                  {monthlySummary.applications.changePercent > 0 ? "+" : ""}
                  {monthlySummary.applications.changePercent}%
                  <span className="ml-1 text-muted">
                    （{monthlySummary.previousPeriodLabel}:{" "}
                    {monthlySummary.applications.previous.toLocaleString("ja-JP")}
                    回）
                  </span>
                </p>
              )}
              <p className="mt-1 text-xs text-muted">
                LINE応募クリック + 電話応募クリックの合計
              </p>
            </>
          )}
        </div>
      </section>

      <section id="admin-jobs" className="mt-0">
        <button
          type="button"
          onClick={() => setIsShopSearchOpen((open) => !open)}
          aria-expanded={isShopSearchOpen}
          aria-controls="admin-shop-search-panel"
          className="flex w-full items-center justify-between gap-3 rounded-2xl border border-gold/30 bg-white px-4 py-3.5 text-left shadow-gold transition hover:bg-ivory/60 sm:px-5"
        >
          <span className="text-base font-semibold text-charcoal sm:text-lg">
            {isShopSearchOpen ? "▼" : "▶"} 掲載店舗検索
            {monthlySummary && !isShopSearchOpen && (
              <span className="ml-2 text-sm font-normal text-muted">
                （掲載 {monthlySummary.publishedJobCount.toLocaleString("ja-JP")}件）
              </span>
            )}
          </span>
        </button>

        {isShopSearchOpen && (
          <div id="admin-shop-search-panel" className="mt-4 space-y-4">
            <div className="rounded-2xl border border-gold/25 bg-white p-4 shadow-gold sm:p-5">
              <h3 className="text-base font-semibold text-charcoal">店舗検索</h3>
              <p className="mt-1 text-xs text-muted">
                店舗名やエリアを指定して検索すると、該当店舗だけが表示されます。
              </p>
              <form
                className="mt-4 space-y-4"
                onSubmit={(event) => {
                  event.preventDefault();
                  void runShopSearch(1, false);
                }}
              >
                <div className="grid gap-4 sm:grid-cols-2">
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
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={searchLoading}
                  className="w-full rounded-full bg-gradient-to-r from-gold to-gold-dark px-5 py-3 text-sm font-semibold text-white shadow-gold disabled:opacity-60 sm:w-auto"
                >
                  {searchLoading ? "検索中..." : "検索する"}
                </button>
              </form>
            </div>

            {!searchPerformed ? (
              <div className="rounded-2xl border border-dashed border-gold/30 bg-white px-4 py-10 text-center text-sm text-muted">
                店舗名やエリアを入力して検索してください
              </div>
            ) : searchLoading && jobs.length === 0 ? (
              <div className="h-32 animate-pulse rounded-2xl border border-gold/20 bg-white" />
            ) : jobs.length === 0 ? (
              <div className="rounded-2xl border border-gold/20 bg-white px-4 py-10 text-center text-sm text-muted">
                検索条件に一致する店舗がありません。
              </div>
            ) : (
              <>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-base font-semibold text-charcoal">
                    検索結果
                    <span className="ml-1 text-sm font-normal text-muted">
                      （{jobs.length}件表示 / 全{searchTotal}件）
                    </span>
                  </h3>
                </div>
                <ul className="space-y-3">
                  {jobs.map((job) => {
                    const detail =
                      applicationDetails[job.id] ?? emptyApplicationDetail();
                    const historyOpen = expandedHistoryJobIds.has(job.id);
                    const viewCount = viewCounts[job.id] ?? 0;

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
                            <p className="mt-1 text-xs font-medium text-gold-dark">
                              プラン：
                              {JOB_PLAN_DEFINITIONS[parseJobPlan(job.plan)].label}
                            </p>
                            <p className="mt-0.5 text-sm text-muted">{job.salary}</p>

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
                            </dl>

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
                                    {detail.history.slice(0, 20).map((entry, index) => (
                                      <li
                                        key={entry.createdAt + "-" + entry.type + "-" + index}
                                        className="rounded-lg border border-gold/15 bg-ivory/50 px-3 py-2 text-sm text-charcoal"
                                      >
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
                {searchHasMore && (
                  <button
                    type="button"
                    disabled={searchLoading}
                    onClick={() => void runShopSearch(searchPage + 1, true)}
                    className="w-full rounded-full border border-gold/40 px-4 py-3 text-sm font-semibold text-gold-dark hover:bg-ivory disabled:opacity-60"
                  >
                    {searchLoading ? "読み込み中..." : "さらに表示（最大20件ずつ）"}
                  </button>
                )}
              </>
            )}
          </div>
        )}
      </section>

      {!editingId && (
        <button
          type="button"
          onClick={() => setIsAddFormOpen((open) => !open)}
          aria-expanded={isAddFormOpen}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-gold/35 bg-gradient-to-r from-gold to-gold-dark px-4 py-3.5 text-base font-semibold text-white shadow-gold transition hover:brightness-105 sm:py-4"
        >
          {isAddFormOpen ? "− 求人追加フォームを閉じる" : "＋ 求人を追加"}
        </button>
      )}

      {isFormVisible && (
      <section className={`rounded-2xl border border-gold/25 bg-white p-5 shadow-gold sm:p-6 ${editingId ? "mt-4" : "mt-3"}`}>
          <form
            onSubmit={handleSubmit}
            className="space-y-4"
          >
            {editingId && (
              <h2 className="text-lg font-semibold text-charcoal">求人を編集</h2>
            )}

        <div className="rounded-2xl border border-gold/30 bg-ivory/60 p-4 sm:p-5">
          <h3 className="text-base font-semibold text-charcoal">掲載プラン</h3>
          <p className="mt-1 text-xs text-muted sm:text-sm">
            プランを選ぶと表示順位・PickUp・AIおすすめ等が自動設定されます。店舗側では変更できません。
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {JOB_PLANS.map((planKey) => {
              const definition = JOB_PLAN_DEFINITIONS[planKey];
              const selected = form.plan === planKey;
              return (
                <button
                  key={planKey}
                  type="button"
                  onClick={() => applyPlan(planKey)}
                  aria-pressed={selected}
                  className={`rounded-2xl border px-4 py-4 text-left transition ${
                    selected
                      ? "border-gold bg-white shadow-md ring-2 ring-gold/40"
                      : "border-gold/25 bg-white/70 hover:border-gold/50"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span
                      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                        selected
                          ? "border-gold bg-gold"
                          : "border-charcoal/30 bg-white"
                      }`}
                      aria-hidden
                    >
                      {selected && (
                        <span className="h-1.5 w-1.5 rounded-full bg-white" />
                      )}
                    </span>
                    <span className="font-serif text-lg font-semibold text-charcoal">
                      {definition.label}
                    </span>
                  </span>
                  <span className="mt-2 block text-sm text-gold-dark">
                    {definition.priceLabel}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-4 rounded-xl border border-gold/20 bg-white p-4">
            <p className="text-sm font-semibold text-charcoal">
              このプランで有効になる機能
            </p>
            <ul className="mt-3 space-y-1.5 text-sm text-charcoal">
              {getEnabledFeatureLabels(form.plan).map((label) => (
                <li key={label} className="flex items-start gap-2">
                  <span className="mt-0.5 text-gold-dark" aria-hidden>
                    ✓
                  </span>
                  <span>{label}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="space-y-4 rounded-2xl border border-gold/40 bg-charcoal p-4 shadow-lg sm:p-5">
          <div className="border-b border-gold/35 pb-3">
            <h3 className="text-base font-semibold text-gold-light sm:text-lg">
              AI相談おすすめ設定
            </h3>
            <p className="mt-1 text-xs text-white/75 sm:text-sm">
              プラン選択でON/OFFと優先度が自動設定されます。おすすめ内容は待遇・紹介文などからAIが自動判断します。
            </p>
          </div>

          <div className="space-y-4 rounded-xl border border-white/15 bg-white/10 p-4">
            <label className="flex items-start gap-3 text-sm text-white sm:items-center">
              <input
                type="checkbox"
                checked={form.chatRecommendEnabled}
                onChange={(event) =>
                  setField("chatRecommendEnabled", event.target.checked)
                }
                className="mt-0.5 h-4 w-4 shrink-0 rounded border-gold/40 text-gold focus:ring-gold/30 sm:mt-0"
              />
              <span>
                <span className="font-medium text-gold-light">
                  AI相談おすすめON/OFF
                </span>
                <span className="mt-0.5 block text-xs text-white/70">
                  ONにするとAI相談でおすすめ候補に含まれます
                </span>
              </span>
            </label>

            <div>
              <label
                htmlFor="chatRecommendPriority"
                className="mb-1.5 block text-sm font-medium text-gold-light"
              >
                おすすめ優先順位
              </label>
              <input
                id="chatRecommendPriority"
                type="number"
                inputMode="numeric"
                value={form.chatRecommendPriority}
                onChange={(event) =>
                  setField("chatRecommendPriority", event.target.value)
                }
                className={inputClass}
                min={0}
              />
              <p className="mt-1 text-xs text-white/65">
                数値が大きいほど上位に表示されます
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4 rounded-2xl border border-gold/40 bg-charcoal p-4 shadow-lg sm:p-5">
          <div className="border-b border-gold/35 pb-3">
            <h3 className="text-base font-semibold text-gold-light sm:text-lg">
              PickUp掲載
            </h3>
            <p className="mt-1 text-xs text-white/75 sm:text-sm">
              プラン選択で自動設定されます。管理者のみ手動変更できます。
            </p>
          </div>
          <div className="rounded-xl border border-white/15 bg-white/10 p-4">
            <label className="flex items-start gap-3 text-sm text-white sm:items-center">
              <input
                type="checkbox"
                checked={form.pickupEnabled}
                onChange={(event) =>
                  setField("pickupEnabled", event.target.checked)
                }
                className="mt-0.5 h-4 w-4 shrink-0 rounded border-gold/40 text-gold focus:ring-gold/30 sm:mt-0"
              />
              <span>
                <span className="font-medium text-gold-light">PickUp掲載ON/OFF</span>
                <span className="mt-0.5 block text-xs text-white/70">
                  ONにするとトップの「ピックアップ店舗一覧」に表示されます
                </span>
              </span>
            </label>
          </div>
        </div>

        <div className="space-y-4 rounded-2xl border border-gold/40 bg-charcoal p-4 shadow-lg sm:p-5">
          <div className="border-b border-gold/35 pb-3">
            <h3 className="text-base font-semibold text-gold-light sm:text-lg">
              新着掲載
            </h3>
            <p className="mt-1 text-xs text-white/75 sm:text-sm">
              プラン選択で自動設定されます。ライトは公開日から
              {getNewListingDays("light")}
              日間、スタンダード・プレミアムは
              {getNewListingDays("standard")}
              日間表示されます。
            </p>
          </div>
          <div className="space-y-4 rounded-xl border border-white/15 bg-white/10 p-4">
            <label className="flex items-start gap-3 text-sm text-white sm:items-center">
              <input
                type="checkbox"
                checked={form.newListingEnabled}
                onChange={(event) =>
                  setField("newListingEnabled", event.target.checked)
                }
                className="mt-0.5 h-4 w-4 shrink-0 rounded border-gold/40 text-gold focus:ring-gold/30 sm:mt-0"
              />
              <span>
                <span className="font-medium text-gold-light">新着掲載ON/OFF</span>
                <span className="mt-0.5 block text-xs text-white/70">
                  OFFにすると新着一覧の対象外になります（管理者のみ）
                </span>
              </span>
            </label>

            <div>
              <label
                htmlFor="postedAt"
                className="mb-1.5 block text-sm font-medium text-gold-light"
              >
                公開日
              </label>
              <input
                id="postedAt"
                type="date"
                value={form.postedAt}
                onChange={(event) => setField("postedAt", event.target.value)}
                className={inputClass}
                required
              />
              <p className="mt-1 text-xs text-white/65">
                新着期間はこの公開日を基準に再計算されます。
              </p>
            </div>

            <div>
              <label
                htmlFor="openDate"
                className="mb-1.5 block text-sm font-medium text-gold-light"
              >
                オープン日
              </label>
              <input
                id="openDate"
                type="date"
                value={form.openDate}
                onChange={(event) => setField("openDate", event.target.value)}
                className={inputClass}
              />
              <p className="mt-1 text-xs text-white/65">
                入力するとオープン日から6か月間、トップの「新規オープン店舗」に表示されます。未入力の店舗は対象外です。
              </p>
            </div>

            <p className="text-sm font-medium text-gold-light">
              新着掲載終了日：
              <span className="ml-1 font-semibold text-white">
                {form.newListingEnabled
                  ? formatNewListingEndDate({
                      postedAt: form.postedAt,
                      plan: form.plan,
                    })
                  : "（新着掲載オフ）"}
              </span>
            </p>
          </div>
        </div>

        <div className="space-y-4 rounded-2xl border border-gold/40 bg-charcoal p-4 shadow-lg sm:p-5">
          <div className="border-b border-gold/35 pb-3">
            <h3 className="text-base font-semibold text-gold-light sm:text-lg">
              LINEおすすめ通知
            </h3>
            <p className="mt-1 text-xs text-white/75 sm:text-sm">
              プラン選択で自動設定されます（プレミアムでON）。管理者のみ手動変更できます。
            </p>
          </div>
          <div className="rounded-xl border border-white/15 bg-white/10 p-4">
            <label className="flex items-start gap-3 text-sm text-white sm:items-center">
              <input
                type="checkbox"
                checked={form.lineRecommendNotify}
                onChange={(event) =>
                  setField("lineRecommendNotify", event.target.checked)
                }
                className="mt-0.5 h-4 w-4 shrink-0 rounded border-gold/40 text-gold focus:ring-gold/30 sm:mt-0"
              />
              <span>
                <span className="font-medium text-gold-light">
                  LINEおすすめ通知ON/OFF
                </span>
                <span className="mt-0.5 block text-xs text-white/70">
                  ONにするとLINEおすすめ通知の対象になります
                </span>
              </span>
            </label>
          </div>
        </div>

        <div className="space-y-4 rounded-2xl border border-gold/40 bg-charcoal p-4 shadow-lg sm:p-5">
          <div className="border-b border-gold/35 pb-3">
            <h3 className="text-base font-semibold text-gold-light sm:text-lg">
              表示順位
            </h3>
            <p className="mt-1 text-xs text-white/75 sm:text-sm">
              プラン選択で自動設定されます。最優先へ変更すると条件一致ユーザーへPickUp店舗通知が自動送信されます（管理者のみ手動変更可）。
            </p>
          </div>
          <div className="rounded-xl border border-white/15 bg-white/10 p-4">
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  ["normal", "通常"],
                  ["priority", "優先"],
                  ["top", "最優先"],
                ] as const
              ).map(([value, label]) => (
                <label
                  key={value}
                  className={`flex cursor-pointer items-center justify-center gap-2 rounded-xl border px-2 py-2.5 text-sm font-semibold transition ${
                    form.listingPriority === value
                      ? "border-gold bg-gold/25 text-gold-light"
                      : "border-white/20 bg-white/5 text-white/70 hover:border-gold/40"
                  }`}
                >
                  <input
                    type="radio"
                    name="listingPriority"
                    checked={form.listingPriority === value}
                    onChange={() => setField("listingPriority", value)}
                    className="sr-only"
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4 rounded-2xl border border-gold/40 bg-charcoal p-4 shadow-lg sm:p-5">
          <div className="border-b border-gold/35 pb-3">
            <h3 className="text-base font-semibold text-gold-light sm:text-lg">
              応募分析
            </h3>
            <p className="mt-1 text-xs text-white/75 sm:text-sm">
              プランに連動します（スタンダード・プレミアムでON）。店舗ダッシュボードのアクセス・応募分析の利用可否に反映されます。
            </p>
          </div>
          <div className="rounded-xl border border-white/15 bg-white/10 p-4">
            <p
              className={`inline-flex rounded-full px-3 py-1.5 text-sm font-semibold ${
                getPlanFeatures(form.plan).analytics
                  ? "border border-gold/40 bg-gold/20 text-gold-light"
                  : "border border-white/15 bg-white/5 text-white/60"
              }`}
            >
              {getPlanFeatures(form.plan).analytics ? "ON" : "OFF"}
            </p>
          </div>
        </div>

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

          <div className="rounded-2xl border border-gold/20 bg-ivory/40 p-4">
            <p className={labelClass}>採用担当からのメッセージ</p>
            <p className="mb-4 text-xs text-muted">
              求人詳細ページの「入店・在籍キャストの声」の下に表示されます。
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="recruiterName" className={labelClass}>
                  採用担当者名
                </label>
                <input
                  id="recruiterName"
                  type="text"
                  value={form.recruiterName}
                  onChange={(event) =>
                    setField("recruiterName", event.target.value)
                  }
                  className={inputClass}
                  placeholder="例: 田中 花子"
                />
              </div>
              <div>
                <label htmlFor="recruiterTitle" className={labelClass}>
                  役職
                </label>
                <input
                  id="recruiterTitle"
                  type="text"
                  value={form.recruiterTitle}
                  onChange={(event) =>
                    setField("recruiterTitle", event.target.value)
                  }
                  className={inputClass}
                  placeholder="例: 店長 / 採用担当 / オーナー"
                  list="recruiter-title-options"
                />
                <datalist id="recruiter-title-options">
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
              <button
                type="button"
                onClick={() => recruiterImageInputRef.current?.click()}
                disabled={uploadingRecruiterImage}
                className="rounded-full border border-gold/40 bg-white px-4 py-2 text-sm font-medium text-gold-dark transition hover:bg-ivory disabled:opacity-60"
              >
                {uploadingRecruiterImage ? "アップロード中..." : "写真を選択"}
              </button>
              {form.recruiterImage && (
                <div className="mt-4 flex flex-wrap items-center gap-4">
                  <img
                    src={form.recruiterImage}
                    alt="採用担当者プレビュー"
                    className="h-24 w-24 rounded-full border-4 border-gold/30 object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setField("recruiterImage", "")}
                    disabled={uploadingRecruiterImage}
                    className="rounded-full border border-charcoal/20 px-3 py-1.5 text-xs font-medium text-muted hover:text-charcoal"
                  >
                    写真を削除
                  </button>
                </div>
              )}
            </div>
            <div className="mt-4">
              <label htmlFor="recruiterMessage" className={labelClass}>
                採用担当からのメッセージ
              </label>
              <textarea
                id="recruiterMessage"
                value={form.recruiterMessage}
                onChange={(event) =>
                  setField("recruiterMessage", event.target.value)
                }
                rows={6}
                className={inputClass}
                placeholder="応募を迷っている方へのメッセージを入力してください"
              />
            </div>
            <div className="mt-4">
              <label htmlFor="managerComment" className={labelClass}>
                店長から一言
              </label>
              <textarea
                id="managerComment"
                value={form.managerComment}
                onChange={(event) =>
                  setField("managerComment", event.target.value)
                }
                rows={4}
                className={inputClass}
                placeholder="LINE配信カルーセルや店舗詳細に表示されます"
              />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gold/20 bg-ivory/40 p-4">
          <p className={labelClass}>店舗トップ画像</p>
          <p className="mb-3 text-xs text-muted">
            求人一覧カードと求人詳細ページ最上部に表示するメイン画像です。1枚のみ設定でき、差し替えも可能です。
          </p>
          <input
            id="imageFile"
            type="file"
            accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
            onChange={handleImageUpload}
            className="hidden"
          />
          <label
            htmlFor="imageFile"
            className={`inline-flex cursor-pointer rounded-full border border-gold/40 bg-white px-4 py-2 text-sm font-medium text-gold-dark transition hover:bg-ivory ${uploading ? "pointer-events-none opacity-60" : ""}`}
          >
            {uploading ? "アップロード中..." : "画像アップロード"}
          </label>
          {form.imageUrl && (
            <img
              src={form.imageUrl}
              alt="店舗トップ画像プレビュー"
              className="mt-4 h-40 w-full rounded-xl object-cover"
            />
          )}
        </div>

        <div className="rounded-2xl border border-gold/20 bg-ivory/40 p-4">
          <p className={labelClass}>店舗ギャラリー</p>
          <p className="mb-3 text-xs text-muted">
            求人詳細ページで店舗の雰囲気が分かる写真を複数枚表示します。JPG / PNG / WebP に対応しています。
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
            {uploadingStoreImages ? "追加中..." : "画像追加"}
          </button>
          {uploadingStoreImages && (
            <p className="mt-2 text-xs text-muted">追加中...</p>
          )}
          {form.storeImages.length === 0 ? (
            <p className="mt-3 rounded-xl border border-dashed border-gold/25 bg-white px-3 py-4 text-center text-sm text-muted">
              「画像追加」から店舗ギャラリーに写真を登録できます
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
                    alt={`店舗ギャラリー ${index + 1}`}
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

        <div className="space-y-4 rounded-2xl border border-gold/30 bg-white p-4 shadow-gold sm:p-5">
          <div>
            <p className="text-sm font-semibold text-gold-dark">店舗ログイン情報</p>
            <p className="mt-1 text-xs text-muted">
              店舗担当者が /shop-login からログインするためのIDとPWです。
              パスワードは平文保存の簡易実装です（将来ハッシュ化推奨）。
            </p>
          </div>
          <div className="space-y-4">
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
                type="text"
                value={form.shopLoginPassword}
                onChange={(event) =>
                  setField("shopLoginPassword", event.target.value)
                }
                className={inputClass}
                placeholder={editingId ? "未設定の場合は空欄" : "初期パスワード"}
                autoComplete="off"
                spellCheck={false}
              />
              {editingId && (
                <p className="mt-1 text-xs text-muted">
                  空欄のまま保存すると、現在のパスワードを維持します。
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 pt-2">
          <button
            type="submit"
            disabled={loading || uploading || uploadingStoreImages || uploadingRecruiterImage}
            className="rounded-full bg-gradient-to-r from-gold to-gold-dark px-6 py-3 text-sm font-semibold text-white shadow-md disabled:opacity-60"
          >
            {editingId ? "変更内容を確認する" : "掲載内容を確認する"}
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
      </section>
      )}

      <section id="admin-broadcast" className="mt-6 overflow-hidden rounded-2xl border border-gold/30 bg-white shadow-gold">
        <button
          type="button"
          onClick={() => {
            setIsBroadcastOpen((open) => {
              const next = !open;
              if (next) setBroadcastMounted(true);
              return next;
            });
          }}
          aria-expanded={isBroadcastOpen}
          aria-controls="admin-broadcast-panel"
          className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left transition hover:bg-ivory/60 sm:px-5"
        >
          <span className="text-base font-semibold text-charcoal sm:text-lg">
            {isBroadcastOpen ? "▼" : "▶"} LINE配信管理
          </span>
        </button>
        {broadcastMounted && (
          <div
            id="admin-broadcast-panel"
            className={
              isBroadcastOpen
                ? "border-t border-gold/15 px-4 py-4 sm:px-5 sm:py-5"
                : "hidden"
            }
          >
            <LineBroadcastPanel
              jobs={broadcastJobs}
              selectedJobId={editingId}
              onMessage={setMessage}
              embedded
            />
          </div>
        )}
      </section>

      <section id="admin-history" className="mt-4 overflow-hidden rounded-2xl border border-gold/30 bg-white shadow-gold">
        <button
          type="button"
          onClick={() => {
            setIsHistoryOpen((open) => {
              const next = !open;
              if (next) setHistoryMounted(true);
              return next;
            });
          }}
          aria-expanded={isHistoryOpen}
          aria-controls="admin-history-panel"
          className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left transition hover:bg-ivory/60 sm:px-5"
        >
          <span className="text-base font-semibold text-charcoal sm:text-lg">
            {isHistoryOpen ? "▼" : "▶"} LINE通知履歴
          </span>
        </button>
        {historyMounted && (
          <div
            id="admin-history-panel"
            className={
              isHistoryOpen
                ? "border-t border-gold/15 px-4 py-4 sm:px-5 sm:py-5"
                : "hidden"
            }
          >
            <LineNotificationHistoryPanel embedded active={isHistoryOpen} />
          </div>
        )}
      </section>

      </div>
    </div>
  );
}
