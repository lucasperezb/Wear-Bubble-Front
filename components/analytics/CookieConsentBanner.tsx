"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const CONSENT_KEY = "bubble_ads_consent";

type ConsentChoice = "accepted" | "rejected";

function updateGoogleConsent(choice: ConsentChoice) {
  const value = choice === "accepted" ? "granted" : "denied";
  window.gtag?.("consent", "update", {
    ad_storage: value,
    analytics_storage: value,
    ad_user_data: value,
    ad_personalization: value,
  });
}

export function CookieConsentBanner() {
  const [choice, setChoice] = useState<ConsentChoice | null | undefined>();

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(CONSENT_KEY);
      setChoice(
        saved === "accepted" || saved === "rejected" ? saved : null,
      );
    } catch {
      setChoice(null);
    }
  }, []);

  function choose(nextChoice: ConsentChoice) {
    try {
      window.localStorage.setItem(CONSENT_KEY, nextChoice);
    } catch {
      // A preferência ainda vale durante a sessão atual.
    }
    updateGoogleConsent(nextChoice);
    setChoice(nextChoice);
  }

  if (choice === undefined) return null;

  if (choice) {
    return (
      <button
        type="button"
        onClick={() => setChoice(null)}
        className="fixed bottom-4 left-4 z-[90] border border-bubble-ink bg-bubble-white px-3 py-2 font-sans text-[.62rem] font-semibold uppercase tracking-[.1em] shadow-md"
      >
        Cookies
      </button>
    );
  }

  return (
    <aside
      aria-label="Preferências de cookies"
      className="fixed inset-x-4 bottom-4 z-[100] mx-auto max-w-[760px] border border-bubble-ink bg-bubble-white p-5 shadow-2xl sm:p-6"
    >
      <div className="grid items-center gap-5 md:grid-cols-[1fr_auto]">
        <div>
          <h2 className="text-xl">Sua privacidade importa</h2>
          <p className="mt-2 text-sm leading-relaxed text-bubble-ink/70">
            Usamos cookies opcionais do Google Ads para medir compras originadas
            por anúncios e melhorar nossas campanhas. Você pode aceitar ou
            recusar sem afetar o funcionamento da loja. Consulte nossa{" "}
            <Link href="/politica-de-privacidade#cookies" className="underline">
              Política de Privacidade
            </Link>
            .
          </p>
        </div>
        <div className="flex flex-wrap gap-2 md:w-[190px] md:flex-col">
          <button
            type="button"
            onClick={() => choose("accepted")}
            className="flex-1 bg-bubble-ink px-4 py-3 font-sans text-[.68rem] font-semibold uppercase tracking-[.08em] text-bubble-white"
          >
            Aceitar opcionais
          </button>
          <button
            type="button"
            onClick={() => choose("rejected")}
            className="flex-1 border border-bubble-ink px-4 py-3 font-sans text-[.68rem] font-semibold uppercase tracking-[.08em]"
          >
            Recusar opcionais
          </button>
        </div>
      </div>
    </aside>
  );
}
