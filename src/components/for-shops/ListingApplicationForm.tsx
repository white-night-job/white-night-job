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
import {
  isListingApplicantType,
  isValidCorporateNumber,
  normalizeCorporateNumber,
  type ListingApplicantType,
  type ListingAttachment,
  type ListingDocumentMeta,
  type ListingShopImage,
} from "@/lib/listing-application";
import {
  FORM_I18N,
  FULLWIDTH_DIGIT_RE,
  PHONE_INTL_SEP_RE,
  PHONE_SEP_RE,
} from "@/components/for-shops/listing-application-form-i18n";
import {
  compressListingImage,
  fileFingerprint,
  mapPool,
  uploadWithProgress,
} from "@/lib/listing-image-compress";

void (null as ListingAttachment | null);

const SHOP_UPLOAD_CONCURRENCY = 3;

type DocUploadUi = {
  phase: "compressing" | "uploading";
  progress: number;
};

type PendingShopUpload = {
  id: string;
  kind: "exterior" | "interior";
  fingerprint: string;
  fileName: string;
  previewUrl: string | null;
  progress: number;
  phase: "compressing" | "uploading" | "error";
  error?: string;
  sourceFile: File;
};

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
  { id: 1, title: FORM_I18N.steps[0] },
  { id: 2, title: FORM_I18N.steps[1] },
  { id: 3, title: FORM_I18N.steps[2] },
  { id: 4, title: FORM_I18N.steps[3] },
  { id: 5, title: FORM_I18N.steps[4] },
  { id: 6, title: FORM_I18N.steps[5] },
  { id: 7, title: FORM_I18N.steps[6] },
  { id: 8, title: FORM_I18N.steps[7] },
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
  | "lateNightAlcoholNotificationDocument"
  | "identityDocumentFront"
  | "identityDocumentBack";

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
  applicantType: ListingApplicantType | "";
  corporateName: string;
  corporateNameKana: string;
  corporateNumber: string;
  representativeName: string;
  identityDocumentFront: ListingDocumentMeta | null;
  identityDocumentBack: ListingDocumentMeta | null;
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
  applicantType: "",
  corporateName: "",
  corporateNameKana: "",
  corporateNumber: "",
  representativeName: "",
  identityDocumentFront: null,
  identityDocumentBack: null,
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
  identityDocumentFront: null,
  identityDocumentBack: null,
};

export function planNameJa(plan: JobPlan): string {
  return `${JOB_PLAN_DEFINITIONS[plan].label}${FORM_I18N.planSuffix}`;
}

export function planPriceJa(plan: JobPlan): string {
  return `${FORM_I18N.planPricePrefix} ${formatJpyPrice(JOB_PLAN_MONTHLY_PRICES[plan])}${FORM_I18N.planPriceSuffix}`;
}

export function formatBytes(size: number): string {
  if (!Number.isFinite(size) || size < 0) return FORM_I18N.emDash;
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
      applicantType: isListingApplicantType(parsed.applicantType)
        ? parsed.applicantType
        : "",
      businessLicenseDocument: parsed.businessLicenseDocument ?? null,
      entertainmentLicenseDocument: parsed.entertainmentLicenseDocument ?? null,
      lateNightAlcoholNotificationDocument:
        parsed.lateNightAlcoholNotificationDocument ?? null,
      identityDocumentFront: parsed.identityDocumentFront ?? null,
      identityDocumentBack: parsed.identityDocumentBack ?? null,
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
  return value.replace(FULLWIDTH_DIGIT_RE, (d) =>
    String.fromCharCode(d.charCodeAt(0) - 0xfee0),
  );
}

