import type { Product } from "./api";
import { money } from "./api";
import { collectionSlug } from "./collections";
import { catalogCategory } from "./product-filters";
import { normalizeSearchText, searchProducts } from "./product-search";
import { productPrice } from "./pricing";
import type { SearchHistoryEntry } from "./search-history";

export type SearchSuggestionKind =
  | "history"
  | "product"
  | "category"
  | "collection"
  | "term"
  | "query";

export type SearchSuggestion = {
  kind: SearchSuggestionKind;
  /** Texto principal da linha. */
  label: string;
  /** Linha secundária (categoria, preço, "Coleção"...). */
  detail?: string;
  href: string;
  /** O que vai para o campo e para o histórico ao escolher. */
  query: string;
  product?: Product;
};

export type SearchDestination = {
  href: string;
  kind: "product" | "category" | "collection" | "results";
  label: string;
};

const categoryRoutes: Record<string, { href: string; label: string }> = {
  "Blusas/Top": { href: "/produtos/tops", label: "Tops & Blusas" },
  "Shorts/Calça": { href: "/produtos/shorts-calcas", label: "Shorts & Calças" },
  Conjunto: { href: "/produtos/conjuntos", label: "Conjuntos" },
};

function withDemo(href: string, demo: boolean) {
  if (!demo) return href;
  return href.includes("?") ? `${href}&demo=1` : `${href}?demo=1`;
}

function singular(token: string) {
  return token.length > 3 && token.endsWith("s") ? token.slice(0, -1) : token;
}

/** Categoria da loja a partir do que a cliente digitou ("leggings" -> Shorts/Calça). */
function categoryFromQuery(query: string) {
  const normalized = normalizeSearchText(query);
  if (!normalized) return null;
  if (normalized.split(" ").length > 2) return null;
  const candidates = [normalized, singular(normalized), normalized.split(" ").map(singular).join(" ")];
  for (const candidate of candidates) {
    const category = catalogCategory(candidate);
    if (categoryRoutes[category]) return category;
  }
  return null;
}

function collectionsOf(products: Product[]) {
  return Array.from(
    new Set(
      products
        .map((product) => (product.collectionName || "").trim())
        .filter(Boolean),
    ),
  );
}

function collectionFromQuery(query: string, products: Product[]) {
  const wanted = collectionSlug(query);
  if (!wanted) return null;
  return (
    collectionsOf(products).find((name) => {
      const slug = collectionSlug(name);
      return slug === wanted || slug === singular(wanted);
    }) || null
  );
}

/**
 * Para onde a busca leva. Uma peça inequívoca abre a própria peça; uma
 * categoria ou coleção abre a listagem; o resto cai na página de resultados,
 * que já lida com termos aproximados.
 */
export function resolveSearchDestination(
  query: string,
  products: Product[],
  demo = false,
): SearchDestination {
  const cleaned = query.trim();
  const results: SearchDestination = {
    href: withDemo(`/produtos?busca=${encodeURIComponent(cleaned)}`, demo),
    kind: "results",
    label: `Resultados para “${cleaned}”`,
  };
  if (!cleaned) return results;

  const normalizedQuery = normalizeSearchText(cleaned);
  const exact = products.find(
    (product) => product.active !== false && normalizeSearchText(product.name) === normalizedQuery,
  );
  if (exact) {
    return { href: withDemo(`/produto/${exact.id}`, demo), kind: "product", label: exact.name };
  }

  const category = categoryFromQuery(cleaned);
  if (category) {
    const route = categoryRoutes[category];
    return { href: withDemo(route.href, demo), kind: "category", label: route.label };
  }

  const collection = collectionFromQuery(cleaned, products);
  if (collection) {
    return {
      href: withDemo(`/colecoes/${collectionSlug(collection)}`, demo),
      kind: "collection",
      label: `Coleção ${collection}`,
    };
  }

  const ranked = searchProducts(products, cleaned);
  const [best, runnerUp] = ranked;
  // Só abre a peça direto quando a busca é praticamente o nome dela
  // ("top cropped estrutura"), não um pedaço solto ("leg").
  const coversName =
    best &&
    normalizedQuery.split(" ").length >= 2 &&
    normalizedQuery.length >= normalizeSearchText(best.product.name).length * 0.6;
  const clearWinner =
    best &&
    coversName &&
    best.score >= 0.92 &&
    (!runnerUp || runnerUp.score <= best.score - 0.12);
  if (best && clearWinner) {
    return {
      href: withDemo(`/produto/${best.product.id}`, demo),
      kind: "product",
      label: best.product.name,
    };
  }
  return results;
}

