import Script from "next/script";

/** Google Ads conversion tag ID (gtag.js). */
export const GOOGLE_ADS_ID = "AW-18435835579";

/**
 * Sitewide Google Ads tag (gtag.js).
 * Loaded once via root layout for conversion measurement readiness.
 */
export function GoogleAdsTag() {
  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GOOGLE_ADS_ID}`}
        strategy="afterInteractive"
      />
      <Script id="google-ads-gtag" strategy="afterInteractive">
        {`
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GOOGLE_ADS_ID}');
        `.trim()}
      </Script>
    </>
  );
}
