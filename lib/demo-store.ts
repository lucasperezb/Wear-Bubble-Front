import type { Product, ShowcaseKey, ShowcaseMap } from "./api";

const STORAGE_KEY = "bubble-demo-showcases-v1";
const PRODUCTS_KEY = "bubble-demo-products-v1";

const color = (n: string, h: string) => ({
  n,
  h,
  sizes: ["P", "M", "G"].map((size) => ({ size, q: 8 })),
});

export const DEMO_PRODUCTS: Product[] = [
  demoProduct(1, "Legging Compressão Core", "Shorts/Calça", "Legging", 249.9, "legging", "Suplex Power", "Core", [color("Café", "#4A3428"), color("Preto", "#17130E")]),
  demoProduct(2, "Top Cropped Estrutura", "Blusas/Top", "Top", 159.9, "top", "Poliamida Dry", "Mais vendido", [color("Areia", "#C8B99E"), color("Preto", "#17130E")]),
  demoProduct(3, "Short Biker Movimento", "Shorts/Calça", "Short", 169.9, "shorts", "Suplex Power", "Core", [color("Oliva", "#73705F"), color("Preto", "#17130E")]),
  demoProduct(4, "Top Alta Sustentação", "Blusas/Top", "Top", 189.9, "top", "Poliamida Dry", "Alta performance", [color("Terra", "#8A5D46"), color("Preto", "#17130E")]),
  demoProduct(5, "Calça Wide Leg Off-Duty", "Shorts/Calça", "Calça", 279.9, "wideleg", "Moletom Premium", "Athleisure", [color("Aveia", "#D9CFB4"), color("Preto", "#17130E")]),
  demoProduct(6, "Regata Essential", "Blusas/Top", "Regata", 119.9, "regata", "Algodão Premium", "Core", [color("Creme", "#F3EDDD"), color("Café", "#4A3428")]),
  demoProduct(7, "Jaqueta Corta-Vento", "Blusas/Top", "Jaqueta", 399.9, "jacket", "Nylon Ripstop", "Edição limitada", [color("Preto", "#17130E"), color("Oliva", "#73705F")]),
  demoProduct(8, "Short Duplo Performance", "Shorts/Calça", "Short", 199.9, "shorts", "Poliamida Dry", "Novo", [color("Cacau", "#5D4033"), color("Preto", "#17130E")]),
  demoProduct(9, "Conjunto Core Flow", "Conjunto", "Conjunto", 349.9, "wideleg", "Poliamida Dry", "Core", [color("Oliva", "#73705F"), color("Preto", "#17130E")]),
  demoProduct(10, "Conjunto Essential Duo", "Conjunto", "Conjunto", 329.9, "wideleg", "Suplex Power", "Novo", [color("Cacau", "#5D4033"), color("Areia", "#C8B99E")]),
];

const defaultIds: Record<ShowcaseKey, number[]> = {
  hero: [1],
  home: [1, 2, 3, 4],
  core: [1, 2, 5, 6],
  tops: [2, 4, 6, 7],
  bottoms: [1, 3, 5, 8],
  sets: [9, 10, 1, 2],
};

export function readDemoProducts(): Product[] {
  if (typeof window === "undefined") return DEMO_PRODUCTS;
  try {
    const saved = JSON.parse(window.localStorage.getItem(PRODUCTS_KEY) || "null") as unknown;
    return Array.isArray(saved) && saved.length ? (saved as Product[]) : DEMO_PRODUCTS;
  } catch {
    return DEMO_PRODUCTS;
  }
}

export function saveDemoProduct(payload: Partial<Product>, productId?: number) {
  const products = readDemoProducts();
  const existing = productId ? products.find((product) => product.id === productId) : undefined;
  const id = existing?.id || Math.max(0, ...products.map((product) => product.id)) + 1;
  const next: Product = {
    ...(existing || demoProduct(id, "Nova peça", "Blusas/Top", "Top", 0, "top", "", "", [color("Preto", "#17130E")])),
    ...payload,
    id,
    collectionName: String(payload.collectionName || existing?.collectionName || "").trim(),
  };
  const updated = existing
    ? products.map((product) => product.id === id ? next : product)
    : [...products, next];
  window.localStorage.setItem(PRODUCTS_KEY, JSON.stringify(updated));
  window.dispatchEvent(new Event("bubble-demo-products-changed"));
  return next;
}

export function deleteDemoProduct(productId: number) {
  window.localStorage.setItem(PRODUCTS_KEY, JSON.stringify(readDemoProducts().filter((product) => product.id !== productId)));
  window.dispatchEvent(new Event("bubble-demo-products-changed"));
}

export function readDemoShowcases(): ShowcaseMap {
  const products = readDemoProducts();
  let saved: Partial<Record<ShowcaseKey, number[]>> = {};
  if (typeof window !== "undefined") {
    try {
      saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "{}") as Partial<Record<ShowcaseKey, number[]>>;
    } catch {
      saved = {};
    }
  }
  return Object.fromEntries(
    (Object.keys(defaultIds) as ShowcaseKey[]).map((key) => [
      key,
      (saved[key]?.length === defaultIds[key].length ? saved[key]! : defaultIds[key])
        .map((id) => products.find((product) => product.id === id))
        .filter((product): product is Product => Boolean(product)),
    ]),
  ) as ShowcaseMap;
}

export function writeDemoShowcase(pageKey: ShowcaseKey, productIds: number[]) {
  const current = Object.fromEntries(
    (Object.keys(defaultIds) as ShowcaseKey[]).map((key) => [
      key,
      readDemoShowcases()[key].map((product) => product.id),
    ]),
  ) as Record<ShowcaseKey, number[]>;
  current[pageKey] = productIds;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
  return readDemoShowcases();
}

function demoProduct(
  id: number,
  name: string,
  cat: string,
  sub: string,
  price: number,
  icon: string,
  material: string,
  tag: string,
  colors: Product["colors"],
): Product {
  return {
    id,
    name,
    cat,
    sub,
    price,
    promoPct: 0,
    tag,
    catalogPosition: id,
    collectionName: "Core",
    icon,
    rating: 4.8,
    reviews: 48 + id * 7,
    stock: 24,
    active: true,
    sizes: ["P", "M", "G"],
    material,
    pair: 0,
    bundlePosition: 0,
    sports: ["Musculação", "Yoga/Pilates"],
    colors,
    desc: "Peça demonstrativa da Wear Bubble, criada para testar a organização das vitrines sem conexão com o servidor.",
    image: null,
    images: [],
  };
}