/** Baralho determinístico: o mesmo `seed` dá a mesma ordem, outro seed dá outra. */
function seededShuffle<T>(items: T[], seed: number) {
  const list = [...items];
  let state = (seed >>> 0) || 1;
  for (let index = list.length - 1; index > 0; index -= 1) {
    state = (state * 1664525 + 1013904223) >>> 0;
    const swap = state % (index + 1);
    [list[index], list[swap]] = [list[swap], list[index]];
  }
  return list;
}

function termSuggestions(products: Product[], demo: boolean): SearchSuggestion[] {
  const terms: SearchSuggestion[] = [];
  const seen = new Set<string>();
  const push = (item: SearchSuggestion) => {
    const key = `${item.kind}:${normalizeSearchText(item.query)}`;
    if (seen.has(key)) return;
    seen.add(key);
    terms.push(item);
  };
  const active = products.filter((product) => product.active !== false);
  for (const product of active) {
    const category = catalogCategory(product.cat);
    const route = categoryRoutes[category];
    if (route)
      push({ kind: "category", label: route.label, detail: "Categoria", href: withDemo(route.href, demo), query: route.label });
    if (product.collectionName)
      push({
        kind: "collection",
        label: `Coleção ${product.collectionName}`,
        detail: "Coleção",
        href: withDemo(`/colecoes/${collectionSlug(product.collectionName)}`, demo),
        query: product.collectionName,
      });
    if (product.sub)
      push({ kind: "term", label: product.sub, detail: "Tipo de peça", href: withDemo(`/produtos?busca=${encodeURIComponent(product.sub)}`, demo), query: product.sub });
    for (const sport of product.sports || [])
      push({ kind: "term", label: sport, detail: "Esporte", href: withDemo(`/produtos?busca=${encodeURIComponent(sport)}`, demo), query: sport });
    if (product.material)
      push({ kind: "term", label: product.material, detail: "Tecido", href: withDemo(`/produtos?busca=${encodeURIComponent(product.material)}`, demo), query: product.material });
  }
  return terms;
}

function productSuggestion(product: Product, demo: boolean): SearchSuggestion {
  return {
    kind: "product",
    label: product.name,
    detail: `${product.sub || product.cat} · ${money.format(productPrice(product))}`,
    href: withDemo(`/produto/${product.id}`, demo),
    query: product.name,
    product,
  };
}

function historySuggestion(entry: SearchHistoryEntry, products: Product[], demo: boolean): SearchSuggestion {
  const destination = resolveSearchDestination(entry.query, products, demo);
  return {
    kind: "history",
    label: entry.query,
    detail: entry.count > 1 ? `Buscado ${entry.count} vezes` : "Busca recente",
    href: destination.href,
    query: entry.query,
  };
}

/**
 * Sugestões para o campo vazio: histórico da cliente + ideias que mudam a
 * cada abertura (o `seed` embaralha categorias, coleções, tipos, esportes e
 * peças bem avaliadas).
 */
export function discoverySuggestions(
  products: Product[],
  history: SearchHistoryEntry[],
  seed: number,
  demo = false,
  limit = 6,
): { recent: SearchSuggestion[]; ideas: SearchSuggestion[] } {
  const recent = history.slice(0, 4).map((entry) => historySuggestion(entry, products, demo));
  const recentKeys = new Set(recent.map((item) => normalizeSearchText(item.query)));
  const active = products.filter((product) => product.active !== false && product.stock > 0);
  const topProducts = [...active]
    .sort((left, right) => right.rating - left.rating || right.reviews - left.reviews)
    .slice(0, 6)
    .map((product) => productSuggestion(product, demo));
  const pool = [...termSuggestions(products, demo), ...topProducts].filter(
    (item) => !recentKeys.has(normalizeSearchText(item.query)),
  );
  // Garante variedade: no máximo duas peças e nunca duas linhas do mesmo tipo em sequência.
  const shuffled = seededShuffle(pool, seed);
  const ideas: SearchSuggestion[] = [];
  let productCount = 0;
  for (const item of shuffled) {
    if (ideas.length >= limit) break;
    if (item.kind === "product" && productCount >= 2) continue;
    if (ideas.length && ideas[ideas.length - 1].kind === item.kind && item.kind !== "product") continue;
    ideas.push(item);
    if (item.kind === "product") productCount += 1;
  }
  return { recent, ideas };
}

