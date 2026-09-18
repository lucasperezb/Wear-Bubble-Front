"use client";

import { Clock3, Layers, Search, Sparkles, Tag, X } from "lucide-react";
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { apiFetch, type Product } from "../../../lib/api";
import { readDemoProducts } from "../../../lib/demo-store";
import {
  SEARCH_HISTORY_EVENT,
  addSearchToHistory,
  clearSearchHistory,
  readSearchHistory,
  removeSearchFromHistory,
  type SearchHistoryEntry,
} from "../../../lib/search-history";
import {
  discoverySuggestions,
  resolveSearchDestination,
  typeaheadSuggestions,
  type SearchSuggestion,
} from "../../../lib/search-suggestions";
import { ProductIcon } from "../../shared";

type SearchBoxProps = {
  demoMode: boolean;
  initialQuery?: string;
  variant: "desktop" | "mobile";
  onNavigate?: () => void;
};

// Catálogo carregado uma vez por aba, só quando a cliente foca a busca.
let cachedProducts: Product[] | null = null;
let inflight: Promise<Product[]> | null = null;

function loadCatalog(demo: boolean) {
  if (cachedProducts) return Promise.resolve(cachedProducts);
  if (demo) {
    cachedProducts = readDemoProducts();
    return Promise.resolve(cachedProducts);
  }
  if (!inflight) {
    inflight = apiFetch<Product[]>("/products")
      .catch(() => [] as Product[])
      .then((list) => {
        cachedProducts = list;
        inflight = null;
        return list;
      });
  }
  return inflight;
}

function suggestionIcon(kind: SearchSuggestion["kind"]) {
  if (kind === "history") return <Clock3 className="size-4" aria-hidden="true" />;
  if (kind === "collection") return <Layers className="size-4" aria-hidden="true" />;
  if (kind === "category" || kind === "term") return <Tag className="size-4" aria-hidden="true" />;
  return <Search className="size-4" aria-hidden="true" />;
}

