import { SITE_FORMAL_NAME } from "@/lib/site";

/** Legal operator / public contact info (online service — no walk-in office). */
export const BUSINESS_LEGAL_NAME = "合同会社COMSIA";
export const BUSINESS_REPRESENTATIVE = "西東時雄";

export const BUSINESS_POSTAL_CODE = "063-0811";
export const BUSINESS_REGION = "北海道";
export const BUSINESS_LOCALITY = "札幌市西区";
export const BUSINESS_STREET_ADDRESS = "琴似1条5丁目4-18細川ビル3階";

/** Single-line registered address for display. */
export const BUSINESS_ADDRESS_DISPLAY =
  `〒${BUSINESS_POSTAL_CODE} ${BUSINESS_REGION}${BUSINESS_LOCALITY}${BUSINESS_STREET_ADDRESS}`;

/** Official public phone (operator / contact). */
export const BUSINESS_PHONE_DISPLAY = "011-600-1073";
export const BUSINESS_PHONE_TEL = "0116001073";

/** Official public contact email. */
export const BUSINESS_EMAIL = "info@comsia.co.jp";

/**
 * Operator contact hours (online inquiries).
 * Inquiries are accepted around the clock.
 */
export const BUSINESS_HOURS_DISPLAY = "24時間受付";
export const BUSINESS_HOURS_OPENS = "00:00";
export const BUSINESS_HOURS_CLOSES = "23:59";
export const BUSINESS_HOURS_DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
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
