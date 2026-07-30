"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  formatJpyPrice,
  JOB_PLAN_DEFINITIONS,
  JOB_PLAN_MONTHLY_PRICES,
  JOB_PLANS,
  isJobPlan,
  type JobPlan,
} from "@/lib/job-plan";
import type {
  ListingAttachment,
  ListingDocumentMeta,
  ListingShopImage,
} from "@/lib/listing-application";

void (null as ListingAttachment | null);

const DRAFT_KEY = "wnj-listing-application-draft-v2";
const RETURN_STEP_KEY = "listingApplicationCurrentStep";
const RETURN_FORM_KEY = "listingApplicationFormData";
const RETURN_SCROLL_KEY = "listingApplicationScrollY";
const RETURN_PATH_KEY = "listingApplicationReturnPath";
const HEADER_OFFSET = 90;

const inputBase =
  "w-full rounded-xl border bg-ivory px-4 py-3 text-base text-charcoal outline-none transition focus:ring-2";
const inputOk = `${inputBase} border-gold/30 focus:border-gold focus:ring-gold/20`;
const inputErr = `${inputBase} border-red-500 focus:border-red-500 focus:ring-red-200`;
const labelClass = "mb-1.5 block text-sm font-medium text-charcoal";
const sectionClass =
  "space-y-4 rounded-2xl border border-gold/25 bg-white p-5 shadow-sm sm:p-6";
const errTextClass = "mt-1.5 text-sm font-medium text-red-600";

const STEPS = [
  { id: 1, title: "??????" },
  { id: 2, title: "?????" },
  { id: 3, title: "SNS?Web??" },
  { id: 4, title: "???????" },
  { id: 5, title: "?????" },
  { id: 6, title: "????" },
  { id: 7, title: "????" },
  { id: 8, title: "????" },
] as const;

const DOC_ACCEPT =
  ".pdf,.jpeg,.jpg,.png,.heic,image/jpeg,image/png,image/heic,application/pdf";
const SHOP_IMAGE_ACCEPT =
  "image/jpeg,image/png,image/webp,image/heic,image/heif,.jpg,.jpeg,.png,.webp,.heic,.heif";

type LocalFileInfo = {
  name: string;
  size: number;
  type: string;
  previewUrl: string | null;
};

type DocKey =
  | "businessLicenseDocument"
  | "entertainmentLicenseDocument"
  | "lateNightAlcoholNotificationDocument";

type FormState = {
  shopName: string;
  shopAddress: string;
  area: string;
  businessType: string;
  businessHours: string;
  shopPhone: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  websiteUrl: string;
  instagramUrl: string;
  xUrl: string;
  tiktokUrl: string;
  lineOfficialUrl: string;
  youtubeUrl: string;
  otherSns: string;
  businessLicenseDocument: ListingDocumentMeta | null;
  entertainmentLicenseDocument: ListingDocumentMeta | null;
  lateNightAlcoholNotificationDocument: ListingDocumentMeta | null;
  openDate: string;
  requestedPlan: JobPlan | "";
  consentAccuracy: boolean;
  consentTerms: boolean;
  shopExteriorImages: ListingShopImage[];
  shopInteriorImages: ListingShopImage[];
  website: string;
};

type FieldKey = keyof FormState;
type FieldError = Partial<Record<FieldKey, string>>;

type LocalFilesState = Record<DocKey, LocalFileInfo | null>;

const EMPTY: FormState = {
  shopName: "",
  shopAddress: "",
  area: "",
  businessType: "",
  businessHours: "",
  shopPhone: "",
  contactName: "",
  contactPhone: "",
  contactEmail: "",
  websiteUrl: "",
  instagramUrl: "",
  xUrl: "",
  tiktokUrl: "",
  lineOfficialUrl: "",
  youtubeUrl: "",
  otherSns: "",
  businessLicenseDocument: null,
  entertainmentLicenseDocument: null,
  lateNightAlcoholNotificationDocument: null,
  openDate: "",
  requestedPlan: "",
  consentAccuracy: false,
  consentTerms: false,
  shopExteriorImages: [],
  shopInteriorImages: [],
  website: "",
};

const EMPTY_LOCAL: LocalFilesState = {
  businessLicenseDocument: null,
  entertainmentLicenseDocument: null,
  lateNightAlcoholNotificationDocument: null,
};

export function planNameJa(plan: JobPlan): string {
  return `${JOB_PLAN_DEFINITIONS[plan].label}???`;
}

export function planPriceJa(plan: JobPlan): string {
  return `?? ${formatJpyPrice(JOB_PLAN_MONTHLY_PRICES[plan])}????`;
}