function normalizePhoneNumber(value: string): string {
  return toHalfWidthDigits(value).replace(PHONE_SEP_RE, "").trim();
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
  const normalized = toHalfWidthDigits(trimmed).replace(PHONE_INTL_SEP_RE, "");
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
    if (!form.shopName.trim()) errors.shopName = FORM_I18N.errShopName;
    if (!form.shopAddress.trim())
      errors.shopAddress = FORM_I18N.errShopAddress;
    if (!form.businessType.trim())
      errors.businessType = FORM_I18N.errBusinessType;
    if (!form.businessHours.trim())
      errors.businessHours = FORM_I18N.errBusinessHours;
    if (!form.shopPhone.trim()) {
      errors.shopPhone = FORM_I18N.errShopPhoneRequired;
    } else if (!isValidPhoneNumber(form.shopPhone)) {
      errors.shopPhone = FORM_I18N.errShopPhoneFormat;
    }
  }
  if (step === 2) {
    if (!form.contactName.trim())
      errors.contactName = FORM_I18N.errContactName;
    if (!form.contactPhone.trim()) {
      errors.contactPhone = FORM_I18N.errContactPhoneRequired;
    } else if (!isValidPhoneNumber(form.contactPhone)) {
      errors.contactPhone = FORM_I18N.errContactPhoneFormat;
    }
    if (!form.contactEmail.trim()) {
      errors.contactEmail = FORM_I18N.errContactEmailRequired;
    } else if (!isValidEmail(form.contactEmail)) {
      errors.contactEmail = FORM_I18N.errContactEmailFormat;
    }
    if (!isListingApplicantType(form.applicantType)) {
      errors.applicantType = FORM_I18N.errApplicantType;
    } else if (form.applicantType === "corporation") {
      if (!form.corporateName.trim()) {
        errors.corporateName = FORM_I18N.errCorporateName;
      }
      if (!form.corporateNameKana.trim()) {
        errors.corporateNameKana = FORM_I18N.errCorporateNameKana;
      }
      if (!isValidCorporateNumber(form.corporateNumber)) {
        errors.corporateNumber = FORM_I18N.errCorporateNumber;
      }
      if (!form.representativeName.trim()) {
        errors.representativeName = FORM_I18N.errRepresentativeName;
      }
    }
    const hasIdentityLocal = Boolean(localFiles?.identityDocumentFront);
    const hasIdentityUploaded = Boolean(
      form.identityDocumentFront?.storagePath,
    );
    if (!hasIdentityLocal && !hasIdentityUploaded) {
      errors.identityDocumentFront = FORM_I18N.errIdentityDocument;
    }
  }
  if (step === 3) {
    const url = form.websiteUrl.trim();
    if (!url) {
      errors.websiteUrl = FORM_I18N.errWebsiteRequired;
    } else if (!/^https?:\/\/.+/i.test(url)) {
      errors.websiteUrl = FORM_I18N.errWebsiteFormat;
    }
  }
  if (step === 4) {
    const hasLocal = Boolean(localFiles?.businessLicenseDocument);
    const hasUploaded = Boolean(form.businessLicenseDocument?.storagePath);
    if (!hasLocal && !hasUploaded) {
      errors.businessLicenseDocument = FORM_I18N.errBusinessLicense;
    }
    if (!form.openDate.trim()) errors.openDate = FORM_I18N.errOpenDate;
  }
  if (step === 5) {
    if (!isJobPlan(form.requestedPlan)) {
      errors.requestedPlan = FORM_I18N.errPlan;
    }
  }
  if (step === 6) {
    if (!form.consentAccuracy) {
      errors.consentAccuracy = FORM_I18N.errConsentAccuracy;
    }
    if (!form.consentTerms) {
      errors.consentTerms = FORM_I18N.errConsentTerms;
    }
  }
  if (step === 7) {
    const exteriorEmpty = form.shopExteriorImages.length === 0;
    const interiorEmpty = form.shopInteriorImages.length === 0;
    if (exteriorEmpty && interiorEmpty) {
      errors.shopExteriorImages = FORM_I18N.errShopImagesBoth;
    } else if (exteriorEmpty) {
      errors.shopExteriorImages = FORM_I18N.errShopExterior;
    } else if (interiorEmpty) {
      errors.shopInteriorImages = FORM_I18N.errShopInterior;
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
  const [docUploadUi, setDocUploadUi] = useState<Partial<Record<DocKey, DocUploadUi>>>(
    {},
  );
  const [pendingShopUploads, setPendingShopUploads] = useState<PendingShopUpload[]>(
    [],
  );
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
  const draftIdRef = useRef(draftId);
  const inFlightUploadsRef = useRef(0);
  const docUploadLockRef = useRef<Partial<Record<DocKey, boolean>>>({});
  const shopFingerprintsRef = useRef<Set<string>>(new Set());
  const shopSortOrderRef = useRef({ exterior: 0, interior: 0 });
  const pendingShopCountRef = useRef({ exterior: 0, interior: 0 });
  const shopUploadedCountRef = useRef({ exterior: 0, interior: 0 });
  const docInputRefs = useRef<Record<DocKey, HTMLInputElement | null>>({
    businessLicenseDocument: null,
    entertainmentLicenseDocument: null,
    lateNightAlcoholNotificationDocument: null,
    identityDocumentFront: null,
    identityDocumentBack: null,
  });
  const exteriorInputRef = useRef<HTMLInputElement | null>(null);
  const interiorInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    draftIdRef.current = draftId;
  }, [draftId]);

  useEffect(() => {
    shopUploadedCountRef.current = {
      exterior: form.shopExteriorImages.length,
      interior: form.shopInteriorImages.length,
    };
  }, [form.shopExteriorImages.length, form.shopInteriorImages.length]);

  const shopUploadsBusy = pendingShopUploads.some(
    (p) => p.phase === "compressing" || p.phase === "uploading",
  );
  const shopUploadsIncomplete = pendingShopUploads.length > 0;
  const uploadsBlockingNext = uploading || shopUploadsIncomplete;

  function beginUploadFlight() {
    inFlightUploadsRef.current += 1;
    setUploading(true);
  }

  function endUploadFlight() {
    inFlightUploadsRef.current = Math.max(0, inFlightUploadsRef.current - 1);
    if (inFlightUploadsRef.current === 0) setUploading(false);
  }

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
        applicantType: isListingApplicantType(merged.applicantType)
          ? merged.applicantType
          : "",
        businessLicenseDocument: merged.businessLicenseDocument ?? null,
        entertainmentLicenseDocument: merged.entertainmentLicenseDocument ?? null,
        lateNightAlcoholNotificationDocument:
          merged.lateNightAlcoholNotificationDocument ?? null,
        identityDocumentFront: merged.identityDocumentFront ?? null,
        identityDocumentBack: merged.identityDocumentBack ?? null,
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
    const initialExterior = Array.isArray(restoredForm?.shopExteriorImages)
      ? restoredForm!.shopExteriorImages!
      : Array.isArray(draft?.shopExteriorImages)
        ? draft!.shopExteriorImages
        : [];
    const initialInterior = Array.isArray(restoredForm?.shopInteriorImages)
      ? restoredForm!.shopInteriorImages!
      : Array.isArray(draft?.shopInteriorImages)
        ? draft!.shopInteriorImages
        : [];
    shopSortOrderRef.current = {
      exterior: initialExterior.length,
      interior: initialInterior.length,
    };
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
    if (navigating || uploadsBlockingNext || loading) return;
    setNavigating(true);
    const errors = validateStep(step, form, localFiles);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setSubmitMessage(FORM_I18N.errGeneric);
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
    if (navigating || uploadsBlockingNext || loading) return;
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
    if (docUploadLockRef.current[key]) return;
    docUploadLockRef.current[key] = true;

    const docType =
      key === "businessLicenseDocument"
        ? "business-license"
        : key === "entertainmentLicenseDocument"
          ? "entertainment-license"
          : key === "lateNightAlcoholNotificationDocument"
            ? "late-night-alcohol-notification"
            : key === "identityDocumentFront"
              ? "identity-document-front"
              : "identity-document-back";

    const previewUrl =
      file.type.startsWith("image/") || /\.(heic|heif)$/i.test(file.name)
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

    beginUploadFlight();
    setSubmitMessage("");
    setDocUploadUi((prev) => ({
      ...prev,
      [key]: { phase: "compressing", progress: 0 },
    }));
    try {
      const compressed = await compressListingImage(file, { preferWebp: false });
      const uploadFile = compressed.file;
      setLocalFiles((prev) => ({
        ...prev,
        [key]: {
          name: uploadFile.name,
          size: uploadFile.size,
          type: uploadFile.type,
          previewUrl: prev[key]?.previewUrl ?? null,
        },
      }));
      setDocUploadUi((prev) => ({
        ...prev,
        [key]: { phase: "uploading", progress: 0 },
      }));

      const body = new FormData();
      body.append("file", uploadFile);
      body.append("draftId", draftIdRef.current);
      body.append("docType", docType);
      const res = await uploadWithProgress(
        "/api/listing-applications/upload",
        body,
        (percent) => {
          setDocUploadUi((prev) => ({
            ...prev,
            [key]: { phase: "uploading", progress: percent },
          }));
        },
      );
      const data = (await res.json()) as {
        message?: string;
        draftId?: string;
        document?: ListingDocumentMeta;
      };
      if (!res.ok) {
        throw new Error(data.message ?? FORM_I18N.uploadFailed);
      }
      if (data.draftId) setDraftId(data.draftId);
      if (data.document) {
        update(key, data.document);
      }
    } catch (e) {
      const message =
        e instanceof Error ? e.message : FORM_I18N.imageBucketMissing;
      setSubmitMessage(
        message.includes(FORM_I18N.imageBucketMissingNeedle)
          ? FORM_I18N.imageBucketMissing
          : FORM_I18N.imageUploadFailed,
      );
      scrollToStepHeader();
    } finally {
      setDocUploadUi((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
      docUploadLockRef.current[key] = false;
      endUploadFlight();
    }
  }

  function clearDocument(key: DocKey) {
    setLocalFiles((prev) => {
      revokeUrl(prev[key]?.previewUrl);
      return { ...prev, [key]: null };
    });
    update(key, null);
  }

  function patchPendingShop(
    id: string,
    patch: Partial<PendingShopUpload>,
  ) {
    setPendingShopUploads((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    );
  }

  function clearShopImageErrors() {
    setFieldErrors((prev) => {
      if (!prev.shopExteriorImages && !prev.shopInteriorImages) return prev;
      const next = { ...prev };
      delete next.shopExteriorImages;
      delete next.shopInteriorImages;
      return next;
    });
  }

  async function runShopImageUpload(pending: PendingShopUpload) {
    beginUploadFlight();
    patchPendingShop(pending.id, {
      phase: "compressing",
      progress: 0,
      error: undefined,
    });
    try {
      const compressed = await compressListingImage(pending.sourceFile, {
        preferWebp: true,
      });
      patchPendingShop(pending.id, { phase: "uploading", progress: 0 });

      const sortOrder = shopSortOrderRef.current[pending.kind]++;
      const body = new FormData();
      body.append("file", compressed.file);
      body.append("draftId", draftIdRef.current);
      body.append(
        "docType",
        pending.kind === "exterior" ? "shop-exterior" : "shop-interior",
      );
      body.append("sortOrder", String(sortOrder));

      const res = await uploadWithProgress(
        "/api/listing-applications/upload",
        body,
        (percent) => {
          patchPendingShop(pending.id, {
            phase: "uploading",
            progress: percent,
          });
        },
      );
      const data = (await res.json()) as {
        message?: string;
        draftId?: string;
        image?: ListingShopImage;
      };
      if (!res.ok) {
        throw new Error(data.message ?? FORM_I18N.uploadFailed);
      }
      if (data.draftId) setDraftId(data.draftId);
      if (data.image) {
        if (pending.kind === "exterior") {
          setForm((c) => ({
            ...c,
            shopExteriorImages: [...c.shopExteriorImages, data.image!],
          }));
        } else {
          setForm((c) => ({
            ...c,
            shopInteriorImages: [...c.shopInteriorImages, data.image!],
          }));
        }
        clearShopImageErrors();
      }
      shopFingerprintsRef.current.delete(pending.fingerprint);
      pendingShopCountRef.current[pending.kind] = Math.max(
        0,
        pendingShopCountRef.current[pending.kind] - 1,
      );
      setPendingShopUploads((prev) => {
        const target = prev.find((p) => p.id === pending.id);
        if (target?.previewUrl) revokeUrl(target.previewUrl);
        return prev.filter((p) => p.id !== pending.id);
      });
    } catch (e) {
      shopFingerprintsRef.current.delete(pending.fingerprint);
      const message =
        e instanceof Error ? e.message : FORM_I18N.uploadFailed;
      patchPendingShop(pending.id, {
        phase: "error",
        progress: 0,
        error: message,
      });
      setSubmitMessage(message);
      scrollToStepHeader();
    } finally {
      endUploadFlight();
    }
  }

  async function enqueueShopImages(
    files: File[],
    kind: "exterior" | "interior",
  ) {
    const max = kind === "exterior" ? 5 : 10;
    let slots =
      max -
      shopUploadedCountRef.current[kind] -
      pendingShopCountRef.current[kind];

    if (slots <= 0) {
      setSubmitMessage(
        kind === "exterior" ? FORM_I18N.exteriorMax : FORM_I18N.interiorMax,
      );
      scrollToStepHeader();
      return;
    }

    setSubmitMessage("");
    const toStart: PendingShopUpload[] = [];
    let skippedDuplicate = false;

    for (const file of files) {
      if (slots <= 0) {
        setSubmitMessage(
          kind === "exterior" ? FORM_I18N.exteriorMax : FORM_I18N.interiorMax,
        );
        scrollToStepHeader();
        break;
      }
      const fingerprint = fileFingerprint(file);
      if (shopFingerprintsRef.current.has(fingerprint)) {
        skippedDuplicate = true;
        continue;
      }
      shopFingerprintsRef.current.add(fingerprint);
      const id = crypto.randomUUID();
      const previewUrl = URL.createObjectURL(file);
      toStart.push({
        id,
        kind,
        fingerprint,
        fileName: file.name,
        previewUrl,
        progress: 0,
        phase: "compressing",
        sourceFile: file,
      });
      slots -= 1;
    }

    if (skippedDuplicate && toStart.length === 0) {
      setSubmitMessage(FORM_I18N.duplicateImageSkipped);
      scrollToStepHeader();
      return;
    }
    if (skippedDuplicate) {
      setSubmitMessage(FORM_I18N.duplicateImageSkipped);
    }
    if (toStart.length === 0) return;

    pendingShopCountRef.current[kind] += toStart.length;
    setPendingShopUploads((prev) => [...prev, ...toStart]);
    await mapPool(toStart, SHOP_UPLOAD_CONCURRENCY, async (item) => {
      await runShopImageUpload(item);
    });
  }

  function retryShopUpload(id: string) {
    const pending = pendingShopUploads.find((p) => p.id === id);
    if (!pending || pending.phase !== "error") return;
    shopFingerprintsRef.current.add(pending.fingerprint);
    void runShopImageUpload(pending);
  }

  function dismissPendingShop(id: string) {
    setPendingShopUploads((prev) => {
      const target = prev.find((p) => p.id === id);
      if (target) {
        shopFingerprintsRef.current.delete(target.fingerprint);
        pendingShopCountRef.current[target.kind] = Math.max(
          0,
          pendingShopCountRef.current[target.kind] - 1,
        );
        revokeUrl(target.previewUrl);
      }
      return prev.filter((p) => p.id !== id);
    });
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
      setSubmitMessage(FORM_I18N.errGeneric);
      shouldScrollRef.current = true;
      setStep(1);
      return;
    }

    const step2Errors = validateStep(2, form, localFiles);
    if (Object.keys(step2Errors).length > 0) {
      setFieldErrors(step2Errors);
      setSubmitMessage(FORM_I18N.errGeneric);
      shouldScrollRef.current = true;
      setStep(2);
      return;
    }

    const consentErrors = validateStep(6, form, localFiles);
    if (Object.keys(consentErrors).length > 0) {
      setFieldErrors(consentErrors);
      setSubmitMessage(FORM_I18N.errGeneric);
      shouldScrollRef.current = true;
      setStep(6);
      return;
    }
    if (!isJobPlan(form.requestedPlan)) {
      setFieldErrors({ requestedPlan: FORM_I18N.errPlan });
      setSubmitMessage(FORM_I18N.errPlan);
      shouldScrollRef.current = true;
      setStep(5);
      return;
    }
    const imageErrors = validateStep(7, form, localFiles);
    if (Object.keys(imageErrors).length > 0) {
      setFieldErrors(imageErrors);
      setSubmitMessage(FORM_I18N.errGeneric);
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
        setSubmitMessage(data.message ?? FORM_I18N.duplicateShort);
        scrollToStepHeader();
        return;
      }
      if (!res.ok) throw new Error(data.message ?? FORM_I18N.applyFailed);
      window.localStorage.removeItem(DRAFT_KEY);
      router.push(
        `/for-shops/apply/complete?no=${encodeURIComponent(data.applicationNumber ?? "")}`,
      );
    } catch (e) {
      setSubmitMessage(e instanceof Error ? e.message : FORM_I18N.applyFailed);
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
          {required ? " *" : FORM_I18N.optional}
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
            {FORM_I18N.selectFile}
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
                  {FORM_I18N.formatLabel}: {displayType} / {FORM_I18N.sizeLabel}:{" "}
                  {formatBytes(displaySize)}
                </p>
                {uploaded?.storagePath ? (
                  <p className="text-xs text-muted">{FORM_I18N.uploaded}</p>
                ) : docUploadUi[key] ? (
                  <p className="text-xs text-muted">
                    {docUploadUi[key]?.phase === "compressing"
                      ? FORM_I18N.compressing
                      : FORM_I18N.uploadingProgress}
                    {docUploadUi[key]?.phase === "uploading"
                      ? ` ${docUploadUi[key]?.progress ?? 0}%`
                      : ""}
                  </p>
                ) : uploading ? (
                  <p className="text-xs text-muted">{FORM_I18N.uploading}</p>
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
                {FORM_I18N.change}
              </button>
              <button
                type="button"
                disabled={uploading || loading}
                onClick={() => clearDocument(key)}
                className="rounded-full border border-red-300 px-3 py-1.5 text-xs font-medium text-red-600 disabled:opacity-60"
              >
                {FORM_I18N.remove}
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
          multiple
          className="sr-only absolute h-0 w-0 opacity-0"
          tabIndex={-1}
          onChange={(e) => {
            const list = e.target.files;
            if (list && list.length > 0) {
              void enqueueShopImages(Array.from(list), kind);
            }
            e.target.value = "";
          }}
        />
        <div className="grid grid-cols-2 gap-3">
          {pendingShopUploads
            .filter((p) => p.kind === kind)
            .map((p) => (
              <div
                key={p.id}
                className="overflow-hidden rounded-xl border border-gold/25 bg-white"
              >
                {p.previewUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={p.previewUrl}
                    alt={p.fileName}
                    className="aspect-square w-full object-cover"
                  />
                ) : (
                  <div className="flex aspect-square items-center justify-center bg-ivory text-xs text-muted">
                    {FORM_I18N.noPreview}
                  </div>
                )}
                <div className="space-y-1 p-2">
                  <p className="truncate text-xs font-medium text-charcoal">
                    {p.fileName}
                  </p>
                  {p.phase === "error" ? (
                    <>
                      <p className="text-[11px] text-red-600">
                        {p.error ?? FORM_I18N.uploadFailed}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          disabled={loading}
                          onClick={() => retryShopUpload(p.id)}
                          className="text-xs text-gold-dark disabled:opacity-60"
                        >
                          {FORM_I18N.retryUpload}
                        </button>
                        <button
                          type="button"
                          disabled={loading}
                          onClick={() => dismissPendingShop(p.id)}
                          className="text-xs text-red-600 disabled:opacity-60"
                        >
                          {FORM_I18N.removeShort}
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="text-[11px] text-muted">
                        {p.phase === "compressing"
                          ? FORM_I18N.compressing
                          : `${FORM_I18N.uploadingProgress} ${p.progress}%`}
                      </p>
                      <div className="h-1.5 overflow-hidden rounded-full bg-gold/15">
                        <div
                          className="h-full rounded-full bg-gold transition-[width]"
                          style={{
                            width: `${
                              p.phase === "compressing"
                                ? 8
                                : Math.max(8, p.progress)
                            }%`,
                          }}
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}
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
                    {FORM_I18N.noPreview}
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
                  disabled={loading}
                  onClick={() => removeShopImage(kind, img.storagePath)}
                  className="text-xs text-red-600 disabled:opacity-60"
                >
                  {FORM_I18N.removeShort}
                </button>
              </div>
            </div>
          ))}
          {images.length +
            pendingShopUploads.filter((p) => p.kind === kind).length <
          max ? (
            <button
              type="button"
              disabled={loading}
              onClick={() => inputRef.current?.click()}
              className="flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-gold/40 bg-ivory/50 text-sm text-gold-dark disabled:opacity-60"
            >
              <span className="text-lg leading-none">{FORM_I18N.plus}</span>
              <span>{FORM_I18N.add}</span>
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
        {FORM_I18N.loading}
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
            {FORM_I18N.stepPrefix} {step} / {STEPS.length}
            {FORM_I18N.stepSeparator}
            {STEPS[step - 1]?.title}
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
            {FORM_I18N.duplicateFound}
          </p>
          <button
            type="button"
            disabled={loading}
            onClick={() => void submit(true)}
            className="mt-3 rounded-full bg-charcoal px-4 py-2 text-xs font-medium text-white disabled:opacity-60"
          >
            {FORM_I18N.confirmAndSubmit}
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
            <h2 className="font-serif text-lg text-charcoal">
              {FORM_I18N.headingShopBasic}
            </h2>
            <Field error={fe.shopName}>
              <label className={labelClass}>{FORM_I18N.labelShopName}</label>
              <input
                className={fe.shopName ? inputErr : inputOk}
                value={form.shopName}
                onChange={(e) => update("shopName", e.target.value)}
              />
            </Field>
            <Field error={fe.shopAddress}>
              <label className={labelClass}>{FORM_I18N.labelShopAddress}</label>
              <input
                className={fe.shopAddress ? inputErr : inputOk}
                value={form.shopAddress}
                onChange={(e) => update("shopAddress", e.target.value)}
                placeholder={FORM_I18N.phShopAddress}
              />
            </Field>
            <Field>
              <label className={labelClass}>{FORM_I18N.labelArea}</label>
              <input
                className={inputOk}
                value={form.area}
                onChange={(e) => update("area", e.target.value)}
                placeholder={FORM_I18N.phArea}
              />
            </Field>
            <Field error={fe.businessType}>
              <label className={labelClass}>{FORM_I18N.labelBusinessType}</label>
              <input
                className={fe.businessType ? inputErr : inputOk}
                value={form.businessType}
                onChange={(e) => update("businessType", e.target.value)}
                placeholder={FORM_I18N.phBusinessType}
              />
            </Field>
            <Field error={fe.businessHours}>
              <label className={labelClass}>{FORM_I18N.labelBusinessHours}</label>
              <input
                className={fe.businessHours ? inputErr : inputOk}
                value={form.businessHours}
                onChange={(e) => update("businessHours", e.target.value)}
                placeholder={FORM_I18N.phBusinessHours}
              />
            </Field>
            <Field error={fe.shopPhone}>
              <label className={labelClass}>{FORM_I18N.labelShopPhone}</label>
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
            <h2 className="font-serif text-lg text-charcoal">
              {FORM_I18N.headingContact}
            </h2>
            <Field error={fe.contactName}>
              <label className={labelClass}>{FORM_I18N.labelContactName}</label>
              <input
                className={fe.contactName ? inputErr : inputOk}
                value={form.contactName}
                onChange={(e) => update("contactName", e.target.value)}
              />
            </Field>
            <Field error={fe.contactPhone}>
              <label className={labelClass}>{FORM_I18N.labelContactPhone}</label>
              <input
                className={fe.contactPhone ? inputErr : inputOk}
                value={form.contactPhone}
                onChange={(e) => update("contactPhone", e.target.value)}
                inputMode="tel"
              />
            </Field>
            <Field error={fe.contactEmail}>
              <label className={labelClass}>{FORM_I18N.labelContactEmail}</label>
              <input
                className={fe.contactEmail ? inputErr : inputOk}
                type="email"
                value={form.contactEmail}
                onChange={(e) => update("contactEmail", e.target.value)}
              />
            </Field>

            <Field error={fe.applicantType}>
              <p className={labelClass}>{FORM_I18N.labelApplicantType}</p>
              <div
                className="mt-1 flex flex-col gap-2 sm:flex-row"
                data-error-field={fe.applicantType ? "1" : undefined}
              >
                {(
                  [
                    ["individual", FORM_I18N.applicantIndividual],
                    ["corporation", FORM_I18N.applicantCorporation],
                  ] as const
                ).map(([value, label]) => (
                  <label
                    key={value}
                    className={`flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm ${
                      form.applicantType === value
                        ? "border-gold bg-ivory ring-2 ring-gold/30"
                        : fe.applicantType
                          ? "border-red-400 bg-white"
                          : "border-gold/25 bg-white"
                    }`}
                  >
                    <input
                      type="radio"
                      name="applicantType"
                      checked={form.applicantType === value}
                      onChange={() => {
                        update("applicantType", value);
                        if (value === "individual") {
                          setForm((current) => ({
                            ...current,
                            applicantType: value,
                            corporateName: "",
                            corporateNameKana: "",
                            corporateNumber: "",
                            representativeName: "",
                          }));
                          setFieldErrors((prev) => {
                            const next = { ...prev };
                            delete next.corporateName;
                            delete next.corporateNameKana;
                            delete next.corporateNumber;
                            delete next.representativeName;
                            delete next.applicantType;
                            return next;
                          });
                        }
                      }}
                      className="h-4 w-4"
                    />
                    <span>{label}</span>
                  </label>
                ))}
              </div>
            </Field>

            {form.applicantType === "corporation" ? (
              <>
                <Field error={fe.corporateName}>
                  <label className={labelClass}>
                    {FORM_I18N.labelCorporateName}
                  </label>
                  <input
                    className={fe.corporateName ? inputErr : inputOk}
                    value={form.corporateName}
                    onChange={(e) => update("corporateName", e.target.value)}
                  />
                </Field>
                <Field error={fe.corporateNameKana}>
                  <label className={labelClass}>
                    {FORM_I18N.labelCorporateNameKana}
                  </label>
                  <input
                    className={fe.corporateNameKana ? inputErr : inputOk}
                    value={form.corporateNameKana}
                    onChange={(e) => update("corporateNameKana", e.target.value)}
                  />
                </Field>
                <Field error={fe.corporateNumber}>
                  <label className={labelClass}>
                    {FORM_I18N.labelCorporateNumber}
                  </label>
                  <input
                    className={fe.corporateNumber ? inputErr : inputOk}
                    value={form.corporateNumber}
                    inputMode="numeric"
                    maxLength={13}
                    placeholder={FORM_I18N.phCorporateNumber}
                    onChange={(e) =>
                      update(
                        "corporateNumber",
                        normalizeCorporateNumber(e.target.value).slice(0, 13),
                      )
                    }
                  />
                </Field>
                <Field error={fe.representativeName}>
                  <label className={labelClass}>
                    {FORM_I18N.labelRepresentativeName}
                  </label>
                  <input
                    className={fe.representativeName ? inputErr : inputOk}
                    value={form.representativeName}
                    onChange={(e) =>
                      update("representativeName", e.target.value)
                    }
                  />
                </Field>
              </>
            ) : null}

            <div className="space-y-3 rounded-xl border border-gold/25 bg-ivory/40 p-4">
              <p className="text-sm font-medium text-charcoal">
                {FORM_I18N.identityUploadTitle}
              </p>
              <p className="text-xs text-muted">{FORM_I18N.identityUploadHint}</p>
              {renderDocUploader(
                "identityDocumentFront",
                FORM_I18N.identityFrontLabel,
                true,
              )}
              {renderDocUploader(
                "identityDocumentBack",
                FORM_I18N.identityBackLabel,
                false,
                FORM_I18N.identityBackHint,
              )}
            </div>
          </section>
        ) : null}

        {step === 3 ? (
          <section className={sectionClass}>
            <h2 className="font-serif text-lg text-charcoal">
              {FORM_I18N.headingSns}
            </h2>
            <p className="text-xs text-muted">{FORM_I18N.snsUrlHint}</p>
            <Field error={fe.websiteUrl}>
              <label className={labelClass}>{FORM_I18N.labelWebsite}</label>
              <input
                className={fe.websiteUrl ? inputErr : inputOk}
                value={form.websiteUrl}
                onChange={(e) => update("websiteUrl", e.target.value)}
                placeholder={FORM_I18N.phWebsite}
              />
              <p className="mt-1 text-xs text-muted">{FORM_I18N.websiteHelp}</p>
            </Field>
            <Field>
              <label className={labelClass}>{FORM_I18N.labelInstagram}</label>
              <input
                className={inputOk}
                value={form.instagramUrl}
                onChange={(e) => update("instagramUrl", e.target.value)}
              />
            </Field>
            <Field>
              <label className={labelClass}>{FORM_I18N.labelX}</label>
              <input
                className={inputOk}
                value={form.xUrl}
                onChange={(e) => update("xUrl", e.target.value)}
              />
            </Field>
            <Field>
              <label className={labelClass}>{FORM_I18N.labelTiktok}</label>
              <input
                className={inputOk}
                value={form.tiktokUrl}
                onChange={(e) => update("tiktokUrl", e.target.value)}
              />
            </Field>
            <Field>
              <label className={labelClass}>{FORM_I18N.labelLine}</label>
              <input
                className={inputOk}
                value={form.lineOfficialUrl}
                onChange={(e) => update("lineOfficialUrl", e.target.value)}
              />
            </Field>
            <Field>
              <label className={labelClass}>{FORM_I18N.labelYoutube}</label>
              <input
                className={inputOk}
                value={form.youtubeUrl}
                onChange={(e) => update("youtubeUrl", e.target.value)}
              />
            </Field>
            <Field>
              <label className={labelClass}>{FORM_I18N.labelOtherSns}</label>
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
            <h2 className="font-serif text-lg text-charcoal">
              {FORM_I18N.headingLicense}
            </h2>
            {renderDocUploader(
              "businessLicenseDocument",
              FORM_I18N.docBusinessLicense,
              true,
              FORM_I18N.docBusinessLicenseHint,
            )}
            {renderDocUploader(
              "entertainmentLicenseDocument",
              FORM_I18N.docEntertainment,
              false,
            )}
            {renderDocUploader(
              "lateNightAlcoholNotificationDocument",
              FORM_I18N.docLateNight,
              false,
            )}
            <Field error={fe.openDate}>
              <label className={labelClass}>{FORM_I18N.labelOpenDate}</label>
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
            <h2 className="font-serif text-lg text-charcoal">
              {FORM_I18N.headingPlan}
            </h2>
            <p className="text-xs text-muted">{FORM_I18N.planHint}</p>
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
                            {FORM_I18N.selected}
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
            <h2 className="font-serif text-lg text-charcoal">
              {FORM_I18N.headingConsent}
            </h2>
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
                <span>{FORM_I18N.consentAccuracyText}</span>
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
                    {FORM_I18N.termsLink}
                  </Link>
                  {FORM_I18N.consentTermsJoiner}
                  <Link
                    href="/privacy"
                    className="text-gold-dark underline"
                    onClick={saveReturnStateForLegal}
                  >
                    {FORM_I18N.privacyLink}
                  </Link>
                  {FORM_I18N.consentTermsSuffix}
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
            <h2 className="font-serif text-lg text-charcoal">
              {FORM_I18N.headingImages}
            </h2>
            <p className="text-xs text-muted">{FORM_I18N.imagesHint}</p>
            {renderShopImageSection(
              "exterior",
              FORM_I18N.exteriorTitle,
              FORM_I18N.exteriorDesc,
              5,
            )}
            {renderShopImageSection(
              "interior",
              FORM_I18N.interiorTitle,
              FORM_I18N.interiorDesc,
              10,
            )}
            {uploadsBlockingNext ? (
              <p className="text-sm text-muted">
                {shopUploadsBusy || uploading
                  ? FORM_I18N.uploading
                  : FORM_I18N.uploadWait}
              </p>
            ) : null}
          </section>
        ) : null}

        {step === 8 ? (
          <section className={sectionClass}>
            <h2 className="font-serif text-lg text-charcoal">
              {FORM_I18N.headingConfirm}
            </h2>
            <dl className="space-y-2 text-sm text-charcoal">
              <div>
                <dt className="text-muted">{FORM_I18N.dtShopName}</dt>
                <dd>{form.shopName}</dd>
              </div>
              <div>
                <dt className="text-muted">{FORM_I18N.dtAddress}</dt>
                <dd>{form.shopAddress}</dd>
              </div>
              <div>
                <dt className="text-muted">{FORM_I18N.dtBusinessType}</dt>
                <dd>{form.businessType}</dd>
              </div>
              <div>
                <dt className="text-muted">{FORM_I18N.dtBusinessHours}</dt>
                <dd>{form.businessHours}</dd>
              </div>
              <div>
                <dt className="text-muted">{FORM_I18N.dtContact}</dt>
                <dd>
                  {form.contactName} / {form.contactEmail}
                </dd>
              </div>
              <div>
                <dt className="text-muted">{FORM_I18N.dtApplicantType}</dt>
                <dd>
                  {form.applicantType === "corporation"
                    ? FORM_I18N.applicantCorporation
                    : form.applicantType === "individual"
                      ? FORM_I18N.applicantIndividual
                      : FORM_I18N.notSelected}
                </dd>
              </div>
              {form.applicantType === "corporation" ? (
                <>
                  <div>
                    <dt className="text-muted">{FORM_I18N.dtCorporateName}</dt>
                    <dd>{form.corporateName || FORM_I18N.emDash}</dd>
                  </div>
                  <div>
                    <dt className="text-muted">{FORM_I18N.dtCorporateNumber}</dt>
                    <dd>{form.corporateNumber || FORM_I18N.emDash}</dd>
                  </div>
                  <div>
                    <dt className="text-muted">
                      {FORM_I18N.dtRepresentativeName}
                    </dt>
                    <dd>{form.representativeName || FORM_I18N.emDash}</dd>
                  </div>
                </>
              ) : null}
              <div>
                <dt className="text-muted">{FORM_I18N.dtIdentityDocument}</dt>
                <dd>
                  {form.identityDocumentFront
                    ? `${FORM_I18N.identityFrontLabel}: ${FORM_I18N.submitted}`
                    : FORM_I18N.notSubmitted}
                  {form.identityDocumentBack
                    ? ` / ${FORM_I18N.identityBackLabel}: ${FORM_I18N.submitted}`
                    : ""}
                </dd>
              </div>
              <div>
                <dt className="text-muted">{FORM_I18N.dtPlan}</dt>
                <dd>
                  {selectedPlan
                    ? planNameJa(selectedPlan)
                    : FORM_I18N.notSelected}
                </dd>
              </div>
              <div>
                <dt className="text-muted">{FORM_I18N.dtMonthly}</dt>
                <dd>
                  {selectedPlan
                    ? `${formatJpyPrice(JOB_PLAN_MONTHLY_PRICES[selectedPlan])}${FORM_I18N.taxIncluded}`
                    : FORM_I18N.emDash}
                </dd>
              </div>
              <div>
                <dt className="text-muted">{FORM_I18N.dtBusinessLicense}</dt>
                <dd>
                  {form.businessLicenseDocument
                    ? FORM_I18N.submitted
                    : FORM_I18N.notSubmitted}
                </dd>
              </div>
              <div>
                <dt className="text-muted">{FORM_I18N.dtEntertainment}</dt>
                <dd>
                  {form.entertainmentLicenseDocument
                    ? FORM_I18N.submitted
                    : FORM_I18N.notSubmitted}
                </dd>
              </div>
              <div>
                <dt className="text-muted">{FORM_I18N.dtLateNight}</dt>
                <dd>
                  {form.lateNightAlcoholNotificationDocument
                    ? FORM_I18N.submitted
                    : FORM_I18N.notSubmitted}
                </dd>
              </div>
            </dl>

            <div className="mt-4 space-y-3">
              <div>
                <p className="text-sm font-medium text-charcoal">
                  {FORM_I18N.exteriorCountPrefix}
                  {form.shopExteriorImages.length}
                  {FORM_I18N.countSuffix}
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
                  {FORM_I18N.interiorCountPrefix}
                  {form.shopInteriorImages.length}
                  {FORM_I18N.countSuffix}
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

            <p className="mt-4 text-xs text-muted">{FORM_I18N.confirmNote}</p>
          </section>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-3">
        {step > 1 ? (
          <button
            type="button"
            disabled={navigating || loading || uploadsBlockingNext}
            onClick={goBack}
            className="rounded-full border border-gold/40 px-5 py-3 text-sm font-medium text-gold-dark disabled:opacity-60"
          >
            {FORM_I18N.back}
          </button>
        ) : null}

        {step < STEPS.length ? (
          <button
            type="button"
            disabled={navigating || loading || uploadsBlockingNext}
            onClick={goNext}
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-gold to-gold-dark px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            {navigating ? FORM_I18N.navigating : FORM_I18N.next}
          </button>
        ) : null}

        {step === STEPS.length ? (
          <button
            type="button"
            disabled={loading || navigating || uploadsBlockingNext}
            onClick={() => void submit(false)}
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-gold to-gold-dark px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            {loading ? FORM_I18N.submitting : FORM_I18N.submit}
          </button>
        ) : null}
      </div>
    </div>
  );
}
