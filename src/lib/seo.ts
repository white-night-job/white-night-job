import type { Metadata } from "next";
import type { GirlReview } from "@/types/girl-review";
import type { Job } from "@/types/job";
import { formatDistrictLabel } from "@/data/districts";
import {
  BUSINESS_EMAIL,
  BUSINESS_LEGAL_NAME,
  BUSINESS_PHONE_DISPLAY,
  buildBusinessPostalAddressJsonLd,
  buildOpeningHoursSpecificationJsonLd,
} from "@/lib/business";
import {
  SITE_BRAND_JA,
  SITE_DESCRIPTION,
  SITE_FORMAL_NAME,
  SITE_LOGO_PATH,
  SITE_LOGO_URL,
  SITE_NAME,
  SITE_OG_TITLE,
  SITE_TITLE,
  SITE_URL,
} from "@/lib/site";
import { isUncontractedPlan } from "@/lib/job-plan";

function stripJsonLdContext(data: Record<string, unknown>) {
  const { ["@context"]: _ctx, ...rest } = data;
  return rest;
}

/** Document title suffix — fullwidth pipe, per Phase1 SEO. */
export const SITE_TITLE_SUFFIX = `｜${SITE_NAME}`;

type OgImageInput =
  | string
  | URL
  | { url: string | URL; alt?: string }
  | Array<string | URL | { url: string | URL; alt?: string }>;

const DEFAULT_OG_IMAGES: Array<{ url: string; alt: string }> = [
  {
    url: SITE_LOGO_PATH,
    alt: SITE_FORMAL_NAME,
  },
];

/**
 * Normalize a page title so the document title ends with exactly
 * 「｜White Night Job」 (no halfwidth |, no double suffix).
 */
export function finalizeDocumentTitle(pageTitle: string): string {
  let base = pageTitle.trim();
  if (!base) return `${SITE_BRAND_JA}${SITE_TITLE_SUFFIX}`;

  // Strip trailing brand segments repeatedly (halfwidth or fullwidth pipe).
  let prev = "";
  while (base !== prev) {
    prev = base;
    base = base
      .replace(/\s*[|｜]\s*White Night Job\s*$/u, "")
      .replace(/\s*[|｜]\s*体入ホワイトナイト\s*$/u, "")
      .trim();
  }

  if (!base || base === SITE_NAME || base === SITE_BRAND_JA) {
    return `${SITE_BRAND_JA}${SITE_TITLE_SUFFIX}`;
  }

  return `${base}${SITE_TITLE_SUFFIX}`;
}

function resolveOgImages(images?: OgImageInput): Array<{ url: string; alt?: string }> {
  if (!images) return DEFAULT_OG_IMAGES.map((img) => ({ ...img }));
  const list = Array.isArray(images) ? images : [images];
  return list.map((img) => {
    if (typeof img === "string") return { url: img };
    if (img instanceof URL) return { url: img.toString() };
    return {
      url: typeof img.url === "string" ? img.url : img.url.toString(),
      alt: img.alt,
    };
  });
}

function buildSocialMetadata(params: {
  title: string;
  description: string;
  canonical: string;
  type?: "website" | "article";
  images?: OgImageInput;
}): Pick<Metadata, "openGraph" | "twitter"> {
  const images = resolveOgImages(params.images);
  return {
    openGraph: {
      type: params.type ?? "website",
      locale: "ja_JP",
      title: params.title,
      description: params.description,
      url: params.canonical,
      siteName: SITE_NAME,
      images,
    },
    twitter: {
      card: "summary_large_image",
      title: params.title,
      description: params.description,
      images: images.map((img) => img.url),
    },
  };
}

export function buildRootMetadata(): Metadata {
  // Home title is absolute (brand in the middle). Do not run finalizeDocumentTitle.
  const title = SITE_TITLE;
  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: title,
      template: `%s${SITE_TITLE_SUFFIX}`,
    },
    description: SITE_DESCRIPTION,
    ...buildSocialMetadata({
      title: SITE_OG_TITLE,
      description: SITE_DESCRIPTION,
      canonical: `${SITE_URL}/`,
    }),
    alternates: {
      canonical: `${SITE_URL}/`,
    },
  };
}

