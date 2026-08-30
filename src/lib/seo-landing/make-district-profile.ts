import type { SeoCopyProfile } from "@/lib/seo-landing/types";

type Section = { heading: string; p1: string; p2: string };

/** Build a landing profile from unique copy (no shared paragraph pool). */
export function districtJobProfile(input: {
  id: string;
  title: string;
  h1: string;
  description: string;
  displayPattern: string;
  breadcrumb: string;
  intro: [string, string];
  guide: [string, string];
  sections: Section[];
  faqHeading: string;
  faqs: Array<{ q: string; a: string }>;
  detailSegment: string;
  listLinkLabel: string;
}): SeoCopyProfile {
  return {
    id: input.id,
    jobTypeDisplayPattern: input.displayPattern,
    title: input.title,
    h1: input.h1,
    description: input.description,
    displayName: "{jobTypeDisplay}",
    breadcrumbLabel: input.breadcrumb,
    intro: [...input.intro],
    guide: [...input.guide],
    contentSections: input.sections.map((section) => ({
      heading: section.heading,
      paragraphs: [section.p1, section.p2],
    })),
    faqHeading: input.faqHeading,
    faqs: input.faqs.map((faq) => ({
      question: faq.q,
      answer: faq.a,
    })),
    detailTitleSegment: input.detailSegment,
    detailDescriptionSegment: input.detailSegment,
    listLinkLabel: input.listLinkLabel,
  };
}
