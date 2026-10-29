"use client";

import { productPath } from "../../lib/product-url";
import { useEffect, useMemo, useRef, useState } from "react";
import { CartDrawer } from "../cart";
import { Footer } from "../home";
import { Header } from "../layout";
import { ProductCatalog } from "../product";
import { ProductModal } from "../product";
import { Product, User, apiFetch } from "../../lib/api";
import { trackEvent } from "../../lib/analytics";
import { CartItem, readCart, writeCart } from "../../lib/cart";
import { sortProductSizes } from "../../lib/product-sizes";
import { productHasPromotion, productPrice } from "../../lib/pricing";
import { readDemoProducts } from "../../lib/demo-store";
import { categoryMatches } from "../../lib/product-filters";
import { collectionSlug as slugForCollection } from "../../lib/collections";
import { matchingProducts, searchProducts } from "../../lib/product-search";
import { addSearchToHistory } from "../../lib/search-history";
import { suggestCorrection } from "../../lib/search-suggestions";
import { SUMMER } from "../../lib/season";
import { useSummerTheme } from "../../lib/use-summer-theme";
import { BenefitsStrip, SummerBubbles, Wave } from "../season";

type ShowcasePageProps = {
  category?: string;
  collectionName?: string;
  collectionSlug?: string;
  eyebrow: string;
  title: string;
  description: string;
  showAll?: boolean;
  /** Abre já filtrado pelas peças em promoção (página /promocoes). */
  promoOnly?: boolean;
};

type Filters = {
  cat: string;
  size: string;
  sport: string;
  sort: string;
  promo: boolean;
};

const initialFilters: Filters = { cat: "all", size: "", sport: "", sort: "rel", promo: false };

