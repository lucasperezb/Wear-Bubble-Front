"use client";

import { useEffect, useState } from "react";
import { countdownTo, type Countdown } from "./promo-campaign";
import { blackFridayActive, blackFridayEndsAtMs } from "./black-friday";

/**
 * Black Friday ligada neste navegador. Começa false para o servidor e o
 * cliente renderizarem o mesmo HTML; depois de montar, confere a data e o ?bf=1.
 */
export function useBlackFriday() {
  const [active, setActive] = useState(false);
  useEffect(() => {
    const preview = new URLSearchParams(window.location.search).get("bf") === "1";
    const check = () => setActive(blackFridayActive(Date.now(), preview));
    check();
    const timer = window.setInterval(check, 60_000);
    return () => window.clearInterval(timer);
  }, []);
  return active;
}

/** Contagem regressiva até o fim da Black. null até montar no cliente. */
export function useBlackFridayCountdown(): Countdown | null {
  const [countdown, setCountdown] = useState<Countdown | null>(null);
  useEffect(() => {
    const target = blackFridayEndsAtMs();
    const tick = () => setCountdown(countdownTo(target));
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, []);
  return countdown;
}
