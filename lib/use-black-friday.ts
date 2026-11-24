"use client";

import { useEffect, useState } from "react";
import type { BlackFridayConfig } from "./api";
import { blackFridayRunning, emptyBlackFridayConfig } from "./black-friday";
import { useHomeLayout } from "./home-layout";
import { countdownTo, type Countdown } from "./promo-campaign";

/**
 * Configuração da Black quando o layout está publicado e dentro do prazo;
 * null fora disso. ?bf=1 força a prévia.
 */
export function useBlackFriday(): BlackFridayConfig | null {
  const layout = useHomeLayout();
  const [preview, setPreview] = useState(false);
  const [ended, setEnded] = useState(false);
  const endsAt = layout?.blackFriday?.endsAt;

  useEffect(() => {
    setPreview(new URLSearchParams(window.location.search).get("bf") === "1");
  }, []);

  // Guarda só o "acabou": a página não renderiza de novo a cada verificação.
  useEffect(() => {
    if (!endsAt) return;
    const check = () => setEnded(Date.parse(endsAt) <= Date.now());
    check();
    const timer = window.setInterval(check, 10_000);
    return () => window.clearInterval(timer);
  }, [endsAt]);

  if (!layout) return null;
  const config = layout.blackFriday || emptyBlackFridayConfig();
  if (preview) return config;
  return layout.active === "blackfriday" && !ended && blackFridayRunning(config) ? config : null;
}

/** Contagem regressiva até o fim da Black. null até montar no cliente. */
export function useBlackFridayCountdown(endsAt: string): Countdown | null {
  const [countdown, setCountdown] = useState<Countdown | null>(null);
  useEffect(() => {
    const tick = () => setCountdown(countdownTo(Date.parse(endsAt)));
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [endsAt]);
  return countdown;
}
