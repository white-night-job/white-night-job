import { randomBytes } from "crypto";
import {
  formatJpyPrice,
  JOB_PLAN_DEFINITIONS,
  JOB_PLAN_MONTHLY_PRICES,
  JOB_PLANS,
  isJobPlan,
  parseJobPlan,
  type JobPlan,
} from "@/lib/job-plan";
import { SHOP_TERMS_VERSION } from "@/lib/shop-terms";

export const LISTING_APPLICATION_STATUSES = [
  "pending",
  "reviewing",
  "needs_info",
  "approved",
  "rejected",
  "withdrawn",
] as const;

export type ListingApplicationStatus =
  (typeof LISTING_APPLICATION_STATUSES)[number];

export const LISTING_APPLICATION_STATUS_LABELS: Record<
  ListingApplicationStatus,
  string
> = {
  pending: "審査待ち",
  reviewing: "審査中",
  needs_info: "追加確認",
  approved: "承認",
  rejected: "否認",
  withdrawn: "取り下げ",
};

export type ListingAttachment = {
  url: string;
  name: string;
  size: number;
  type: string;
  storagePath?: string;
};

export type ListingDocumentMeta = {
  storagePath: string;
  fileName: string;
  mimeType: string;
  size: number;
  uploadedAt: string;
  signedUrl?: string;
};

export const LISTING_APPLICANT_TYPES = ["individual", "corporation"] as const;
export type ListingApplicantType = (typeof LISTING_APPLICANT_TYPES)[number];

export const LISTING_APPLICANT_TYPE_LABELS: Record<ListingApplicantType, string> =
  {
    individual: "個人事業主",
    corporation: "法人",
  };

export function isListingApplicantType(
  value: unknown,
): value is ListingApplicantType {
  return (
    typeof value === "string" &&
    (LISTING_APPLICANT_TYPES as readonly string[]).includes(value)
  );
}

/** Corporate number: exactly 13 ASCII digits. */
export function normalizeCorporateNumber(value: string | undefined): string {
  return String(value ?? "")
    .replace(/[\uFF10-\uFF19]/g, (d) =>
      String.fromCharCode(d.charCodeAt(0) - 0xfee0),
    )
    .replace(/\D/g, "");
}

export function isValidCorporateNumber(value: string | undefined): boolean {
  return /^\d{13}$/.test(normalizeCorporateNumber(value));
}


export type ListingShopImageKind = "exterior" | "interior";

export type ListingShopImage = {
  storagePath: string;
  fileName: string;
  mimeType: string;
  size: number;
  kind: ListingShopImageKind;
  sortOrder: number;
  uploadedAt: string;
  signedUrl?: string;
};

export type ListingApplicationInput = {
  shopName: string;
  shopAddress: string;
  area?: string;
  businessType: string;
  businessHours: string;
  shopPhone: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  applicantType: ListingApplicantType;
  corporateName?: string;
  corporateNameKana?: string;
  corporateNumber?: string;
  representativeName?: string;
  identityDocumentFront?: ListingDocumentMeta | null;
  identityDocumentBack?: ListingDocumentMeta | null;
  websiteUrl: string;
  instagramUrl: string;
  xUrl: string;
  tiktokUrl: string;
  lineOfficialUrl: string;
  youtubeUrl?: string;
  otherSns?: string;
  openDate: string;
  requestedPlan: JobPlan;
  listingReason?: string;
  shopFeatures?: string;
  notes?: string;
  consentAccuracy: boolean;
  consentTerms: boolean;
  consentAntisocial: boolean;
  attachments?: ListingAttachment[];
  shopExteriorImages?: ListingShopImage[];
  shopInteriorImages?: ListingShopImage[];
  businessLicenseDocument?: ListingDocumentMeta | null;
  entertainmentLicenseDocument?: ListingDocumentMeta | null;
  lateNightAlcoholNotificationDocument?: ListingDocumentMeta | null;
  /** legacy hidden field */
  businessLicenseInfo?: string;
  /** honeypot — must be empty */
  website?: string;
  /** form open timestamp ms */
  formOpenedAt?: number;
};

