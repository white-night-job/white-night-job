import { randomBytes } from "crypto";
import type { JobPlan } from "@/lib/job-plan";
import { JOB_PLANS, isJobPlan, parseJobPlan } from "@/lib/job-plan";

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
  websiteUrl: string;
  instagramUrl: string;
  xUrl: string;
  tiktokUrl: string;
  lineOfficialUrl: string;
  youtubeUrl?: string;
  otherSns?: string;
  businessLicenseInfo: string;
  openDate: string;
  requestedPlan: JobPlan;
  listingReason: string;
  shopFeatures: string;
  notes?: string;
  consentAccuracy: boolean;
  consentTerms: boolean;
  attachments?: ListingAttachment[];
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

export function getSiteOrigin(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, "");
  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) return `https://${vercel.replace(/\/$/, "")}`;
  return "http://localhost:3000";
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

export function validateListingApplicationInput(
  input: Partial<ListingApplicationInput>,
): string | null {
  // honeypot
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
    requiredText(input.businessLicenseInfo, "営業許可に関する情報"),
    requiredText(input.openDate, "オープン日"),
    requiredText(input.listingReason, "掲載を希望する理由"),
    requiredText(input.shopFeatures, "店舗の特徴"),
  ];

  for (const error of checks) {
    if (error) return error;
  }

  if (!isJobPlan(input.requestedPlan)) {
    return "希望プランを選択してください。";
  }

  if (!input.consentAccuracy) {
    return "求人内容と実際の勤務条件に相違がないことへの同意が必要です。";
  }
  if (!input.consentTerms) {
    return "利用規約・掲載基準・プライバシーポリシーへの同意が必要です。";
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

  if (Array.isArray(input.attachments) && input.attachments.length > 8) {
    return "添付資料は最大8件までです。";
  }

  return null;
}

export function normalizeListingApplicationInput(
  input: ListingApplicationInput,
): ListingApplicationInput {
  const trim = (value: string | undefined) => (value ?? "").trim();
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
    websiteUrl: trim(input.websiteUrl),
    instagramUrl: trim(input.instagramUrl),
    xUrl: trim(input.xUrl),
    tiktokUrl: trim(input.tiktokUrl),
    lineOfficialUrl: trim(input.lineOfficialUrl),
    youtubeUrl: trim(input.youtubeUrl) || undefined,
    otherSns: trim(input.otherSns) || undefined,
    businessLicenseInfo: trim(input.businessLicenseInfo),
    openDate: trim(input.openDate),
    requestedPlan: parseJobPlan(input.requestedPlan) ?? "light",
    listingReason: trim(input.listingReason),
    shopFeatures: trim(input.shopFeatures),
    notes: trim(input.notes) || undefined,
    consentAccuracy: Boolean(input.consentAccuracy),
    consentTerms: Boolean(input.consentTerms),
    attachments: Array.isArray(input.attachments) ? input.attachments : [],
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
    website_url: input.websiteUrl,
    instagram_url: input.instagramUrl,
    x_url: input.xUrl,
    tiktok_url: input.tiktokUrl,
    line_official_url: input.lineOfficialUrl,
    youtube_url: input.youtubeUrl ?? null,
    other_sns: input.otherSns ?? null,
    business_license_info: input.businessLicenseInfo,
    open_date: input.openDate,
    requested_plan: input.requestedPlan,
    listing_reason: input.listingReason,
    shop_features: input.shopFeatures,
    notes: input.notes ?? null,
    consent_accuracy: input.consentAccuracy,
    consent_terms: input.consentTerms,
    attachments: input.attachments ?? [],
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
  website_url: string;
  instagram_url: string;
  x_url: string;
  tiktok_url: string;
  line_official_url: string;
  youtube_url: string | null;
  other_sns: string | null;
  business_license_info: string;
  open_date: string;
  requested_plan: JobPlan;
  confirmed_plan: JobPlan | null;
  listing_reason: string;
  shop_features: string;
  notes: string | null;
  consent_accuracy: boolean;
  consent_terms: boolean;
  attachments: ListingAttachment[] | null;
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
    rejectionReason:
      row.status === "rejected" ? row.rejection_reason : null,
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
  if (!plan) return "—";
  if (plan === "light") return "ライト";
  if (plan === "standard") return "スタンダード";
  if (plan === "premium") return "プレミアム";
  return plan;
}

export { JOB_PLANS };
