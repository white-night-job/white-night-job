import { rowToChatRecommend } from "@/lib/chat-recommend-db";
import {
  FIXED_AREA,
  type CastVoiceEntry,
  type District,
  type Job,
  type JobType,
} from "@/types/job";

export type JobPayload = {
  shopName: string;
  district: District;
  jobType: JobType;
  salary: string;
  benefits: string[];
  otherBenefits?: string[];
  introductionText?: string;
  descriptionText?: string;
  castVoices?: CastVoiceEntry[];
  businessHours?: string;
  ageGroup?: string;
  customerPersonalityLevel?: number;
  customerAgeLevel?: number;
  customerRegularLevel?: number;
  imageUrl?: string;
  storeImages?: string[];
  recruiterName?: string;
  recruiterTitle?: string;
  recruiterImage?: string;
  recruiterMessage?: string;
  phone?: string;
  address?: string;
  access?: string;
  xUrl?: string;
  instagramUrl?: string;
  tiktokUrl?: string;
  youtubeUrl?: string;
  websiteUrl?: string;
  lineUrl: string;
  workHours?: string;
  requirements?: string[];
  isVerified?: boolean;
};

type JobRow = {
  id: string;
  shop_name: string;
  area: string;
  district: District;
  job_type: JobType;
  title: string;
  salary: string;
  work_hours: string;
  business_hours: string | null;
  age_group: string | null;
  customer_personality_level: number | null;
  customer_age_level: number | null;
  customer_regular_level: number | null;
  introduction_text: string | null;
  description_text: string | null;
  description: string | null;
  cast_voice: string | null;
  cast_voices?: unknown;
  store_images?: unknown;
  requirements: string[] | null;
  benefits: string[] | null;
  other_benefits: string[] | null;
  is_verified: boolean;
  image_url: string | null;
  recruiter_name: string | null;
  recruiter_title: string | null;
  recruiter_image: string | null;
  recruiter_message: string | null;
  phone: string | null;
  address: string | null;
  access: string | null;
  x_url: string | null;
  instagram_url: string | null;
  tiktok_url: string | null;
  youtube_url: string | null;
  website_url: string | null;
  line_url: string;
  posted_at: string;
  shop_login_id?: string | null;
  shop_login_password?: string | null;
  chat_recommend_enabled?: boolean | null;
  chat_recommend_priority?: number | null;
  chat_recommend_comment?: string | null;
  chat_recommend_beginner?: boolean | null;
  chat_recommend_no_alcohol_ok?: boolean | null;
  chat_recommend_shuttle?: boolean | null;
  chat_recommend_privacy?: boolean | null;
  chat_recommend_high_salary?: boolean | null;
  chat_recommend_relaxed?: boolean | null;
  chat_recommend_high_earning?: boolean | null;
};

export function rowToJob(row: JobRow): Job {
  return {
    id: row.id,
    shopName: row.shop_name,
    area: FIXED_AREA,
    district: row.district,
    jobType: row.job_type,
    title: row.title,
    salary: row.salary,
    workHours: row.work_hours,
    businessHours: row.business_hours ?? undefined,
    ageGroup: row.age_group ?? undefined,
    customerPersonalityLevel: row.customer_personality_level ?? undefined,
    customerAgeLevel: row.customer_age_level ?? undefined,
    customerRegularLevel: row.customer_regular_level ?? undefined,
    introductionText: row.introduction_text?.trim() || undefined,
    descriptionText:
      row.description_text?.trim() || row.description?.trim() || undefined,
    castVoices: resolveCastVoicesFromRow(row),
    castVoice: row.cast_voice?.trim() || undefined,
    requirements: row.requirements ?? [],
    benefits: row.benefits ?? [],
    otherBenefits: row.other_benefits ?? [],
    isVerified: row.is_verified,
    imageUrl: row.image_url ?? undefined,
    storeImages: getDisplayStoreImages({ storeImages: undefined, store_images: row.store_images }),
    recruiterName: row.recruiter_name?.trim() || undefined,
    recruiterTitle: row.recruiter_title?.trim() || undefined,
    recruiterImage: row.recruiter_image?.trim() || undefined,
    recruiterMessage: row.recruiter_message?.trim() || undefined,
    phone: row.phone ?? undefined,
    address: row.address ?? undefined,
    access: row.access ?? undefined,
    xUrl: row.x_url ?? undefined,
    instagramUrl: row.instagram_url ?? undefined,
    tiktokUrl: row.tiktok_url ?? undefined,
    youtubeUrl: row.youtube_url ?? undefined,
    websiteUrl: row.website_url ?? undefined,
    lineUrl: row.line_url,
    postedAt: row.posted_at,
    shopLoginId: row.shop_login_id?.trim() || undefined,
    chatRecommend: rowToChatRecommend(row),
  };
}

