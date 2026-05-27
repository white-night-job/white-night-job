import { FIXED_AREA, type District, type Job, type JobType } from "@/types/job";

export type JobPayload = {
  shopName: string;
  district: District;
  jobType: JobType;
  salary: string;
  benefits: string[];
  description: string;
  businessHours?: string;
  ageGroup?: string;
  imageUrl?: string;
  phone?: string;
  address?: string;
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
  description: string;
  requirements: string[] | null;
  benefits: string[] | null;
  is_verified: boolean;
  image_url: string | null;
  phone: string | null;
  address: string | null;
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
    description: row.description,
    requirements: row.requirements ?? [],
    benefits: row.benefits ?? [],
    isVerified: row.is_verified,
    imageUrl: row.image_url ?? undefined,
    phone: row.phone ?? undefined,
    address: row.address ?? undefined,
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
    description: payload.description.trim(),
    requirements: payload.requirements ?? ["20歳以上"],
    benefits: payload.benefits,
    is_verified: payload.isVerified ?? false,
    image_url: payload.imageUrl?.trim() || null,
    phone: payload.phone?.trim() || null,
    address: payload.address?.trim() || null,
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
    description: String(data.description ?? ""),
    businessHours: data.businessHours ? String(data.businessHours) : undefined,
    ageGroup: data.ageGroup ? String(data.ageGroup) : undefined,
    imageUrl: data.imageUrl ? String(data.imageUrl) : undefined,
    phone: data.phone ? String(data.phone) : undefined,
    address: data.address ? String(data.address) : undefined,
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
  if (!payload.description.trim()) return "説明文を入力してください。";
  if (!payload.lineUrl.trim()) return "LINE応募URLを入力してください。";
  return null;
}

export function parseBenefits(value: string): string[] {
  return value
    .split(/[\n,、]/)
    .map((item) => item.trim())
    .filter(Boolean);
}
