export const GOOGLE_ADS_ID = "AW-18384376708";
export const GOOGLE_ADS_PURCHASE_DESTINATION =
  "AW-18384376708/G7rlCLa39t8cEISnrb5E";
export const COOKIE_PREFERENCES_EVENT = "bubble:open-cookie-preferences";

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

type PurchaseConversion = {
  transactionId: string;
  value: number;
};

export function trackGoogleAdsPurchase({
  transactionId,
  value,
}: PurchaseConversion) {
  if (
    typeof window === "undefined" ||
    !transactionId ||
    !Number.isFinite(value) ||
    value < 0
  ) {
    return false;
  }

  const storageKey = `google_ads_purchase_${transactionId}`;
  try {
    if (window.localStorage.getItem(storageKey)) return false;
  } catch {
    // O transaction_id também permite ao Google remover duplicidades.
  }

  window.dataLayer = window.dataLayer || [];
  const gtag =
    window.gtag ||
    function googleTagQueue() {
      window.dataLayer.push(arguments);
    };

  gtag("event", "conversion", {
    send_to: GOOGLE_ADS_PURCHASE_DESTINATION,
    value,
    currency: "BRL",
    transaction_id: transactionId,
  });

  try {
    window.localStorage.setItem(storageKey, new Date().toISOString());
  } catch {
    // A conversão continua válida mesmo com o armazenamento indisponível.
  }
  return true;
}
