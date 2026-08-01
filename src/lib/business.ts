import { SITE_BRAND_JA, SITE_FORMAL_NAME, SITE_LOGO_URL, SITE_NAME, SITE_URL } from "@/lib/site";

/** Legal operator / NAP (must match Google Business Profile). */
export const BUSINESS_LEGAL_NAME = "合同会社COMSIA";
export const BUSINESS_REPRESENTATIVE = "西東時雄";

export const BUSINESS_POSTAL_CODE = "063-0811";
export const BUSINESS_REGION = "北海道";
export const BUSINESS_LOCALITY = "札幌市西区";
export const BUSINESS_STREET_ADDRESS = "琴似1条5丁目4-18細川ビル3階";

/** Single-line address for display (NAP). */
export const BUSINESS_ADDRESS_DISPLAY =
  `〒${BUSINESS_POSTAL_CODE} ${BUSINESS_REGION}${BUSINESS_LOCALITY}${BUSINESS_STREET_ADDRESS}`;

/** Official public phone (NAP / LocalBusiness / GBP). */
export const BUSINESS_PHONE_DISPLAY = "011-600-1073";
export const BUSINESS_PHONE_TEL = "0116001073";

/** Official public contact email (visible surfaces). */
export const BUSINESS_EMAIL = "comsia.info@gmail.com";

/**
 * Public business hours.
 * Interpreted as Monday–Friday (平日). Weekend hours are not published.
 */
export const BUSINESS_HOURS_DISPLAY = "平日 9:00〜17:00";
export const BUSINESS_HOURS_OPENS = "09:00";
export const BUSINESS_HOURS_CLOSES = "17:00";
export const BUSINESS_HOURS_DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
] as const;

export const BUSINESS_DESCRIPTION =
  `${SITE_FORMAL_NAME}の運営、夜職求人の掲載・管理、掲載店舗向け支援サービスの提供`;

export const BUSINESS_AREA_SERVED = [
  "札幌市",
  "すすきの",
  "琴似",
  "北24条",
  "手稲",
] as const;

/** Maps search by verified address only (no Place ID / fictional GBP URL). */
export const BUSINESS_MAPS_SEARCH_URL = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
  BUSINESS_ADDRESS_DISPLAY,
)}`;

export function buildBusinessPostalAddressJsonLd() {
  return {
    "@type": "PostalAddress",
    streetAddress: BUSINESS_STREET_ADDRESS,
    addressLocality: BUSINESS_LOCALITY,
    addressRegion: BUSINESS_REGION,
    postalCode: BUSINESS_POSTAL_CODE,
    addressCountry: "JP",
  };
}

export function buildOpeningHoursSpecificationJsonLd() {
  return {
    "@type": "OpeningHoursSpecification",
    dayOfWeek: [...BUSINESS_HOURS_DAYS],
    opens: BUSINESS_HOURS_OPENS,
    closes: BUSINESS_HOURS_CLOSES,
  };
}

export function buildLocalBusinessJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: BUSINESS_LEGAL_NAME,
    alternateName: [SITE_NAME, SITE_BRAND_JA, SITE_FORMAL_NAME],
    legalName: BUSINESS_LEGAL_NAME,
    url: `${SITE_URL}/`,
    logo: SITE_LOGO_URL,
    image: SITE_LOGO_URL,
    telephone: BUSINESS_PHONE_DISPLAY,
    email: BUSINESS_EMAIL,
    address: buildBusinessPostalAddressJsonLd(),
    openingHoursSpecification: buildOpeningHoursSpecificationJsonLd(),
    areaServed: BUSINESS_AREA_SERVED.map((name) => ({
      "@type": "Place",
      name,
    })),
    description: BUSINESS_DESCRIPTION,
  };
}