export function formatBytes(size: number): string {
  if (!Number.isFinite(size) || size < 0) return "?";
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export function revokeUrl(url: string | null | undefined) {
  if (url && url.startsWith("blob:")) {
    try {
      URL.revokeObjectURL(url);
    } catch {
      /* ignore */
    }
  }
}

function loadDraft(): FormState | null {
  try {
    const raw = window.localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<FormState>;
    return {
      ...EMPTY,
      ...parsed,
      shopExteriorImages: Array.isArray(parsed.shopExteriorImages)
        ? parsed.shopExteriorImages
        : [],
      shopInteriorImages: Array.isArray(parsed.shopInteriorImages)
        ? parsed.shopInteriorImages
        : [],
      requestedPlan: isJobPlan(parsed.requestedPlan) ? parsed.requestedPlan : "",
      businessLicenseDocument: parsed.businessLicenseDocument ?? null,
      entertainmentLicenseDocument: parsed.entertainmentLicenseDocument ?? null,
      lateNightAlcoholNotificationDocument:
        parsed.lateNightAlcoholNotificationDocument ?? null,
    };
  } catch {
    return null;
  }
}

function scrollToStepHeader() {
  requestAnimationFrame(() => {
    const element = document.getElementById("application-step-header");
    if (!element) return;
    const targetTop = Math.max(
      0,
      element.getBoundingClientRect().top + window.scrollY - HEADER_OFFSET,
    );
    const canSmooth =
      typeof CSS !== "undefined" &&
      typeof CSS.supports === "function" &&
      CSS.supports("scroll-behavior", "smooth");
    try {
      window.scrollTo({
        top: targetTop,
        behavior: canSmooth ? "smooth" : "auto",
      });
    } catch {
      window.scrollTo(0, targetTop);
    }
  });
}

function focusFirstError(container: HTMLElement | null) {
  if (!container) return;
  setTimeout(() => {
    const el = container.querySelector<HTMLElement>(
      "[data-error-field] input, [data-error-field] textarea, [data-error-field] select, [data-error-field] button",
    );
    el?.focus({ preventScroll: true });
  }, 80);
}

function fileFormatLabel(info: { name: string; type: string }): string {
  const ext = info.name.split(".").pop()?.toUpperCase();
  if (ext) return ext;
  if (info.type) return info.type;
  return "FILE";
}

function toHalfWidthDigits(value: string): string {
  return value.replace(/[０-９]/g, (d) =>
    String.fromCharCode(d.charCodeAt(0) - 0xfee0),
  );
}

function normalizePhoneNumber(value: string): string {
  return toHalfWidthDigits(value)
    .replace(/[\s\-－ー―‐]/g, "")
    .trim();
}

function isAsciiEmail(value: string): boolean {
  return /^[\x00-\x7F]+$/.test(value);
}

function isValidEmail(value: string): boolean {
  const v = value.trim();
  if (!v || !isAsciiEmail(v) || /\s/.test(v)) return false;
  const at = v.indexOf("@");
  if (at <= 0 || at !== v.lastIndexOf("@")) return false;
  const local = v.slice(0, at);
  const domain = v.slice(at + 1);
  if (!local || !domain || !domain.includes(".")) return false;
  if (domain.startsWith(".") || domain.endsWith(".")) return false;
  return true;
}

function isValidJapanesePhoneNumber(value: string): boolean {
  const normalized = normalizePhoneNumber(value);
  return /^0\d{9,10}$/.test(normalized);
}

function isValidInternationalPhoneNumber(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed.startsWith("+")) return false;
  const normalized = toHalfWidthDigits(trimmed).replace(/[\s\-－ー―‐()（）]/g, "");
  return /^\+\d{8,15}$/.test(normalized);
}

function isValidPhoneNumber(value: string): boolean {
  return (
    isValidJapanesePhoneNumber(value) || isValidInternationalPhoneNumber(value)
  );
}

function validateStep(
  step: number,
  form: FormState,
  localFiles?: LocalFilesState,
): FieldError {
  const errors: FieldError = {};
  if (step === 1) {
    if (!form.shopName.trim()) errors.shopName = "店舗名を入力してください。";
    if (!form.shopAddress.trim())
      errors.shopAddress = "店舗住所を入力してください。";
    if (!form.businessType.trim())
      errors.businessType = "業種を入力してください。";
    if (!form.businessHours.trim())
      errors.businessHours = "営業時間を入力してください。";
    if (!form.shopPhone.trim()) {
      errors.shopPhone = "店舗電話番号を入力してください。";
    } else if (!isValidPhoneNumber(form.shopPhone)) {
      errors.shopPhone = "店舗電話番号の形式が正しくありません";
    }
  }
  if (step === 2) {
    if (!form.contactName.trim())
      errors.contactName = "担当者名を入力してください。";
    if (!form.contactPhone.trim()) {
      errors.contactPhone = "担当者電話番号を入力してください。";
    } else if (!isValidPhoneNumber(form.contactPhone)) {
      errors.contactPhone = "担当者電話番号の形式が正しくありません";
    }
    if (!form.contactEmail.trim()) {
      errors.contactEmail = "担当者メールアドレスを入力してください。";
    } else if (!isValidEmail(form.contactEmail)) {
      errors.contactEmail = "メールアドレスの形式が正しくありません";
    }
  }
  if (step === 3) {
    const url = form.websiteUrl.trim();
    if (!url) {
      errors.websiteUrl =
        "公式WebサイトまたはSNSのURLを入力してください。";
    } else if (!/^https?:\/\/.+/i.test(url)) {
      errors.websiteUrl = "正しいURLを入力してください。";
    }
  }
  if (step === 4) {
    const hasLocal = Boolean(localFiles?.businessLicenseDocument);
    const hasUploaded = Boolean(form.businessLicenseDocument?.storagePath);
    if (!hasLocal && !hasUploaded) {
      errors.businessLicenseDocument =
        "営業許可証をアップロードしてください。";
    }
    if (!form.openDate.trim()) errors.openDate = "オープン日を入力してください。";
  }
  if (step === 5) {
    if (!isJobPlan(form.requestedPlan)) {
      errors.requestedPlan = "料金プランを選択してください";
    }
  }
  if (step === 6) {
    if (!form.consentAccuracy) {
      errors.consentAccuracy =
        "求人内容と実際の勤務条件に相違がないことへの同意が必要です。";
    }
    if (!form.consentTerms) {
      errors.consentTerms =
        "利用規約・プライバシーポリシーへの同意が必要です。";
    }
  }
  if (step === 7) {
    const exteriorEmpty = form.shopExteriorImages.length === 0;
    const interiorEmpty = form.shopInteriorImages.length === 0;
    if (exteriorEmpty && interiorEmpty) {
      errors.shopExteriorImages =
        "店舗外観と店舗内観の画像をアップロードしてください";
    } else if (exteriorEmpty) {
      errors.shopExteriorImages =
        "店舗外観の画像をアップロードしてください";
    } else if (interiorEmpty) {
      errors.shopInteriorImages =
        "店舗内観の画像をアップロードしてください";
    }
  }
  return errors;
}

