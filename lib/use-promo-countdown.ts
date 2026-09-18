"use client";

import { useEffect, useState } from "react";
import { countdownTo, promoEndsAtMs, type Countdown } from "./promo-campaign";

/**
 * Contagem regressiva até o fim da campanha. Começa em null para o servidor e
 * o cliente renderizarem o mesmo HTML; só depois de montar é que passa a contar.
 */
export function usePromoCountdown(): Countdown | null {
  const [countdown, setCountdown] = useState<Countdown | null>(null);

  useEffect(() => {
    const target = promoEndsAtMs();
    const tick = () => setCountdown(countdownTo(target));
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, []);

  return countdown;
}
