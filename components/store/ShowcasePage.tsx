"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CartDrawer } from "../cart/CartDrawer";
import { Footer } from "../home/StaticSections";
import { Header } from "../layout/Header";
import { ProductCatalog } from "../product/ProductCatalog";
import { ProductModal } from "../product/ProductModal";
import { Product, User, apiFetch } from "../../lib/api";
import { CartItem, readCart, writeCart } from "../../lib/cart";
import { sortProductSizes } from "../../lib/product-sizes";
import { readDemoProducts } from "../../lib/demo-store";
import { categoryMatches } from "../../lib/product-filters";
import { collectionSlug as slugForCollection } from "../../lib/collections";

type ShowcasePageProps = {
  category?: string;
  collectionName?: string;
  collectionSlug?: string;
  eyebrow: string;
  title: string;
  description: string;
  showAll?: boolean;
};

const emptyFilters = { cat: "all", size: "", sport: "", sort: "rel" };

export function ShowcasePage({
  category,
  collectionName,
  collectionSlug,
  eyebrow,
  title,
  description,
  showAll = false,
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
  const toastTimer = useRef<number | null>(null);

  useEffect(() => {
    const demo = new URLSearchParams(window.location.search).get("demo") === "1";
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

  const visibleProducts = useMemo(() => {
    if (showAll) return products;
    if (category) return products.filter((product) => categoryMatches(product.cat, category));
    if (collectionSlug || collectionName) {
      const wanted = collectionSlug || slugForCollection(collectionName || "");
      return products.filter((product) => slugForCollection(product.collectionName || "") === wanted);
    }
    return products;
  }, [category, collectionName, collectionSlug, products, showAll]);

  function openProduct(product: Product) {
    window.location.assign(`/produto/${product.id}${demoMode ? "?demo=1" : ""}`);
  }

  function addToCart(product: Product, size: string, color: string, bundle?: string | null) {
    setCart((current) => {
      const found = current.find((item) => item.pid === product.id && item.size === size && item.color === color && item.bundle === bundle);
      if (found) return current.map((item) => item === found ? { ...item, qty: Math.min(10, item.qty + 1) } : item);
      return [...current, { pid: product.id, size, color, qty: 1, bundle }];
    });
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
      <section className="border-b border-bubble-ink bg-bubble-ink px-6 py-20 text-bubble-cream sm:py-24">
        <div className="mx-auto max-w-[1200px]">
          <span className="font-sans text-[.68rem] font-semibold uppercase tracking-[.28em] text-bubble-candy">{eyebrow}</span>
          <h1 className="mt-5 max-w-[850px] text-[clamp(2.8rem,7vw,6rem)] leading-[.95]">{title}</h1>
          <p className="mt-6 max-w-[600px] text-[1rem] italic leading-relaxed text-bubble-cream/70">{description}</p>
        </div>
      </section>
      {demoMode ? <div className="border-b border-bubble-ink bg-bubble-candy px-4 py-3 text-center font-sans text-[.66rem] font-semibold uppercase tracking-[.1em]">Modo demonstração · dados locais</div> : null}
      <ProductCatalog
        filters={emptyFilters}
        sports={[]}
        products={visibleProducts}
        loading={loading}
        error={error}
        onFilter={() => undefined}
        onClear={() => undefined}
        productHref={(product) => `/produto/${product.id}${demoMode ? "?demo=1" : ""}`}
        onRetry={() => void load(demoMode)}
        showFilters={false}
        eyebrow={collectionName ? `Coleção ${collectionName}` : showAll ? "Wear Bubble · Todas as linhas" : "Seleção por categoria"}
        title={showAll ? "Todas as peças" : collectionName ? `Todas as peças ${collectionName}` : "Todas as peças"}
        description={showAll ? "Explore toda a coleção e encontre as peças que combinam com o seu movimento." : collectionName ? `Todas as peças cadastradas na coleção ${collectionName}.` : "Todas as peças publicadas nesta categoria."}
      />
      <Footer />
      <CartDrawer open={cartOpen} cart={cart} products={products} onQty={changeQty} onClose={() => setCartOpen(false)} />
      <ProductModal product={selectedProduct} selectedSize={selectedSize} onSize={setSelectedSize} onClose={() => setSelectedProduct(null)} onAdd={addToCart} />
      <div className={`fixed bottom-7 left-1/2 z-[900] -translate-x-1/2 bg-bubble-ink px-6 py-3 text-sm text-bubble-cream shadow-bubble transition-all ${toast ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-8 opacity-0"}`}>{toast}</div>
    </main>
  );
}