export type ParsedShopCredentials = {
  shop_login_id?: string | null;
  shop_login_password?: string;
  passwordProvided: boolean;
};

export function parseShopCredentialsFromBody(
  body: Record<string, unknown>,
): ParsedShopCredentials {
  const shopLoginIdValue = body.shop_login_id ?? body.shopLoginId;
  const shopLoginPasswordValue =
    body.shop_login_password ?? body.shopLoginPassword;

  const parsed: ParsedShopCredentials = {
    passwordProvided: false,
  };

  if (shopLoginIdValue !== undefined) {
    parsed.shop_login_id = String(shopLoginIdValue).trim() || null;
  }

  if (
    shopLoginPasswordValue !== undefined &&
    String(shopLoginPasswordValue).trim().length > 0
  ) {
    parsed.shop_login_password = String(shopLoginPasswordValue).trim();
    parsed.passwordProvided = true;
  }

  return parsed;
}

export function shopCredentialsToRow(
  credentials: ParsedShopCredentials,
): {
  shop_login_id?: string | null;
  shop_login_password?: string | null;
} {
  const row: {
    shop_login_id?: string | null;
    shop_login_password?: string | null;
  } = {};

  if (credentials.shop_login_id !== undefined) {
    row.shop_login_id = credentials.shop_login_id;
  }

  if (credentials.passwordProvided && credentials.shop_login_password) {
    row.shop_login_password = credentials.shop_login_password;
  }

  return row;
}

function readOptionalString(value: unknown): string | undefined {
  if (value === undefined || value === null) return undefined;
  const trimmed = String(value).trim();
  return trimmed || undefined;
}

export function hasRecruiterContent(
  job: Pick<
    Job,
    "recruiterName" | "recruiterTitle" | "recruiterImage" | "recruiterMessage"
  >,
): boolean {
  return Boolean(
    job.recruiterName?.trim() ||
      job.recruiterTitle?.trim() ||
      job.recruiterImage?.trim() ||
      job.recruiterMessage?.trim(),
  );
}

export function payloadToRow(payload: JobPayload) {
  const shopName = payload.shopName.trim();

  return {
    shop_name: shopName,
    area: FIXED_AREA,
    district: payload.district,
    job_type: payload.jobType,
    title: `${shopName}｜${payload.jobType}募集`,
    salary: payload.salary.trim(),
    work_hours: payload.workHours ?? "20:00〜LAST",
    business_hours: payload.businessHours?.trim() || null,
    age_group: payload.ageGroup?.trim() || null,
    customer_personality_level: normalizeLevel(payload.customerPersonalityLevel),
    customer_age_level: normalizeLevel(payload.customerAgeLevel),
    customer_regular_level: normalizeLevel(payload.customerRegularLevel),
    introduction_text: payload.introductionText?.trim() || null,
    description_text: payload.descriptionText?.trim() || null,
    description: payload.descriptionText?.trim() || null,
    cast_voices: sanitizeCastVoicesForSave(payload.castVoices ?? []),
    requirements: payload.requirements ?? ["20歳以上"],
    benefits: payload.benefits,
    other_benefits: payload.otherBenefits ?? [],
    is_verified: payload.isVerified ?? false,
    image_url: payload.imageUrl?.trim() || null,
    store_images: sanitizeStoreImagesForSave(payload.storeImages ?? []),
    recruiter_name: payload.recruiterName?.trim() || null,
    recruiter_title: payload.recruiterTitle?.trim() || null,
    recruiter_image: payload.recruiterImage?.trim() || null,
    recruiter_message: payload.recruiterMessage?.trim() || null,
    phone: payload.phone?.trim() || null,
    address: payload.address?.trim() || null,
    access: payload.access?.trim() || null,
    x_url: payload.xUrl?.trim() || null,
    instagram_url: payload.instagramUrl?.trim() || null,
    tiktok_url: payload.tiktokUrl?.trim() || null,
    youtube_url: payload.youtubeUrl?.trim() || null,
    website_url: payload.websiteUrl?.trim() || null,
    line_url: payload.lineUrl.trim(),
  };
}

