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
import { Product, User, apiFetch } from "../lib/api";
import { readCart, writeCart, type CartItem } from "../lib/cart";

type Filters = {
  cat: string;
  size: string;
  material: string;
  sport: string;
  stock: string;
  sort: string;
};

const initialFilters: Filters = {
  cat: "all",
  size: "",
  material: "",
  sport: "",
  stock: "",
  sort: "rel",
};

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState("");
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartHydrated, setCartHydrated] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedSize, setSelectedSize] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [toast, setToast] = useState("");
  const toastTimer = useRef<number | null>(null);
  const [combo, setCombo] = useState({
    bottomId: null as number | null,
    topId: null as number | null,
    bottomSize: "",
    topSize: "",
  });

  useEffect(() => {
    void refreshProducts();
    const wantsAccount =
      new URLSearchParams(window.location.search).get("conta") === "1";
    apiFetch<User | null>("/auth/session")
      .then((currentUser) => {
        if (!currentUser) {
          if (wantsAccount) window.location.assign("/login");
          return;
        }
        setUser(currentUser);
        if (wantsAccount) window.location.assign("/conta");
        if (
          currentUser.role === "manager" &&
          new URLSearchParams(window.location.search).get("admin") === "1"
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

  async function refreshProducts() {
    setProductsLoading(true);
    setProductsError("");
    try {
      setProducts(await apiFetch<Product[]>("/products"));
    } catch (error) {
      setProductsError(
        error instanceof Error
          ? error.message
          : "Nao foi possivel carregar a colecao.",
      );
    } finally {
      setProductsLoading(false);
    }
  }

  const materials = useMemo(
    () => [
      ...new Set(products.map((product) => product.material).filter(Boolean)),
    ],
    [products],
  );
  const sports = useMemo(
    () =>
      [...new Set(products.flatMap((product) => product.sports || []))].sort(),
    [products],
  );

  const visibleProducts = useMemo(() => {
    let list = products.filter((product) => product.active !== false);
    if (filters.cat !== "all")
      list = list.filter((product) => product.cat === filters.cat);
    if (filters.size)
      list = list.filter((product) => product.sizes.includes(filters.size));
    if (filters.material)
      list = list.filter((product) => product.material === filters.material);
    if (filters.sport)
      list = list.filter((product) => product.sports?.includes(filters.sport));
    if (filters.stock === "in")
      list = list.filter((product) => product.stock > 0);
    if (filters.stock === "low")
      list = list.filter((product) => product.stock > 0 && product.stock <= 5);
    if (filters.sort === "asc")
      list = [...list].sort((a, b) => a.price - b.price);
    if (filters.sort === "desc")
      list = [...list].sort((a, b) => b.price - a.price);
    if (filters.sort === "rating")
      list = [...list].sort((a, b) => b.rating - a.rating);
    return list;
  }, [filters, products]);

  function openProduct(product: Product) {
    setSelectedProduct(product);
    setSelectedSize(product.sizes[0] || "");
  }

  function addToCart(product: Product, size: string, bundle?: string | null) {
    setCart((current) => {
      const found = current.find(
        (item) =>
          item.pid === product.id &&
          item.size === size &&
          item.bundle === bundle,
      );
      if (found)
        return current.map((item) =>
          item === found ? { ...item, qty: Math.min(10, item.qty + 1) } : item,
        );
      return [...current, { pid: product.id, size, qty: 1, bundle }];
    });
    setSelectedProduct(null);
    setCartOpen(true);
    showToast(`Adicionado a sacola · Tam. ${size}`);
  }

  function changeQty(
    pid: number,
    size: string,
    bundle: string | null | undefined,
    delta: number,
  ) {
    setCart((current) =>
      current
        .map((item) =>
          item.pid === pid && item.size === size && item.bundle === bundle
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
    const additions: CartItem[] = [
      {
        pid: bottom.id,
        size: combo.bottomSize || bottom.sizes[0],
        qty: 1,
        bundle,
      },
      { pid: top.id, size: combo.topSize || top.sizes[0], qty: 1, bundle },
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
      <Hero />
      <ProductCatalog
        filters={filters}
        materials={materials}
        sports={sports}
        products={visibleProducts}
        loading={productsLoading}
        error={productsError}
        onFilter={(patch) =>
          setFilters((current) => ({ ...current, ...patch }))
        }
        onClear={() => setFilters(initialFilters)}
        onOpen={openProduct}
        onRetry={refreshProducts}
      />
      <ComboBuilder
        products={products}
        bottomId={combo.bottomId}
        topId={combo.topId}
        bottomSize={combo.bottomSize}
        topSize={combo.topSize}
        onSelectBottom={(product) =>
          setCombo((current) => ({
            ...current,
            bottomId: product.id,
            bottomSize: current.bottomSize || product.sizes[0],
          }))
        }
        onSelectTop={(product) =>
          setCombo((current) => ({
            ...current,
            topId: product.id,
            topSize: current.topSize || product.sizes[0],
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
