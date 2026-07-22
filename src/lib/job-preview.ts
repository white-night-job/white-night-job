import { FIXED_AREA, type Job } from "@/types/job";
import {
  parseBenefits,
  sanitizeCastVoicesForSave,
  sanitizeStoreImagesForSave,
} from "@/lib/job-db";
import type { CastVoiceEntry, District, JobType } from "@/types/job";
import type { JobPlan } from "@/lib/job-plan";

export type AdminPreviewForm = {
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
  plan?: JobPlan;
  postedAt?: string;
};

export type ShopPreviewForm = {
  shopName: string;
  district: District;
  jobType: JobType;
  imageUrl: string;
  salary: string;
  access: string;
  businessHours: string;
  ageGroup: string;
  introductionText: string;
  descriptionText: string;
  castVoices: CastVoiceEntry[];
  recruiterName: string;
  recruiterTitle: string;
  recruiterImage: string;
  recruiterMessage: string;
  managerComment: string;
  storeImages: string[];
  benefits: string[];
  otherBenefits: string;
  phone: string;
  xUrl: string;
  instagramUrl: string;
  tiktokUrl: string;
  youtubeUrl: string;
  websiteUrl: string;
  lineUrl: string;
};

function parseLevel(value: string): number | undefined {
  if (!value) return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

export function buildPreviewJobFromAdminForm(
  form: AdminPreviewForm,
  options?: { id?: string },
): Job {
  const postedAtRaw = form.postedAt?.trim().slice(0, 10) ?? "";
  const postedAt = /^\d{4}-\d{2}-\d{2}$/.test(postedAtRaw)
    ? postedAtRaw
    : new Date().toISOString().slice(0, 10);

  return {
    id: options?.id ?? "preview-draft",
    shopName: form.shopName.trim() || "店舗名未入力",
    area: FIXED_AREA,
    district: form.district,
    jobType: form.jobType,
    title: `${form.shopName.trim() || "店舗名未入力"}｜${form.jobType}募集`,
    salary: form.salary.trim() || "時給未設定",
    workHours: form.businessHours.trim(),
    businessHours: form.businessHours.trim() || undefined,
    ageGroup: form.ageGroup.trim() || undefined,
    customerPersonalityLevel: parseLevel(form.customerPersonalityLevel),
    customerAgeLevel: parseLevel(form.customerAgeLevel),
    customerRegularLevel: parseLevel(form.customerRegularLevel),
    introductionText: form.introductionText.trim() || undefined,
    descriptionText: form.descriptionText.trim() || undefined,
    castVoices: sanitizeCastVoicesForSave(form.castVoices),
    requirements: [],
    benefits: form.benefits,
    otherBenefits: parseBenefits(form.otherBenefits),
    isVerified: true,
    imageUrl: form.imageUrl.trim() || undefined,
    storeImages: sanitizeStoreImagesForSave(form.storeImages),
    recruiterName: form.recruiterName.trim() || undefined,
    recruiterTitle: form.recruiterTitle.trim() || undefined,
    recruiterImage: form.recruiterImage.trim() || undefined,
    recruiterMessage: form.recruiterMessage.trim() || undefined,
    managerComment: form.managerComment.trim() || undefined,
    phone: form.phone.trim() || undefined,
    address: form.address.trim() || undefined,
    access: form.access.trim() || undefined,
    xUrl: form.xUrl.trim() || undefined,
    instagramUrl: form.instagramUrl.trim() || undefined,
    tiktokUrl: form.tiktokUrl.trim() || undefined,
    youtubeUrl: form.youtubeUrl.trim() || undefined,
    websiteUrl: form.websiteUrl.trim() || undefined,
    lineUrl: form.lineUrl.trim() || "https://line.me/",
    postedAt,
    plan: form.plan,
  };
}

export function buildPreviewJobFromShopForm(
  form: ShopPreviewForm,
  baseJob: Job,
): Job {
  return {
    ...baseJob,
    shopName: form.shopName || baseJob.shopName,
    district: form.district || baseJob.district,
    jobType: form.jobType || baseJob.jobType,
    title: `${form.shopName || baseJob.shopName}｜${form.jobType || baseJob.jobType}募集`,
    salary: form.salary.trim() || baseJob.salary,
    workHours: form.businessHours.trim() || baseJob.workHours,
    businessHours: form.businessHours.trim() || undefined,
    ageGroup: form.ageGroup.trim() || undefined,
    introductionText: form.introductionText.trim() || undefined,
    descriptionText: form.descriptionText.trim() || undefined,
    castVoices: sanitizeCastVoicesForSave(form.castVoices),
    benefits: form.benefits,
    otherBenefits: parseBenefits(form.otherBenefits),
    imageUrl: form.imageUrl.trim() || undefined,
    storeImages: sanitizeStoreImagesForSave(form.storeImages),
    recruiterName: form.recruiterName.trim() || undefined,
    recruiterTitle: form.recruiterTitle.trim() || undefined,
    recruiterImage: form.recruiterImage.trim() || undefined,
    recruiterMessage: form.recruiterMessage.trim() || undefined,
    managerComment: form.managerComment.trim() || undefined,
    phone: form.phone.trim() || undefined,
    access: form.access.trim() || undefined,
    xUrl: form.xUrl.trim() || undefined,
    instagramUrl: form.instagramUrl.trim() || undefined,
    tiktokUrl: form.tiktokUrl.trim() || undefined,
    youtubeUrl: form.youtubeUrl.trim() || undefined,
    websiteUrl: form.websiteUrl.trim() || undefined,
    lineUrl: form.lineUrl.trim() || baseJob.lineUrl,
  };
}
