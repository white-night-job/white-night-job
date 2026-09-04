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
  workHours?: string;
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
  requirements?: string[];
  phone?: string;
  xUrl?: string;
  instagramUrl?: string;
  tiktokUrl?: string;
  youtubeUrl?: string;
  websiteUrl?: string;
  lineUrl: string;
  regularHourlyPay?: string;
  trialHourlyPay?: string;
  backPayDetails?: string;
  salaryPaymentMethod?: string;
  minWorkDays?: string;
  costumeUniform?: string;
  /** null = unset; undefined = omit from DB update */
  trialVisitAvailable?: boolean | null;
  trialVisitNotes?: string;
};

function normalizeLevel(value: unknown): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return 3;
  return Math.min(5, Math.max(1, Math.round(n)));
}

function hasOwn(data: object, ...keys: string[]): boolean {
  return keys.some((key) => Object.prototype.hasOwnProperty.call(data, key));
}

function readPresentString(
  data: Record<string, unknown>,
  camel: string,
  snake?: string,
): string | undefined {
  const keys = snake ? [camel, snake] : [camel];
  if (!hasOwn(data, ...keys)) return undefined;
  return String(data[camel] ?? (snake ? data[snake] : "") ?? "").trim();
}

function normalizeRequirements(value: unknown): string[] | undefined {
  if (value === undefined) return undefined;
  if (!Array.isArray(value)) return [];
  return value.map(String).map((item) => item.trim()).filter(Boolean);
}

function normalizeTrialVisitAvailable(
  value: unknown,
): boolean | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  if (value === true || value === "true") return true;
  if (value === false || value === "false") return false;
  return null;
}

export function normalizeShopJobPayload(body: unknown): ShopJobPayload {
  const data = body as Partial<ShopJobPayload> & Record<string, unknown>;
  const hasImageUrl = hasOwn(data, "imageUrl", "image_url");
  const hasTrialVisit = hasOwn(data, "trialVisitAvailable", "trial_visit_available");

  return {
    imageUrl: hasImageUrl
      ? String(data.imageUrl ?? data.image_url ?? "").trim() || null
      : undefined,
    salary: String(data.salary ?? ""),
    access: data.access ? String(data.access) : undefined,
    businessHours: data.businessHours ? String(data.businessHours) : undefined,
    workHours: readPresentString(data, "workHours", "work_hours"),
    ageGroup: data.ageGroup ? String(data.ageGroup) : undefined,
    customerPersonalityLevel: normalizeLevel(
      data.customerPersonalityLevel ?? data.customer_personality_level,
    ),
    customerAgeLevel: normalizeLevel(
      data.customerAgeLevel ?? data.customer_age_level,
    ),
    customerRegularLevel: normalizeLevel(
      data.customerRegularLevel ?? data.customer_regular_level,
    ),
    introductionText: data.introductionText
      ? String(data.introductionText)
      : undefined,
    descriptionText: data.descriptionText
      ? String(data.descriptionText)
      : undefined,
    storeImages: sanitizeStoreImagesForSave(
      parseStoreImages(data.storeImages ?? data.store_images),
    ),
    recruiterName: data.recruiterName
      ? String(data.recruiterName)
      : data.recruiter_name
        ? String(data.recruiter_name)
        : undefined,
    recruiterTitle: data.recruiterTitle
      ? String(data.recruiterTitle)
      : data.recruiter_title
        ? String(data.recruiter_title)
        : undefined,
    recruiterImage:
      hasOwn(data, "recruiterImage", "recruiter_image")
        ? String(data.recruiterImage ?? data.recruiter_image ?? "").trim() ||
          null
        : undefined,
    recruiterMessage: data.recruiterMessage
      ? String(data.recruiterMessage)
      : data.recruiter_message
        ? String(data.recruiter_message)
        : undefined,
    managerComment: data.managerComment
      ? String(data.managerComment)
      : data.manager_comment
        ? String(data.manager_comment)
        : undefined,
    benefits: Array.isArray(data.benefits) ? data.benefits.map(String) : [],
    otherBenefits: Array.isArray(data.otherBenefits)
      ? data.otherBenefits.map(String)
      : parseBenefits(String(data.otherBenefits ?? "")),
    requirements: hasOwn(data, "requirements")
      ? normalizeRequirements(data.requirements) ?? []
      : undefined,
    phone: data.phone ? String(data.phone) : undefined,
    xUrl: data.xUrl ? String(data.xUrl) : undefined,
    instagramUrl: data.instagramUrl ? String(data.instagramUrl) : undefined,
    tiktokUrl: data.tiktokUrl ? String(data.tiktokUrl) : undefined,
    youtubeUrl: data.youtubeUrl ? String(data.youtubeUrl) : undefined,
    websiteUrl: data.websiteUrl ? String(data.websiteUrl) : undefined,
    lineUrl: String(data.lineUrl ?? ""),
    regularHourlyPay: readPresentString(
      data,
      "regularHourlyPay",
      "regular_hourly_pay",
    ),
    trialHourlyPay: readPresentString(
      data,
      "trialHourlyPay",
      "trial_hourly_pay",
    ),
    backPayDetails: readPresentString(
      data,
      "backPayDetails",
      "back_pay_details",
    ),
    salaryPaymentMethod: readPresentString(
      data,
      "salaryPaymentMethod",
      "salary_payment_method",
    ),
    minWorkDays: readPresentString(data, "minWorkDays", "min_work_days"),
    costumeUniform: readPresentString(
      data,
      "costumeUniform",
      "costume_uniform",
    ),
    trialVisitAvailable: hasTrialVisit
      ? normalizeTrialVisitAvailable(
          data.trialVisitAvailable ?? data.trial_visit_available,
        )
      : undefined,
    trialVisitNotes: readPresentString(
      data,
      "trialVisitNotes",
      "trial_visit_notes",
    ),
  };
}

export function validateShopJobPayload(payload: ShopJobPayload): string | null {
  if (!payload.salary.trim()) return "時給を入力してください。";
  if (!payload.lineUrl.trim()) return "LINE応募URLを入力してください。";
  return null;
}

function setNullableText(
  row: Record<string, unknown>,
  column: string,
  value: string | undefined,
) {
  if (value === undefined) return;
  row[column] = value.trim() || null;
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

  setNullableText(row, "work_hours", payload.workHours);
  setNullableText(row, "regular_hourly_pay", payload.regularHourlyPay);
  setNullableText(row, "trial_hourly_pay", payload.trialHourlyPay);
  setNullableText(row, "back_pay_details", payload.backPayDetails);
  setNullableText(row, "salary_payment_method", payload.salaryPaymentMethod);
  setNullableText(row, "min_work_days", payload.minWorkDays);
  setNullableText(row, "costume_uniform", payload.costumeUniform);
  setNullableText(row, "trial_visit_notes", payload.trialVisitNotes);

  if (payload.requirements !== undefined) {
    row.requirements = payload.requirements;
  }

  if (payload.trialVisitAvailable !== undefined) {
    row.trial_visit_available = payload.trialVisitAvailable;
  }

  if (payload.imageUrl !== undefined) {
    row.image_url = payload.imageUrl?.trim() || null;
  }

  if (payload.recruiterImage !== undefined) {
    row.recruiter_image = payload.recruiterImage?.trim() || null;
  }

  return row;
}
