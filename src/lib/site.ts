export const SITE_BRAND_JA = "体入ホワイトナイト";
export const SITE_NAME = "White Night Job";
export const SITE_FORMAL_NAME = "体入ホワイトナイト（White Night Job）";
export const SITE_LEGAL_INTRO = `${SITE_FORMAL_NAME}（以下「当サイト」といいます。）`;
/** Homepage / default document title (absolute — do not append brand suffix). */
export const SITE_TITLE =
  "【優良店専門】White Night Job | 安心して働ける札幌の夜職求人";
export const SITE_DESCRIPTION =
  "札幌の優良店だけを厳選掲載。独自審査を通過した店舗のみ掲載し、ブラック店を避けたい方のお店選びをサポート。面接前相談にも対応した安心の夜職求人サイトです。";
export const SITE_OG_TITLE = SITE_TITLE;
export const SITE_TAGLINE =
  "体入ホワイトナイト（White Night Job）は、安心して働ける夜職求人サイトです。";

/**
 * Pre-launch flag: published jobs are demo/sample listings.
 * Set to `false` at official release to remove sample badges and notices.
 */
export const SHOW_SAMPLE_LISTINGS = true;

export const SAMPLE_LISTING_DETAIL_NOTE =
  "※この求人はデモ（サンプル）です。正式リリース時に実際の掲載店舗へ切り替わります。";

export const SAMPLE_LISTING_HOME_NOTICE =
  "現在は正式リリース前のため、掲載求人はすべてサンプル表示です。現在掲載店舗を募集しています。";
/** Canonical origin (www, https). Prefer NEXT_PUBLIC_SITE_URL in production. */
function resolveSiteUrl(): string {
  const fallback = "https://www.whitenightjob.jp";
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim() || fallback;
  try {
    const url = new URL(raw.startsWith("http") ? raw : `https://${raw}`);
    if (url.hostname === "whitenightjob.jp") {
      url.hostname = "www.whitenightjob.jp";
    }
    url.protocol = "https:";
    url.port = "";
    return url.origin;
  } catch {
    return fallback;
  }
}

export const SITE_URL = resolveSiteUrl();
/** Official brand mark used in Organization structured data / OG. */
export const SITE_LOGO_PATH = "/images/brand/white-night-job-mark.png";
export const SITE_LOGO_URL = `${SITE_URL}${SITE_LOGO_PATH}`;
export const LOGO_ALT = "体入ホワイトナイト White Night Job";
export const IMAGE_ALT_BRAND = "体入ホワイトナイト";
