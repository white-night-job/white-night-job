import type { Metadata } from "next";
import {
  SITE_BRAND_JA,
  SITE_DESCRIPTION,
  SITE_FORMAL_NAME,
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
      template: `%s | ${SITE_BRAND_JA}`,
    },
    description: SITE_DESCRIPTION,
    openGraph: {
      type: "website",
      locale: "ja_JP",
      url: SITE_URL,
      siteName: SITE_FORMAL_NAME,
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
): Metadata {
  const canonical = `${SITE_URL}${pathname}`;
  const ogTitle = `${pageTitle} | ${SITE_OG_TITLE}`;

  return {
    title: pageTitle,
    description,
    openGraph: {
      title: ogTitle,
      description,
      url: canonical,
      siteName: SITE_FORMAL_NAME,
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
    "@graph": [
      {
        "@type": "Organization",
        name: SITE_FORMAL_NAME,
        alternateName: [SITE_NAME, SITE_BRAND_JA],
        url: SITE_URL,
      },
      {
        "@type": "WebSite",
        name: SITE_FORMAL_NAME,
        alternateName: [SITE_BRAND_JA, SITE_NAME],
        url: SITE_URL,
        publisher: {
          "@type": "Organization",
          name: SITE_FORMAL_NAME,
        },
      },
    ],
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
      name: SITE_FORMAL_NAME,
      url: SITE_URL,
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
