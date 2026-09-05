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
  regularHourlyPay?: string;
  trialHourlyPay?: string;
  backPayDetails?: string;
  salaryPaymentMethod?: string;
  minWorkDays?: string;
  costumeUniform?: string;
  trialVisitAvailable?: "" | "yes" | "no";
  trialVisitNotes?: string;
  businessHours: string;
  ageGroup: string;
  customerPersonalityLevel: string;
  customerAgeLevel: string;
  customerRegularLevel: string;
  benefits: string[];
  otherBenefits: string;
  introductionText: string;
  descriptionText: string;
  castVoices?: CastVoiceEntry[];
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
  workHours?: string;
  ageGroup: string;
  customerPersonalityLevel: number;
  customerAgeLevel: number;
  customerRegularLevel: number;
  introductionText: string;
  descriptionText: string;
  castVoices?: CastVoiceEntry[];
  recruiterName: string;
  recruiterTitle: string;
  recruiterImage: string;
  recruiterMessage: string;
  managerComment: string;
  storeImages: string[];
  benefits: string[];
  otherBenefits: string;
  requirements?: string;
  regularHourlyPay?: string;
  trialHourlyPay?: string;
  backPayDetails?: string;
  salaryPaymentMethod?: string;
  minWorkDays?: string;
  costumeUniform?: string;
  trialVisitAvailable?: "" | "yes" | "no";
  trialVisitNotes?: string;
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

  const uncontracted = form.plan === "uncontracted";
  const shopName = form.shopName.trim() || "店舗名未入力";
  const trialChoice = form.trialVisitAvailable;
  const trialVisitAvailable =
    trialChoice === "yes"
      ? true
      : trialChoice === "no"
        ? false
        : undefined;

  return {
    id: options?.id ?? "preview-draft",
    shopName,
    area: FIXED_AREA,
    district: form.district,
    jobType: form.jobType,
    title: uncontracted
      ? `${shopName}｜店舗情報`
      : `${shopName}｜${form.jobType}募集`,
    salary: form.salary.trim() || "時給未設定",
    workHours: form.businessHours.trim(),
    businessHours: form.businessHours.trim() || undefined,
    ageGroup: form.ageGroup.trim() || undefined,
    customerPersonalityLevel: parseLevel(form.customerPersonalityLevel),
    customerAgeLevel: parseLevel(form.customerAgeLevel),
    customerRegularLevel: parseLevel(form.customerRegularLevel),
    introductionText: uncontracted
      ? undefined
      : form.introductionText.trim() || undefined,
    descriptionText: uncontracted
      ? undefined
      : form.descriptionText.trim() || undefined,
    castVoices: uncontracted
      ? []
      : sanitizeCastVoicesForSave(form.castVoices ?? []),
    requirements: [],
    benefits: uncontracted ? [] : form.benefits,
    otherBenefits: uncontracted ? [] : parseBenefits(form.otherBenefits),
    isVerified: uncontracted ? false : true,
    regularHourlyPay: uncontracted
      ? undefined
      : form.regularHourlyPay?.trim() || undefined,
    trialHourlyPay: uncontracted
      ? undefined
      : form.trialHourlyPay?.trim() || undefined,
    backPayDetails: uncontracted
      ? undefined
      : form.backPayDetails?.trim() || undefined,
    salaryPaymentMethod: uncontracted
      ? undefined
      : form.salaryPaymentMethod?.trim() || undefined,
    minWorkDays: uncontracted
      ? undefined
      : form.minWorkDays?.trim() || undefined,
    costumeUniform: uncontracted
      ? undefined
      : form.costumeUniform?.trim() || undefined,
    trialVisitAvailable: uncontracted ? undefined : trialVisitAvailable,
    trialVisitNotes: uncontracted
      ? undefined
      : form.trialVisitNotes?.trim() || undefined,
    imageUrl: form.imageUrl.trim() || undefined,
    storeImages: sanitizeStoreImagesForSave(form.storeImages),
    recruiterName: uncontracted
      ? undefined
      : form.recruiterName.trim() || undefined,
    recruiterTitle: uncontracted
      ? undefined
      : form.recruiterTitle.trim() || undefined,
    recruiterImage: uncontracted
      ? undefined
      : form.recruiterImage.trim() || undefined,
    recruiterMessage: uncontracted
      ? undefined
      : form.recruiterMessage.trim() || undefined,
    managerComment: uncontracted
      ? undefined
      : form.managerComment.trim() || undefined,
    phone: uncontracted ? undefined : form.phone.trim() || undefined,
    address: form.address.trim() || undefined,
    access: uncontracted ? undefined : form.access.trim() || undefined,
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
  const trialChoice = form.trialVisitAvailable;
  const trialVisitAvailable =
    trialChoice === "yes"
      ? true
      : trialChoice === "no"
        ? false
        : trialChoice === ""
          ? undefined
          : baseJob.trialVisitAvailable;

  return {
    ...baseJob,
    shopName: form.shopName || baseJob.shopName,
    district: form.district || baseJob.district,
    jobType: form.jobType || baseJob.jobType,
    title: `${form.shopName || baseJob.shopName}｜${form.jobType || baseJob.jobType}募集`,
    salary: form.salary.trim() || baseJob.salary,
    workHours:
      form.workHours?.trim() ||
      form.businessHours.trim() ||
      baseJob.workHours,
    businessHours: form.businessHours.trim() || undefined,
    ageGroup: form.ageGroup.trim() || undefined,
    customerPersonalityLevel: form.customerPersonalityLevel,
    customerAgeLevel: form.customerAgeLevel,
    customerRegularLevel: form.customerRegularLevel,
    introductionText: form.introductionText.trim() || undefined,
    descriptionText: form.descriptionText.trim() || undefined,
    castVoices: sanitizeCastVoicesForSave(form.castVoices ?? []),
    benefits: form.benefits,
    otherBenefits: parseBenefits(form.otherBenefits),
    requirements:
      form.requirements !== undefined
        ? parseBenefits(form.requirements)
        : baseJob.requirements,
    regularHourlyPay: form.regularHourlyPay?.trim() || undefined,
    trialHourlyPay: form.trialHourlyPay?.trim() || undefined,
    backPayDetails: form.backPayDetails?.trim() || undefined,
    salaryPaymentMethod: form.salaryPaymentMethod?.trim() || undefined,
    minWorkDays: form.minWorkDays?.trim() || undefined,
    costumeUniform: form.costumeUniform?.trim() || undefined,
    trialVisitAvailable,
    trialVisitNotes: form.trialVisitNotes?.trim() || undefined,
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
