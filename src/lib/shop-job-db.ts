import {
  parseBenefits,
  parseStoreImages,
  sanitizeStoreImagesForSave,
} from "@/lib/job-db";

export type ShopJobPayload = {
  imageUrl?: string | null;
  salary: string;
  access?: string;
  businessHours?: string;
  ageGroup?: string;
  customerPersonalityLevel?: number;
  customerAgeLevel?: number;
  customerRegularLevel?: number;
  introductionText?: string;
  descriptionText?: string;
  storeImages?: string[];
  recruiterName?: string;
  recruiterTitle?: string;
  recruiterImage?: string | null;
  recruiterMessage?: string;
  managerComment?: string;
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

function normalizeLevel(value: unknown): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return 3;
  return Math.min(5, Math.max(1, Math.round(n)));
}

export function normalizeShopJobPayload(body: unknown): ShopJobPayload {
  const data = body as Partial<ShopJobPayload> & {
    image_url?: unknown;
  };
  const hasImageUrl =
    data.imageUrl !== undefined || data.image_url !== undefined;
  return {
    imageUrl: hasImageUrl
      ? String(data.imageUrl ?? data.image_url ?? "").trim() || null
      : undefined,
    salary: String(data.salary ?? ""),
    access: data.access ? String(data.access) : undefined,
    businessHours: data.businessHours ? String(data.businessHours) : undefined,
    ageGroup: data.ageGroup ? String(data.ageGroup) : undefined,
    customerPersonalityLevel: normalizeLevel(
      data.customerPersonalityLevel ??
        (data as { customer_personality_level?: unknown })
          .customer_personality_level,
    ),
    customerAgeLevel: normalizeLevel(
      data.customerAgeLevel ??
        (data as { customer_age_level?: unknown }).customer_age_level,
    ),
    customerRegularLevel: normalizeLevel(
      data.customerRegularLevel ??
        (data as { customer_regular_level?: unknown }).customer_regular_level,
    ),
    introductionText: data.introductionText
      ? String(data.introductionText)
      : undefined,
    descriptionText: data.descriptionText
      ? String(data.descriptionText)
      : undefined,
    storeImages: sanitizeStoreImagesForSave(
      parseStoreImages(
        data.storeImages ?? (data as { store_images?: unknown }).store_images,
      ),
    ),
    recruiterName: data.recruiterName
      ? String(data.recruiterName)
      : (data as { recruiter_name?: unknown }).recruiter_name
        ? String((data as { recruiter_name?: unknown }).recruiter_name)
        : undefined,
    recruiterTitle: data.recruiterTitle
      ? String(data.recruiterTitle)
      : (data as { recruiter_title?: unknown }).recruiter_title
        ? String((data as { recruiter_title?: unknown }).recruiter_title)
        : undefined,
    recruiterImage:
      data.recruiterImage !== undefined ||
      (data as { recruiter_image?: unknown }).recruiter_image !== undefined
        ? String(
            data.recruiterImage ??
              (data as { recruiter_image?: unknown }).recruiter_image ??
              "",
          ).trim() || null
        : undefined,
    recruiterMessage: data.recruiterMessage
      ? String(data.recruiterMessage)
      : (data as { recruiter_message?: unknown }).recruiter_message
        ? String((data as { recruiter_message?: unknown }).recruiter_message)
        : undefined,
    managerComment: data.managerComment
      ? String(data.managerComment)
      : (data as { manager_comment?: unknown }).manager_comment
        ? String((data as { manager_comment?: unknown }).manager_comment)
        : undefined,
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
  if (!payload.salary.trim()) return "時給を入力してください。";
  if (!payload.lineUrl.trim()) return "LINE応募URLを入力してください。";
  return null;
}

export function shopPayloadToRow(payload: ShopJobPayload) {
  const row: Record<string, unknown> = {
    salary: payload.salary.trim(),
    access: payload.access?.trim() || null,
    business_hours: payload.businessHours?.trim() || null,
    age_group: payload.ageGroup?.trim() || null,
    customer_personality_level: normalizeLevel(
      payload.customerPersonalityLevel,
    ),
    customer_age_level: normalizeLevel(payload.customerAgeLevel),
    customer_regular_level: normalizeLevel(payload.customerRegularLevel),
    introduction_text: payload.introductionText?.trim() || null,
    description_text: payload.descriptionText?.trim() || null,
    description: payload.descriptionText?.trim() || null,
    store_images: sanitizeStoreImagesForSave(payload.storeImages ?? []),
    recruiter_name: payload.recruiterName?.trim() || null,
    recruiter_title: payload.recruiterTitle?.trim() || null,
    recruiter_message: payload.recruiterMessage?.trim() || null,
    manager_comment: payload.managerComment?.trim() || null,
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

  if (payload.imageUrl !== undefined) {
    row.image_url = payload.imageUrl?.trim() || null;
  }

  if (payload.recruiterImage !== undefined) {
    row.recruiter_image = payload.recruiterImage?.trim() || null;
  }

  return row;
}
