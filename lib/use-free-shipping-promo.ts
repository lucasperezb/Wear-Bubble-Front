"use client";

import { useEffect, useState } from "react";
import {
  FREE_SHIPPING_MINIMUM,
  freeShippingPromoActive,
  freeShippingPromoMonthLabel,
} from "./store-config";

/**
 * Horário do `next build`, embutido igual no servidor e no cliente. A primeira
 * renderização usa esse instante, então o HTML pré-gerado e a hidratação
 * concordam; depois de montar passa a valer o relógio real.
 */
const BUILD_TIME = Number(process.env.NEXT_PUBLIC_BUILD_TIME) || 0;

/**
 * Estado da campanha de frete grátis para a interface. Reavalia a cada minuto
 * para virar sozinho na meia-noite de início/fim, sem recarregar a página.
 */
export function useFreeShippingPromo() {
  const [now, setNow] = useState(BUILD_TIME);

  useEffect(() => {
    const tick = () => setNow(Date.now());
    tick();
    const timer = window.setInterval(tick, 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const active = now > 0 && freeShippingPromoActive(now);
  return {
    active,
    minimum: active ? 0 : FREE_SHIPPING_MINIMUM,
    /** "outubro" */
    month: freeShippingPromoMonthLabel(),
    /** "durante todo o mês de outubro" */
    period: `durante todo o mês de ${freeShippingPromoMonthLabel()}`,
  };
}
