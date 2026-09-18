"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "./api";
import {
  defaultPromotionSettings,
  normalizeTiers,
  type PromotionSettings,
} from "./progressive-discount";

let cached: PromotionSettings | null = null;
let inflight: Promise<PromotionSettings> | null = null;
const listeners = new Set<(settings: PromotionSettings) => void>();

function normalize(input: Partial<PromotionSettings> | null | undefined): PromotionSettings {
  const progressive = { ...defaultPromotionSettings.progressive, ...(input?.progressive || {}) };
  return {
    individualEnabled: input?.individualEnabled !== false,
    progressive: {
      enabled: progressive.enabled === true,
      tiers: normalizeTiers(progressive.tiers),
      extendLast: progressive.extendLast !== false,
      stackWithOtherDiscounts: progressive.stackWithOtherDiscounts === true,
    },
  };
}

/** Carrega as configurações de promoção uma vez por aba; falha vira o padrão (tudo desligado). */
export function loadPromotionSettings(): Promise<PromotionSettings> {
  if (cached) return Promise.resolve(cached);
  if (!inflight) {
    inflight = apiFetch<PromotionSettings>("/promotions/settings")
      .then((data) => normalize(data))
      .catch(() => normalize(null))
      .then((settings) => {
        cached = settings;
        inflight = null;
        listeners.forEach((listener) => listener(settings));
        return settings;
      });
  }
  return inflight;
}

/** Usado pelo painel após salvar, para a loja aberta na mesma aba refletir na hora. */
export function primePromotionSettings(settings: PromotionSettings) {
  cached = normalize(settings);
  listeners.forEach((listener) => listener(cached as PromotionSettings));
}

export function usePromotionSettings() {
  const [settings, setSettings] = useState<PromotionSettings>(
    () => cached || defaultPromotionSettings,
  );

  useEffect(() => {
    listeners.add(setSettings);
    void loadPromotionSettings().then(setSettings);
    return () => {
      listeners.delete(setSettings);
    };
  }, []);

  return settings;
}