export type ListingApplicationPublicStatus = {
  applicationNumber: string;
  status: ListingApplicationStatus;
  statusLabel: string;
  shopName: string;
  requestedPlan: JobPlan;
  confirmedPlan: JobPlan | null;
  submittedAt: string;
  rejectionReason: string | null;
  needsInfoMessage: string | null;
  needsInfoDeadline: string | null;
  approvedAt: string | null;
  hasInvite: boolean;
  onboardingCompleted: boolean;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[0-9+\-()（）\s]{8,20}$/;
const URL_RE = /^https?:\/\/.+/i;

export function isListingApplicationStatus(
  value: unknown,
): value is ListingApplicationStatus {
  return (
    typeof value === "string" &&
    (LISTING_APPLICATION_STATUSES as readonly string[]).includes(value)
  );
}

export function generateApplicationNumber(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const suffix = randomBytes(3).toString("hex").toUpperCase();
  return `WNJ-${y}${m}${d}-${suffix}`;
}

export function generateInviteCode(): string {
  return randomBytes(16).toString("hex");
}

/** Canonical public site origin for applicant-facing links (onboarding, email). */
export const DEFAULT_PUBLIC_SITE_ORIGIN = "https://whitenightjob.jp";

/**
 * Public site origin for listing-application links.
 * Never uses Vercel preview hostnames (VERCEL_URL / *.vercel.app).
 */
export function getSiteOrigin(): string {
  const explicit =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    process.env.SITE_URL?.trim() ||
    "";
  if (explicit) {
    const normalized = explicit.replace(/\/$/, "");
    // Guard: preview deployments sometimes set NEXT_PUBLIC_SITE_URL to the
    // deployment URL. Applicant-facing links must stay on the production domain.
    if (!/\.vercel\.app$/i.test(normalized.replace(/^https?:\/\//i, ""))) {
      return normalized.startsWith("http")
        ? normalized
        : `https://${normalized}`;
    }
  }
  return DEFAULT_PUBLIC_SITE_ORIGIN;
}

export function buildOnboardingUrl(inviteCode: string): string {
  return `${getSiteOrigin()}/for-shops/onboarding/${inviteCode}`;
}

export function buildNeedsInfoUploadUrl(token: string): string {
  return `${getSiteOrigin()}/for-shops/review-status?upload=${encodeURIComponent(token)}`;
}

function requiredText(value: unknown, label: string): string | null {
  if (typeof value !== "string" || !value.trim()) {
    return `${label}を入力してください。`;
  }
  return null;
}

function isDocMeta(value: unknown): value is ListingDocumentMeta {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.storagePath === "string" &&
    typeof v.fileName === "string" &&
    typeof v.mimeType === "string" &&
    typeof v.size === "number" &&
    typeof v.uploadedAt === "string"
  );
}

function isShopImage(value: unknown): value is ListingShopImage {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.storagePath === "string" &&
    typeof v.fileName === "string" &&
    typeof v.mimeType === "string" &&
    typeof v.size === "number" &&
    (v.kind === "exterior" || v.kind === "interior") &&
    typeof v.sortOrder === "number" &&
    typeof v.uploadedAt === "string"
  );
}

export function isListingShopImage(value: unknown): value is ListingShopImage {
  return isShopImage(value);
}

export function validateListingApplicationInput(
  input: Partial<ListingApplicationInput>,
): string | null {
  if (typeof input.website === "string" && input.website.trim()) {
    return "送信に失敗しました。しばらくしてから再度お試しください。";
  }

  if (typeof input.formOpenedAt === "number") {
    const elapsed = Date.now() - input.formOpenedAt;
    if (elapsed >= 0 && elapsed < 3000) {
      return "送信が早すぎます。内容を確認してから再度送信してください。";
    }
  }

  const checks: Array<string | null> = [
    requiredText(input.shopName, "店舗名"),
    requiredText(input.shopAddress, "店舗所在地"),
    requiredText(input.businessType, "業種"),
    requiredText(input.businessHours, "営業時間"),
    requiredText(input.shopPhone, "店舗電話番号"),
    requiredText(input.contactName, "担当者名"),
    requiredText(input.contactPhone, "担当者電話番号"),
    requiredText(input.contactEmail, "担当者メールアドレス"),
    requiredText(input.websiteUrl, "公式WebサイトまたはSNSのURL"),
    requiredText(input.openDate, "オープン日"),
  ];

  for (const error of checks) {
    if (error) return error;
  }

  if (!isListingApplicantType(input.applicantType)) {
    return "申請者区分を選択してください。";
  }

  if (input.applicantType === "corporation") {
    if (!String(input.corporateName ?? "").trim()) {
      return "法人名を入力してください。";
    }
    if (!String(input.corporateNameKana ?? "").trim()) {
      return "法人名フリガナを入力してください。";
    }
    if (!isValidCorporateNumber(input.corporateNumber)) {
      return "法人番号は数字13桁で入力してください。";
    }
    if (!String(input.representativeName ?? "").trim()) {
      return "代表者名を入力してください。";
    }
  }

  if (!isDocMeta(input.identityDocumentFront)) {
    return "顔写真付き身分証明書をアップロードしてください。";
  }
  if (
    input.identityDocumentBack != null &&
    !isDocMeta(input.identityDocumentBack)
  ) {
    return "身分証明書（裏面）の形式が正しくありません。";
  }

  if (!isDocMeta(input.businessLicenseDocument)) {
    return "営業許可証をアップロードしてください。";
  }

  if (!isJobPlan(input.requestedPlan)) {
    return "料金プランを選択してください";
  }

  if (!input.consentAccuracy) {
    return "求人内容と実際の勤務条件に相違がないことへの同意が必要です。";
  }
  if (!input.consentTerms) {
    return "利用規約・プライバシーポリシーへの同意が必要です。";
  }
  if (!input.consentAntisocial) {
    return "反社会的勢力に該当しないことの確認が必要です。";
  }

  if (!EMAIL_RE.test(String(input.contactEmail).trim())) {
    return "担当者メールアドレスの形式が正しくありません。";
  }
  if (!PHONE_RE.test(String(input.shopPhone).trim())) {
    return "店舗電話番号の形式が正しくありません。";
  }
  if (!PHONE_RE.test(String(input.contactPhone).trim())) {
    return "担当者電話番号の形式が正しくありません。";
  }

  if (!URL_RE.test(String(input.websiteUrl).trim())) {
    return "公式WebサイトまたはSNSは https:// から始まるURLで入力してください。";
  }

  const optionalUrlFields: Array<[string | undefined, string]> = [
    [input.instagramUrl, "Instagram"],
    [input.xUrl, "X"],
    [input.tiktokUrl, "TikTok"],
    [input.lineOfficialUrl, "LINE公式アカウント"],
    [input.youtubeUrl, "YouTube"],
  ];
  for (const [value, label] of optionalUrlFields) {
    if (value?.trim() && !URL_RE.test(value.trim())) {
      return `${label}は https:// から始まるURLで入力してください。`;
    }
  }

  const openDate = String(input.openDate).trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(openDate)) {
    return "オープン日はYYYY-MM-DD形式で入力してください。";
  }


  const exterior = Array.isArray(input.shopExteriorImages)
    ? input.shopExteriorImages
    : [];
  const interior = Array.isArray(input.shopInteriorImages)
    ? input.shopInteriorImages
    : [];
  if (exterior.length === 0 && interior.length === 0) {
    return "店舗外観と店舗内観の画像をアップロードしてください";
  }
  if (exterior.length === 0) {
    return "店舗外観の画像をアップロードしてください";
  }
  if (interior.length === 0) {
    return "店舗内観の画像をアップロードしてください";
  }
  if (exterior.length > 5) {
    return "店舗外観は最大5枚までです。";
  }
  if (interior.length > 10) {
    return "店舗内観は最大10枚までです。";
  }
  for (const img of [...exterior, ...interior]) {
    if (!isShopImage(img)) {
      return "店舗画像の形式が正しくありません。";
    }
  }

  return null;
}