export function buildPageMetadata(
  pageTitle: string,
  description: string,
  pathname: string,
  options?: { absoluteTitle?: boolean; noIndex?: boolean },
): Metadata {
  const canonical = `${SITE_URL}${pathname}`;
  const title = options?.absoluteTitle
    ? pageTitle.trim()
    : finalizeDocumentTitle(pageTitle);
  const social = buildSocialMetadata({
    title,
    description,
    canonical,
  });

  return {
    title: { absolute: title },
    description,
    ...social,
    alternates: {
      canonical,
    },
    ...(options?.noIndex
      ? { robots: { index: false, follow: false } }
      : {}),
  };
}

export function buildOrganizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    legalName: BUSINESS_LEGAL_NAME,
    alternateName: [SITE_BRAND_JA, SITE_FORMAL_NAME, BUSINESS_LEGAL_NAME],
    url: `${SITE_URL}/`,
    logo: SITE_LOGO_URL,
    image: SITE_LOGO_URL,
    telephone: BUSINESS_PHONE_DISPLAY,
    email: BUSINESS_EMAIL,
    address: buildBusinessPostalAddressJsonLd(),
    openingHoursSpecification: buildOpeningHoursSpecificationJsonLd(),
  };
}

/** WebSite schema（name / alternateName / url は Search Console 向け）. */
export function buildWebSiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    alternateName: SITE_BRAND_JA,
    url: `${SITE_URL}/`,
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      logo: {
        "@type": "ImageObject",
        url: SITE_LOGO_URL,
      },
    },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/jobs?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

function ensureArticleDescription(description: string, articleTitle: string): string {
  const chars = [...description];
  if (chars.length >= 120) {
    return chars.length > 160 ? chars.slice(0, 160).join("") : description;
  }
  const next = `${description}${articleTitle}の要点を、応募前の判断材料としてまとめました。`;
  const nextChars = [...next];
  return nextChars.length > 160 ? nextChars.slice(0, 160).join("") : next;
}

export function buildArticleMetadata(
  articleTitle: string,
  description: string,
  pathname: string,
): Metadata {
  const canonical = `${SITE_URL}${pathname}`;
  const title = finalizeDocumentTitle(articleTitle);
  const metaDescription = ensureArticleDescription(description, articleTitle);
  const social = buildSocialMetadata({
    title,
    description: metaDescription,
    canonical,
    type: "article",
  });

  return {
    title: { absolute: title },
    description: metaDescription,
    ...social,
    alternates: {
      canonical,
    },
  };
}

export function buildArticleJsonLd(params: {
  title: string;
  description: string;
  pathname: string;
  datePublished?: string;
  dateModified: string;
  category: string;
  image?: string;
}) {
  const url = `${SITE_URL}${params.pathname}`;
  const dateModified = params.dateModified;
  const datePublished = params.datePublished || dateModified;
  const imageUrl = params.image?.trim() || SITE_LOGO_URL;

  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: params.title,
    description: params.description,
    url,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": url,
    },
    image: [imageUrl],
    datePublished,
    dateModified,
    author: {
      "@type": "Organization",
      name: SITE_FORMAL_NAME,
      url: SITE_URL,
    },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
      logo: {
        "@type": "ImageObject",
        url: SITE_LOGO_URL,
      },
    },
    articleSection: params.category,
    isPartOf: {
      "@type": "WebSite",
      name: SITE_NAME,
      url: `${SITE_URL}/`,
    },
  };
}

export function buildWebPageJsonLd(
  pageTitle: string,
  description: string,
  pathname: string,
) {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: pageTitle,
    description,
    url: `${SITE_URL}${pathname}`,
    isPartOf: {
      "@type": "WebSite",
      name: SITE_NAME,
      url: `${SITE_URL}/`,
    },
  };
}

export type BreadcrumbItem = {
  label: string;
  href?: string;
};

