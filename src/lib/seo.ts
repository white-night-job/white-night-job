import type { Metadata } from "next";
import type { Job } from "@/types/job";
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
  const title = finalizeDocumentTitle(SITE_TITLE);
  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: title,
      template: `%s${SITE_TITLE_SUFFIX}`,
    },
    description: SITE_DESCRIPTION,
    ...buildSocialMetadata({
      title: finalizeDocumentTitle(SITE_OG_TITLE),
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
  const title = finalizeDocumentTitle(pageTitle);
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
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: params.title,
    description: params.description,
    url: `${SITE_URL}${params.pathname}`,
    image: [SITE_LOGO_URL],
    ...(params.datePublished ? { datePublished: params.datePublished } : {}),
    dateModified: params.dateModified,
    author: {
      "@type": "Organization",
      name: SITE_FORMAL_NAME,
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

export function buildBreadcrumbJsonLd(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
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

/** Parse free-text salary only when numeric hourly values are clear. */
export function parseHourlySalaryForJsonLd(salary: string): {
  minValue: number;
  maxValue?: number;
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
  return maxValue > minValue ? { minValue, maxValue } : { minValue };
}

function buildJobDescriptionForJsonLd(job: Job): string {
  const parts = [
    job.introductionText,
    job.descriptionText,
    job.salary ? `給与: ${job.salary}` : null,
    job.workHours ? `勤務時間: ${job.workHours}` : null,
    job.requirements.length > 0
      ? `応募条件: ${job.requirements.join("、")}`
      : null,
    job.benefits.length > 0 ? `待遇: ${job.benefits.join("、")}` : null,
  ].filter(Boolean);
  return parts.join("\n\n").slice(0, 5000);
}

export function buildJobPostingJsonLd(job: Job) {
  const url = `${SITE_URL}/jobs/${job.id}`;
  const description = buildJobDescriptionForJsonLd(job);
  const salary = parseHourlySalaryForJsonLd(job.salary);

  const address: Record<string, string> = {
    "@type": "PostalAddress",
    addressCountry: "JP",
    addressRegion: "北海道",
    addressLocality: `札幌市（${job.district}）`,
  };
  if (job.address?.trim()) {
    address.streetAddress = job.address.trim();
  }

  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: `${job.shopName}の求人（${job.jobType}）`,
    description: description || `${job.shopName}の${job.jobType}求人情報。`,
    datePosted: job.postedAt,
    hiringOrganization: {
      "@type": "Organization",
      name: job.shopName,
      sameAs: url,
    },
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
  };

  if (salary) {
    data.baseSalary = {
      "@type": "MonetaryAmount",
      currency: "JPY",
      value: {
        "@type": "QuantitativeValue",
        minValue: salary.minValue,
        ...(salary.maxValue != null ? { maxValue: salary.maxValue } : {}),
        unitText: "HOUR",
      },
    };
  }

  if (job.requirements.length > 0) {
    data.experienceRequirements = job.requirements.join("、");
    data.qualifications = job.requirements.join("、");
  }

  if (job.imageUrl) {
    data.image = job.imageUrl;
  }

  return data;
}

export function buildJobDetailMetadata(job: Job): Metadata {
  const pathname = `/jobs/${job.id}`;
  const canonical = `${SITE_URL}${pathname}`;
  const title = finalizeDocumentTitle(
    `${job.shopName}の求人｜${job.district}・${job.jobType}`,
  );
  const description =
    `${job.shopName}（${job.district}・${job.jobType}）の求人情報。時給・勤務時間・待遇・アクセス・体験入店の有無を掲載。札幌の審査済み店舗から安心して応募できます。` +
    (job.salary ? ` 給与：${job.salary}` : "");

  const images = job.imageUrl
    ? [{ url: job.imageUrl, alt: `${job.shopName}の求人` }]
    : DEFAULT_OG_IMAGES;

  return {
    title: { absolute: title },
    description,
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
