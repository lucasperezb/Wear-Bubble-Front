"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AdminPanel } from "../components/admin/AdminPanel";
import { CartDrawer } from "../components/cart/CartDrawer";
import { ComboBuilder } from "../components/home/ComboBuilder";
import { Hero } from "../components/home/Hero";
import {
  BrandSections,
  ContactSection,
  Footer,
} from "../components/home/StaticSections";
import { Header } from "../components/layout/Header";
import { ProductCatalog } from "../components/product/ProductCatalog";
import { ProductModal } from "../components/product/ProductModal";
import { Product, ShowcaseMap, User, apiFetch } from "../lib/api";
import { readCart, writeCart, type CartItem } from "../lib/cart";
import { categoryMatches } from "../lib/product-filters";
import { availableVariantSizes, sortProductSizes } from "../lib/product-sizes";
import { productPrice } from "../lib/pricing";
import { readDemoProducts, readDemoShowcases } from "../lib/demo-store";

type Filters = {
  cat: string;
  size: string;
  sport: string;
  sort: string;
};

const initialFilters: Filters = {
  cat: "all",
  size: "",
  sport: "",
  sort: "rel",
};

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState("");
  const [showcases, setShowcases] = useState<ShowcaseMap | null>(null);
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartHydrated, setCartHydrated] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const [demoMode, setDemoMode] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedSize, setSelectedSize] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [toast, setToast] = useState("");
  const toastTimer = useRef<number | null>(null);
  const [combo, setCombo] = useState({
    bottomId: null as number | null,
    topId: null as number | null,
    bottomColor: "",
    topColor: "",
    bottomSize: "",
    topSize: "",
  });

  useEffect(() => {
    const search = new URLSearchParams(window.location.search);
    const demo = search.get("admin") === "demo" || search.get("demo") === "1";
    const wantsAccount = search.get("conta") === "1";
    setDemoMode(demo);
    if (demo) {
      setProducts(readDemoProducts());
      setShowcases(readDemoShowcases());
      setProductsLoading(false);
      setUser({ uid: "demo-manager", email: "gerente@demo.local", role: "manager", name: "Gerente Demo", emailVerified: true });
      setAdminOpen(search.get("admin") === "demo");
    } else {
      void refreshProducts();
    }
    if (!demo) apiFetch<User | null>("/auth/session")
      .then((currentUser) => {
        if (!currentUser) {
          if (wantsAccount) window.location.assign("/login");
          return;
        }
        setUser(currentUser);
        if (wantsAccount) window.location.assign("/conta");
        if (
          currentUser.role === "manager" &&
          search.get("admin") === "1"
        )
          setAdminOpen(true);
      })
      .catch(() => {
        if (wantsAccount) window.location.assign("/login");
      });
    setCart(readCart());
    setCartHydrated(true);
    return () => {
      if (toastTimer.current) window.clearTimeout(toastTimer.current);
    };
  }, []);

  useEffect(() => {
    if (cartHydrated) writeCart(cart);
  }, [cart, cartHydrated]);

  function showToast(message: string) {
    setToast(message);
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(""), 3000);
  }

  async function refreshProducts(useDemo = demoMode) {
    setProductsLoading(true);
    setProductsError("");
    if (useDemo) {
      setProducts(readDemoProducts());
      setShowcases(readDemoShowcases());
      setProductsLoading(false);
      return;
    }
    try {
      const response = await apiFetch<unknown>("/products");
      if (!Array.isArray(response)) {
        throw new Error("A API retornou uma lista de produtos inválida.");
      }
      setProducts(response as Product[]);
      try {
        setShowcases(await apiFetch<ShowcaseMap>("/products/showcases"));
      } catch {
        setShowcases(null);
      }
    } catch (error) {
      setProductsError(
        error instanceof Error
          ? error.message
          : "Não foi possível carregar a coleção.",
      );
    } finally {
      setProductsLoading(false);
    }
  }

  const sports = useMemo(
    () =>
      [
        ...new Set(
          (Array.isArray(products) ? products : []).flatMap(
            (product) => product.sports || [],
          ),
        ),
      ].sort(),
    [products],
  );

  const visibleProducts = useMemo(() => {
    let list = (Array.isArray(products) ? products : []).filter(
      (product) => product.active !== false,
    );
    if (filters.cat !== "all")
      list = list.filter((product) => categoryMatches(product.cat, filters.cat));
    if (filters.size)
      list = list.filter((product) =>
        sortProductSizes(product.sizes).includes(filters.size),
      );
    if (filters.sport)
      list = list.filter((product) => product.sports?.includes(filters.sport));
    if (filters.sort === "price-asc" || filters.sort === "asc")
      list = [...list].sort((a, b) => productPrice(a) - productPrice(b));
    if (filters.sort === "price-desc" || filters.sort === "desc")
      list = [...list].sort((a, b) => productPrice(b) - productPrice(a));
    if (filters.sort === "stock-asc")
      list = [...list].sort((a, b) => a.stock - b.stock);
    if (filters.sort === "stock-desc")
      list = [...list].sort((a, b) => b.stock - a.stock);
    return list;
  }, [filters, products]);

  const homeProducts = useMemo(() => {
    const selected = (showcases?.home || [])
      .map((showcaseProduct) =>
        products.find((product) => product.id === showcaseProduct.id),
      )
      .filter((product): product is Product => Boolean(product));
    return (selected.length ? selected : visibleProducts).slice(0, 4);
  }, [products, showcases, visibleProducts]);

  const heroProduct = useMemo(() => {
    const selectedId = showcases?.hero?.[0]?.id;
    return (
      products.find((product) => product.id === selectedId) ||
      homeProducts[0]
    );
  }, [homeProducts, products, showcases]);

  function openProduct(product: Product) {
    window.location.assign(`/produto/${product.id}${demoMode ? "?demo=1" : ""}`);
  }

  function addToCart(
    product: Product,
    size: string,
    color: string,
    bundle?: string | null,
  ) {
    setCart((current) => {
      const found = current.find(
        (item) =>
          item.pid === product.id &&
          item.size === size &&
          item.color === color &&
          item.bundle === bundle,
      );
      if (found)
        return current.map((item) =>
          item === found ? { ...item, qty: Math.min(10, item.qty + 1) } : item,
        );
      return [...current, { pid: product.id, size, color, qty: 1, bundle }];
    });
    setSelectedProduct(null);
    setCartOpen(true);
    showToast(
      `Adicionado à sacola · ${color ? `Cor ${color} · ` : ""}Tam. ${size}`,
    );
  }

  function changeQty(
    pid: number,
    size: string,
    color: string | undefined,
    bundle: string | null | undefined,
    delta: number,
  ) {
    setCart((current) =>
      current
        .map((item) =>
          item.pid === pid &&
          item.size === size &&
          item.color === color &&
          item.bundle === bundle
            ? { ...item, qty: Math.min(10, item.qty + delta) }
            : item,
        )
        .filter((item) => item.qty > 0),
    );
  }

  function addCombo() {
    const bottom = products.find((product) => product.id === combo.bottomId);
    const top = products.find((product) => product.id === combo.topId);
    if (!bottom || !top)
      return showToast("Escolha uma parte de baixo e um top.");
    const bundle = crypto.randomUUID().slice(0, 8);
    const bottomVariant = firstAvailableVariant(
      bottom,
      combo.bottomSize,
      combo.bottomColor,
    );
    const topVariant = firstAvailableVariant(
      top,
      combo.topSize,
      combo.topColor,
    );
    if (!bottomVariant || !topVariant)
      return showToast("Uma das peças do conjunto está sem estoque.");
    const additions: CartItem[] = [
      {
        pid: bottom.id,
        size: bottomVariant.size,
        color: bottomVariant.color,
        qty: 1,
        bundle,
      },
      {
        pid: top.id,
        size: topVariant.size,
        color: topVariant.color,
        qty: 1,
        bundle,
      },
    ];
    setCart((current) => [...current, ...additions]);
    setCartOpen(true);
    showToast("Conjunto na sacola com 5% OFF!");
  }

  return (
    <main>
      <Header
        cartCount={cart.reduce((sum, item) => sum + item.qty, 0)}
        onCart={() => setCartOpen(true)}
        onAccount={() => {
          window.location.assign(user ? "/conta" : "/login");
        }}
      />
      <Hero
        product={heroProduct}
        productHref={heroProduct ? `/produto/${heroProduct.id}${demoMode ? "?demo=1" : ""}` : undefined}
      />
      {demoMode ? (
        <div className="flex flex-wrap items-center justify-center gap-3 border-b border-bubble-ink bg-bubble-candy px-4 py-3 text-center font-sans text-[.68rem] font-semibold uppercase tracking-[.1em]">
          Modo demonstração · escolhas salvas neste navegador
          <button type="button" className="border border-bubble-ink bg-bubble-ink px-3 py-2 text-bubble-cream" onClick={() => setAdminOpen(true)}>
            Abrir painel
          </button>
        </div>
      ) : null}
      <ProductCatalog
        filters={filters}
        sports={sports}
        products={homeProducts}
        loading={productsLoading}
        error={productsError}
        onFilter={(patch) =>
          setFilters((current) => ({ ...current, ...patch }))
        }
        onClear={() => setFilters(initialFilters)}
        productHref={(product) => `/produto/${product.id}${demoMode ? "?demo=1" : ""}`}
        onRetry={refreshProducts}
        showFilters={false}
        eyebrow="Curadoria Bubble · 4 escolhas"
        title="Em destaque"
        description="Clique na peça para ver detalhes, tecido e sugestão de conjunto."
      />
      <ComboBuilder
        products={products}
        bottomId={combo.bottomId}
        topId={combo.topId}
        bottomColor={combo.bottomColor}
        topColor={combo.topColor}
        bottomSize={combo.bottomSize}
        topSize={combo.topSize}
        onSelectBottom={(product) => {
          const variant = firstAvailableVariant(product);
          setCombo((current) => {
            if (current.bottomId === product.id) {
              return {
                ...current,
                bottomId: null,
                bottomColor: "",
                bottomSize: "",
              };
            }
            return {
              ...current,
              bottomId: product.id,
              bottomColor: variant?.color || "",
              bottomSize: variant?.size || "",
            };
          });
        }}
        onSelectTop={(product) => {
          const variant = firstAvailableVariant(product);
          setCombo((current) => {
            if (current.topId === product.id) {
              return {
                ...current,
                topId: null,
                topColor: "",
                topSize: "",
              };
            }
            return {
              ...current,
              topId: product.id,
              topColor: variant?.color || "",
              topSize: variant?.size || "",
            };
          });
        }}
        onBottomColor={(color, size) =>
          setCombo((current) => ({
            ...current,
            bottomColor: color,
            bottomSize: size,
          }))
        }
        onTopColor={(color, size) =>
          setCombo((current) => ({
            ...current,
            topColor: color,
            topSize: size,
          }))
        }
        onBottomSize={(size) =>
          setCombo((current) => ({ ...current, bottomSize: size }))
        }
        onTopSize={(size) =>
          setCombo((current) => ({ ...current, topSize: size }))
        }
        onAdd={addCombo}
      />
      <ContactSection />
      <BrandSections />
      <Footer />
      <CartDrawer
        open={cartOpen}
        cart={cart}
        products={products}
        onQty={changeQty}
        onClose={() => setCartOpen(false)}
      />
      {user?.role === "manager" ? (
        <AdminPanel
          open={adminOpen}
          managerLabel={user.email}
          onClose={() => setAdminOpen(false)}
          onChanged={refreshProducts}
          notify={showToast}
          demoMode={demoMode}
        />
      ) : null}
      <ProductModal
        product={selectedProduct}
        selectedSize={selectedSize}
        onSize={setSelectedSize}
        onClose={() => setSelectedProduct(null)}
        onAdd={addToCart}
      />
      <div
        className={`fixed bottom-[26px] left-1/2 z-[900] flex max-w-[90vw] -translate-x-1/2 items-center gap-2.5 bg-bubble-ink px-6 py-3.5 text-[.82rem] text-bubble-cream shadow-bubble transition-all duration-300 ${toast ? "visible pointer-events-auto translate-y-0 opacity-100" : "invisible pointer-events-none translate-y-[160%] opacity-0"}`}
      >
        <span>{toast}</span>
      </div>
    </main>
  );
}

function firstAvailableVariant(
  product: Product,
  preferredSize = "",
  preferredColor = "",
) {
  const configuredColors = (product.colors || []).filter(
    (color) => (color.sizes || []).length,
  );
  const orderedColors = [
    ...configuredColors.filter((color) => color.n === preferredColor),
    ...configuredColors.filter((color) => color.n !== preferredColor),
  ];
  for (const color of orderedColors) {
    const sizes = availableVariantSizes(color.sizes || []);
    const available = sizes.includes(preferredSize) ? preferredSize : sizes[0];
    if (available) return { color: color.n, size: available };
  }
  if (product.stock <= 0) return null;
  return {
    color:
      product.colors?.find((color) => color.n === preferredColor)?.n ||
      product.colors?.[0]?.n ||
      "",
    size: preferredSize || sortProductSizes(product.sizes)[0] || "P",
  };
}