function Field({
  error,
  children,
}: {
  error?: string;
  children: ReactNode;
}) {
  return (
    <div data-error-field={error ? "1" : undefined}>
      {children}
      {error ? <p className={errTextClass}>{error}</p> : null}
    </div>
  );
}

export function ListingApplicationForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [localFiles, setLocalFiles] = useState<LocalFilesState>(EMPTY_LOCAL);
  const [hydrated, setHydrated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [navigating, setNavigating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldError>({});
  const [duplicateWarning, setDuplicateWarning] = useState(false);
  const [draftId, setDraftId] = useState(() => crypto.randomUUID());
  const formOpenedAt = useRef(Date.now());
  const sectionRef = useRef<HTMLDivElement>(null);
  const shouldScrollRef = useRef(false);
  const submittingRef = useRef(false);
  const restoredFromReturnRef = useRef(false);
  const restoreScrollYRef = useRef<number | null>(null);
  const docInputRefs = useRef<Record<DocKey, HTMLInputElement | null>>({
    businessLicenseDocument: null,
    entertainmentLicenseDocument: null,
    lateNightAlcoholNotificationDocument: null,
  });
  const exteriorInputRef = useRef<HTMLInputElement | null>(null);
  const interiorInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const draft = loadDraft();
    let restoredFromReturn = false;
    let restoredStep: number | null = null;
    let restoredScrollY: number | null = null;
    let restoredForm: Partial<FormState> | null = null;
    try {
      const returnPath = window.sessionStorage.getItem(RETURN_PATH_KEY);
      if (returnPath === "/for-shops/apply") {
        const rawStep = window.sessionStorage.getItem(RETURN_STEP_KEY);
        const rawScrollY = window.sessionStorage.getItem(RETURN_SCROLL_KEY);
        const rawForm = window.sessionStorage.getItem(RETURN_FORM_KEY);
        const parsedStep = Number(rawStep);
        const parsedScrollY = Number(rawScrollY);
        if (Number.isFinite(parsedStep)) {
          restoredStep = Math.min(STEPS.length, Math.max(1, Math.floor(parsedStep)));
        }
        if (Number.isFinite(parsedScrollY) && parsedScrollY >= 0) {
          restoredScrollY = parsedScrollY;
        }
        if (rawForm) {
          restoredForm = JSON.parse(rawForm) as Partial<FormState>;
        }
        restoredFromReturn = true;
      }
    } catch {
      restoredFromReturn = false;
    } finally {
      window.sessionStorage.removeItem(RETURN_PATH_KEY);
      window.sessionStorage.removeItem(RETURN_STEP_KEY);
      window.sessionStorage.removeItem(RETURN_SCROLL_KEY);
      window.sessionStorage.removeItem(RETURN_FORM_KEY);
    }
    const planParam = searchParams.get("plan");
    const planFromUrl = isJobPlan(planParam) ? planParam : null;
    if (restoredForm) {
      const merged = {
        ...EMPTY,
        ...(draft ?? {}),
        ...restoredForm,
      } as FormState;
      setForm({
        ...merged,
        shopExteriorImages: Array.isArray(merged.shopExteriorImages)
          ? merged.shopExteriorImages
          : [],
        shopInteriorImages: Array.isArray(merged.shopInteriorImages)
          ? merged.shopInteriorImages
          : [],
        requestedPlan: isJobPlan(merged.requestedPlan) ? merged.requestedPlan : "",
        businessLicenseDocument: merged.businessLicenseDocument ?? null,
        entertainmentLicenseDocument: merged.entertainmentLicenseDocument ?? null,
        lateNightAlcoholNotificationDocument:
          merged.lateNightAlcoholNotificationDocument ?? null,
      });
    } else if (draft) {
      setForm({
        ...draft,
        requestedPlan: planFromUrl ?? draft.requestedPlan,
      });
    } else if (planFromUrl) {
      setForm((c) => ({ ...c, requestedPlan: planFromUrl }));
    }
    if (restoredStep) {
      setStep(restoredStep);
      restoredFromReturnRef.current = restoredFromReturn;
      restoreScrollYRef.current = restoredScrollY;
    }
    setHydrated(true);
  }, [searchParams]);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(DRAFT_KEY, JSON.stringify(form));
  }, [form, hydrated]);

  useEffect(() => {
    if (!shouldScrollRef.current) return;
    shouldScrollRef.current = false;
    scrollToStepHeader();
  }, [step]);

  useEffect(() => {
    if (!hydrated || !restoredFromReturnRef.current) return;
    restoredFromReturnRef.current = false;
    requestAnimationFrame(() => {
      if (restoreScrollYRef.current != null) {
        const y = Math.max(0, restoreScrollYRef.current);
        restoreScrollYRef.current = null;
        window.scrollTo({ top: y, behavior: "auto" });
      } else {
        scrollToStepHeader();
      }
    });
  }, [hydrated, step]);

  useEffect(() => {
    return () => {
      revokeUrl(localFiles.businessLicenseDocument?.previewUrl);
      revokeUrl(localFiles.entertainmentLicenseDocument?.previewUrl);
      revokeUrl(localFiles.lateNightAlcoholNotificationDocument?.previewUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const progress = useMemo(
    () => Math.round((step / STEPS.length) * 100),
    [step],
  );

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((c) => ({ ...c, [key]: value }));
    if (fieldErrors[key]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  }

  function goNext() {
    if (navigating || uploading || loading) return;
    setNavigating(true);
    const errors = validateStep(step, form, localFiles);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setSubmitMessage(
        "????????????????????????????",
      );
      scrollToStepHeader();
      focusFirstError(sectionRef.current);
      setNavigating(false);
      return;
    }
    setFieldErrors({});
    setSubmitMessage("");
    shouldScrollRef.current = true;
    setStep((c) => Math.min(STEPS.length, c + 1));
    setNavigating(false);
  }

  function goBack() {
    if (navigating || uploading || loading) return;
    setNavigating(true);
    setFieldErrors({});
    setSubmitMessage("");
    shouldScrollRef.current = true;
    setStep((c) => Math.max(1, c - 1));
    setNavigating(false);
  }

  function saveReturnStateForLegal() {
    try {
      window.sessionStorage.setItem(RETURN_PATH_KEY, "/for-shops/apply");
      window.sessionStorage.setItem(RETURN_STEP_KEY, String(step));
      window.sessionStorage.setItem(RETURN_FORM_KEY, JSON.stringify(form));
      window.sessionStorage.setItem(RETURN_SCROLL_KEY, String(window.scrollY));
    } catch {
      // ignore storage errors and continue navigation
    }
  }

  async function uploadDocument(file: File, key: DocKey) {
    const docType =
      key === "businessLicenseDocument"
        ? "business-license"
        : key === "entertainmentLicenseDocument"
          ? "entertainment-license"
          : "late-night-alcohol-notification";

    const previewUrl = file.type.startsWith("image/")
      ? URL.createObjectURL(file)
      : null;
    const localInfo: LocalFileInfo = {
      name: file.name,
      size: file.size,
      type: file.type,
      previewUrl,
    };

    setLocalFiles((prev) => {
      revokeUrl(prev[key]?.previewUrl);
      return { ...prev, [key]: localInfo };
    });
    if (fieldErrors[key]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }

    setUploading(true);
    setSubmitMessage("");
    try {
      const body = new FormData();
      body.append("file", file);
      body.append("draftId", draftId);
      body.append("docType", docType);
      const res = await fetch("/api/listing-applications/upload", {
        method: "POST",
        body,
      });
      const data = (await res.json()) as {
        message?: string;
        draftId?: string;
        document?: ListingDocumentMeta;
      };
      if (!res.ok) {
        throw new Error(data.message ?? "??????????????");
      }
      if (data.draftId) setDraftId(data.draftId);
      if (data.document) {
        update(key, data.document);
      }
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "?????????????????????????????";
      setSubmitMessage(
        message.includes("????????????????")
          ? "????????????????????????????????"
          : "?????????????????????????????",
      );
      scrollToStepHeader();
    } finally {
      setUploading(false);
    }
  }

  function clearDocument(key: DocKey) {
    setLocalFiles((prev) => {
      revokeUrl(prev[key]?.previewUrl);
      return { ...prev, [key]: null };
    });
    update(key, null);
  }

  async function uploadShopImage(
    file: File,
    kind: "exterior" | "interior",
  ) {
    const max = kind === "exterior" ? 5 : 10;
    const current =
      kind === "exterior" ? form.shopExteriorImages : form.shopInteriorImages;
    if (current.length >= max) {
      setSubmitMessage(
        kind === "exterior"
          ? "???????5??????"
          : "???????10??????",
      );
      scrollToStepHeader();
      return;
    }

    setUploading(true);
    setSubmitMessage("");
    try {
      const body = new FormData();
      body.append("file", file);
      body.append("draftId", draftId);
      body.append(
        "docType",
        kind === "exterior" ? "shop-exterior" : "shop-interior",
      );
      body.append("sortOrder", String(current.length));
      const res = await fetch("/api/listing-applications/upload", {
        method: "POST",
        body,
      });
      const data = (await res.json()) as {
        message?: string;
        draftId?: string;
        image?: ListingShopImage;
      };
      if (!res.ok) {
        throw new Error(data.message ?? "??????????????");
      }
      if (data.draftId) setDraftId(data.draftId);
      if (data.image) {
        if (kind === "exterior") {
          update("shopExteriorImages", [...form.shopExteriorImages, data.image]);
          if (fieldErrors.shopExteriorImages) {
            setFieldErrors((prev) => {
              const next = { ...prev };
              delete next.shopExteriorImages;
              delete next.shopInteriorImages;
              return next;
            });
          }
        } else {
          update("shopInteriorImages", [...form.shopInteriorImages, data.image]);
          if (fieldErrors.shopInteriorImages || fieldErrors.shopExteriorImages) {
            setFieldErrors((prev) => {
              const next = { ...prev };
              delete next.shopExteriorImages;
              delete next.shopInteriorImages;
              return next;
            });
          }
        }
      }
    } catch (e) {
      setSubmitMessage(
        e instanceof Error ? e.message : "??????????????",
      );
      scrollToStepHeader();
    } finally {
      setUploading(false);
    }
  }

  function removeShopImage(kind: "exterior" | "interior", storagePath: string) {
    if (kind === "exterior") {
      update(
        "shopExteriorImages",
        form.shopExteriorImages.filter((img) => img.storagePath !== storagePath),
      );
    } else {
      update(
        "shopInteriorImages",
        form.shopInteriorImages.filter((img) => img.storagePath !== storagePath),
      );
    }
  }

  async function submit(confirmDuplicate = false) {
    if (submittingRef.current) return;

    const step1Errors = validateStep(1, form, localFiles);
    if (Object.keys(step1Errors).length > 0) {
      setFieldErrors(step1Errors);
      setSubmitMessage(
        "入力内容にエラーがあります。赤字の項目をご確認ください。",
      );
      shouldScrollRef.current = true;
      setStep(1);
      return;
    }

    const step2Errors = validateStep(2, form, localFiles);
    if (Object.keys(step2Errors).length > 0) {
      setFieldErrors(step2Errors);
      setSubmitMessage(
        "入力内容にエラーがあります。赤字の項目をご確認ください。",
      );
      shouldScrollRef.current = true;
      setStep(2);
      return;
    }

    const consentErrors = validateStep(6, form, localFiles);
    if (Object.keys(consentErrors).length > 0) {
      setFieldErrors(consentErrors);
      setSubmitMessage(
        "入力内容にエラーがあります。赤字の項目をご確認ください。",
      );
      shouldScrollRef.current = true;
      setStep(6);
      return;
    }
    if (!isJobPlan(form.requestedPlan)) {
      setFieldErrors({ requestedPlan: "料金プランを選択してください" });
      setSubmitMessage("料金プランを選択してください");
      shouldScrollRef.current = true;
      setStep(5);
      return;
    }
    const imageErrors = validateStep(7, form, localFiles);
    if (Object.keys(imageErrors).length > 0) {
      setFieldErrors(imageErrors);
      setSubmitMessage(
        "入力内容にエラーがあります。赤字の項目をご確認ください。",
      );
      shouldScrollRef.current = true;
      setStep(7);
      return;
    }

    submittingRef.current = true;
    setLoading(true);
    setSubmitMessage("");
    try {
      const res = await fetch("/api/listing-applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          formOpenedAt: formOpenedAt.current,
          confirmDuplicate,
        }),
      });
      const data = (await res.json()) as {
        message?: string;
        duplicateWarning?: boolean;
        applicationNumber?: string;
      };
      if (res.status === 409 && data.duplicateWarning) {
        setDuplicateWarning(true);
        setSubmitMessage(
          data.message ?? "????????????????",
        );
        scrollToStepHeader();
        return;
      }
      if (!res.ok) throw new Error(data.message ?? "??????????");
      window.localStorage.removeItem(DRAFT_KEY);
      router.push(
        `/for-shops/apply/complete?no=${encodeURIComponent(data.applicationNumber ?? "")}`,
      );
    } catch (e) {
      setSubmitMessage(e instanceof Error ? e.message : "??????????");
      scrollToStepHeader();
    } finally {
      setLoading(false);
      submittingRef.current = false;
    }
  }

  function renderDocUploader(
    key: DocKey,
    label: string,
    required: boolean,
    hint?: string,
  ) {
    const local = localFiles[key];
    const uploaded = form[key];
    const hasFile = Boolean(local || uploaded);
    const displayName = local?.name ?? uploaded?.fileName ?? "";
    const displayType = local
      ? fileFormatLabel(local)
      : uploaded
        ? fileFormatLabel({ name: uploaded.fileName, type: uploaded.mimeType })
        : "";
    const displaySize = local?.size ?? uploaded?.size ?? 0;
    const preview =
      local?.previewUrl ??
      (uploaded?.mimeType?.startsWith("image/") ? uploaded.signedUrl : null) ??
      null;
    const error = fieldErrors[key];

    return (
      <Field error={error}>
        <label className={labelClass}>
          {label}
          {required ? " *" : "????"}
        </label>
        {hint ? <p className="mb-1 text-xs text-muted">{hint}</p> : null}
        <input
          ref={(el) => {
            docInputRefs.current[key] = el;
          }}
          type="file"
          accept={DOC_ACCEPT}
          className="sr-only absolute h-0 w-0 opacity-0"
          tabIndex={-1}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void uploadDocument(file, key);
            e.target.value = "";
          }}
        />
        {!hasFile ? (
          <button
            type="button"
            disabled={uploading || loading}
            onClick={() => docInputRefs.current[key]?.click()}
            className={`rounded-xl border px-4 py-3 text-sm font-medium transition ${
              error
                ? "border-red-500 text-red-700"
                : "border-gold/40 text-gold-dark hover:bg-ivory"
            } disabled:opacity-60`}
          >
            ???????
          </button>
        ) : (
          <div className="rounded-xl border border-gold/25 bg-ivory/60 p-3">
            <div className="flex flex-wrap items-start gap-3">
              {preview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={preview}
                  alt={displayName}
                  className="h-20 w-20 rounded-lg object-cover"
                />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-lg bg-white text-xs text-muted">
                  {displayType}
                </div>
              )}
              <div className="min-w-0 flex-1 space-y-1 text-sm">
                <p className="truncate font-medium text-charcoal">{displayName}</p>
                <p className="text-xs text-muted">
                  ??: {displayType} / ???: {formatBytes(displaySize)}
                </p>
                {uploaded?.storagePath ? (
                  <p className="text-xs text-muted">????????</p>
                ) : uploading ? (
                  <p className="text-xs text-muted">???????...</p>
                ) : null}
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={uploading || loading}
                onClick={() => docInputRefs.current[key]?.click()}
                className="rounded-full border border-gold/40 px-3 py-1.5 text-xs font-medium text-gold-dark disabled:opacity-60"
              >
                ????
              </button>
              <button
                type="button"
                disabled={uploading || loading}
                onClick={() => clearDocument(key)}
                className="rounded-full border border-red-300 px-3 py-1.5 text-xs font-medium text-red-600 disabled:opacity-60"
              >
                ????
              </button>
            </div>
          </div>
        )}
      </Field>
    );
  }

  function renderShopImageSection(
    kind: "exterior" | "interior",
    title: string,
    description: string,
    max: number,
  ) {
    const images =
      kind === "exterior" ? form.shopExteriorImages : form.shopInteriorImages;
    const inputRef = kind === "exterior" ? exteriorInputRef : interiorInputRef;
    const errorKey =
      kind === "exterior" ? "shopExteriorImages" : "shopInteriorImages";
    const error = fieldErrors[errorKey] ?? fieldErrors.shopExteriorImages;

    return (
      <div
        className="space-y-3"
        data-error-field={
          kind === "exterior"
            ? fieldErrors.shopExteriorImages
              ? "1"
              : undefined
            : fieldErrors.shopInteriorImages ||
                (fieldErrors.shopExteriorImages &&
                  form.shopExteriorImages.length > 0 &&
                  form.shopInteriorImages.length === 0)
              ? "1"
              : undefined
        }
      >
        <div>
          <h3 className="text-sm font-semibold text-charcoal">{title}</h3>
          <p className="mt-1 text-xs text-muted">{description}</p>
        </div>
        {kind === "exterior" && error ? (
          <p className={errTextClass}>{error}</p>
        ) : null}
        {kind === "interior" && fieldErrors.shopInteriorImages ? (
          <p className={errTextClass}>{fieldErrors.shopInteriorImages}</p>
        ) : null}
        <input
          ref={inputRef}
          type="file"
          accept={SHOP_IMAGE_ACCEPT}
          className="sr-only absolute h-0 w-0 opacity-0"
          tabIndex={-1}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void uploadShopImage(file, kind);
            e.target.value = "";
          }}
        />
        <div className="grid grid-cols-2 gap-3">
          {images.map((img) => (
            <div
              key={img.storagePath}
              className="overflow-hidden rounded-xl border border-gold/25 bg-white"
            >
              <button
                type="button"
                className="block w-full"
                onClick={() => {
                  if (img.signedUrl) window.open(img.signedUrl, "_blank");
                }}
              >
                {img.signedUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={img.signedUrl}
                    alt={img.fileName}
                    className="aspect-square w-full object-cover"
                  />
                ) : (
                  <div className="flex aspect-square items-center justify-center bg-ivory text-xs text-muted">
                    ???????
                  </div>
                )}
              </button>
              <div className="space-y-1 p-2">
                <p className="truncate text-xs font-medium text-charcoal">
                  {img.fileName}
                </p>
                <p className="text-[11px] text-muted">{formatBytes(img.size)}</p>
                <button
                  type="button"
                  disabled={uploading || loading}
                  onClick={() => removeShopImage(kind, img.storagePath)}
                  className="text-xs text-red-600 disabled:opacity-60"
                >
                  ??
                </button>
              </div>
            </div>
          ))}
          {images.length < max ? (
            <button
              type="button"
              disabled={uploading || loading}
              onClick={() => inputRef.current?.click()}
              className="flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-gold/40 bg-ivory/50 text-sm text-gold-dark disabled:opacity-60"
            >
              <span className="text-lg leading-none">?</span>
              <span>??</span>
              <span className="text-[11px] text-muted">
                {images.length}/{max}
              </span>
            </button>
          ) : null}
        </div>
      </div>
    );
  }

  if (!hydrated) {
    return (
      <p className="rounded-xl border border-gold/20 bg-white px-4 py-6 text-sm text-muted">
        ?????...
      </p>
    );
  }

  const fe = fieldErrors;
  const selectedPlan = isJobPlan(form.requestedPlan)
    ? form.requestedPlan
    : null;

  return (
    <div className="space-y-5">
      <div
        id="application-step-header"
        style={{ scrollMarginTop: `${HEADER_OFFSET}px` }}
      >
        <div className="mb-2 flex items-center justify-between text-xs text-muted">
          <span>
            ???? {step} / {STEPS.length}?{STEPS[step - 1]?.title}
          </span>
          <span>{progress}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-gold/15">
          <div
            className="h-full rounded-full bg-gradient-to-r from-gold to-gold-dark transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {submitMessage ? (
        <p
          role="alert"
          className={`rounded-xl border px-4 py-3 text-sm font-medium ${
            Object.keys(fe).length > 0
              ? "border-red-300 bg-red-50 text-red-700"
              : "border-gold/30 bg-white text-charcoal"
          }`}
        >
          {submitMessage}
        </p>
      ) : null}

      {duplicateWarning ? (
        <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-charcoal">
          <p>
            ???????????????????????????????????????
          </p>
          <button
            type="button"
            disabled={loading}
            onClick={() => void submit(true)}
            className="mt-3 rounded-full bg-charcoal px-4 py-2 text-xs font-medium text-white disabled:opacity-60"
          >
            ???????????
          </button>
        </div>
      ) : null}

      <div
        className="absolute -left-[9999px] h-0 w-0 overflow-hidden"
        aria-hidden
      >
        <label>
          website
          <input
            tabIndex={-1}
            autoComplete="off"
            value={form.website}
            onChange={(e) => update("website", e.target.value)}
          />
        </label>
      </div>

      <div ref={sectionRef}>
        {step === 1 ? (
          <section className={sectionClass}>
            <h2 className="font-serif text-lg text-charcoal">1. ??????</h2>
            <Field error={fe.shopName}>
              <label className={labelClass}>??? *</label>
              <input
                className={fe.shopName ? inputErr : inputOk}
                value={form.shopName}
                onChange={(e) => update("shopName", e.target.value)}
              />
            </Field>
            <Field error={fe.shopAddress}>
              <label className={labelClass}>???? *</label>
              <input
                className={fe.shopAddress ? inputErr : inputOk}
                value={form.shopAddress}
                onChange={(e) => update("shopAddress", e.target.value)}
                placeholder="???????????????"
              />
            </Field>
            <Field>
              <label className={labelClass}>???????</label>
              <input
                className={inputOk}
                value={form.area}
                onChange={(e) => update("area", e.target.value)}
                placeholder="??????"
              />
            </Field>
            <Field error={fe.businessType}>
              <label className={labelClass}>?? *</label>
              <input
                className={fe.businessType ? inputErr : inputOk}
                value={form.businessType}
                onChange={(e) => update("businessType", e.target.value)}
                placeholder="????????"
              />
            </Field>
            <Field error={fe.businessHours}>
              <label className={labelClass}>???? *</label>
              <input
                className={fe.businessHours ? inputErr : inputOk}
                value={form.businessHours}
                onChange={(e) => update("businessHours", e.target.value)}
                placeholder="??20:00?LAST"
              />
            </Field>
            <Field error={fe.shopPhone}>
              <label className={labelClass}>?????? *</label>
              <input
                className={fe.shopPhone ? inputErr : inputOk}
                value={form.shopPhone}
                onChange={(e) => update("shopPhone", e.target.value)}
                inputMode="tel"
              />
            </Field>
          </section>
        ) : null}

        {step === 2 ? (
          <section className={sectionClass}>
            <h2 className="font-serif text-lg text-charcoal">2. ?????</h2>
            <Field error={fe.contactName}>
              <label className={labelClass}>???? *</label>
              <input
                className={fe.contactName ? inputErr : inputOk}
                value={form.contactName}
                onChange={(e) => update("contactName", e.target.value)}
              />
            </Field>
            <Field error={fe.contactPhone}>
              <label className={labelClass}>??????? *</label>
              <input
                className={fe.contactPhone ? inputErr : inputOk}
                value={form.contactPhone}
                onChange={(e) => update("contactPhone", e.target.value)}
                inputMode="tel"
              />
            </Field>
            <Field error={fe.contactEmail}>
              <label className={labelClass}>?????????? *</label>
              <input
                className={fe.contactEmail ? inputErr : inputOk}
                type="email"
                value={form.contactEmail}
                onChange={(e) => update("contactEmail", e.target.value)}
              />
            </Field>
          </section>
        ) : null}

        {step === 3 ? (
          <section className={sectionClass}>
            <h2 className="font-serif text-lg text-charcoal">3. SNS?Web??</h2>
            <p className="text-xs text-muted">
              URL? https:// ?????????????????
            </p>
            <Field error={fe.websiteUrl}>
              <label className={labelClass}>
                ??Web????Instagram??? *
              </label>
              <input
                className={fe.websiteUrl ? inputErr : inputOk}
                value={form.websiteUrl}
                onChange={(e) => update("websiteUrl", e.target.value)}
                placeholder="??https://example.com"
              />
              <p className="mt-1 text-xs text-muted">
                ???????????????SNS?Instagram / X /
                TikTok???URL??????????
              </p>
            </Field>
            <Field>
              <label className={labelClass}>Instagram????</label>
              <input
                className={inputOk}
                value={form.instagramUrl}
                onChange={(e) => update("instagramUrl", e.target.value)}
              />
            </Field>
            <Field>
              <label className={labelClass}>X????</label>
              <input
                className={inputOk}
                value={form.xUrl}
                onChange={(e) => update("xUrl", e.target.value)}
              />
            </Field>
            <Field>
              <label className={labelClass}>TikTok????</label>
              <input
                className={inputOk}
                value={form.tiktokUrl}
                onChange={(e) => update("tiktokUrl", e.target.value)}
              />
            </Field>
            <Field>
              <label className={labelClass}>LINE???????????</label>
              <input
                className={inputOk}
                value={form.lineOfficialUrl}
                onChange={(e) => update("lineOfficialUrl", e.target.value)}
              />
            </Field>
            <Field>
              <label className={labelClass}>YouTube????</label>
              <input
                className={inputOk}
                value={form.youtubeUrl}
                onChange={(e) => update("youtubeUrl", e.target.value)}
              />
            </Field>
            <Field>
              <label className={labelClass}>???SNS????</label>
              <textarea
                className={inputOk}
                rows={3}
                value={form.otherSns}
                onChange={(e) => update("otherSns", e.target.value)}
              />
            </Field>
          </section>
        ) : null}

        {step === 4 ? (
          <section className={sectionClass}>
            <h2 className="font-serif text-lg text-charcoal">4. ???????</h2>
            {renderDocUploader(
              "businessLicenseDocument",
              "?????",
              true,
              "??????????????????????",
            )}
            {renderDocUploader(
              "entertainmentLicenseDocument",
              "???????????????????",
              false,
            )}
            {renderDocUploader(
              "lateNightAlcoholNotificationDocument",
              "?????????????????????",
              false,
            )}
            <Field error={fe.openDate}>
              <label className={labelClass}>????? *</label>
              <input
                className={fe.openDate ? inputErr : inputOk}
                type="date"
                value={form.openDate}
                onChange={(e) => update("openDate", e.target.value)}
              />
            </Field>
          </section>
        ) : null}

        {step === 5 ? (
          <section className={sectionClass}>
            <h2 className="font-serif text-lg text-charcoal">5. ?????</h2>
            <p className="text-xs text-muted">
              ????????????????????????????????
            </p>
            {fe.requestedPlan ? (
              <p className={errTextClass}>{fe.requestedPlan}</p>
            ) : null}
            <div
              className="space-y-3"
              data-error-field={fe.requestedPlan ? "1" : undefined}
            >
              {JOB_PLANS.map((plan) => {
                const selected = form.requestedPlan === plan;
                return (
                  <label
                    key={plan}
                    className={`flex min-h-[72px] cursor-pointer items-start gap-3 rounded-xl border px-4 py-4 transition ${
                      selected
                        ? "border-gold bg-ivory ring-2 ring-gold/30"
                        : fe.requestedPlan
                          ? "border-red-400 bg-white"
                          : "border-gold/25 bg-white"
                    }`}
                  >
                    <input
                      type="radio"
                      name="requestedPlan"
                      checked={selected}
                      onChange={() => update("requestedPlan", plan)}
                      className="mt-1.5 h-4 w-4"
                    />
                    <span className="flex-1">
                      <span className="flex items-center justify-between gap-2">
                        <span className="block text-base font-semibold text-charcoal">
                          {planNameJa(plan)}
                        </span>
                        {selected ? (
                          <span className="text-xs font-medium text-gold-dark">
                            ? ???
                          </span>
                        ) : null}
                      </span>
                      <span className="mt-1 block text-sm text-muted">
                        {planPriceJa(plan)}
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>
          </section>
        ) : null}

        {step === 6 ? (
          <section className={sectionClass}>
            <h2 className="font-serif text-lg text-charcoal">6. ????</h2>
            <div data-error-field={fe.consentAccuracy ? "1" : undefined}>
              <label
                className={`flex items-start gap-3 text-sm ${
                  fe.consentAccuracy ? "text-red-700" : "text-charcoal"
                }`}
              >
                <input
                  type="checkbox"
                  checked={form.consentAccuracy}
                  onChange={(e) => update("consentAccuracy", e.target.checked)}
                  className="mt-1"
                />
                <span>
                  ???????????????????????????*
                </span>
              </label>
              {fe.consentAccuracy ? (
                <p className={errTextClass}>{fe.consentAccuracy}</p>
              ) : null}
            </div>
            <div data-error-field={fe.consentTerms ? "1" : undefined}>
              <label
                className={`flex items-start gap-3 text-sm ${
                  fe.consentTerms ? "text-red-700" : "text-charcoal"
                }`}
              >
                <input
                  type="checkbox"
                  checked={form.consentTerms}
                  onChange={(e) => update("consentTerms", e.target.checked)}
                  className="mt-1"
                />
                <span>
                  <Link
                    href="/terms-shop"
                    className="text-gold-dark underline"
                    onClick={saveReturnStateForLegal}
                  >
                    ????
                  </Link>
                  ?
                  <Link
                    href="/privacy"
                    className="text-gold-dark underline"
                    onClick={saveReturnStateForLegal}
                  >
                    ??????????
                  </Link>
                  ???????*
                </span>
              </label>
              {fe.consentTerms ? (
                <p className={errTextClass}>{fe.consentTerms}</p>
              ) : null}
            </div>
          </section>
        ) : null}

        {step === 7 ? (
          <section className={sectionClass}>
            <h2 className="font-serif text-lg text-charcoal">7. ????</h2>
            <p className="text-xs text-muted">
              ????????????????????????????
            </p>
            {renderShopImageSection(
              "exterior",
              "????",
              "??????????????????????????????",
              5,
            )}
            {renderShopImageSection(
              "interior",
              "????",
              "?????????????????????????????",
              10,
            )}
            {uploading ? (
              <p className="text-sm text-muted">???????...</p>
            ) : null}
          </section>
        ) : null}

        {step === 8 ? (
          <section className={sectionClass}>
            <h2 className="font-serif text-lg text-charcoal">8. ????</h2>
            <dl className="space-y-2 text-sm text-charcoal">
              <div>
                <dt className="text-muted">???</dt>
                <dd>{form.shopName}</dd>
              </div>
              <div>
                <dt className="text-muted">???</dt>
                <dd>{form.shopAddress}</dd>
              </div>
              <div>
                <dt className="text-muted">??</dt>
                <dd>{form.businessType}</dd>
              </div>
              <div>
                <dt className="text-muted">????</dt>
                <dd>{form.businessHours}</dd>
              </div>
              <div>
                <dt className="text-muted">???</dt>
                <dd>
                  {form.contactName} / {form.contactEmail}
                </dd>
              </div>
              <div>
                <dt className="text-muted">?????</dt>
                <dd>{selectedPlan ? planNameJa(selectedPlan) : "???"}</dd>
              </div>
              <div>
                <dt className="text-muted">????</dt>
                <dd>
                  {selectedPlan
                    ? `${formatJpyPrice(JOB_PLAN_MONTHLY_PRICES[selectedPlan])}????`
                    : "?"}
                </dd>
              </div>
              <div>
                <dt className="text-muted">?????</dt>
                <dd>
                  {form.businessLicenseDocument ? "????" : "???"}
                </dd>
              </div>
              <div>
                <dt className="text-muted">???????</dt>
                <dd>
                  {form.entertainmentLicenseDocument ? "????" : "???"}
                </dd>
              </div>
              <div>
                <dt className="text-muted">????????</dt>
                <dd>
                  {form.lateNightAlcoholNotificationDocument
                    ? "????"
                    : "???"}
                </dd>
              </div>
            </dl>

            <div className="mt-4 space-y-3">
              <div>
                <p className="text-sm font-medium text-charcoal">
                  ?????{form.shopExteriorImages.length}??
                </p>
                <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {form.shopExteriorImages.map((img) => (
                    <button
                      key={img.storagePath}
                      type="button"
                      onClick={() => {
                        if (img.signedUrl) window.open(img.signedUrl, "_blank");
                      }}
                      className="overflow-hidden rounded-lg border border-gold/20"
                    >
                      {img.signedUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={img.signedUrl}
                          alt={img.fileName}
                          className="aspect-square w-full object-cover"
                        />
                      ) : (
                        <div className="flex aspect-square items-center justify-center bg-ivory text-xs text-muted">
                          {img.fileName}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-charcoal">
                  ?????{form.shopInteriorImages.length}??
                </p>
                <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {form.shopInteriorImages.map((img) => (
                    <button
                      key={img.storagePath}
                      type="button"
                      onClick={() => {
                        if (img.signedUrl) window.open(img.signedUrl, "_blank");
                      }}
                      className="overflow-hidden rounded-lg border border-gold/20"
                    >
                      {img.signedUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={img.signedUrl}
                          alt={img.fileName}
                          className="aspect-square w-full object-cover"
                        />
                      ) : (
                        <div className="flex aspect-square items-center justify-center bg-ivory text-xs text-muted">
                          {img.fileName}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <p className="mt-4 text-xs text-muted">
              ??????????????????????????????????
            </p>
          </section>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-3">
        {step > 1 ? (
          <button
            type="button"
            disabled={navigating || loading || uploading}
            onClick={goBack}
            className="rounded-full border border-gold/40 px-5 py-3 text-sm font-medium text-gold-dark disabled:opacity-60"
          >
            ??
          </button>
        ) : null}

        {step < STEPS.length ? (
          <button
            type="button"
            disabled={navigating || loading || uploading}
            onClick={goNext}
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-gold to-gold-dark px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            {navigating ? "???..." : "??"}
          </button>
        ) : null}

        {step === STEPS.length ? (
          <button
            type="button"
            disabled={loading || navigating || uploading}
            onClick={() => void submit(false)}
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-gold to-gold-dark px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            {loading ? "???..." : "???????"}
          </button>
        ) : null}
      </div>
    </div>
  );
}