/** Sugestões enquanto digita: histórico que casa, termos, peças aproximadas e a busca literal. */
export function typeaheadSuggestions(
  query: string,
  products: Product[],
  history: SearchHistoryEntry[],
  demo = false,
): SearchSuggestion[] {
  const cleaned = query.trim();
  const normalized = normalizeSearchText(cleaned);
  if (!normalized) return [];
  const tokens = normalized.split(" ").filter(Boolean);
  const matchesQuery = (text: string) => {
    const target = normalizeSearchText(text);
    return tokens.every((token) => target.includes(token));
  };

  const out: SearchSuggestion[] = [];
  const seen = new Set<string>();
  const push = (item: SearchSuggestion) => {
    const key = `${item.kind === "history" ? "q" : item.kind}:${normalizeSearchText(item.query)}`;
    if (seen.has(key)) return;
    seen.add(key);
    out.push(item);
  };

  history
    .filter((entry) => matchesQuery(entry.query) && normalizeSearchText(entry.query) !== normalized)
    .slice(0, 2)
    .forEach((entry) => push(historySuggestion(entry, products, demo)));

  termSuggestions(products, demo)
    .filter((item) => matchesQuery(item.label))
    .slice(0, 3)
    .forEach(push);

  const nameFields = (product: Product) =>
    normalizeSearchText([product.name, product.sub, product.cat, product.collectionName || ""].join(" ")).split(" ");
  searchProducts(products, cleaned)
    .filter(
      ({ product, score }) =>
        score >= 0.66 &&
        tokens.some((token) => nameFields(product).some((field) => field.includes(token) || wordSimilarity(field, token) >= 0.8)),
    )
    .slice(0, 4)
    .forEach(({ product }) => push(productSuggestion(product, demo)));

  const destination = resolveSearchDestination(cleaned, products, demo);
  push({
    kind: "query",
    label: destination.kind === "results" ? `Buscar por “${cleaned}”` : `Ir para ${destination.label}`,
    detail: destination.kind === "results" ? "Ver todos os resultados" : undefined,
    href: destination.href,
    query: cleaned,
  });
  return out.slice(0, 8);
}

/**
 * "Você quis dizer": termo do catálogo mais parecido com a busca, para a
 * página de resultados vazia.
 */
export function suggestCorrection(query: string, products: Product[]) {
  const normalized = normalizeSearchText(query);
  if (!normalized) return null;
  const vocabulary = new Set<string>();
  for (const product of products) {
    for (const source of [product.name, product.sub, product.cat, product.material, product.collectionName || "", ...(product.sports || [])]) {
      for (const word of normalizeSearchText(source).split(" ")) if (word.length > 2) vocabulary.add(word);
    }
    vocabulary.add(normalizeSearchText(product.name));
  }
  let best: { term: string; score: number } | null = null;
  for (const term of vocabulary) {
    const score = wordSimilarity(term, normalized);
    if (score >= 0.6 && score < 1 && (!best || score > best.score)) best = { term, score };
  }
  return best?.term || null;
}

function wordSimilarity(left: string, right: string) {
  if (left === right) return 1;
  if (!left || !right) return 0;
  const previous = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let row = 1; row <= left.length; row += 1) {
    let diagonal = previous[0];
    previous[0] = row;
    for (let column = 1; column <= right.length; column += 1) {
      const above = previous[column];
      previous[column] = Math.min(
        previous[column] + 1,
        previous[column - 1] + 1,
        diagonal + (left[row - 1] === right[column - 1] ? 0 : 1),
      );
      diagonal = above;
    }
  }
  return 1 - previous[right.length] / Math.max(left.length, right.length);
}