export function normalizeJobPayload(body: unknown): JobPayload {
  const data = body as Partial<JobPayload>;
  return {
    shopName: String(data.shopName ?? ""),
    district: data.district as District,
    jobType: data.jobType as JobType,
    salary: String(data.salary ?? ""),
    benefits: Array.isArray(data.benefits) ? data.benefits.map(String) : [],
    otherBenefits: Array.isArray(data.otherBenefits)
      ? data.otherBenefits.map(String)
      : [],
    introductionText: data.introductionText
      ? String(data.introductionText)
      : undefined,
    descriptionText: data.descriptionText
      ? String(data.descriptionText)
      : undefined,
    castVoices: normalizeCastVoicesInput(
      data.castVoices ??
        (data as { cast_voices?: unknown }).cast_voices,
    ),
    businessHours: data.businessHours ? String(data.businessHours) : undefined,
    ageGroup: data.ageGroup ? String(data.ageGroup) : undefined,
    customerPersonalityLevel: data.customerPersonalityLevel
      ? Number(data.customerPersonalityLevel)
      : undefined,
    customerAgeLevel: data.customerAgeLevel
      ? Number(data.customerAgeLevel)
      : undefined,
    customerRegularLevel: data.customerRegularLevel
      ? Number(data.customerRegularLevel)
      : undefined,
    imageUrl: data.imageUrl ? String(data.imageUrl) : undefined,
    storeImages:
      normalizeStoreImagesInput(
        data.storeImages ?? (data as { store_images?: unknown }).store_images,
      ) ?? [],
    recruiterName: readOptionalString(
      data.recruiterName ?? (data as { recruiter_name?: unknown }).recruiter_name,
    ),
    recruiterTitle: readOptionalString(
      data.recruiterTitle ?? (data as { recruiter_title?: unknown }).recruiter_title,
    ),
    recruiterImage: readOptionalString(
      data.recruiterImage ?? (data as { recruiter_image?: unknown }).recruiter_image,
    ),
    recruiterMessage: readOptionalString(
      data.recruiterMessage ??
        (data as { recruiter_message?: unknown }).recruiter_message,
    ),
    phone: data.phone ? String(data.phone) : undefined,
    address: data.address ? String(data.address) : undefined,
    access: data.access ? String(data.access) : undefined,
    xUrl: data.xUrl ? String(data.xUrl) : undefined,
    instagramUrl: data.instagramUrl ? String(data.instagramUrl) : undefined,
    tiktokUrl: data.tiktokUrl ? String(data.tiktokUrl) : undefined,
    youtubeUrl: data.youtubeUrl ? String(data.youtubeUrl) : undefined,
    websiteUrl: data.websiteUrl ? String(data.websiteUrl) : undefined,
    lineUrl: String(data.lineUrl ?? ""),
    workHours: data.workHours ? String(data.workHours) : undefined,
    requirements: Array.isArray(data.requirements)
      ? data.requirements.map(String)
      : undefined,
    isVerified: Boolean(data.isVerified ?? false),
  };
}

export function coerceStoreImagesToArray(value: unknown): unknown[] {
  if (value === null || value === undefined) return [];

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed || trimmed === "[]") return [];
    try {
      return coerceStoreImagesToArray(JSON.parse(trimmed));
    } catch {
      return trimmed ? [trimmed] : [];
    }
  }

  if (Array.isArray(value)) return value;

  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    if (Array.isArray(record.store_images)) return record.store_images;
    if (Array.isArray(record.storeImages)) return record.storeImages;
    if (typeof record.url === "string") return [record.url];
    if (typeof record.imageUrl === "string") return [record.imageUrl];
  }

  return [];
}

function normalizeStoreImageItem(item: unknown): string {
  if (typeof item === "string") return item.trim();
  if (item && typeof item === "object") {
    const record = item as Record<string, unknown>;
    return String(record.url ?? record.imageUrl ?? record.publicUrl ?? "").trim();
  }
  return "";
}

export function parseStoreImages(value: unknown): string[] {
  return coerceStoreImagesToArray(value)
    .map((item) => normalizeStoreImageItem(item))
    .filter(Boolean);
}

export function sanitizeStoreImagesForSave(urls: string[]): string[] {
  return urls.map((url) => url.trim()).filter(Boolean);
}

