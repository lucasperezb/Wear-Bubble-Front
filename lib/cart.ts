import type { Product } from './api';
import { isBottomCategory, isTopCategory } from './product-filters';
import { productPrice } from './pricing';
import { FREE_SHIPPING_MINIMUM } from './store-config';

export type CartItem = {
  pid: number;
  size: string;
  color?: string;
  qty: number;
  bundle?: string | null;
};

export type PaymentMethod = "Pix" | "Cartão de crédito";
export type AppliedCoupon =
  | {
      code: string;
      type: "coupon";
      pct: number;
      minimumCharge: boolean;
      freeShipping: boolean;
    }
  | null;

export const CART_STORAGE_KEY = "bubble_cart";
export const MINIMUM_PIX_CHARGE = 0.5;
export const SPECIAL_COUPON_TOTAL = 5;

export function readCart(): CartItem[] {
  try {
    const parsed = JSON.parse(
      window.localStorage.getItem(CART_STORAGE_KEY) || "[]",
    );
    return Array.isArray(parsed) ? parsed.filter(isCartItem) : [];
  } catch {
    return [];
  }
}

export function writeCart(cart: CartItem[]) {
  window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
}

export function calculateCart(
  cart: CartItem[],
  products: Product[],
  coupon: AppliedCoupon = null,
  method: PaymentMethod = "Pix",
) {
  const lines = cart
    .map((item) => ({
      item,
      product: products.find((product) => product.id === item.pid),
    }))
    .filter((line): line is { item: CartItem; product: Product } =>
      Boolean(line.product),
    );

  const subtotal = lines.reduce(
    (sum, line) => sum + productPrice(line.product) * line.item.qty,
    0,
  );
  const bundles = new Map<string, typeof lines>();
  for (const line of lines) {
    if (!line.item.bundle) continue;
    const grouped = bundles.get(line.item.bundle) || [];
    grouped.push(line);
    bundles.set(line.item.bundle, grouped);
  }

  const bundleSubtotal = [...bundles.values()].reduce((sum, grouped) => {
    if (
      grouped.length !== 2 ||
      grouped[0].product.id === grouped[1].product.id
    ) {
      return sum;
    }
    const bottom = grouped.find((line) => isBottomCategory(line.product.cat));
    const top = grouped.find((line) => isTopCategory(line.product.cat));
    if (!bottom || !top) return sum;
    const matchedQuantity = Math.min(bottom.item.qty, top.item.qty);
    return (
      sum +
      (productPrice(bottom.product) + productPrice(top.product)) *
        matchedQuantity
    );
  }, 0);
  const bundleDiscount = bundleSubtotal * 0.05;
  const afterBundle = subtotal - bundleDiscount;
  const minimumChargeCoupon =
    coupon?.type === "coupon" && coupon.minimumCharge === true;
  const percentDiscount = minimumChargeCoupon
    ? Math.max(0, afterBundle - SPECIAL_COUPON_TOTAL)
    : coupon?.type === "coupon"
      ? afterBundle * (coupon.pct / 100)
      : 0;
  const beforePayment = minimumChargeCoupon
    ? SPECIAL_COUPON_TOTAL
    : afterBundle - percentDiscount;
  const pixDiscount =
    method === "Pix" && !minimumChargeCoupon
      ? Math.min(
          beforePayment * 0.05,
          Math.max(0, beforePayment - MINIMUM_PIX_CHARGE),
        )
      : 0;
  const beforeCredit = beforePayment - pixDiscount;
  const couponDiscount = percentDiscount;
  const total = beforeCredit;

  return {
    lines,
    subtotal,
    bundleDiscount,
    couponDiscount,
    pixDiscount,
    total,
    // Considera preços vigentes, conjunto e cupom. Apenas o desconto Pix
    // não reduz a base usada para conquistar o frete grátis.
    freeShippingSubtotal: beforePayment,
    freeShippingRemaining: Math.max(0, FREE_SHIPPING_MINIMUM - beforePayment),
  };
}

export function calculateAccountCreditDiscount(
  balance: number,
  amount: number,
  method: PaymentMethod,
) {
  const available = Math.max(0, balance);
  const due = Math.max(0, amount);
  if (method !== "Pix" || available >= due) return Math.min(available, due);
  return Math.min(available, Math.max(0, due - MINIMUM_PIX_CHARGE));
}

function isCartItem(value: unknown): value is CartItem {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<CartItem>;
  return (
    Number.isInteger(item.pid) &&
    typeof item.size === "string" &&
    (item.color === undefined || typeof item.color === "string") &&
    Number.isInteger(item.qty) &&
    Number(item.qty) > 0
  );
}
