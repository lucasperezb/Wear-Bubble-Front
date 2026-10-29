"use client";

import { useHomeLayout } from "./home-layout";

/**
 * Tema de verão ligado agora: vale quando o layout "Coleção Fizz · Verão"
 * está publicado no painel (Vitrines do site).
 */
export function useSummerTheme() {
  return useHomeLayout()?.active === "fizz";
}
