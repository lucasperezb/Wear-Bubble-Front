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
    bottomColor: "",
    topColor: "",
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
      const response = await apiFetch<unknown>("/products");
      if (!Array.isArray(response)) {
        throw new Error("A API retornou uma lista de produtos inválida.");
      }
      setProducts(response as Product[]);
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

  const materials = useMemo(
    () => [
      ...new Set(
        (Array.isArray(products) ? products : [])
          .map((product) => product.material)
          .filter(Boolean),
      ),
    ],
    [products],
  );
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
    const available =
      color.sizes?.find(
        (item) => item.size === preferredSize && Number(item.q) > 0,
      ) || color.sizes?.find((item) => Number(item.q) > 0);
    if (available) return { color: color.n, size: available.size };
  }
  if (product.stock <= 0) return null;
  return {
    color:
      product.colors?.find((color) => color.n === preferredColor)?.n ||
      product.colors?.[0]?.n ||
      "",
    size: preferredSize || product.sizes[0] || "U",
  };
}
