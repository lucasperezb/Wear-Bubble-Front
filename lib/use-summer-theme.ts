"use client";

import { useHomeLayout } from "./home-layout";

/**
 * Tema de verão ligado agora: vale quando o layout "Coleção Fizz · Verão"
 * está publicado no painel (Vitrines do site). A Black Friday troca só a
 * página inicial: o resto do site segue no tema que estava no ar antes dela.
 */
export function useSummerTheme() {
  const layout = useHomeLayout();
  return (
    (layout?.active === "blackfriday" ? layout.previous : layout?.active) ===
    "fizz"
  );
}
