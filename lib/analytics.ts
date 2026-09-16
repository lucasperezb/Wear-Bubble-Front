import { apiFetch } from "./api";

export type TrackEventType = "view" | "click" | "add" | "buy";

const sent = new Set<string>();

/**
 * Registra um evento anonimizado no painel do gerente.
 * Nunca lança: telemetria não pode quebrar a navegação da loja.
 */
export function trackEvent(type: TrackEventType, pid?: number | null) {
  if (typeof window === "undefined") return;
  const demo = new URLSearchParams(window.location.search).get("demo") === "1";
  if (demo) return;
  void apiFetch("/events", {
    method: "POST",
    body: JSON.stringify({ type, pid: pid && pid > 0 ? pid : undefined }),
  }).catch(() => null);
}

/** Igual a trackEvent, mas dispara uma única vez por chave na sessão da aba. */
export function trackEventOnce(type: TrackEventType, pid?: number | null) {
  const key = `${type}:${pid ?? ""}`;
  if (sent.has(key)) return;
  sent.add(key);
  trackEvent(type, pid);
}
