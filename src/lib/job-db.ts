import { FIXED_AREA, type District, type Job, type JobType } from "@/types/job";

export type JobPayload = {
  shopName: string;
  district: District;
  jobType: JobType;
  salary: string;
  benefits: string[];
  otherBenefits?: string[];
  introductionText?: string;
  descriptionText?: string;
  businessHours?: string;
  ageGroup?: string;
  customerPersonalityLevel?: number;
  customerAgeLevel?: number;
  customerRegularLevel?: number;
  imageUrl?: string;
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
  requirements: string[] | null;
  benefits: string[] | null;
  other_benefits: string[] | null;
  is_verified: boolean;
  image_url: string | null;
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
    requirements: row.requirements ?? [],
    benefits: row.benefits ?? [],
    otherBenefits: row.other_benefits ?? [],
    isVerified: row.is_verified,
    imageUrl: row.image_url ?? undefined,
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
  };
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
    requirements: payload.requirements ?? ["20歳以上"],
    benefits: payload.benefits,
    other_benefits: payload.otherBenefits ?? [],
    is_verified: payload.isVerified ?? false,
    image_url: payload.imageUrl?.trim() || null,
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

export function validateJobPayload(payload: JobPayload): string | null {
  if (!payload.shopName.trim()) return "店名を入力してください。";
  if (!payload.district) return "地区を選択してください。";
  if (!payload.jobType) return "職種を選択してください。";
  if (!payload.salary.trim()) return "時給を入力してください。";
  if (!payload.lineUrl.trim()) return "LINE応募URLを入力してください。";
  return null;
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
