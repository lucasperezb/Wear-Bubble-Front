import type { Product } from "./api";

export function promotionPct(product: Product) {
  return Math.min(90, Math.max(0, Number(product.promoPct) || 0));
}

export function productPrice(product: Product) {
  const discount = promotionPct(product);
  const price = Number(product.price) || 0;
  return Math.round(price * (1 - discount / 100) * 100) / 100;
}

export function productHasPromotion(product: Product) {
  return promotionPct(product) > 0 && productPrice(product) < product.price;
}

export function pixPrice(product: Product) {
  return Math.round(productPrice(product) * 0.95 * 100) / 100;
}