export function normalizeListingApplicationInput(
  input: ListingApplicationInput,
): ListingApplicationInput {
  const trim = (value: string | undefined) => (value ?? "").trim();
  const normalizeDoc = (doc?: ListingDocumentMeta | null) =>
    isDocMeta(doc)
      ? {
          storagePath: doc.storagePath.trim(),
          fileName: doc.fileName.trim(),
          mimeType: doc.mimeType.trim(),
          size: Number(doc.size || 0),
          uploadedAt: doc.uploadedAt,
          // signedUrl is ephemeral (preview only); never persist to DB
        }
      : null;

  const normalizeImages = (
    images: ListingShopImage[] | undefined,
    kind: ListingShopImageKind,
  ): ListingShopImage[] =>
    (Array.isArray(images) ? images : [])
      .filter(isShopImage)
      .map((img, index) => ({
        storagePath: img.storagePath.trim(),
        fileName: img.fileName.trim(),
        mimeType: img.mimeType.trim(),
        size: Number(img.size || 0),
        kind,
        sortOrder: Number.isFinite(img.sortOrder) ? img.sortOrder : index,
        uploadedAt: img.uploadedAt,
      }))
      .sort((a, b) => a.sortOrder - b.sortOrder);

  const applicantType: ListingApplicantType = isListingApplicantType(
    input.applicantType,
  )
    ? input.applicantType
    : "individual";

  return {
    shopName: trim(input.shopName),
    shopAddress: trim(input.shopAddress),
    area: trim(input.area) || undefined,
    businessType: trim(input.businessType),
    businessHours: trim(input.businessHours),
    shopPhone: trim(input.shopPhone),
    contactName: trim(input.contactName),
    contactPhone: trim(input.contactPhone),
    contactEmail: trim(input.contactEmail).toLowerCase(),
    applicantType,
    corporateName:
      applicantType === "corporation"
        ? trim(input.corporateName) || undefined
        : undefined,
    corporateNameKana:
      applicantType === "corporation"
        ? trim(input.corporateNameKana) || undefined
        : undefined,
    corporateNumber:
      applicantType === "corporation"
        ? normalizeCorporateNumber(input.corporateNumber) || undefined
        : undefined,
    representativeName:
      applicantType === "corporation"
        ? trim(input.representativeName) || undefined
        : undefined,
    identityDocumentFront: normalizeDoc(input.identityDocumentFront),
    identityDocumentBack: normalizeDoc(input.identityDocumentBack),
    websiteUrl: trim(input.websiteUrl),
    instagramUrl: trim(input.instagramUrl),
    xUrl: trim(input.xUrl),
    tiktokUrl: trim(input.tiktokUrl),
    lineOfficialUrl: trim(input.lineOfficialUrl),
    youtubeUrl: trim(input.youtubeUrl) || undefined,
    otherSns: trim(input.otherSns) || undefined,
    businessLicenseInfo: trim(input.businessLicenseInfo),
    openDate: trim(input.openDate),
    requestedPlan: parseJobPlan(input.requestedPlan),
    listingReason: "",
    shopFeatures: "",
    notes: undefined,
    consentAccuracy: Boolean(input.consentAccuracy),
    consentTerms: Boolean(input.consentTerms),
    consentAntisocial: Boolean(input.consentAntisocial),
    attachments: [],
    shopExteriorImages: normalizeImages(input.shopExteriorImages, "exterior"),
    shopInteriorImages: normalizeImages(input.shopInteriorImages, "interior"),
    businessLicenseDocument: normalizeDoc(input.businessLicenseDocument),
    entertainmentLicenseDocument: normalizeDoc(input.entertainmentLicenseDocument),
    lateNightAlcoholNotificationDocument: normalizeDoc(
      input.lateNightAlcoholNotificationDocument,
    ),
    website: "",
    formOpenedAt: input.formOpenedAt,
  };
}