export function SearchBox({ demoMode, initialQuery = "", variant, onNavigate }: SearchBoxProps) {
  const [query, setQuery] = useState(initialQuery);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [products, setProducts] = useState<Product[]>(cachedProducts || []);
  const [history, setHistory] = useState<SearchHistoryEntry[]>([]);
  // Muda a cada abertura: as ideias nunca vêm na mesma ordem.
  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 1e9));
  const rootRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  useEffect(() => {
    setHistory(readSearchHistory());
    const sync = () => setHistory(readSearchHistory());
    window.addEventListener(SEARCH_HISTORY_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(SEARCH_HISTORY_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    function closeOnOutside(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    window.addEventListener("pointerdown", closeOnOutside);
    return () => window.removeEventListener("pointerdown", closeOnOutside);
  }, [open]);

  const openBox = useCallback(() => {
    setOpen(true);
    setActiveIndex(-1);
    setSeed((current) => current + 1);
    void loadCatalog(demoMode).then(setProducts);
  }, [demoMode]);

  const trimmed = query.trim();
  const discovery = useMemo(
    () => (trimmed ? null : discoverySuggestions(products, history, seed, demoMode)),
    [demoMode, history, products, seed, trimmed],
  );
  const typeahead = useMemo(
    () => (trimmed ? typeaheadSuggestions(trimmed, products, history, demoMode) : []),
    [demoMode, history, products, trimmed],
  );
  const options: SearchSuggestion[] = trimmed
    ? typeahead
    : [...(discovery?.recent || []), ...(discovery?.ideas || [])];

  function go(href: string, remember: string) {
    if (remember) addSearchToHistory(remember);
    setOpen(false);
    onNavigate?.();
    window.location.assign(href);
  }

  function submit(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    if (activeIndex >= 0 && options[activeIndex]) {
      const chosen = options[activeIndex];
      go(chosen.href, chosen.query);
      return;
    }
    if (!trimmed) {
      openBox();
      return;
    }
    const destination = resolveSearchDestination(trimmed, products, demoMode);
    go(destination.href, trimmed);
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (!open) openBox();
      setActiveIndex((current) => (options.length ? (current + 1) % options.length : -1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((current) =>
        options.length ? (current <= 0 ? options.length - 1 : current - 1) : -1,
      );
    } else if (event.key === "Escape") {
      if (open) {
        event.preventDefault();
        setOpen(false);
      }
    } else if (event.key === "Enter" && activeIndex >= 0) {
      event.preventDefault();
      submit();
    }
  }

  const isMobile = variant === "mobile";
  const activeId = activeIndex >= 0 ? `${listId}-opt-${activeIndex}` : undefined;

  return (
    <form
      ref={rootRef}
      onSubmit={submit}
      role="search"
      className={
        isMobile
          ? "relative mx-4 mb-3 sm:hidden"
          : "relative hidden sm:block"
      }
    >
      <div
        className={
          isMobile
            ? "flex items-center gap-2 border border-bubble-ink bg-bubble-white px-3"
            : `flex items-center border-b transition-colors ${open ? "border-bubble-ink" : "border-transparent"}`
        }
      >
        <Search className="size-4 shrink-0 text-bubble-ink/55" aria-hidden="true" />
        <input
          ref={inputRef}
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setActiveIndex(-1);
            if (!open) openBox();
          }}
          onFocus={openBox}
          onKeyDown={onKeyDown}
          className={
            isMobile
              ? "min-h-11 w-full min-w-0 bg-transparent py-2 font-serif text-base outline-none placeholder:text-bubble-ink/45"
              : "w-[150px] bg-transparent px-2 py-2 font-serif text-[.82rem] outline-none placeholder:text-bubble-ink/45 lg:w-[190px]"
          }
          placeholder="Buscar peças"
          aria-label="Buscar produtos"
          type="search"
          enterKeyHint="search"
          autoComplete="off"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={activeId}
        />
        {query ? (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setActiveIndex(-1);
              inputRef.current?.focus();
            }}
            className={`flex shrink-0 items-center justify-center text-bubble-ink/55 transition-colors hover:text-bubble-ink ${isMobile ? "size-9 [&_svg]:size-4" : "size-5 [&_svg]:size-3.5"}`}
            aria-label="Limpar busca"
            title="Limpar busca"
          >
            <X aria-hidden="true" />
          </button>
        ) : null}
      </div>

      {open ? (
        <div
          className={`absolute z-[60] mt-2 border border-bubble-ink bg-bubble-white shadow-bubble ${
            isMobile ? "inset-x-0" : "right-0 w-[380px] max-w-[calc(100vw-2rem)]"
          }`}
        >
          {!trimmed && discovery?.recent.length ? (
            <div className="flex items-center justify-between border-b border-bubble-line px-3 pb-1.5 pt-2.5">
              <span className="font-sans text-[.58rem] font-bold uppercase tracking-[.16em] text-bubble-ink/45">Suas buscas recentes</span>
              <button
                type="button"
                className="font-sans text-[.6rem] font-semibold uppercase tracking-[.1em] text-bubble-brown hover:text-bubble-ink"
                onClick={() => {
                  clearSearchHistory();
                  inputRef.current?.focus();
                }}
              >
                Limpar
              </button>
            </div>
          ) : null}

          <ul id={listId} role="listbox" aria-label="Sugestões de busca" className="m-0 max-h-[min(60vh,420px)] list-none overflow-y-auto overscroll-contain p-0">
            {options.map((item, index) => {
              const firstIdea = !trimmed && discovery && index === discovery.recent.length;
              return (
                <li key={`${item.kind}-${item.query}-${index}`} role="presentation">
                  {firstIdea ? (
                    <div className="flex items-center gap-2 border-b border-t border-bubble-line px-3 pb-1.5 pt-2.5 font-sans text-[.58rem] font-bold uppercase tracking-[.16em] text-bubble-ink/45">
                      <Sparkles className="size-3" aria-hidden="true" /> Ideias para você
                    </div>
                  ) : null}
                  <div
                    id={`${listId}-opt-${index}`}
                    role="option"
                    aria-selected={activeIndex === index}
                    className={`group/opt flex cursor-pointer items-center gap-3 px-3 py-2.5 text-left transition-colors ${activeIndex === index ? "bg-bubble-cream" : "hover:bg-bubble-cream"}`}
                    onMouseEnter={() => setActiveIndex(index)}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => go(item.href, item.query)}
                  >
                    {item.product ? (
                      <span className="flex h-11 w-9 shrink-0 items-center justify-center overflow-hidden bg-bubble-cream2 [&_svg]:w-3/5">
                        {item.product.image ? (
                          <img src={item.product.image} alt="" className="size-full object-cover" loading="lazy" decoding="async" />
                        ) : (
                          <ProductIcon icon={item.product.icon} />
                        )}
                      </span>
                    ) : (
                      <span className="flex size-9 shrink-0 items-center justify-center text-bubble-ink/50">
                        {suggestionIcon(item.kind)}
                      </span>
                    )}
                    <span className="min-w-0 flex-1">
                      <span className={`block truncate text-[.86rem] ${item.kind === "query" ? "font-semibold" : ""}`}>{item.label}</span>
                      {item.detail ? (
                        <span className="block truncate text-[.66rem] text-bubble-ink/50">{item.detail}</span>
                      ) : null}
                    </span>
                    {item.kind === "history" ? (
                      <button
                        type="button"
                        className="flex size-9 shrink-0 items-center justify-center text-bubble-ink/40 hover:text-bubble-danger"
                        aria-label={`Remover “${item.query}” do histórico`}
                        onClick={(event) => {
                          event.stopPropagation();
                          removeSearchFromHistory(item.query);
                          inputRef.current?.focus();
                        }}
                      >
                        <X className="size-3.5" aria-hidden="true" />
                      </button>
                    ) : null}
                  </div>
                </li>
              );
            })}
            {!options.length ? (
              <li className="px-3 py-4 text-center text-[.78rem] text-bubble-ink/55" role="presentation">
                {products.length ? "Digite para ver sugestões." : "Carregando sugestões…"}
              </li>
            ) : null}
          </ul>

          <div className="flex items-center justify-between border-t border-bubble-line px-3 py-2 text-[.62rem] text-bubble-ink/45">
            <span>↑↓ para navegar · Enter para abrir</span>
            {!trimmed ? (
              <button
                type="button"
                className="font-sans text-[.6rem] font-semibold uppercase tracking-[.1em] text-bubble-brown hover:text-bubble-ink"
                onClick={() => {
                  setSeed((current) => current + 7);
                  inputRef.current?.focus();
                }}
              >
                Outras ideias
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
    </form>
  );
}
