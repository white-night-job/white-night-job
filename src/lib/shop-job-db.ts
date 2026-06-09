import {
  FIXED_AREA,
  type CastVoiceEntry,
  type District,
  type JobType,
} from "@/types/job";
import {
  parseBenefits,
  parseCastVoices,
  parseStoreImages,
  sanitizeCastVoicesForSave,
  sanitizeStoreImagesForSave,
} from "@/lib/job-db";

export type ShopJobPayload = {
  shopName: string;
  district: District;
  jobType: JobType;
  salary: string;
  access?: string;
  businessHours?: string;
  ageGroup?: string;
  introductionText?: string;
  descriptionText?: string;
  castVoices?: CastVoiceEntry[];
  storeImages?: string[];
  benefits: string[];
  otherBenefits?: string[];
  phone?: string;
  xUrl?: string;
  instagramUrl?: string;
  tiktokUrl?: string;
  youtubeUrl?: string;
  websiteUrl?: string;
  lineUrl: string;
};

export function normalizeShopJobPayload(body: unknown): ShopJobPayload {
  const data = body as Partial<ShopJobPayload>;
  return {
    shopName: String(data.shopName ?? ""),
    district: data.district as District,
    jobType: data.jobType as JobType,
    salary: String(data.salary ?? ""),
    access: data.access ? String(data.access) : undefined,
    businessHours: data.businessHours ? String(data.businessHours) : undefined,
    ageGroup: data.ageGroup ? String(data.ageGroup) : undefined,
    introductionText: data.introductionText
      ? String(data.introductionText)
      : undefined,
    descriptionText: data.descriptionText
      ? String(data.descriptionText)
      : undefined,
    castVoices: parseCastVoices(
      data.castVoices ?? (data as { cast_voices?: unknown }).cast_voices,
    ),
    storeImages: sanitizeStoreImagesForSave(
      parseStoreImages(
        data.storeImages ?? (data as { store_images?: unknown }).store_images,
      ),
    ),
    benefits: Array.isArray(data.benefits) ? data.benefits.map(String) : [],
    otherBenefits: Array.isArray(data.otherBenefits)
      ? data.otherBenefits.map(String)
      : parseBenefits(String(data.otherBenefits ?? "")),
    phone: data.phone ? String(data.phone) : undefined,
    xUrl: data.xUrl ? String(data.xUrl) : undefined,
    instagramUrl: data.instagramUrl ? String(data.instagramUrl) : undefined,
    tiktokUrl: data.tiktokUrl ? String(data.tiktokUrl) : undefined,
    youtubeUrl: data.youtubeUrl ? String(data.youtubeUrl) : undefined,
    websiteUrl: data.websiteUrl ? String(data.websiteUrl) : undefined,
    lineUrl: String(data.lineUrl ?? ""),
  };
}

export function validateShopJobPayload(payload: ShopJobPayload): string | null {
  if (!payload.shopName.trim()) return "店名を入力してください。";
  if (!payload.district) return "地区を選択してください。";
  if (!payload.jobType) return "職種を選択してください。";
  if (!payload.salary.trim()) return "時給を入力してください。";
  if (!payload.lineUrl.trim()) return "LINE応募URLを入力してください。";
  return null;
}

export function shopPayloadToRow(payload: ShopJobPayload) {
  const shopName = payload.shopName.trim();

  return {
    shop_name: shopName,
    area: FIXED_AREA,
    district: payload.district,
    job_type: payload.jobType,
    title: `${shopName}｜${payload.jobType}募集`,
    salary: payload.salary.trim(),
    access: payload.access?.trim() || null,
    business_hours: payload.businessHours?.trim() || null,
    age_group: payload.ageGroup?.trim() || null,
    introduction_text: payload.introductionText?.trim() || null,
    description_text: payload.descriptionText?.trim() || null,
    description: payload.descriptionText?.trim() || null,
    cast_voices: sanitizeCastVoicesForSave(payload.castVoices ?? []),
    store_images: sanitizeStoreImagesForSave(payload.storeImages ?? []),
    benefits: payload.benefits,
    other_benefits: payload.otherBenefits ?? [],
    phone: payload.phone?.trim() || null,
    x_url: payload.xUrl?.trim() || null,
    instagram_url: payload.instagramUrl?.trim() || null,
    tiktok_url: payload.tiktokUrl?.trim() || null,
    youtube_url: payload.youtubeUrl?.trim() || null,
    website_url: payload.websiteUrl?.trim() || null,
    line_url: payload.lineUrl.trim(),
  };
}