export function withHomeBreadcrumb(items: BreadcrumbItem[]): BreadcrumbItem[] {
  if (items[0]?.label === SITE_BRAND_JA) return items;
  return [{ label: SITE_BRAND_JA, href: "/" }, ...items];
}

export function buildBreadcrumbJsonLd(items: BreadcrumbItem[]) {
  const trail = withHomeBreadcrumb(items);
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.label,
      ...(item.href ? { item: `${SITE_URL}${item.href}` } : {}),
    })),
  };
}

export function buildFaqPageJsonLd(
  faqs: Array<{ question: string; answer: string }>,
) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

/** CollectionPage for エリア×職種 SEO listing pages. */
export function buildCollectionPageJsonLd(params: {
  name: string;
  description: string;
  pathname: string;
  jobs: Job[];
  breadcrumbs: BreadcrumbItem[];
}) {
  const url = `${SITE_URL}${params.pathname}`;
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: params.name,
    description: params.description,
    url,
    breadcrumb: stripJsonLdContext(
      buildBreadcrumbJsonLd(params.breadcrumbs) as Record<string, unknown>,
    ),
    mainEntity: {
      "@type": "ItemList",
      name: params.name,
      numberOfItems: params.jobs.length,
      itemListElement: params.jobs.map((job, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: `${SITE_URL}/jobs/${job.id}`,
        name: `${job.shopName}の求人（${job.jobType}）`,
      })),
    },
  };
}

/** ItemList wrapping JobPosting entries for area listing SEO pages. */
export function buildJobPostingItemListJsonLd(
  jobs: Job[],
  params: { name: string; pathname: string },
) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: params.name,
    url: `${SITE_URL}${params.pathname}`,
    numberOfItems: jobs.length,
    itemListElement: jobs.map((job, index) => {
      const posting = buildJobPostingJsonLd(job) as Record<string, unknown>;
      return {
        "@type": "ListItem",
        position: index + 1,
        item: stripJsonLdContext(posting),
      };
    }),
  };
}

/** Parse free-text salary only when numeric hourly values are clear. */
export function parseHourlySalaryForJsonLd(salary: string): {
  minValue: number;
  maxValue: number;
} | null {
  const normalized = salary.replace(/,/g, "").replace(/／/g, "/");
  if (!/時給|円/.test(normalized)) return null;
  const matches = [...normalized.matchAll(/(\d{3,6})\s*円/g)].map((m) =>
    Number(m[1]),
  );
  const values = matches.filter((n) => Number.isFinite(n) && n >= 800 && n <= 50000);
  if (values.length === 0) return null;
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  // Google recommends maxValue alongside minValue for MonetaryAmount ranges.
  return { minValue, maxValue };
}

/** ValidThrough window for evergreen night-job listings (renewed via updatedAt/postedAt). */
const JOB_POSTING_VALID_THROUGH_DAYS = 60;

type DistrictLocation = {
  addressLocality: string;
  postalCode: string;
};

/** Representative locality + postal for each published district (Sapporo). */
const DISTRICT_JOB_LOCATIONS: Record<string, DistrictLocation> = {
  すすきの: { addressLocality: "札幌市中央区", postalCode: "064-0804" },
  琴似: { addressLocality: "札幌市西区", postalCode: "063-0811" },
  "24条": { addressLocality: "札幌市北区", postalCode: "001-0024" },
  手稲: { addressLocality: "札幌市手稲区", postalCode: "006-0811" },
};

function extractPostalCodeFromAddress(address?: string | null): string | null {
  if (!address) return null;
  const match = address.match(/〒?\s*(\d{3})-?(\d{4})/);
  if (!match) return null;
  return `${match[1]}-${match[2]}`;
}

function resolveJobLocationAddress(job: Job): Record<string, string> {
  const districtMeta =
    DISTRICT_JOB_LOCATIONS[job.district] ?? {
      addressLocality: "札幌市",
      postalCode: "060-0001",
    };
  const postalCode =
    extractPostalCodeFromAddress(job.address) ?? districtMeta.postalCode;

  const address: Record<string, string> = {
    "@type": "PostalAddress",
    addressCountry: "JP",
    addressRegion: "北海道",
    addressLocality: districtMeta.addressLocality,
    postalCode,
  };

  if (job.address?.trim()) {
    address.streetAddress = job.address.replace(/〒?\s*\d{3}-?\d{4}\s*/u, "").trim() ||
      job.address.trim();
  }

  return address;
}

