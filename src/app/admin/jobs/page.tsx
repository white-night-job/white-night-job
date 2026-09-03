"use client";

import { JobListingPreview } from "@/components/JobListingPreview";
import { ImageUploadSizeHint } from "@/components/ImageUploadSizeHint";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAdminUnsavedChanges } from "@/components/admin/AdminUnsavedChanges";
import { useScrollToTopAfterChange } from "@/hooks/useScrollToTopAfterChange";
import { useAuthSessionGuard } from "@/hooks/useAuthSessionGuard";
import {
  buildAdminLoginRedirectUrl,
  checkAdminSession,
  readJsonWithAuth,
  SESSION_EXPIRED_MESSAGE,
  isSessionExpiredError,
} from "@/lib/auth-session-client";
import {
  clearAdminJobFormDraft,
  loadAdminJobFormDraft,
  saveAdminJobFormDraft,
} from "@/lib/job-form-draft-storage";
import { copyTextToClipboard } from "@/lib/clipboard";
import {
  BENEFIT_CATEGORIES,
  getKnownBenefits,
  getUncategorizedBenefits,
} from "@/data/benefits";
import { DISTRICTS, formatDistrictLabel } from "@/data/districts";
import {
  emptyApplicationDetail,
  formatApplicationDateTime,
  getApplicationTypeLabel,
  REGION_FILTER_OPTIONS,
  type JobApplicationDetail,
} from "@/lib/job-applications";
import { formatLocation, JOBS_UPDATED_EVENT } from "@/lib/job-storage";
import type { JobListingRanks } from "@/lib/shop-boosts";
import {
  getDisplayCastVoices,
  getDisplayStoreImages,
  parseBenefits,
  sanitizeCastVoicesForSave,
  sanitizeStoreImagesForSave,
} from "@/lib/job-db";
import { computeJobDraftProgress } from "@/lib/job-draft-progress";
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
import type { GirlReview } from "@/types/girl-review";
import {
  formatNewListingEndDate,
  getNewListingDays,
  toOpenDateInputValue,
  toPostedAtDateInputValue,
} from "@/lib/job-listing";
import {
  getEnabledFeatureLabels,
  getPlanFeatures,
  isUncontractedPlan,
  JOB_PLAN_DEFINITIONS,
  JOB_PLANS,
  parseJobPlan,
  planToFormPatch,
  type JobPlan,
} from "@/lib/job-plan";
import {
  JOB_LISTING_STATUS_LABELS,
  resolveJobListingStatus,
  type JobListingStatus,
} from "@/lib/job-listing-status";

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

const SEARCH_PLAN_FILTER_OPTIONS: Array<{ value: JobPlan; label: string }> = [
  { value: "uncontracted", label: "未契約店舗" },
  { value: "light", label: "ライトプラン" },
  { value: "standard", label: "スタンダードプラン" },
  { value: "premium", label: "プレミアムプラン" },
];

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
    // 店舗ログインID/PWはサーバ自動発行・再発行APIのみ。保存時は送らない。
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
  return readJsonWithAuth<T>(response);
}

