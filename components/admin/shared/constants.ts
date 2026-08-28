import { clothingCategories } from "../../../lib/product-filters";
import { standardProductSizes } from "../../../lib/product-sizes";
import type { AdminTab, ProductDraft } from "./types";

export const adminTabs: Array<{ id: AdminTab; label: string }> = [
  { id: "dash", label: "Dashboard" },
  { id: "products", label: "Produtos" },
  { id: "ship", label: "Pedidos" },
  { id: "customers", label: "Clientes" },
  { id: "coupons", label: "Cupons" },
  { id: "promotions", label: "PROMOÇÕES" },
  { id: "showcases", label: "Vitrines do site" },
  { id: "hero", label: "Carrossel" },
  { id: "combos", label: "Conjuntos" },
];

export const productCategories = clothingCategories;
export const productIcons = [
  "legging",
  "top",
  "shorts",
  "wideleg",
  "regata",
  "jacket",
  "sock",
];
export const defaultSports = [
  "Musculação",
  "Yoga/Pilates",
  "Funcional/HIIT",
  "Corrida",
  "Ciclismo",
  "Crossfit",
  "Casual/Dia a dia",
];
export const shippingStages = [
  "Confirmado",
  "Pagamento",
  "Separação",
  "Enviado",
  "Em trânsito",
  "Entregue",
];

export const createEmptyProductDraft = (): ProductDraft => ({
  id: 0,
  name: "",
  cat: "Blusas/Top",
  sub: "",
  price: 0,
  promoPct: 0,
  tag: "",
  collectionName: "",
  icon: "top",
  rating: 5,
  reviews: 0,
  stock: 0,
  active: true,
  sizes: standardProductSizes,
  material: "",
  weight: 0.3,
  width: 20,
  height: 4,
  length: 25,
  pair: 0,
  bundlePosition: 0,
  catalogPosition: 0,
  sports: [],
  colors: [{ n: "Preto", h: "#2B1420" }],
  desc: "",
  image: null,
  images: [],
});
