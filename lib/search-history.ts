/**
 * Histórico de buscas da cliente, guardado só no aparelho (localStorage).
 * Não sobe para a API: é conveniência de navegação, não dado pessoal.
 */

export const SEARCH_HISTORY_KEY = "bubble_search_history";
export const SEARCH_HISTORY_EVENT = "bubble:search-history";
export const SEARCH_HISTORY_LIMIT = 8;

export type SearchHistoryEntry = {
  query: string;
  /** Data da última vez que a busca foi feita (ms). */
  at: number;
  /** Quantas vezes essa busca foi repetida. */
  count: number;
};

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function isEntry(value: unknown): value is SearchHistoryEntry {
  if (!value || typeof value !== "object") return false;
  const entry = value as Partial<SearchHistoryEntry>;
  return (
    typeof entry.query === "string" &&
    entry.query.trim().length > 0 &&
    Number.isFinite(entry.at) &&
    Number.isFinite(entry.count)
  );
}

function notify() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(SEARCH_HISTORY_EVENT));
}

export function readSearchHistory(): SearchHistoryEntry[] {
  if (!canUseStorage()) return [];
  try {
    const parsed: unknown = JSON.parse(
      window.localStorage.getItem(SEARCH_HISTORY_KEY) || "[]",
    );
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(isEntry)
      .sort((left, right) => right.at - left.at)
      .slice(0, SEARCH_HISTORY_LIMIT);
  } catch {
    return [];
  }
}

function writeSearchHistory(entries: SearchHistoryEntry[]) {
  if (!canUseStorage()) return;
  try {
    window.localStorage.setItem(
      SEARCH_HISTORY_KEY,
      JSON.stringify(entries.slice(0, SEARCH_HISTORY_LIMIT)),
    );
  } catch {
    // Sem espaço ou modo privado: a busca funciona do mesmo jeito.
  }
  notify();
}

/** Registra uma busca (ou sobe para o topo se já existia). */
export function addSearchToHistory(query: string) {
  const cleaned = query.trim().replace(/\s+/g, " ");
  if (!cleaned) return;
  const key = cleaned.toLocaleLowerCase("pt-BR");
  const current = readSearchHistory();
  const existing = current.find(
    (entry) => entry.query.toLocaleLowerCase("pt-BR") === key,
  );
  const next: SearchHistoryEntry = {
    query: existing?.query || cleaned,
    at: Date.now(),
    count: (existing?.count || 0) + 1,
  };
  writeSearchHistory([
    next,
    ...current.filter(
      (entry) => entry.query.toLocaleLowerCase("pt-BR") !== key,
    ),
  ]);
}

export function removeSearchFromHistory(query: string) {
  const key = query.trim().toLocaleLowerCase("pt-BR");
  writeSearchHistory(
    readSearchHistory().filter(
      (entry) => entry.query.toLocaleLowerCase("pt-BR") !== key,
    ),
  );
}

export function clearSearchHistory() {
  writeSearchHistory([]);
}
