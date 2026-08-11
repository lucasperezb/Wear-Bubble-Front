import Script from "next/script";
import { GOOGLE_ADS_ID } from "../../lib/google-ads";

export function GoogleAdsTag() {
  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GOOGLE_ADS_ID}`}
        strategy="afterInteractive"
      />
      <Script id="google-ads-tag" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          window.gtag = gtag;
          var adsConsent = 'denied';
          try {
            adsConsent = localStorage.getItem('bubble_ads_consent') === 'accepted' ? 'granted' : 'denied';
          } catch (error) {}
          gtag('consent', 'default', {
            'ad_storage': adsConsent,
            'analytics_storage': adsConsent,
            'ad_user_data': adsConsent,
            'ad_personalization': adsConsent
          });
          gtag('set', 'ads_data_redaction', true);
          gtag('js', new Date());
          gtag('config', '${GOOGLE_ADS_ID}');
        `}
      </Script>
    </>
  );
}