export function ShowcasePage({
  category,
  collectionName,
  collectionSlug,
  eyebrow,
  title,
  description,
  showAll = false,
  promoOnly = false,
}: ShowcasePageProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [cartHydrated, setCartHydrated] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedSize, setSelectedSize] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [toast, setToast] = useState("");
  const [demoMode, setDemoMode] = useState(false);
  const [filters, setFilters] = useState<Filters>({ ...initialFilters, promo: promoOnly });
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestionOffset, setSuggestionOffset] = useState(0);
  const [subFilter, setSubFilter] = useState("");
  const summer = useSummerTheme();
  const summerCollection =
    summer && !!collectionSlug && collectionSlug === SUMMER.collectionSlug;
  const toastTimer = useRef<number | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const demo = params.get("demo") === "1";
    const initialQuery = params.get("busca") || "";
    setSearchQuery(initialQuery);
    // O link "Promoção" do menu e do hero chegam com ?promo=1 para abrir já filtrado.
    if (params.get("promo") === "1") setFilters((current) => ({ ...current, promo: true }));
    if (initialQuery.trim()) addSearchToHistory(initialQuery);
    setDemoMode(demo);
    void load(demo);
    setCart(readCart());
    setCartHydrated(true);
    if (!demo) apiFetch<User | null>("/auth/session").then(setUser).catch(() => null);
    return () => {
      if (toastTimer.current) window.clearTimeout(toastTimer.current);
    };
  }, []);

  useEffect(() => {
    if (cartHydrated) writeCart(cart);
  }, [cart, cartHydrated]);

  async function load(useDemo = demoMode) {
    setLoading(true);
    setError("");
    if (useDemo) {
      setProducts(readDemoProducts());
      setLoading(false);
      return;
    }
    try {
      const productList = await apiFetch<Product[]>("/products");
      setProducts(productList);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Não foi possível carregar esta página.");
    } finally {
      setLoading(false);
    }
  }

  const scopedProducts = useMemo(() => {
    const active = products.filter((product) => product.active !== false);
    if (showAll) return active;
    if (category) return active.filter((product) => categoryMatches(product.cat, category));
    if (collectionSlug || collectionName) {
      const wanted = collectionSlug || slugForCollection(collectionName || "");
      return active.filter((product) => slugForCollection(product.collectionName || "") === wanted);
    }
    return active;
  }, [category, collectionName, collectionSlug, products, showAll]);

  const sports = useMemo(
    () => [...new Set(scopedProducts.flatMap((product) => product.sports || []))].sort(),
    [scopedProducts],
  );

  const promoCount = useMemo(
    () => scopedProducts.filter(productHasPromotion).length,
    [scopedProducts],
  );

  const searchMatches = useMemo(
    () => matchingProducts(scopedProducts, searchQuery),
    [scopedProducts, searchQuery],
  );

  const searchSuggestions = useMemo(() => {
    if (!searchQuery.trim() || searchMatches.length) return [];
    const ranked = searchProducts(scopedProducts, searchQuery).map(({ product }) => product);
    const fallback = [...scopedProducts].sort((left, right) => right.rating - left.rating || right.reviews - left.reviews);
    const candidates = [...ranked, ...fallback].filter((product, index, list) => list.findIndex((item) => item.id === product.id) === index);
    if (!candidates.length) return [];
    const start = suggestionOffset % candidates.length;
    return Array.from({ length: Math.min(4, candidates.length) }, (_, index) => candidates[(start + index) % candidates.length]);
  }, [scopedProducts, searchMatches.length, searchQuery, suggestionOffset]);

  useEffect(() => {
    if (!searchQuery.trim() || searchMatches.length || searchSuggestions.length < 2) return;
    const timer = window.setInterval(() => setSuggestionOffset((current) => current + 1), 5000);
    return () => window.clearInterval(timer);
  }, [searchMatches.length, searchQuery, searchSuggestions.length]);

  const didYouMean = useMemo(
    () => (searchQuery.trim() && !searchMatches.length ? suggestCorrection(searchQuery, scopedProducts) : null),
    [scopedProducts, searchMatches.length, searchQuery],
  );

  const visibleProducts = useMemo(() => {
    let list = searchQuery.trim() ? searchMatches.map(({ product }) => product) : scopedProducts;
    if (showAll && filters.cat !== "all")
      list = list.filter((product) => categoryMatches(product.cat, filters.cat));
    if (filters.promo) list = list.filter(productHasPromotion);
    if (filters.size)
      list = list.filter((product) => sortProductSizes(product.sizes).includes(filters.size));
    if (filters.sport)
      list = list.filter((product) => product.sports?.includes(filters.sport));
    if (filters.sort === "price-asc") list = [...list].sort((a, b) => productPrice(a) - productPrice(b));
    if (filters.sort === "price-desc") list = [...list].sort((a, b) => productPrice(b) - productPrice(a));
    if (filters.sort === "stock-asc") list = [...list].sort((a, b) => a.stock - b.stock);
    if (filters.sort === "stock-desc") list = [...list].sort((a, b) => b.stock - a.stock);
    if (summerCollection && subFilter) list = list.filter((product) => product.sub === subFilter);
    return list;
  }, [filters, scopedProducts, searchMatches, searchQuery, showAll, summerCollection, subFilter]);

  // Pílulas da coleção de verão: um tipo de peça por pílula (campo "sub").
  const subOptions = useMemo(
    () => Array.from(new Set(scopedProducts.map((product) => product.sub).filter(Boolean))),
    [scopedProducts],
  );

  function openProduct(product: Product) {
    trackEvent("click", product.id);
    window.location.assign(`${productPath(product)}${demoMode ? "?demo=1" : ""}`);
  }

  function addToCart(product: Product, size: string, color: string, bundle?: string | null) {
    setCart((current) => {
      const found = current.find((item) => item.pid === product.id && item.size === size && item.color === color && item.bundle === bundle);
      if (found) return current.map((item) => item === found ? { ...item, qty: Math.min(10, item.qty + 1) } : item);
      return [...current, { pid: product.id, size, color, qty: 1, bundle }];
    });
    trackEvent("add", product.id);
    setSelectedProduct(null);
    setCartOpen(true);
    setToast("Peça adicionada à sacola.");
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(""), 3000);
  }

  function changeQty(pid: number, size: string, color: string | undefined, bundle: string | null | undefined, delta: number) {
    setCart((current) => current
      .map((item) => item.pid === pid && item.size === size && item.color === color && item.bundle === bundle ? { ...item, qty: Math.min(10, item.qty + delta) } : item)
      .filter((item) => item.qty > 0));
  }

  return (
    <main>
      <Header
        cartCount={cart.reduce((sum, item) => sum + item.qty, 0)}
        onCart={() => setCartOpen(true)}
        onAccount={() => window.location.assign(user ? "/conta" : "/login")}
      />
      {summer ? (
        <section className="relative overflow-hidden bg-bubble-sun text-bubble-ink">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(rgba(21,19,15,.09)_1.5px,transparent_1.7px)] bg-[length:26px_26px]" aria-hidden="true" />
          <SummerBubbles />
          <span className="pointer-events-none absolute -top-16 right-[6%] size-[210px] rounded-full border-[16px] border-bubble-brown/40 max-[620px]:size-[130px] max-[620px]:border-[11px]" aria-hidden="true" />
          <div className="relative mx-auto max-w-[1200px] px-8 pb-10 pt-12 max-[520px]:px-4 sm:pb-12 sm:pt-14">
            <nav aria-label="Você está em" className="font-sans text-[.62rem] font-semibold uppercase tracking-[.16em]">
              <a href={`/${demoMode ? "?demo=1" : ""}`} className="hover:underline">Início</a>
              {(summerCollection ? ["Verão", `Coleção ${SUMMER.collectionName}`] : eyebrow.split(" · ")).map((part) => (
                <span key={part}> / {part}</span>
              ))}
            </nav>
            <h1 className="mt-4 max-w-[850px] text-[clamp(2.6rem,6.5vw,5rem)] leading-[.95]">
              {summerCollection ? `Coleção ${SUMMER.collectionName}` : title}
            </h1>
            <p className="m-0 mt-3 max-w-[600px] font-serif text-[1.05rem] italic leading-relaxed">
              {summerCollection ? SUMMER.tagline : description}
            </p>
          </div>
          <Wave className="relative -mb-px text-bubble-cream" flip />
        </section>
      ) : (
        <section className="border-b border-bubble-ink bg-bubble-ink px-6 py-20 text-bubble-cream sm:py-24">
          <div className="mx-auto max-w-[1200px]">
            <span className="font-sans text-[.68rem] font-semibold uppercase tracking-[.28em] text-bubble-candy">{eyebrow}</span>
            <h1 className="mt-5 max-w-[850px] text-[clamp(2.8rem,7vw,6rem)] leading-[.95]">{title}</h1>
            <p className="mt-6 max-w-[600px] text-[1rem] italic leading-relaxed text-bubble-cream/70">{description}</p>
          </div>
        </section>
      )}
      {demoMode ? <div className="border-b border-bubble-ink bg-bubble-candy px-4 py-3 text-center font-sans text-[.66rem] font-semibold uppercase tracking-[.1em]">Modo demonstração · dados locais</div> : null}
      <ProductCatalog
        filters={filters}
        sports={sports}
        products={visibleProducts}
        loading={loading}
        error={error}
        onFilter={(patch) => setFilters((current) => ({ ...current, ...patch }))}
        onClear={() => setFilters(initialFilters)}
        productHref={(product) => `${productPath(product)}${demoMode ? "?demo=1" : ""}`}
        onRetry={() => void load(demoMode)}
        showFilters={!summerCollection}
        hideHeader={summerCollection}
        wide={summerCollection}
        toolbar={summerCollection ? (
          <div className="mb-7 flex flex-wrap items-center gap-2">
            {[{ value: "", label: "Todas" }, ...subOptions.map((sub) => ({ value: sub, label: pluralLabel(sub) }))].map((option) => (
              <button
                key={option.value || "all"}
                type="button"
                aria-pressed={subFilter === option.value}
                onClick={() => setSubFilter(option.value)}
                className={`${subFilter === option.value ? "bg-bubble-ink text-bubble-cream" : "bg-transparent text-bubble-ink hover:bg-bubble-ink/5"} min-h-10 cursor-pointer rounded-full border border-bubble-ink px-4 font-sans text-[.64rem] font-semibold uppercase tracking-[.12em]`}
              >
                {option.label}
              </button>
            ))}
            <span className="ml-auto font-serif text-[.8rem] italic text-bubble-ink/60">
              {visibleProducts.length} peça{visibleProducts.length !== 1 ? "s" : ""}
            </span>
          </div>
        ) : undefined}
        showCategoryFilter={showAll}
        promoCount={promoCount}
        emptyTitle={searchQuery.trim() ? "Não encontramos sua busca" : filters.promo ? "Nenhuma peça em promoção neste momento" : undefined}
        emptyDescription={searchQuery.trim() ? (
          <>
            {didYouMean ? (
              <>
                Você quis dizer{" "}
                <a href={`/produtos?busca=${encodeURIComponent(didYouMean)}${demoMode ? "&demo=1" : ""}`} className="font-semibold text-bubble-brown underline underline-offset-4">
                  {didYouMean}
                </a>
                ?{" "}
              </>
            ) : null}
            Tente outro termo ou confira as sugestões abaixo — são as peças mais próximas do que você procurou.
          </>
        ) : filters.promo ? (
          <>
            O desconto progressivo continua valendo na sacola.{" "}
            <button
              type="button"
              className="font-semibold text-bubble-brown underline underline-offset-4"
              onClick={() => setFilters((current) => ({ ...current, promo: false }))}
            >
              Ver todas as peças
            </button>
          </>
        ) : undefined}
        suggestionProducts={searchSuggestions}
        suggestionTitle={searchQuery.trim() ? "Sugestões relevantes para você" : undefined}
        eyebrow={collectionName ? `Coleção ${collectionName}` : showAll ? "Wear Bubble · Todas as linhas" : "Seleção por categoria"}
        title={showAll ? "Todas as peças" : collectionName ? `Todas as peças ${collectionName}` : "Todas as peças"}
        description={showAll ? "Explore toda a coleção e encontre as peças que combinam com o seu movimento." : collectionName ? `Todas as peças cadastradas na coleção ${collectionName}.` : "Todas as peças publicadas nesta categoria."}
      />
      {summer ? <BenefitsStrip className="border-t" /> : null}
      <Footer />
      <CartDrawer open={cartOpen} cart={cart} products={products} onQty={changeQty} onClose={() => setCartOpen(false)} />
      <ProductModal product={selectedProduct} selectedSize={selectedSize} onSize={setSelectedSize} onClose={() => setSelectedProduct(null)} onAdd={addToCart} />
      <div className={`fixed bottom-7 left-1/2 z-[900] -translate-x-1/2 bg-bubble-ink px-6 py-3 text-sm text-bubble-cream shadow-bubble transition-all ${toast ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-8 opacity-0"}`}>{toast}</div>
    </main>
  );
}

/** "Short" → "Shorts", "Calça" → "Calças", "Macacão" → "Macacões". */
function pluralLabel(value: string) {
  if (/s$/i.test(value)) return value;
  if (/ão$/i.test(value)) return value.replace(/ão$/i, "ões");
  return `${value}s`;
}