function formatAdminDateTime(value: string | null | undefined) {
  if (!value) return "—";
  try {
    return new Intl.DateTimeFormat("ja-JP", {
      timeZone: "Asia/Tokyo",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

export default function AdminJobsPage() {
  return (
    <Suspense
      fallback={
        <div className="rounded-2xl border border-gold/20 bg-white px-4 py-10 text-center text-sm text-muted">
          読み込み中...
        </div>
      }
    >
      <AdminJobsPageInner />
    </Suspense>
  );
}

function AdminJobsPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setDirty: setUnsavedDirty, requestNavigation } =
    useAdminUnsavedChanges();
  const [jobs, setJobs] = useState<Job[]>([]);
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
  const [listingRanksByJobId, setListingRanksByJobId] = useState<
    Record<string, JobListingRanks>
  >({});
  const [editingListingRanks, setEditingListingRanks] =
    useState<JobListingRanks | null>(null);
  const [shopSearchQuery, setShopSearchQuery] = useState("");
  const [regionFilter, setRegionFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [planFilters, setPlanFilters] = useState<JobPlan[]>([]);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formDirty, setFormDirty] = useState(false);
  const [editingListingStatus, setEditingListingStatus] =
    useState<JobListingStatus>("draft");
  const [expandedHistoryJobIds, setExpandedHistoryJobIds] = useState<
    Set<string>
  >(new Set());
  const [isShopSearchOpen, setIsShopSearchOpen] = useState(false);
  const [isDraftSearchOpen, setIsDraftSearchOpen] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewKind, setPreviewKind] = useState<"publish" | "draft">("publish");
  const [previewGirlReviews, setPreviewGirlReviews] = useState<GirlReview[]>(
    [],
  );
  const publishLockRef = useRef(false);
  const editorSectionRef = useRef<HTMLElement | null>(null);
  const jobsListAnchorRef = useRef<HTMLElement | null>(null);
  const pendingScrollToEditorRef = useRef(false);
  const pendingScrollToListRef = useRef(false);
  const pendingScrollToTopRef = useRef(false);
  /** Prevents ?edit= reload from wiping in-progress form (e.g. preview → 修正する). */
  const editingIdRef = useRef<string | null>(null);
  const showPreviewRef = useRef(false);
  /** Form state at preview open — restored on「修正する」so edits are never reset. */
  const previewFormSnapshotRef = useRef<JobForm | null>(null);
  /** Always-current form/dirty for autosave (avoids stale closures overwriting newer input). */
  const formRef = useRef<JobForm>(emptyForm);
  const formDirtyRef = useRef(false);
  const isAddFormOpenRef = useRef(false);
  const editingListingStatusRef = useRef<JobListingStatus>("draft");
  const draftJobIdRef = useRef(draftJobId);
  const previewKindRef = useRef(previewKind);
  const localPersistTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const serverAutosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autosaveInFlightRef = useRef(false);
  const [autosaveStatus, setAutosaveStatus] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const messageClearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const [pendingSaveIntent, setPendingSaveIntent] = useState<
    "draft" | "publish" | "pause" | "republish" | null
  >(null);
  const [credentialsModal, setCredentialsModal] = useState<{
    title: string;
    shopLoginId: string;
    shopLoginPassword: string;
  } | null>(null);
  const [reissuingPassword, setReissuingPassword] = useState(false);
  const [copyToast, setCopyToast] = useState<{
    message: string;
    tone: "success" | "error";
  } | null>(null);
  const [copiedKey, setCopiedKey] = useState<
    "shopLoginId" | "shopLoginPassword" | "both" | null
  >(null);
  const copyToastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const copiedKeyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestScrollToTop = useScrollToTopAfterChange([showPreview]);
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchPage, setSearchPage] = useState(1);
  const [searchTotal, setSearchTotal] = useState(0);
  const [searchHasMore, setSearchHasMore] = useState(false);
  const SEARCH_LIMIT = 20;

  const [draftJobs, setDraftJobs] = useState<Job[]>([]);
  const [draftTotal, setDraftTotal] = useState(0);
  const [draftSearchTotal, setDraftSearchTotal] = useState(0);
  const [draftSearchPerformed, setDraftSearchPerformed] = useState(false);
  const [draftSearchLoading, setDraftSearchLoading] = useState(false);
  const [draftShopName, setDraftShopName] = useState("");
  const [draftArea, setDraftArea] = useState("all");
  const [draftJobType, setDraftJobType] = useState("all");
  const [draftContactName, setDraftContactName] = useState("");
  const [draftCreatedFrom, setDraftCreatedFrom] = useState("");
  const [draftCreatedTo, setDraftCreatedTo] = useState("");
  const [draftUpdatedFrom, setDraftUpdatedFrom] = useState("");
  const [draftUpdatedTo, setDraftUpdatedTo] = useState("");
  const sessionRedirectRef = useRef(false);

  const handleSessionExpired = useCallback(() => {
    if (sessionRedirectRef.current) return;
    sessionRedirectRef.current = true;

    if (editingIdRef.current !== null || isAddFormOpenRef.current) {
      saveAdminJobFormDraft({
        form: formRef.current as unknown as Record<string, unknown>,
        editingId: editingIdRef.current,
        draftJobId: draftJobIdRef.current,
        isAddFormOpen: isAddFormOpenRef.current,
        editingListingStatus: editingListingStatusRef.current,
        showPreview: showPreviewRef.current,
        previewKind: previewKindRef.current,
        savedAt: Date.now(),
      });
    }

    const returnPath = editingIdRef.current
      ? `/admin/jobs?edit=${encodeURIComponent(editingIdRef.current)}`
      : "/admin/jobs";
    router.replace(buildAdminLoginRedirectUrl(returnPath));
  }, [router]);

  const ensureAdminSession = useCallback(async (): Promise<boolean> => {
    const ok = await checkAdminSession();
    if (!ok) {
      handleSessionExpired();
      return false;
    }
    return true;
  }, [handleSessionExpired]);

  useAuthSessionGuard({
    enabled: editingId !== null || isAddFormOpen || showPreview,
    checkSession: checkAdminSession,
    onSessionExpired: handleSessionExpired,
  });

  function persistLocalDraftNow() {
    if (!(editingIdRef.current !== null || isAddFormOpenRef.current || showPreviewRef.current)) {
      return;
    }
    saveAdminJobFormDraft({
      form: formRef.current as unknown as Record<string, unknown>,
      editingId: editingIdRef.current,
      draftJobId: draftJobIdRef.current,
      isAddFormOpen: isAddFormOpenRef.current,
      editingListingStatus: editingListingStatusRef.current,
      showPreview: showPreviewRef.current,
      previewKind: previewKindRef.current,
      savedAt: Date.now(),
    });
  }

  function scheduleLocalDraftPersist() {
    if (localPersistTimerRef.current) clearTimeout(localPersistTimerRef.current);
    localPersistTimerRef.current = setTimeout(() => {
      localPersistTimerRef.current = null;
      persistLocalDraftNow();
    }, 800);
  }

  function togglePlanFilter(plan: JobPlan) {
    setPlanFilters((current) =>
      current.includes(plan)
        ? current.filter((item) => item !== plan)
        : [...current, plan],
    );
  }

  async function runShopSearch(page = 1, append = false) {
    const q = shopSearchQuery.trim();
    if (!q && regionFilter === "all" && planFilters.length === 0) {
      setSearchPerformed(false);
      setJobs([]);
      setSearchTotal(0);
      setSearchHasMore(false);
      setSearchPage(1);
      setApplicationDetails({});
      setListingRanksByJobId({});
      setMessage("店舗名、エリア、または掲載プランを指定して検索してください");
      return;
    }

    setSearchLoading(true);
    setMessage("");
    console.time("admin:shop-search");
    try {
      const params = new URLSearchParams({
        q,
        region: regionFilter,
        status: statusFilter,
        page: String(page),
        limit: String(SEARCH_LIMIT),
      });
      for (const plan of planFilters) {
        params.append("plan", plan);
      }
      const data = await readJson<{
        jobs: Job[];
        total: number;
        page: number;
        hasMore: boolean;
        details: Record<string, JobApplicationDetail>;
        listingRanks?: Record<string, JobListingRanks>;
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
      setJobs((current) => {
        if (!append) return data.jobs;
        const seen = new Set(current.map((job) => job.id));
        const merged = [...current];
        for (const job of data.jobs) {
          if (seen.has(job.id)) continue;
          seen.add(job.id);
          merged.push(job);
        }
        return merged;
      });
      setApplicationDetails((current) =>
        append ? { ...current, ...data.details } : data.details,
      );
      setListingRanksByJobId((current) =>
        append
          ? { ...current, ...(data.listingRanks ?? {}) }
          : (data.listingRanks ?? {}),
      );
      console.timeEnd("admin:shop-search");
    } catch (error) {
      console.timeEnd("admin:shop-search");
      setMessage(error instanceof Error ? error.message : "検索に失敗しました。");
    } finally {
      setSearchLoading(false);
    }
  }

  async function runDraftSearch() {
    setDraftSearchLoading(true);
    setMessage("");
    try {
      const params = new URLSearchParams();
      if (draftShopName.trim()) params.set("shopName", draftShopName.trim());
      if (draftArea !== "all") params.set("area", draftArea);
      if (draftJobType !== "all") params.set("jobType", draftJobType);
      if (draftContactName.trim()) {
        params.set("contactName", draftContactName.trim());
      }
      if (draftCreatedFrom) params.set("createdFrom", draftCreatedFrom);
      if (draftCreatedTo) params.set("createdTo", draftCreatedTo);
      if (draftUpdatedFrom) params.set("updatedFrom", draftUpdatedFrom);
      if (draftUpdatedTo) params.set("updatedTo", draftUpdatedTo);
      params.set("limit", "100");

      const data = await readJson<{
        jobs: Job[];
        total: number;
        draftTotal: number;
        message?: string;
      }>(
        await fetch(`/api/admin/jobs/drafts?${params.toString()}`, {
          cache: "no-store",
          credentials: "include",
        }),
      );

      setDraftJobs(data.jobs ?? []);
      setDraftSearchTotal(data.total ?? 0);
      setDraftTotal(data.draftTotal ?? data.total ?? 0);
      setDraftSearchPerformed(true);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "下書き検索に失敗しました。",
      );
    } finally {
      setDraftSearchLoading(false);
    }
  }

  async function loadDraftTotal() {
    try {
      const data = await readJson<{ draftTotal: number }>(
        await fetch("/api/admin/jobs/drafts?limit=1", {
          cache: "no-store",
          credentials: "include",
        }),
      );
      setDraftTotal(data.draftTotal ?? 0);
    } catch {
      /* non-blocking */
    }
  }

  async function refreshAfterMutation() {
    await loadDraftTotal();
    if (
      shopSearchQuery.trim() ||
      regionFilter !== "all" ||
      statusFilter !== "all" ||
      planFilters.length > 0
    ) {
      await runShopSearch(1, false);
    }
    if (draftSearchPerformed || isDraftSearchOpen) {
      await runDraftSearch();
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
    void loadDraftTotal();
  }, []);

  useEffect(() => {
    if (searchParams.get("restoreDraft") !== "1") return;
    const draft = loadAdminJobFormDraft();
    if (!draft?.form) return;

    setForm(draft.form as unknown as JobForm);
    setEditingId(draft.editingId);
    setDraftJobId(draft.draftJobId);
    setIsAddFormOpen(draft.isAddFormOpen);
    setEditingListingStatus(draft.editingListingStatus as JobListingStatus);
    if (draft.showPreview) {
      setShowPreview(true);
      setPreviewKind(draft.previewKind);
    }
    setFormDirty(true);
    setAutosaveStatus("saved");
    setMessage(
      "入力内容を復元しました。内容をご確認のうえ、再度保存してください。",
    );

    router.replace(
      draft.editingId
        ? `/admin/jobs?edit=${encodeURIComponent(draft.editingId)}`
        : "/admin/jobs",
      { scroll: false },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  editingIdRef.current = editingId;
  showPreviewRef.current = showPreview;
  formRef.current = form;
  formDirtyRef.current = formDirty;
  isAddFormOpenRef.current = isAddFormOpen;
  editingListingStatusRef.current = editingListingStatus;
  draftJobIdRef.current = draftJobId;
  previewKindRef.current = previewKind;

  useEffect(() => {
    if (searchParams.get("restoreDraft") === "1") return;
    const editId = searchParams.get("edit")?.trim();
    if (!editId) return;
    // Already editing this job (or previewing / dirty): never reload DB over input.
    if (
      editingIdRef.current === editId ||
      showPreviewRef.current ||
      (formDirtyRef.current && editingIdRef.current === editId)
    ) {
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const data = await readJson<{
          job: Job;
          listingRanks?: JobListingRanks | null;
        }>(
          await fetch(`/api/admin/jobs/${editId}`, {
            cache: "no-store",
            credentials: "include",
          }),
        );
        if (cancelled) return;
        // Re-check after await: user may have started typing or opened preview.
        if (
          showPreviewRef.current ||
          (editingIdRef.current === editId && formDirtyRef.current)
        ) {
          return;
        }
        // Prefer local in-progress draft over older DB row (reload / session return).
        const local = loadAdminJobFormDraft();
        const hasLocalForJob =
          local?.form &&
          local.editingId === editId &&
          typeof local.savedAt === "number";

        if (editingIdRef.current === editId && !hasLocalForJob) {
          return;
        }

        handleEdit(data.job, {
          skipUrlUpdate: true,
          preserveLocalDraft: true,
        });
        setEditingListingRanks(data.listingRanks ?? null);

        if (hasLocalForJob && local?.form) {
          setForm(local.form as unknown as JobForm);
          setFormDirty(true);
          setAutosaveStatus("saved");
        }
      } catch (error) {
        if (!cancelled) {
          setMessage(
            error instanceof Error
              ? error.message
              : "下書きの読み込みに失敗しました。",
          );
        }
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Restore in-progress "求人を追加" form after reload (no ?edit=).
  useEffect(() => {
    if (searchParams.get("restoreDraft") === "1") return;
    if (searchParams.get("edit")?.trim()) return;
    if (editingIdRef.current || isAddFormOpenRef.current) return;
    const draft = loadAdminJobFormDraft();
    if (!draft?.form || !draft.isAddFormOpen || draft.editingId) return;
    if (Date.now() - draft.savedAt > 24 * 60 * 60 * 1000) return;
    setForm(draft.form as unknown as JobForm);
    setDraftJobId(draft.draftJobId);
    setIsAddFormOpen(true);
    setEditingListingStatus(draft.editingListingStatus as JobListingStatus);
    setFormDirty(true);
    setAutosaveStatus("saved");
    setMessage("前回の入力内容を復元しました。");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  useEffect(() => {
    if (isDraftSearchOpen && !draftSearchPerformed) {
      void runDraftSearch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDraftSearchOpen]);

  function setField<K extends keyof JobForm>(key: K, value: JobForm[K]) {
    setForm((current) => {
      const next = { ...current, [key]: value };
      formRef.current = next;
      return next;
    });
    setFormDirty(true);
    formDirtyRef.current = true;
    setAutosaveStatus("idle");
    scheduleLocalDraftPersist();
    setFieldErrors((prev) => {
      if (!prev[key as string]) return prev;
      const next = { ...prev };
      delete next[key as string];
      return next;
    });
  }

  function markFormDirty() {
    setFormDirty(true);
    formDirtyRef.current = true;
    setAutosaveStatus("idle");
    scheduleLocalDraftPersist();
  }

  const showCopyToast = useCallback(
    (tone: "success" | "error", message: string) => {
      if (copyToastTimerRef.current) {
        clearTimeout(copyToastTimerRef.current);
      }
      setCopyToast({ tone, message });
      copyToastTimerRef.current = setTimeout(() => {
        setCopyToast(null);
        copyToastTimerRef.current = null;
      }, 2500);
    },
    [],
  );

  const copyShopCredential = useCallback(
    async (
      text: string,
      key: "shopLoginId" | "shopLoginPassword" | "both",
    ) => {
      const ok = await copyTextToClipboard(text);
      if (ok) {
        setCopiedKey(key);
        if (copiedKeyTimerRef.current) {
          clearTimeout(copiedKeyTimerRef.current);
        }
        copiedKeyTimerRef.current = setTimeout(() => {
          setCopiedKey(null);
          copiedKeyTimerRef.current = null;
        }, 2000);
        showCopyToast("success", "コピーしました");
      } else {
        showCopyToast("error", "コピーできませんでした");
      }
    },
    [showCopyToast],
  );

  useEffect(() => {
    return () => {
      if (copyToastTimerRef.current) clearTimeout(copyToastTimerRef.current);
      if (copiedKeyTimerRef.current) clearTimeout(copiedKeyTimerRef.current);
    };
  }, []);

  function applyPlan(plan: JobPlan) {
    setForm((current) => {
      const next = { ...current, ...planToFormPatch(plan) };
      formRef.current = next;
      return next;
    });
    markFormDirty();
  }

  function toggleBenefit(benefit: string) {
    setForm((current) => {
      const next = {
        ...current,
        benefits: current.benefits.includes(benefit)
          ? current.benefits.filter((item) => item !== benefit)
          : [...current.benefits, benefit],
      };
      formRef.current = next;
      return next;
    });
    markFormDirty();
  }

  function addCastVoice() {
    setForm((current) => {
      const next = {
        ...current,
        castVoices: [...current.castVoices, emptyCastVoiceEntry()],
      };
      formRef.current = next;
      return next;
    });
    markFormDirty();
  }

  function removeCastVoice(index: number) {
    setForm((current) => {
      const next = {
        ...current,
        castVoices: current.castVoices.filter((_, itemIndex) => itemIndex !== index),
      };
      formRef.current = next;
      return next;
    });
    markFormDirty();
  }

  function updateCastVoice(
    index: number,
    key: keyof CastVoiceEntry,
    value: string,
  ) {
    setForm((current) => {
      const next = {
        ...current,
        castVoices: current.castVoices.map((entry, itemIndex) =>
          itemIndex === index ? { ...entry, [key]: value } : entry,
        ),
      };
      formRef.current = next;
      return next;
    });
    markFormDirty();
  }

  function removeStoreImage(index: number) {
    setForm((current) => {
      const next = {
        ...current,
        storeImages: current.storeImages.filter((_, itemIndex) => itemIndex !== index),
      };
      formRef.current = next;
      return next;
    });
    markFormDirty();
  }

  function scrollWithHeaderOffset(element: HTMLElement | null) {
    if (!element) return;
    const headerOffset = 72; // sticky admin topbar
    const top =
      element.getBoundingClientRect().top + window.scrollY - headerOffset;
    window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
  }

  function scrollToEditorSection() {
    scrollWithHeaderOffset(editorSectionRef.current);
  }

  function scrollToJobsList() {
    const messageEl =
      typeof document !== "undefined"
        ? document.getElementById("admin-jobs-message")
        : null;
    scrollWithHeaderOffset(messageEl ?? jobsListAnchorRef.current);
  }

  function scheduleMessageAutoClear(text: string, ms: number) {
    if (messageClearTimerRef.current) {
      clearTimeout(messageClearTimerRef.current);
      messageClearTimerRef.current = null;
    }
    messageClearTimerRef.current = setTimeout(() => {
      setMessage((current) => (current === text ? "" : current));
      messageClearTimerRef.current = null;
    }, ms);
  }

  function closeEditor(options?: {
    keepMessage?: boolean;
    message?: string;
    scrollToList?: boolean;
    scrollToTop?: boolean;
    autoClearMessageMs?: number;
  }) {
    setForm(emptyForm);
    formRef.current = emptyForm;
    setEditingId(null);
    editingIdRef.current = null;
    setEditingListingStatus("draft");
    editingListingStatusRef.current = "draft";
    setIsAddFormOpen(false);
    isAddFormOpenRef.current = false;
    setShowPreview(false);
    setPreviewKind("publish");
    setPreviewGirlReviews([]);
    previewFormSnapshotRef.current = null;
    setFormDirty(false);
    formDirtyRef.current = false;
    setAutosaveStatus("idle");
    clearAdminJobFormDraft();
    setFieldErrors({});
    setPendingSaveIntent(null);
    pendingScrollToEditorRef.current = false;
    if (options?.message != null) {
      setMessage(options.message);
      if (options.autoClearMessageMs && options.autoClearMessageMs > 0) {
        scheduleMessageAutoClear(options.message, options.autoClearMessageMs);
      }
    } else if (!options?.keepMessage) {
      setMessage("");
    }
    setDraftJobId(crypto.randomUUID());
    router.replace("/admin/jobs", { scroll: false });
    if (options?.scrollToTop) {
      pendingScrollToTopRef.current = true;
    } else if (options?.scrollToList) {
      pendingScrollToListRef.current = true;
    }
  }

  function resetForm() {
    closeEditor();
  }

  async function saveJob(saveIntent: "draft" | "publish" | "pause" | "republish", options?: { silent?: boolean }) {
    if (publishLockRef.current || (!options?.silent && loading)) return null;
    if (options?.silent && autosaveInFlightRef.current) return null;
    publishLockRef.current = true;
    if (options?.silent) autosaveInFlightRef.current = true;
    const isPublishedUpdate =
      editingIdRef.current != null &&
      editingListingStatusRef.current === "published" &&
      saveIntent === "publish";
    const formAtSave = formRef.current;
    const editingIdAtSave = editingIdRef.current;
    if (!options?.silent) {
      setLoading(true);
      setPendingSaveIntent(saveIntent);
      if (messageClearTimerRef.current) {
        clearTimeout(messageClearTimerRef.current);
        messageClearTimerRef.current = null;
      }
      setMessage("");
      setFieldErrors({});
    } else {
      setAutosaveStatus("saving");
    }
    try {
      if (!(await ensureAdminSession())) {
        if (options?.silent) setAutosaveStatus("error");
        return null;
      }
      const wasCreate = !editingIdAtSave;
      const url = editingIdAtSave ? `/api/jobs/${editingIdAtSave}` : "/api/jobs";
      const method = editingIdAtSave ? "PUT" : "POST";
      const payload = {
        ...(await promoteTempImagesInPayload(toPayload(formAtSave))),
        saveIntent,
      };
      const saveResult = await readJson<{
        job: Job;
        issuedCredentials?: {
          shopLoginId: string;
          shopLoginPassword: string;
        };
      }>(
        await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        }),
      );
      const savedJob = saveResult.job;
      if (!savedJob?.id) {
        throw new Error("保存に失敗しました。");
      }
      const issued = saveResult.issuedCredentials;

      if (issued) {
        setCredentialsModal({
          title: wasCreate
            ? "店舗ログイン情報を発行しました"
            : "店舗ログイン情報を発行しました（未設定だったため自動発行）",
          shopLoginId: issued.shopLoginId,
          shopLoginPassword: issued.shopLoginPassword,
        });
      }

      if (options?.silent) {
        setEditingId(savedJob.id);
        editingIdRef.current = savedJob.id;
        setEditingListingStatus(resolveJobListingStatus(savedJob));
        editingListingStatusRef.current = resolveJobListingStatus(savedJob);
        setDraftJobId(savedJob.id);
        draftJobIdRef.current = savedJob.id;
        // Never replace in-progress form with DB response (wipes newer keystrokes).
        // Clear dirty only when the user has not typed since this save started.
        const unchangedSinceSave =
          JSON.stringify(formRef.current) === JSON.stringify(formAtSave);
        if (unchangedSinceSave) {
          setFormDirty(false);
          formDirtyRef.current = false;
          setAutosaveStatus("saved");
        } else {
          setAutosaveStatus("idle");
        }
        persistLocalDraftNow();
        if (!editingIdAtSave) {
          router.replace(`/admin/jobs?edit=${savedJob.id}`, { scroll: false });
        }
        return savedJob;
      }

      await refreshAfterMutation();
      window.dispatchEvent(new Event(JOBS_UPDATED_EVENT));
      setShowPreview(false);

      if (saveIntent === "draft") {
        // 下書き保存成功：フォームを閉じ、一覧を更新し、上部に成功メッセージ
        clearAdminJobFormDraft();
        closeEditor({
          message: issued
            ? "下書きを保存しました。ログイン情報を店舗へ伝えてください。"
            : "下書きを保存しました",
          scrollToTop: true,
          autoClearMessageMs: 5000,
        });
      } else if (saveIntent === "publish" || saveIntent === "republish") {
        clearAdminJobFormDraft();
        closeEditor({
          message: isPublishedUpdate
            ? issued
              ? "更新しました。ログイン情報を店舗へ伝えてください。"
              : "更新しました"
            : issued
              ? "求人を公開しました。ログイン情報を店舗へ伝えてください。"
              : "求人を公開しました",
          scrollToTop: true,
        });
      } else if (issued) {
        setEditingId(savedJob.id);
        setForm(toForm(savedJob));
        setEditingListingStatus(resolveJobListingStatus(savedJob));
        setIsAddFormOpen(false);
        setFormDirty(false);
        setDraftJobId(savedJob.id);
        setMessage("求人を掲載停止にしました。");
      } else if (saveIntent === "pause") {
        setEditingId(savedJob.id);
        setForm(toForm(savedJob));
        setEditingListingStatus(resolveJobListingStatus(savedJob));
        setIsAddFormOpen(false);
        setFormDirty(false);
        setDraftJobId(savedJob.id);
        setMessage("求人を掲載停止にしました。");
      }
      return savedJob;
    } catch (error) {
      if (options?.silent) {
        setAutosaveStatus("error");
        persistLocalDraftNow();
      }
      if (isSessionExpiredError(error)) {
        handleSessionExpired();
        return null;
      }
      const message =
        error instanceof Error ? error.message : "保存に失敗しました。";
      const field =
        error && typeof error === "object" && "field" in error
          ? String((error as { field?: string }).field ?? "")
          : "";
      if (!options?.silent) {
        if (messageClearTimerRef.current) {
          clearTimeout(messageClearTimerRef.current);
          messageClearTimerRef.current = null;
        }
        setMessage(message);
        if (field) {
          setFieldErrors({ [field]: message });
        } else {
          if (message.includes("店名")) setFieldErrors({ shopName: message });
          if (message.includes("時給"))
            setFieldErrors((p) => ({ ...p, salary: message }));
          if (message.includes("LINE"))
            setFieldErrors((p) => ({ ...p, lineUrl: message }));
          if (message.includes("地区"))
            setFieldErrors((p) => ({ ...p, district: message }));
          if (message.includes("職種"))
            setFieldErrors((p) => ({ ...p, jobType: message }));
        }
        setShowPreview(false);
      }
      throw error;
    } finally {
      if (!options?.silent) {
        setLoading(false);
        setPendingSaveIntent(null);
      }
      autosaveInFlightRef.current = false;
      publishLockRef.current = false;
    }
  }

  async function loadPreviewGirlReviews(jobId: string | null) {
    if (!jobId) {
      setPreviewGirlReviews([]);
      return;
    }
    try {
      const res = await fetch(
        `/api/admin/girl-reviews?jobId=${encodeURIComponent(jobId)}&limit=100`,
      );
      if (!res.ok) {
        setPreviewGirlReviews([]);
        return;
      }
      const data = (await res.json()) as { reviews?: GirlReview[] };
      setPreviewGirlReviews(Array.isArray(data.reviews) ? data.reviews : []);
    } catch {
      setPreviewGirlReviews([]);
    }
  }

  async function openPreview(kind: "publish" | "draft") {
    if (!(await ensureAdminSession())) return;
    setMessage("");
    if (kind === "publish") {
      const uncontracted = isUncontractedPlan(form.plan);
      if (
        !form.shopName.trim() ||
        (!uncontracted && (!form.salary.trim() || !form.lineUrl.trim()))
      ) {
        setMessage(
          uncontracted
            ? "公開前確認には店舗名が必要です。不足がある場合は「下書き保存」を使ってください。"
            : "公開前確認には店舗名・時給・LINE URLが必要です。不足がある場合は「下書き保存」を使ってください。",
        );
        return;
      }
    }
    const jobId = editingId ?? draftJobId;
    await loadPreviewGirlReviews(jobId);
    // Snapshot before preview so「修正する」can restore without re-init / DB reload.
    try {
      previewFormSnapshotRef.current = structuredClone(form);
    } catch {
      previewFormSnapshotRef.current = {
        ...form,
        benefits: [...form.benefits],
        storeImages: [...form.storeImages],
        castVoices: form.castVoices.map((voice) => ({ ...voice })),
      };
    }
    setPreviewKind(kind);
    requestScrollToTop();
    setShowPreview(true);
  }

  function handleBackFromPreview() {
    const snapshot = previewFormSnapshotRef.current;
    previewFormSnapshotRef.current = null;
    if (snapshot) {
      setForm(snapshot);
      formRef.current = snapshot;
      // Keep editor open with in-progress edits; do not reset / reload / close.
      setFormDirty(true);
      formDirtyRef.current = true;
      scheduleLocalDraftPersist();
    }
    requestScrollToTop();
    setShowPreview(false);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await openPreview("publish");
  }

  async function handleConfirmPublish() {
    try {
      await saveJob("publish");
    } catch {
      /* message set in saveJob */
    }
  }

  async function handleConfirmDraftSave() {
    try {
      await saveJob("draft");
    } catch {
      /* message set in saveJob — keep preview/form so user can fix */
    }
  }

  async function handleDelete(job: Job) {
    if (resolveJobListingStatus(job) !== "draft") {
      setMessage("公開中・掲載停止の求人はこの画面から削除できません。");
      return;
    }
    if (
      !window.confirm(
        `下書き「${job.shopName || "（未入力）"}」を削除しますか？\nこの操作は取り消せません。`,
      )
    ) {
      return;
    }
    setLoading(true);
    setMessage("");
    try {
      await readJson<{ ok: boolean }>(
        await fetch(`/api/jobs/${job.id}`, {
          method: "DELETE",
          credentials: "include",
        }),
      );
      if (editingId === job.id) resetForm();
      setMessage("下書きを削除しました。");
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
        setForm((current) => {
          const next = {
            ...current,
            storeImages: sanitizeStoreImagesForSave([
              ...current.storeImages,
              ...uploadedUrls,
            ]),
          };
          formRef.current = next;
          return next;
        });
        markFormDirty();
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

  function handleEdit(
    job: Job,
    options?: { skipUrlUpdate?: boolean; preserveLocalDraft?: boolean },
  ) {
    // Single editor only — reusing the same form state (no duplicate mounts).
    const nextForm = toForm(job);
    setEditingId(job.id);
    editingIdRef.current = job.id;
    setForm(nextForm);
    formRef.current = nextForm;
    setEditingListingStatus(resolveJobListingStatus(job));
    editingListingStatusRef.current = resolveJobListingStatus(job);
    setEditingListingRanks(listingRanksByJobId[job.id] ?? null);
    setIsAddFormOpen(false);
    isAddFormOpenRef.current = false;
    setShowPreview(false);
    setFormDirty(false);
    formDirtyRef.current = false;
    setAutosaveStatus("idle");
    setFieldErrors({});
    setMessage("");
    setDraftJobId(job.id);
    draftJobIdRef.current = job.id;
    if (!options?.preserveLocalDraft) {
      clearAdminJobFormDraft();
    }
    if (!options?.skipUrlUpdate) {
      router.replace(`/admin/jobs?edit=${job.id}`, { scroll: false });
    }
    pendingScrollToEditorRef.current = true;
  }

  const isFormVisible = editingId !== null || isAddFormOpen;
  const isUncontracted = isUncontractedPlan(form.plan);

  useEffect(() => {
    setUnsavedDirty(isFormVisible && formDirty);
    return () => setUnsavedDirty(false);
  }, [isFormVisible, formDirty, setUnsavedDirty]);

  function requestDiscardForm(onDiscard: () => void) {
    const ok = requestNavigation({
      kind: "action",
      run: onDiscard,
    });
    if (ok) onDiscard();
  }

  useEffect(() => {
    if (!pendingScrollToEditorRef.current || !editingId) return;
    if (!isFormVisible) return;
    pendingScrollToEditorRef.current = false;
    const frame = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        scrollToEditorSection();
      });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [editingId, isFormVisible, form]);

  useEffect(() => {
    if (!pendingScrollToTopRef.current) return;
    if (isFormVisible) return;
    pendingScrollToTopRef.current = false;
    const frame = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [isFormVisible, message]);

  useEffect(() => {
    if (!pendingScrollToListRef.current) return;
    if (isFormVisible) return;
    pendingScrollToListRef.current = false;
    const frame = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        scrollToJobsList();
      });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [isFormVisible, message]);

  useEffect(() => {
    return () => {
      if (messageClearTimerRef.current) {
        clearTimeout(messageClearTimerRef.current);
      }
      if (localPersistTimerRef.current) clearTimeout(localPersistTimerRef.current);
      if (serverAutosaveTimerRef.current) clearTimeout(serverAutosaveTimerRef.current);
    };
  }, []);

  // Debounced server autosave after idle typing (existing drafts only).
  // Uses formRef so the latest input is saved — never a stale closure snapshot.
  useEffect(() => {
    if (!isFormVisible || !formDirty) return;
    if (showPreview) return;
    if (!editingId) {
      // New job: localStorage only (avoid duplicate DB drafts). Status still updates.
      if (serverAutosaveTimerRef.current) clearTimeout(serverAutosaveTimerRef.current);
      serverAutosaveTimerRef.current = setTimeout(() => {
        persistLocalDraftNow();
        setAutosaveStatus("saved");
      }, 2000);
      return () => {
        if (serverAutosaveTimerRef.current) clearTimeout(serverAutosaveTimerRef.current);
      };
    }
    if (serverAutosaveTimerRef.current) clearTimeout(serverAutosaveTimerRef.current);
    serverAutosaveTimerRef.current = setTimeout(() => {
      if (!formDirtyRef.current || publishLockRef.current || autosaveInFlightRef.current) {
        return;
      }
      if (uploading || uploadingStoreImages || uploadingRecruiterImage) return;
      void saveJob("draft", { silent: true }).catch(() => {
        /* local draft already persisted; keep editing */
      });
    }, 5000);
    return () => {
      if (serverAutosaveTimerRef.current) clearTimeout(serverAutosaveTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    isFormVisible,
    formDirty,
    editingId,
    showPreview,
    form,
    uploading,
    uploadingStoreImages,
    uploadingRecruiterImage,
  ]);


  if (showPreview) {
    const previewJob = buildPreviewJobFromAdminForm(form, {
      id: editingId ?? draftJobId,
    });
    return (
      <JobListingPreview
        job={previewJob}
        mode={editingId ? "edit" : "create"}
        variant={previewKind}
        listingStatus={editingListingStatus}
        submitting={loading}
        girlReviews={previewGirlReviews}
        onBack={handleBackFromPreview}
        onConfirm={
          previewKind === "publish"
            ? () => {
                void handleConfirmPublish();
              }
            : () => {
                void handleConfirmDraftSave();
              }
        }
      />
    );
  }

  return (
    <div>
      <header className="admin-page-header">
        <h1>求人管理</h1>
        <p>掲載店舗の検索、求人の追加・編集、公開状態の管理を行います。</p>
      </header>

      {message && (
        <p
          id="admin-jobs-message"
          className="mb-4 rounded-xl border border-gold/30 bg-gold-light/20 px-4 py-3 text-sm text-charcoal"
        >
          {message}
        </p>
      )}

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
                <div className="grid gap-4 sm:grid-cols-3">
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
                    <label htmlFor="status-filter" className={labelClass}>
                      公開状態
                    </label>
                    <select
                      id="status-filter"
                      value={statusFilter}
                      onChange={(event) => setStatusFilter(event.target.value)}
                      className={inputClass}
                    >
                      <option value="all">公開中 + 掲載停止</option>
                      <option value="published">公開中</option>
                      <option value="paused">掲載停止</option>
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
                <fieldset>
                  <legend className={labelClass}>掲載プラン</legend>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
                    {SEARCH_PLAN_FILTER_OPTIONS.map((option) => {
                      const checked = planFilters.includes(option.value);
                      return (
                        <label
                          key={option.value}
                          className="flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-gold/30 bg-ivory px-3 py-2.5 text-sm text-charcoal"
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => togglePlanFilter(option.value)}
                            className="h-4 w-4 shrink-0 accent-gold-dark"
                          />
                          <span>{option.label}</span>
                        </label>
                      );
                    })}
                  </div>
                  <p className="mt-1.5 text-xs text-muted">
                    複数選択できます。未選択の場合はすべてのプランが対象です。
                  </p>
                </fieldset>
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
                店舗名・エリア・公開状態・掲載プランのいずれかで絞り込んで検索してください
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
                            <p className="mt-1">
                              <span className="inline-flex rounded-full border border-black/10 bg-ivory px-2.5 py-0.5 text-xs font-semibold text-charcoal">
                                {
                                  JOB_LISTING_STATUS_LABELS[
                                    resolveJobListingStatus(job)
                                  ]
                                }
                              </span>
                            </p>
                            <p className="mt-1 text-xs font-medium text-gold-dark">
                              プラン：
                              {JOB_PLAN_DEFINITIONS[parseJobPlan(job.plan)].label}
                            </p>
                            {(() => {
                              const ranks = listingRanksByJobId[job.id];
                              const sapporoLabel =
                                ranks?.sapporoRank == null
                                  ? "—"
                                  : `${ranks.sapporoRank}位`;
                              const districtLabel =
                                ranks?.districtRank == null
                                  ? "—"
                                  : `${ranks.districtRank}位`;
                              return (
                                <p className="mt-1 text-xs text-muted">
                                  札幌内 {sapporoLabel}
                                  <span className="mx-1.5 text-gold/40" aria-hidden>
                                    /
                                  </span>
                                  {formatDistrictLabel(job.district)}内 {districtLabel}
                                </p>
                              );
                            })()}
                            <p className="mt-0.5 text-sm text-muted">{job.salary}</p>

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
                              onClick={() => {
                                void (async () => {
                                  if (!(await ensureAdminSession())) return;
                                  handleEdit(job);
                                })();
                              }}
                              className="rounded-full border border-gold/40 px-4 py-2 text-sm font-medium text-gold-dark hover:bg-ivory"
                            >
                              編集
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

      <section
        id="admin-draft-jobs"
        ref={jobsListAnchorRef}
        className="mt-3"
      >
        <button
          type="button"
          onClick={() => setIsDraftSearchOpen((open) => !open)}
          aria-expanded={isDraftSearchOpen}
          aria-controls="admin-draft-search-panel"
          className="flex w-full items-center justify-between gap-3 rounded-2xl border border-gold/30 bg-white px-4 py-3.5 text-left shadow-gold transition hover:bg-ivory/60 sm:px-5"
        >
          <span className="text-base font-semibold text-charcoal sm:text-lg">
            {isDraftSearchOpen ? "▼" : "▶"} 下書き店舗検索
            <span className="ml-2 text-sm font-normal text-muted">
              （{draftTotal.toLocaleString("ja-JP")}件）
            </span>
          </span>
        </button>

        {isDraftSearchOpen && (
          <div id="admin-draft-search-panel" className="mt-4 space-y-4">
            <div className="rounded-2xl border border-gold/25 bg-white p-4 shadow-gold sm:p-5">
              <h3 className="text-base font-semibold text-charcoal">
                下書きを検索
              </h3>
              <p className="mt-1 text-xs text-muted">
                下書き（draft）のみが対象です。修正して再保存、または公開できます。
              </p>
              <form
                className="mt-4 space-y-4"
                onSubmit={(event) => {
                  event.preventDefault();
                  void runDraftSearch();
                }}
              >
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <div>
                    <label htmlFor="draft-shop-name" className={labelClass}>
                      店舗名
                    </label>
                    <input
                      id="draft-shop-name"
                      type="search"
                      value={draftShopName}
                      onChange={(e) => setDraftShopName(e.target.value)}
                      className={inputClass}
                      placeholder="店舗名"
                    />
                  </div>
                  <div>
                    <label htmlFor="draft-area" className={labelClass}>
                      エリア
                    </label>
                    <select
                      id="draft-area"
                      value={draftArea}
                      onChange={(e) => setDraftArea(e.target.value)}
                      className={inputClass}
                    >
                      <option value="all">すべて</option>
                      {DISTRICTS.map((d) => (
                        <option key={d} value={d}>
                          {formatDistrictLabel(d)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="draft-job-type" className={labelClass}>
                      業種
                    </label>
                    <select
                      id="draft-job-type"
                      value={draftJobType}
                      onChange={(e) => setDraftJobType(e.target.value)}
                      className={inputClass}
                    >
                      <option value="all">すべて</option>
                      {JOB_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="draft-contact" className={labelClass}>
                      担当者名
                    </label>
                    <input
                      id="draft-contact"
                      type="search"
                      value={draftContactName}
                      onChange={(e) => setDraftContactName(e.target.value)}
                      className={inputClass}
                      placeholder="採用担当者名"
                    />
                  </div>
                  <div>
                    <label htmlFor="draft-created-from" className={labelClass}>
                      作成日（開始）
                    </label>
                    <input
                      id="draft-created-from"
                      type="date"
                      value={draftCreatedFrom}
                      onChange={(e) => setDraftCreatedFrom(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label htmlFor="draft-created-to" className={labelClass}>
                      作成日（終了）
                    </label>
                    <input
                      id="draft-created-to"
                      type="date"
                      value={draftCreatedTo}
                      onChange={(e) => setDraftCreatedTo(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label htmlFor="draft-updated-from" className={labelClass}>
                      最終更新日（開始）
                    </label>
                    <input
                      id="draft-updated-from"
                      type="date"
                      value={draftUpdatedFrom}
                      onChange={(e) => setDraftUpdatedFrom(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label htmlFor="draft-updated-to" className={labelClass}>
                      最終更新日（終了）
                    </label>
                    <input
                      id="draft-updated-to"
                      type="date"
                      value={draftUpdatedTo}
                      onChange={(e) => setDraftUpdatedTo(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={draftSearchLoading}
                  className="w-full rounded-full bg-gradient-to-r from-gold to-gold-dark px-5 py-3 text-sm font-semibold text-white shadow-gold disabled:opacity-60 sm:w-auto"
                >
                  {draftSearchLoading ? "検索中..." : "検索する"}
                </button>
              </form>
            </div>

            {!draftSearchPerformed || (draftSearchLoading && draftJobs.length === 0) ? (
              <div className="h-32 animate-pulse rounded-2xl border border-gold/20 bg-white" />
            ) : draftJobs.length === 0 ? (
              <div className="rounded-2xl border border-gold/20 bg-white px-4 py-10 text-center text-sm text-muted">
                保存中の下書きはありません
              </div>
            ) : (
              <>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-base font-semibold text-charcoal">
                    下書き一覧
                    <span className="ml-1 text-sm font-normal text-muted">
                      （{draftSearchTotal.toLocaleString("ja-JP")}件）
                    </span>
                  </h3>
                </div>
                <ul className="space-y-3">
                  {draftJobs.map((job) => {
                    const progress = computeJobDraftProgress(job);
                    return (
                      <li
                        key={job.id}
                        className="rounded-2xl border border-gold/20 bg-white p-4 shadow-gold sm:p-5"
                      >
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                          <div className="min-w-0 flex-1">
                            <p className="text-lg font-semibold text-charcoal">
                              {job.shopName?.trim() || "（店舗名未入力）"}
                            </p>
                            <dl className="mt-3 grid gap-1 text-sm sm:grid-cols-2">
                              <div className="flex flex-wrap gap-x-2">
                                <dt className="text-muted">エリア:</dt>
                                <dd>{formatDistrictLabel(job.district) || "—"}</dd>
                              </div>
                              <div className="flex flex-wrap gap-x-2">
                                <dt className="text-muted">業種:</dt>
                                <dd>{job.jobType || "—"}</dd>
                              </div>
                              <div className="flex flex-wrap gap-x-2">
                                <dt className="text-muted">作成日:</dt>
                                <dd>{formatAdminDateTime(job.createdAt)}</dd>
                              </div>
                              <div className="flex flex-wrap gap-x-2">
                                <dt className="text-muted">最終更新日:</dt>
                                <dd>{formatAdminDateTime(job.updatedAt)}</dd>
                              </div>
                              <div className="flex flex-wrap gap-x-2 sm:col-span-2">
                                <dt className="text-muted">入力進捗:</dt>
                                <dd className="font-medium text-charcoal">
                                  {progress.label}
                                </dd>
                              </div>
                              <div className="flex flex-wrap gap-x-2">
                                <dt className="text-muted">ステータス:</dt>
                                <dd>
                                  <span className="inline-flex rounded-full border border-black/10 bg-ivory px-2.5 py-0.5 text-xs font-semibold text-charcoal">
                                    下書き
                                  </span>
                                </dd>
                              </div>
                            </dl>
                          </div>
                          <div className="flex shrink-0 gap-2 lg:flex-col lg:items-end">
                            <button
                              type="button"
                              onClick={() => {
                                void (async () => {
                                  if (!(await ensureAdminSession())) return;
                                  handleEdit(job);
                                })();
                              }}
                              className="rounded-full border border-gold/40 px-4 py-2 text-sm font-medium text-gold-dark hover:bg-ivory"
                            >
                              修正する
                            </button>
                            <button
                              type="button"
                              onClick={() => void handleDelete(job)}
                              disabled={loading}
                              className="rounded-full border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-60"
                            >
                              削除する
                            </button>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </>
            )}
          </div>
        )}
      </section>

      {!editingId && (
        <button
          type="button"
          onClick={() => {
            if (isAddFormOpen && formDirty) {
              requestDiscardForm(() => closeEditor({ scrollToList: false }));
              return;
            }
            void (async () => {
              if (!isAddFormOpen && !(await ensureAdminSession())) return;
              setIsAddFormOpen((open) => !open);
            })();
          }}
          aria-expanded={isAddFormOpen}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-gold/35 bg-gradient-to-r from-gold to-gold-dark px-4 py-3.5 text-base font-semibold text-white shadow-gold transition hover:brightness-105 sm:py-4"
        >
          {isAddFormOpen ? "− 求人追加フォームを閉じる" : "＋ 求人を追加"}
        </button>
      )}

      {isFormVisible && (
      <section
        id="admin-job-editor"
        ref={editorSectionRef}
        className={`rounded-2xl border border-gold/25 bg-white p-5 shadow-gold sm:p-6 ${editingId ? "mt-4" : "mt-3"}`}
      >
          <form
            onSubmit={handleSubmit}
            className="space-y-4"
          >
            {editingId ? (
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="text-lg font-semibold text-charcoal">
                  求人を編集
                  {editingListingStatus === "draft" ? (
                    <span className="ml-2 text-sm font-normal text-muted">
                      （下書き）
                    </span>
                  ) : null}
                </h2>
                {autosaveStatus === "saving" || autosaveStatus === "saved" ? (
                  <p className="text-xs text-muted" aria-live="polite">
                    {autosaveStatus === "saving" ? "保存中…" : "下書き保存済み"}
                  </p>
                ) : null}
              </div>
            ) : autosaveStatus === "saving" || autosaveStatus === "saved" ? (
              <p className="text-xs text-muted" aria-live="polite">
                {autosaveStatus === "saving" ? "保存中…" : "下書き保存済み"}
              </p>
            ) : null}

        <div className="rounded-2xl border border-gold/30 bg-ivory/60 p-4 sm:p-5">
          <h3 className="text-base font-semibold text-charcoal">掲載プラン</h3>
          <p className="mt-1 text-xs text-muted sm:text-sm">
            プランを選ぶと表示順位・PickUp・AIおすすめ等が自動設定されます。店舗側では変更できません。
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
                    {definition.cardSubtitle}
                  </span>
                  {definition.cardNote ? (
                    <span className="mt-1 block text-xs text-muted">
                      {definition.cardNote}
                    </span>
                  ) : null}
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

        {!isUncontracted && (
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
        )}

        {!isUncontracted && (
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
        )}

        {!isUncontracted && (
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
        )}

        {!isUncontracted && (
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
        )}

        {!isUncontracted && (
        <div className="space-y-4 rounded-2xl border border-gold/40 bg-charcoal p-4 shadow-lg sm:p-5">
          <div className="border-b border-gold/35 pb-3">
            <h3 className="text-base font-semibold text-gold-light sm:text-lg">
              表示順位
            </h3>
            <p className="mt-1 text-xs text-white/75 sm:text-sm">
              公開中求人の実表示順位です（下書き・停止中は —）。プラン選択で自動設定されます。最優先へ変更すると条件一致ユーザーへPickUp店舗通知が自動送信されます（管理者のみ手動変更可）。
            </p>
          </div>
          <div className="rounded-xl border border-white/15 bg-white/10 p-4">
            <dl className="mb-4 grid gap-3 sm:grid-cols-2">
              <div>
                <dt className="text-xs text-gold-light/80">札幌内表示順位</dt>
                <dd className="mt-1 text-lg font-semibold text-white">
                  {editingListingRanks?.sapporoRank == null
                    ? "—"
                    : `${editingListingRanks.sapporoRank}位`}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-gold-light/80">
                  エリア内表示順位（{formatDistrictLabel(form.district) || "—"}）
                </dt>
                <dd className="mt-1 text-lg font-semibold text-white">
                  {editingListingRanks?.districtRank == null
                    ? "—"
                    : `${editingListingRanks.districtRank}位`}
                </dd>
              </div>
            </dl>
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
        )}

        <div className="space-y-4 rounded-2xl border border-gold/40 bg-charcoal p-4 shadow-lg sm:p-5">
          <div className="border-b border-gold/35 pb-3">
            <h3 className="text-base font-semibold text-gold-light sm:text-lg">
              アクセス・応募分析レポート
            </h3>
            <p className="mt-1 text-xs text-white/75 sm:text-sm">
              ライトは基本集計のみ、スタンダード・プレミアムは詳細クリック分析と改善レポートが利用できます。
            </p>
          </div>
          <div className="rounded-xl border border-white/15 bg-white/10 p-4">
            <p
              className={`inline-flex rounded-full px-3 py-1.5 text-sm font-semibold ${
                getPlanFeatures(form.plan).analytics
                  ? "border border-gold/40 bg-gold/20 text-gold-light"
                  : "border border-white/15 bg-white/5 text-white/80"
              }`}
            >
              {getPlanFeatures(form.plan).analytics
                ? "詳細レポート ON"
                : "基本集計のみ"}
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
                  {FIXED_AREA} / {formatDistrictLabel(district)}
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

        {!isUncontracted && (
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
        )}

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

        {!isUncontracted && (
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
        )}

        {!isUncontracted && (
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
        )}

        {!isUncontracted && (
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
        )}

        {!isUncontracted && (
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
        )}

        {!isUncontracted && (
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
            <p className={labelClass}>採用担当からのメッセージ</p>
            <p className="mb-4 text-xs text-muted">
              求人詳細ページの「女の子の口コミ」の下に表示されます。口コミは店舗ダッシュボードの「女の子の口コミ管理」から登録します（星評価はAI自動判定。手動修正は管理画面の口コミ評価管理）。
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
              <ImageUploadSizeHint className="mb-2 text-xs leading-relaxed text-muted" />
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
        )}

        <div className="rounded-2xl border border-gold/20 bg-ivory/40 p-4">
          <p className={labelClass}>店舗トップ画像</p>
          <p className="mb-3 text-xs text-muted">
            求人一覧カードと求人詳細ページ最上部に表示するメイン画像です。1枚のみ設定でき、差し替えも可能です。
          </p>
          <ImageUploadSizeHint className="mb-3 text-xs leading-relaxed text-muted" />
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

        {!isUncontracted && (
        <div className="rounded-2xl border border-gold/20 bg-ivory/40 p-4">
          <p className={labelClass}>店舗ギャラリー</p>
          <p className="mb-3 text-xs text-muted">
            求人詳細ページで店舗の雰囲気が分かる写真を複数枚表示します。
          </p>
          <ImageUploadSizeHint className="mb-3 text-xs leading-relaxed text-muted" />
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
        )}

        {!isUncontracted && (
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
        )}

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

        {!isUncontracted && (
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
        )}

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
              作成時に自動発行されます。管理者のみ確認でき、店舗へ伝えてください。
              DBにはAES暗号化して保存します（平文保存なし）。
            </p>
          </div>
          <div className="space-y-4">
            <div>
              <label className={labelClass}>店舗ログインID</label>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="text"
                  value={form.shopLoginId || (editingId ? "（未発行）" : "保存時に自動発行")}
                  readOnly
                  className={`${inputClass} font-mono`}
                />
                {form.shopLoginId ? (
                  <button
                    type="button"
                    className={
                      copiedKey === "shopLoginId"
                        ? "rounded-full border border-[#047a3b]/40 bg-[#047a3b]/10 px-3 py-2 text-xs font-semibold text-[#047a3b] transition"
                        : "rounded-full border border-gold/40 px-3 py-2 text-xs font-semibold text-gold-dark transition active:bg-gold/15"
                    }
                    onClick={() => {
                      void copyShopCredential(form.shopLoginId, "shopLoginId");
                    }}
                  >
                    {copiedKey === "shopLoginId" ? "✓ コピー済" : "コピー"}
                  </button>
                ) : null}
              </div>
            </div>
            <div>
              <label className={labelClass}>店舗ログインPW</label>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="text"
                  value={
                    form.shopLoginPassword ||
                    (editingId ? "（未発行／再発行で移行）" : "保存時に自動発行")
                  }
                  readOnly
                  className={`${inputClass} font-mono`}
                  spellCheck={false}
                />
                {form.shopLoginPassword ? (
                  <button
                    type="button"
                    className={
                      copiedKey === "shopLoginPassword"
                        ? "rounded-full border border-[#047a3b]/40 bg-[#047a3b]/10 px-3 py-2 text-xs font-semibold text-[#047a3b] transition"
                        : "rounded-full border border-gold/40 px-3 py-2 text-xs font-semibold text-gold-dark transition active:bg-gold/15"
                    }
                    onClick={() => {
                      void copyShopCredential(
                        form.shopLoginPassword,
                        "shopLoginPassword",
                      );
                    }}
                  >
                    {copiedKey === "shopLoginPassword" ? "✓ コピー済" : "コピー"}
                  </button>
                ) : null}
              </div>
              {editingId ? (
                <button
                  type="button"
                  disabled={reissuingPassword || !form.shopLoginId}
                  onClick={() => {
                    void (async () => {
                      if (
                        !editingId ||
                        !window.confirm(
                          "店舗ログインパスワードを再発行しますか？\n既存のパスワードは使えなくなります。",
                        )
                      ) {
                        return;
                      }
                      setReissuingPassword(true);
                      setMessage("");
                      try {
                        const data = await readJson<{
                          shopLoginId: string;
                          shopLoginPassword: string;
                          message?: string;
                        }>(
                          await fetch(
                            `/api/admin/jobs/${editingId}/reissue-shop-password`,
                            {
                              method: "POST",
                              credentials: "include",
                            },
                          ),
                        );
                        setField("shopLoginPassword", data.shopLoginPassword);
                        setCredentialsModal({
                          title: "パスワードを再発行しました",
                          shopLoginId: data.shopLoginId,
                          shopLoginPassword: data.shopLoginPassword,
                        });
                        setMessage(
                          data.message ??
                            "パスワードを再発行しました。店舗へ伝えてください。",
                        );
                      } catch (error) {
                        setMessage(
                          error instanceof Error
                            ? error.message
                            : "パスワード再発行に失敗しました。",
                        );
                      } finally {
                        setReissuingPassword(false);
                      }
                    })();
                  }}
                  className="mt-3 rounded-full bg-gradient-to-r from-gold to-gold-dark px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {reissuingPassword ? "再発行中..." : "パスワード再発行"}
                </button>
              ) : (
                <p className="mt-1 text-xs text-muted">
                  新規作成の保存時に ID・PW を自動発行します。
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 border-t border-gold/15 pt-4">
          {!(editingId && editingListingStatus === "published") ? (
            <button
              type="button"
              disabled={loading || uploading || uploadingStoreImages || uploadingRecruiterImage}
              onClick={() => void openPreview("draft")}
              className="rounded-full border border-gold/40 px-6 py-3 text-sm font-semibold text-gold-dark disabled:opacity-60"
            >
              {loading && pendingSaveIntent === "draft"
                ? "保存中..."
                : "下書き保存"}
            </button>
          ) : null}
          <button
            type="button"
            disabled={loading || uploading || uploadingStoreImages || uploadingRecruiterImage}
            onClick={() => {
              setMessage("");
              if (
                !form.shopName.trim() ||
                (!isUncontracted &&
                  (!form.salary.trim() || !form.lineUrl.trim()))
              ) {
                setMessage(
                  isUncontracted
                    ? "公開には店舗名が必要です。"
                    : "公開には店舗名・時給・LINE URLが必要です。",
                );
                const next: Record<string, string> = {};
                if (!form.shopName.trim()) next.shopName = "店名を入力してください。";
                if (!isUncontracted && !form.salary.trim())
                  next.salary = "時給を入力してください。";
                if (!isUncontracted && !form.lineUrl.trim())
                  next.lineUrl = "LINE応募URLを入力してください。";
                setFieldErrors(next);
                return;
              }
              void openPreview("publish");
            }}
            className="rounded-full bg-[#8f7344] px-6 py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            {loading &&
            (pendingSaveIntent === "publish" ||
              pendingSaveIntent === "republish")
              ? "公開中..."
              : editingId && editingListingStatus === "published"
                ? "更新する"
                : "公開する"}
          </button>
          {editingId && editingListingStatus === "published" ? (
            <button
              type="button"
              disabled={loading}
              onClick={() => void saveJob("pause").catch(() => undefined)}
              className="rounded-full border border-black/20 px-6 py-3 text-sm font-medium text-charcoal disabled:opacity-60"
            >
              {loading && pendingSaveIntent === "pause"
                ? "処理中..."
                : "掲載停止にする"}
            </button>
          ) : null}
          {editingId && editingListingStatus === "paused" ? (
            <button
              type="button"
              disabled={loading}
              onClick={() => void saveJob("republish").catch(() => undefined)}
              className="rounded-full border border-gold/40 px-6 py-3 text-sm font-medium text-gold-dark disabled:opacity-60"
            >
              {loading && pendingSaveIntent === "republish"
                ? "公開中..."
                : "再公開する"}
            </button>
          ) : null}
          <button
            type="button"
            disabled={loading}
            onClick={() =>
              requestDiscardForm(() => closeEditor({ scrollToList: true }))
            }
            className="rounded-full border border-gold/40 px-6 py-3 text-sm font-medium text-muted hover:text-charcoal disabled:opacity-60"
          >
            キャンセル
          </button>
        </div>
          </form>
      </section>
      )}

      {credentialsModal && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md space-y-4 rounded-2xl border border-gold/30 bg-white p-5 shadow-gold">
            <p className="text-base font-semibold text-gold-dark">
              {credentialsModal.title}
            </p>
            <p className="text-xs text-muted">
              店舗へこのID・パスワードを伝えてください。編集画面からもいつでも確認できます。
            </p>
            <div>
              <p className="text-xs text-muted">ログインID</p>
              <p className="mt-1 break-all font-mono text-sm">
                {credentialsModal.shopLoginId}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted">パスワード</p>
              <p className="mt-1 break-all font-mono text-sm">
                {credentialsModal.shopLoginPassword}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className={
                  copiedKey === "both"
                    ? "rounded-full border border-[#047a3b]/40 bg-[#047a3b]/10 px-4 py-2 text-xs font-semibold text-[#047a3b] transition"
                    : "rounded-full border border-gold/40 px-4 py-2 text-xs font-semibold text-gold-dark transition active:bg-gold/15"
                }
                onClick={() => {
                  void copyShopCredential(
                    `ID: ${credentialsModal.shopLoginId}\nPW: ${credentialsModal.shopLoginPassword}`,
                    "both",
                  );
                }}
              >
                {copiedKey === "both" ? "✓ コピー済" : "まとめてコピー"}
              </button>
              <button
                type="button"
                className="rounded-full bg-gradient-to-r from-gold to-gold-dark px-4 py-2 text-xs font-semibold text-white"
                onClick={() => setCredentialsModal(null)}
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}

      {copyToast && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed bottom-6 left-1/2 z-[90] -translate-x-1/2 rounded-full px-4 py-2.5 text-sm font-medium shadow-lg ${
            copyToast.tone === "success"
              ? "border border-[#047a3b]/30 bg-[#047a3b] text-white"
              : "border border-red-300 bg-red-600 text-white"
          }`}
        >
          {copyToast.message}
        </div>
      )}

    </div>
  );
}
