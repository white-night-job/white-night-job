export const SITE_BRAND_JA = "体入ホワイトナイト";
export const SITE_NAME = "White Night Job";
export const SITE_FORMAL_NAME = "体入ホワイトナイト（White Night Job）";
export const SITE_LEGAL_INTRO = `${SITE_FORMAL_NAME}（以下「当サイト」といいます。）`;
export const SITE_TITLE =
  "体入ホワイトナイト｜安心・安全な札幌の夜職・体験入店求人サイト";
export const SITE_DESCRIPTION =
  "体入ホワイトナイト（White Night Job）は、札幌で安心して働ける夜職求人だけを掲載する求人サイトです。体験入店・ガールズバー・コンカフェ・ラウンジ・ニュークラブなど、審査済みの優良店舗を比較しながら探せます。初めての方も条件を確認しながら、自分に合うお店を探しやすい設計です。";
export const SITE_OG_TITLE = "体入ホワイトナイト｜安心できる夜職求人";
export const SITE_TAGLINE =
  "体入ホワイトナイト（White Night Job）は、安心して働ける夜職求人サイトです。";
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
