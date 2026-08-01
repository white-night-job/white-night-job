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
  SITE_LOGO_URL,
  SITE_NAME,
  SITE_OG_TITLE,
  SITE_TITLE,
  SITE_URL,
} from "@/lib/site";

export function buildRootMetadata(): Metadata {
  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: SITE_TITLE,
      template: `%s | ${SITE_NAME}`,
    },
    description: SITE_DESCRIPTION,
    openGraph: {
      type: "website",
      locale: "ja_JP",
      url: SITE_URL,
      siteName: SITE_NAME,
      title: SITE_OG_TITLE,
      description: SITE_DESCRIPTION,
    },
    twitter: {
      card: "summary_large_image",
      title: SITE_OG_TITLE,
      description: SITE_DESCRIPTION,
    },
    alternates: {
      canonical: SITE_URL,
    },
  };
}

export function buildPageMetadata(
  pageTitle: string,
  description: string,
  pathname: string,
  options?: { absoluteTitle?: boolean },
): Metadata {
  const canonical = `${SITE_URL}${pathname}`;
  const ogTitle = options?.absoluteTitle
    ? pageTitle
    : `${pageTitle} | ${SITE_OG_TITLE}`;

  return {
    title: options?.absoluteTitle
      ? { absolute: pageTitle }
      : pageTitle,
    description,
    openGraph: {
      title: ogTitle,
      description,
      url: canonical,
      siteName: SITE_NAME,
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description,
    },
    alternates: {
      canonical,
    },
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
  };
}

export function buildArticleMetadata(
  articleTitle: string,
  description: string,
  pathname: string,
): Metadata {
  const canonical = `${SITE_URL}${pathname}`;
  const ogTitle = `${articleTitle} | ${SITE_OG_TITLE}`;

  return {
    title: articleTitle,
    description,
    openGraph: {
      type: "article",
      title: ogTitle,
      description,
      url: canonical,
      siteName: SITE_NAME,
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description,
    },
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
  const title = `${job.shopName}の求人｜${job.district}・${job.jobType}｜${SITE_NAME}`;
  const description =
    `${job.shopName}の求人情報。時給、勤務時間、待遇、アクセス、体験入店、応募方法を掲載しています。` +
    (job.salary ? `（${job.salary}）` : "");

  return {
    title: { absolute: title },
    description,
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: SITE_NAME,
      type: "website",
      ...(job.imageUrl ? { images: [{ url: job.imageUrl }] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    alternates: {
      canonical,
    },
  };
}