function normalizeStoreImagesInput(value: unknown): string[] {
  if (value === undefined || value === null) return [];
  return sanitizeStoreImagesForSave(parseStoreImages(value));
}

export function getDisplayStoreImages(
  job: Pick<Job, "storeImages"> & { store_images?: unknown },
): string[] {
  const fromCamel = parseStoreImages(job.storeImages);
  if (fromCamel.length > 0) return fromCamel;
  return parseStoreImages(job.store_images);
}

export function validateJobPayload(payload: JobPayload): string | null {
  if (!payload.shopName.trim()) return "店名を入力してください。";
  if (!payload.district) return "地区を選択してください。";
  if (!payload.jobType) return "職種を選択してください。";
  if (!payload.salary.trim()) return "時給を入力してください。";
  if (!payload.lineUrl.trim()) return "LINE応募URLを入力してください。";
  return null;
}

function normalizeCastVoiceRecord(record: Record<string, unknown>): CastVoiceEntry | null {
  const entry: CastVoiceEntry = {
    name: String(record.name ?? record.cast_name ?? "").trim(),
    age: String(record.age ?? "").trim(),
    comment: String(record.comment ?? "").trim(),
  };
  if (!entry.name && !entry.age && !entry.comment) return null;
  return entry;
}

export function coerceCastVoicesToArray(value: unknown): unknown[] {
  if (value === null || value === undefined) return [];

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed || trimmed === "[]") return [];
    try {
      return coerceCastVoicesToArray(JSON.parse(trimmed));
    } catch {
      return [];
    }
  }

  if (Array.isArray(value)) return value;

  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    if (Array.isArray(record.cast_voices)) return record.cast_voices;
    if (Array.isArray(record.castVoices)) return record.castVoices;
    if ("name" in record || "age" in record || "comment" in record) {
      return [record];
    }
  }

  return [];
}

export function parseCastVoices(value: unknown): CastVoiceEntry[] {
  return coerceCastVoicesToArray(value)
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      return normalizeCastVoiceRecord(item as Record<string, unknown>);
    })
    .filter((entry): entry is CastVoiceEntry => entry !== null);
}

export function sanitizeCastVoicesForSave(
  entries: CastVoiceEntry[],
): CastVoiceEntry[] {
  return entries
    .map((entry) => ({
      name: entry.name.trim(),
      age: entry.age.trim(),
      comment: entry.comment.trim(),
    }))
    .filter((entry) => entry.name || entry.age || entry.comment);
}

function resolveCastVoicesFromRow(row: JobRow): CastVoiceEntry[] {
  const fromJsonColumn = parseCastVoices(row.cast_voices);
  if (fromJsonColumn.length > 0) return fromJsonColumn;

  const legacyText = row.cast_voice?.trim();
  if (!legacyText) return [];

  const fromLegacyJson = parseCastVoices(legacyText);
  if (fromLegacyJson.length > 0) return fromLegacyJson;

  return [];
}

function normalizeCastVoicesInput(value: unknown): CastVoiceEntry[] | undefined {
  if (value === undefined) return undefined;

  const entries = sanitizeCastVoicesForSave(
    coerceCastVoicesToArray(value).map((item) => {
      const record = (item ?? {}) as Record<string, unknown>;
      return {
        name: String(record.name ?? record.cast_name ?? ""),
        age: String(record.age ?? ""),
        comment: String(record.comment ?? ""),
      };
    }),
  );

  return entries;
}

export function getDisplayCastVoices(
  job: Pick<Job, "castVoices" | "castVoice">,
): CastVoiceEntry[] {
  const fromColumn = parseCastVoices(job.castVoices);
  if (fromColumn.length > 0) return fromColumn;

  const legacy = job.castVoice?.trim();
  if (!legacy) return [];

  const fromLegacyJson = parseCastVoices(legacy);
  if (fromLegacyJson.length > 0) return fromLegacyJson;

  return [{ name: "", age: "", comment: legacy }];
}

export function formatCastVoiceAge(age: string): string {
  const trimmed = age.trim();
  if (!trimmed) return "";
  return trimmed.endsWith("歳") ? trimmed : `${trimmed}歳`;
}

function normalizeLevel(value: number | undefined): number | null {
  if (!value || Number.isNaN(value)) return null;
  return Math.min(5, Math.max(1, Math.round(value)));
}

export function parseBenefits(value: string): string[] {
  return value
    .split(/[\n,、]/)
    .map((item) => item.trim())
    .filter(Boolean);
}
