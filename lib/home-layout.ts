"use client";

import { useEffect, useLayoutEffect, useState } from "react";
import { apiFetch, type FizzLayoutConfig, type HomeLayoutSettings } from "./api";

/** Última resposta guardada no navegador: a página abre no tema certo sem piscar. */
const CACHE_KEY = "bubble-home-layout-v1";
/** Modo demonstração: o painel local grava aqui. */
const DEMO_KEY = "bubble-demo-home-layout-v1";

export const emptyFizzConfig = (): FizzLayoutConfig => ({
  heroProductId: null,
  heroColor: "",
  sideProductId: null,
  newsProductIds: [],
  storyImages: ["Look completo", "Bolso lateral", "Cintura em V"].map((label) => ({
    productId: null,
    color: "",
    imageIndex: 0,
    label,
  })),
});

export const defaultHomeLayout = (): HomeLayoutSettings => ({
  active: "padrao",
  fizz: emptyFizzConfig(),
});

let current: HomeLayoutSettings | null = null;
let request: Promise<HomeLayoutSettings> | null = null;
const listeners = new Set<(value: HomeLayoutSettings) => void>();

function isDemo() {
  return (
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("demo") === "1"
  );
}

function readStored(key: string): HomeLayoutSettings | null {
  try {
    const value = JSON.parse(window.localStorage.getItem(key) || "null") as HomeLayoutSettings | null;
    return value && (value.active === "padrao" || value.active === "fizz") ? value : null;
  } catch {
    return null;
  }
}

function writeStored(key: string, value: HomeLayoutSettings) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Navegação privada ou armazenamento bloqueado: segue sem cache.
  }
}

function publish(value: HomeLayoutSettings) {
  current = value;
  listeners.forEach((listener) => listener(value));
}

/** Busca o layout publicado (uma vez por página; o painel força com `force`). */
export function loadHomeLayout(force = false): Promise<HomeLayoutSettings> {
  if (isDemo()) {
    const value = readStored(DEMO_KEY) || defaultHomeLayout();
    publish(value);
    return Promise.resolve(value);
  }
  if (request && !force) return request;
  request = apiFetch<HomeLayoutSettings>("/home-layout")
    .then((value) => {
      writeStored(CACHE_KEY, value);
      publish(value);
      return value;
    })
    .catch(() => {
      // API fora do ar: mantém o que já estava (ou o layout padrão).
      const fallback = current || readStored(CACHE_KEY) || defaultHomeLayout();
      publish(fallback);
      request = null;
      return fallback;
    });
  return request;
}

/** Layout salvo no modo demonstração (painel e loja locais). */
export function readDemoHomeLayout(): HomeLayoutSettings {
  return readStored(DEMO_KEY) || defaultHomeLayout();
}

/** Painel em modo demonstração: grava o layout local e avisa a página. */
export function saveDemoHomeLayout(value: HomeLayoutSettings) {
  writeStored(DEMO_KEY, value);
  publish(value);
  return value;
}

/** Depois de salvar no painel: atualiza o cache e as telas abertas. */
export function setHomeLayout(value: HomeLayoutSettings) {
  writeStored(CACHE_KEY, value);
  publish(value);
}

/**
 * Layout publicado. Começa nulo, igual no servidor e na hidratação; antes da
 * primeira pintura usa o cache do navegador e depois confirma com a API.
 */
export function useHomeLayout() {
  const [layout, setLayout] = useState<HomeLayoutSettings | null>(null);

  useLayoutEffect(() => {
    const cached = current || readStored(isDemo() ? DEMO_KEY : CACHE_KEY);
    if (cached) setLayout(cached);
  }, []);

  useEffect(() => {
    listeners.add(setLayout);
    void loadHomeLayout();
    return () => {
      listeners.delete(setLayout);
    };
  }, []);

  return layout;
}