export function inputToDbRow(
  input: ListingApplicationInput,
  extras: {
    applicationNumber: string;
    clientIp?: string;
    userAgent?: string;
  },
) {
  return {
    application_number: extras.applicationNumber,
    status: "pending" as const,
    shop_name: input.shopName,
    shop_address: input.shopAddress,
    area: input.area ?? null,
    business_type: input.businessType,
    business_hours: input.businessHours,
    shop_phone: input.shopPhone,
    contact_name: input.contactName,
    contact_phone: input.contactPhone,
    contact_email: input.contactEmail,
    applicant_type: input.applicantType,
    corporate_name:
      input.applicantType === "corporation"
        ? (input.corporateName ?? null)
        : null,
    corporate_name_kana:
      input.applicantType === "corporation"
        ? (input.corporateNameKana ?? null)
        : null,
    corporate_number:
      input.applicantType === "corporation"
        ? (input.corporateNumber ?? null)
        : null,
    representative_name:
      input.applicantType === "corporation"
        ? (input.representativeName ?? null)
        : null,
    identity_document_front: input.identityDocumentFront ?? null,
    identity_document_back: input.identityDocumentBack ?? null,
    website_url: input.websiteUrl,
    instagram_url: input.instagramUrl,
    x_url: input.xUrl,
    tiktok_url: input.tiktokUrl,
    line_official_url: input.lineOfficialUrl,
    youtube_url: input.youtubeUrl ?? null,
    other_sns: input.otherSns ?? null,
    business_license_info: input.businessLicenseInfo ?? "",
    open_date: input.openDate,
    requested_plan: input.requestedPlan,
    listing_reason: input.listingReason ?? "",
    shop_features: input.shopFeatures ?? "",
    notes: null,
    consent_accuracy: input.consentAccuracy,
    consent_terms: input.consentTerms,
    consent_antisocial: input.consentAntisocial,
    consent_antisocial_at: input.consentAntisocial
      ? new Date().toISOString()
      : null,
    shop_terms_version: input.consentAntisocial ? SHOP_TERMS_VERSION : null,
    attachments: [],
    shop_exterior_images: input.shopExteriorImages ?? [],
    shop_interior_images: input.shopInteriorImages ?? [],
    business_license_document: input.businessLicenseDocument ?? null,
    entertainment_license_document: input.entertainmentLicenseDocument ?? null,
    late_night_alcohol_notification_document:
      input.lateNightAlcoholNotificationDocument ?? null,
    client_ip: extras.clientIp ?? null,
    user_agent: extras.userAgent ?? null,
  };
}