function toIsoDateOnly(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  const dateOnly = trimmed.slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateOnly)) return dateOnly;
  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) return null;
  const y = parsed.getFullYear();
  const m = String(parsed.getMonth() + 1).padStart(2, "0");
  const d = String(parsed.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function resolveDatePosted(job: Job): string {
  return (
    toIsoDateOnly(job.postedAt) ||
    toIsoDateOnly(job.createdAt) ||
    toIsoDateOnly(job.updatedAt) ||
    new Date().toISOString().slice(0, 10)
  );
}

/** ISO 8601 datetime in Asia/Tokyo for Google JobPosting.validThrough. */
function resolveValidThrough(job: Job): string {
  const baseDate =
    toIsoDateOnly(job.updatedAt) ||
    toIsoDateOnly(job.postedAt) ||
    toIsoDateOnly(job.createdAt) ||
    new Date().toISOString().slice(0, 10);
  const [y, m, d] = baseDate.split("-").map(Number);
  const end = new Date(Date.UTC(y, m - 1, d + JOB_POSTING_VALID_THROUGH_DAYS));
  const yy = end.getUTCFullYear();
  const mm = String(end.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(end.getUTCDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}T23:59:59+09:00`;
}

function resolveEmploymentType(job: Job): string | string[] {
  const haystack = [
    job.title,
    job.salary,
    job.introductionText,
    job.descriptionText,
    ...job.benefits,
    ...job.requirements,
    ...(job.otherBenefits ?? []),
  ]
    .filter(Boolean)
    .join(" ");

  const types = new Set<string>();
  if (/正社員|フルタイム|常勤/.test(haystack)) types.add("FULL_TIME");
  if (/業務委託|委託契約/.test(haystack)) types.add("CONTRACTOR");
  if (/期間限定|単発|臨時|短期/.test(haystack)) types.add("TEMPORARY");
  if (
    /パート|アルバイト|時給|掛け持ち|シフト|体入|体験入店/.test(haystack) ||
    types.size === 0
  ) {
    types.add("PART_TIME");
  }

  const list = [...types];
  return list.length === 1 ? list[0]! : list;
}

/**
 * Google accepts either the literal "no requirements" or
 * OccupationalExperienceRequirements.monthsOfExperience.
 * Free-text Japanese strings are not valid for this property.
 */
function resolveExperienceRequirements(
  job: Job,
): string | Record<string, unknown> {
  const reqText = job.requirements.join("、");
  const haystack = [
    reqText,
    ...job.benefits,
    job.introductionText ?? "",
    job.descriptionText ?? "",
  ].join(" ");

  const yearMatch = haystack.match(/(?:経験|実務)\s*(\d+)\s*年/);
  if (yearMatch) {
    return {
      "@type": "OccupationalExperienceRequirements",
      monthsOfExperience: Number(yearMatch[1]) * 12,
    };
  }

  const monthMatch = haystack.match(/(?:経験|実務)\s*(\d+)\s*(?:か[月ヶ]|ヶ月|カ月|か月)/);
  if (monthMatch) {
    return {
      "@type": "OccupationalExperienceRequirements",
      monthsOfExperience: Number(monthMatch[1]),
    };
  }

  const beginner =
    job.benefits.some((b) => /未経験/.test(b)) ||
    /未経験|経験不問|経験不要|初心者歓迎/.test(haystack) ||
    job.requirements.length === 0;

  if (beginner) return "no requirements";

  // Age / appearance only etc. — no measurable work experience required.
  return "no requirements";
}

function buildJobDescriptionForJsonLd(job: Job): string {
  const parts = [
    job.introductionText,
    job.descriptionText,
    job.salary ? `給与: ${job.salary}` : null,
    job.workHours ? `勤務時間: ${job.workHours}` : null,
    job.businessHours ? `営業時間: ${job.businessHours}` : null,
    job.requirements.length > 0
      ? `応募条件: ${job.requirements.join("、")}`
      : null,
    job.benefits.length > 0 ? `待遇: ${job.benefits.join("、")}` : null,
  ].filter(Boolean);
  return parts.join("\n\n").slice(0, 5000);
}

export function buildJobPostingJsonLd(
  job: Job,
  _reviews: GirlReview[] = [],
) {
  // Uncontracted store-info pages must not emit JobPosting.
  if (isUncontractedPlan(job.plan)) {
    return buildStoreInfoJsonLd(job);
  }

  const url = `${SITE_URL}/jobs/${job.id}`;
  const description = buildJobDescriptionForJsonLd(job);
  const salary = parseHourlySalaryForJsonLd(job.salary);
  const datePosted = resolveDatePosted(job);
  const address = resolveJobLocationAddress(job);
  const experienceRequirements = resolveExperienceRequirements(job);

  const hiringOrganization: Record<string, unknown> = {
    "@type": "Organization",
    name: job.shopName,
    sameAs: job.websiteUrl?.trim() || SITE_URL,
  };

  const data: Record<string, unknown> = {
    "@context": "https://schema.org/",
    "@type": "JobPosting",
    title: `${job.shopName}の求人（${job.jobType}）`,
    description: description || `${job.shopName}の${job.jobType}求人情報。`,
    datePosted,
    validThrough: resolveValidThrough(job),
    employmentType: resolveEmploymentType(job),
    hiringOrganization,
    jobLocation: {
      "@type": "Place",
      address,
    },
    identifier: {
      "@type": "PropertyValue",
      name: SITE_NAME,
      value: job.id,
    },
    url,
    directApply: true,
    occupationalCategory: job.jobType,
    experienceRequirements,
    educationRequirements: "no requirements",
  };

  if (salary) {
    data.baseSalary = {
      "@type": "MonetaryAmount",
      currency: "JPY",
      value: {
        "@type": "QuantitativeValue",
        minValue: salary.minValue,
        maxValue: salary.maxValue,
        unitText: "HOUR",
      },
    };
  }

  if (job.requirements.length > 0) {
    data.qualifications = job.requirements.join("、");
  }

  if (job.benefits.length > 0 || (job.otherBenefits?.length ?? 0) > 0) {
    data.jobBenefits = [...job.benefits, ...(job.otherBenefits ?? [])].join(
      "、",
    );
  }

  const hours = job.workHours?.trim() || job.businessHours?.trim();
  if (hours) {
    data.workHours = hours;
  }

  if (job.imageUrl) {
    data.image = job.imageUrl;
  }

  return data;
}

/** LocalBusiness JSON-LD for uncontracted store-info pages (not JobPosting). */
export function buildStoreInfoJsonLd(job: Job) {
  const url = `${SITE_URL}/jobs/${job.id}`;
  const address = resolveJobLocationAddress(job);
  const sameAs = [
    job.websiteUrl,
    job.instagramUrl,
    job.xUrl,
    job.tiktokUrl,
    job.youtubeUrl,
  ]
    .map((value) => value?.trim())
    .filter((value): value is string => Boolean(value));

  const descriptionParts = [
    `${formatDistrictLabel(job.district)}にある${job.jobType}${job.shopName}の店舗情報。`,
    job.address?.trim() ? `所在地：${job.address.trim()}。` : null,
    job.businessHours?.trim()
      ? `営業時間：${job.businessHours.trim()}。`
      : null,
    sameAs.length > 0 ? "公式SNS・Webの案内を掲載しています。" : null,
  ].filter(Boolean);

  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: job.shopName,
    description: descriptionParts.join(""),
    url,
    address,
  };

  if (sameAs.length > 0) {
    data.sameAs = sameAs;
  }
  if (job.imageUrl?.trim()) {
    data.image = job.imageUrl.trim();
  }
  if (job.businessHours?.trim()) {
    data.openingHours = job.businessHours.trim();
  }

  return data;
}

/** SEO title/description for uncontracted store-info pages (no job wording). */
export function buildStoreInfoDetailMetadata(job: Job): Metadata {
  const pathname = `/jobs/${job.id}`;
  const canonical = `${SITE_URL}${pathname}`;
  // Example: 〇〇｜すすきののガールズバー店舗情報｜White Night Job
  const title = finalizeDocumentTitle(
    `${job.shopName}｜${formatDistrictLabel(job.district)}の${job.jobType}店舗情報`,
  );

  const hasAddress = Boolean(job.address?.trim());
  const hasSns = Boolean(
    job.websiteUrl?.trim() ||
      job.instagramUrl?.trim() ||
      job.xUrl?.trim() ||
      job.tiktokUrl?.trim() ||
      job.youtubeUrl?.trim(),
  );
  const detailBits = [
    hasAddress ? "所在地" : null,
    "店舗情報",
    hasSns ? "公式SNS" : null,
  ].filter(Boolean);
  const detailText =
    detailBits.length > 0 ? `${detailBits.join("・")}などを掲載しています。` : "";

  const description =
    `${formatDistrictLabel(job.district)}にある${job.jobType}${job.shopName}の店舗情報。${detailText}`.slice(
      0,
      160,
    );

  const images = job.imageUrl
    ? [{ url: job.imageUrl, alt: `${job.shopName}の店舗情報` }]
    : DEFAULT_OG_IMAGES;

  return {
    title: { absolute: title },
    description,
    robots: { index: true, follow: true },
    ...buildSocialMetadata({
      title,
      description,
      canonical,
      images,
    }),
    alternates: {
      canonical,
    },
  };
}

/**
 * Review / AggregateRating for girl reviews.
 * Kept separate from JobPosting — Google JobPosting rich results do not
 * recognize nested review fields and may emit warnings.
 */
export function buildJobReviewsJsonLd(job: Job, reviews: GirlReview[]) {
  if (reviews.length === 0) return null;

  const url = `${SITE_URL}/jobs/${job.id}`;
  const address = resolveJobLocationAddress(job);
  const ratingSum = reviews.reduce((sum, review) => sum + review.rating, 0);
  const ratingValue = Math.round((ratingSum / reviews.length) * 10) / 10;

  return {
    "@context": "https://schema.org/",
    "@type": "LocalBusiness",
    name: job.shopName,
    url,
    image: job.imageUrl || SITE_LOGO_URL,
    address,
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue,
      bestRating: 5,
      worstRating: 1,
      reviewCount: reviews.length,
    },
    review: reviews.map((review) => ({
      "@type": "Review",
      author: {
        "@type": "Person",
        name: review.nickname,
      },
      reviewRating: {
        "@type": "Rating",
        ratingValue: review.rating,
        bestRating: 5,
        worstRating: 1,
      },
      reviewBody:
        review.comment.trim() || `${review.nickname}さんの口コミ`,
    })),
  };
}

export function buildJobDetailMetadata(job: Job): Metadata {
  if (isUncontractedPlan(job.plan)) {
    return buildStoreInfoDetailMetadata(job);
  }

  const pathname = `/jobs/${job.id}`;
  const canonical = `${SITE_URL}${pathname}`;

  const title = finalizeDocumentTitle(
    `${job.shopName}の求人｜${formatDistrictLabel(job.district)}・${job.jobType}`,
  );
  const description =
    `${job.shopName}（${formatDistrictLabel(job.district)}・${job.jobType}）の求人情報。時給・勤務時間・待遇・アクセス・体験入店の有無を掲載。札幌の審査済み店舗から安心して応募できます。` +
    (job.salary ? ` 給与：${job.salary}` : "");

  const images = job.imageUrl
    ? [{ url: job.imageUrl, alt: `${job.shopName}の求人` }]
    : DEFAULT_OG_IMAGES;

  return {
    title: { absolute: title },
    description,
    robots: { index: true, follow: true },
    ...buildSocialMetadata({
      title,
      description,
      canonical,
      images,
    }),
    alternates: {
      canonical,
    },
  };
}
