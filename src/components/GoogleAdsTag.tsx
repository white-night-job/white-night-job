/** Google Ads conversion tag ID (gtag.js). */
export const GOOGLE_ADS_ID = "AW-18435835579";

/**
 * Sitewide Google Ads tag (gtag.js).
 * Uses native <script> in the root layout <head> so the tag is present in
 * the initial HTML (script[src*="AW-…"] is queryable) on every page.
 * next/script is intentionally avoided: it injects via __next_s and may not
 * expose a real script[src] until after client bootstrap.
 */
export function GoogleAdsTag() {
  return (
    <>
      <script
        async
        src={`https://www.googletagmanager.com/gtag/js?id=${GOOGLE_ADS_ID}`}
      />
      <script
        id="google-ads-gtag"
        dangerouslySetInnerHTML={{
          __html: `
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GOOGLE_ADS_ID}');
`.trim(),
        }}
      />
    </>
  );
}