export type ListingApplicationRow = {
  id: string;
  application_number: string;
  status: ListingApplicationStatus;
  shop_name: string;
  shop_address: string;
  area: string | null;
  business_type: string;
  business_hours: string;
  shop_phone: string;
  contact_name: string;
  contact_phone: string;
  contact_email: string;
  applicant_type: ListingApplicantType | null;
  corporate_name: string | null;
  corporate_name_kana: string | null;
  corporate_number: string | null;
  representative_name: string | null;
  identity_document_front: ListingDocumentMeta | null;
  identity_document_back: ListingDocumentMeta | null;
  website_url: string;
  instagram_url: string;
  x_url: string;
  tiktok_url: string;
  line_official_url: string;
  youtube_url: string | null;
  other_sns: string | null;
  business_license_info: string;
  business_license_document: ListingDocumentMeta | null;
  entertainment_license_document: ListingDocumentMeta | null;
  late_night_alcohol_notification_document: ListingDocumentMeta | null;
  open_date: string;
  requested_plan: JobPlan;
  confirmed_plan: JobPlan | null;
  listing_reason: string;
  shop_features: string;
  notes: string | null;
  consent_accuracy: boolean;
  consent_terms: boolean;
  consent_antisocial: boolean;
  consent_antisocial_at: string | null;
  shop_terms_version: string | null;
  attachments: ListingAttachment[] | null;
  shop_exterior_images: ListingShopImage[] | null;
  shop_interior_images: ListingShopImage[] | null;
  admin_memo: string | null;
  assigned_admin: string | null;
  rejection_reason: string | null;
  needs_info_message: string | null;
  needs_info_deadline: string | null;
  needs_info_upload_token: string | null;
  approved_at: string | null;
  approved_by: string | null;
  invite_code: string | null;
  invite_expires_at: string | null;
  linked_job_id: string | null;
  linked_shop_id?: string | null;
  onboarding_completed_at: string | null;
  created_at: string;
  updated_at: string;
};

export function rowToPublicStatus(
  row: ListingApplicationRow,
): ListingApplicationPublicStatus {
  return {
    applicationNumber: row.application_number,
    status: row.status,
    statusLabel: LISTING_APPLICATION_STATUS_LABELS[row.status],
    shopName: row.shop_name,
    requestedPlan: row.requested_plan,
    confirmedPlan: row.confirmed_plan,
    submittedAt: row.created_at,
    rejectionReason: row.status === "rejected" ? row.rejection_reason : null,
    needsInfoMessage:
      row.status === "needs_info" ? row.needs_info_message : null,
    needsInfoDeadline:
      row.status === "needs_info" ? row.needs_info_deadline : null,
    approvedAt: row.status === "approved" ? row.approved_at : null,
    hasInvite: Boolean(row.invite_code) && row.status === "approved",
    onboardingCompleted: Boolean(row.onboarding_completed_at),
  };
}

export function planLabel(plan: JobPlan | null | undefined): string {
  if (!plan || !isJobPlan(plan)) return "—";
  const name = JOB_PLAN_DEFINITIONS[plan].label;
  const price = formatJpyPrice(JOB_PLAN_MONTHLY_PRICES[plan]);
  return `${name}プラン（月額${price}）`;
}

export { JOB_PLANS };
