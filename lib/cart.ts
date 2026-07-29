import type { Product } from './api';
import { FREE_SHIPPING_ENABLED } from './store-config';

export type CartItem = {
  pid: number;
  size: string;
  color?: string;
  qty: number;
  bundle?: string | null;
};

export type PaymentMethod = 'Pix' | 'Cartao de credito';
export type AppliedCoupon = { code: string; pct: number } | null;

export const CART_STORAGE_KEY = 'bubble_cart';

export function readCart(): CartItem[] {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(CART_STORAGE_KEY) || '[]');
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
  method: PaymentMethod = 'Pix',
) {
  const lines = cart
    .map((item) => ({ item, product: products.find((product) => product.id === item.pid) }))
    .filter((line): line is { item: CartItem; product: Product } => Boolean(line.product));

  const subtotal = lines.reduce((sum, line) => sum + line.product.price * line.item.qty, 0);
  const bundleCounts = new Map<string, number>();
  for (const { item } of lines) {
    if (item.bundle) bundleCounts.set(item.bundle, (bundleCounts.get(item.bundle) || 0) + 1);
  }

  const bundleSubtotal = lines.reduce((sum, line) => (
    line.item.bundle && (bundleCounts.get(line.item.bundle) || 0) >= 2
      ? sum + line.product.price * line.item.qty
      : sum
  ), 0);
  const bundleDiscount = bundleSubtotal * 0.05;
  const afterBundle = subtotal - bundleDiscount;
  const couponDiscount = coupon ? afterBundle * (coupon.pct / 100) : 0;
  const beforePayment = afterBundle - couponDiscount;
  const pixDiscount = method === 'Pix' ? beforePayment * 0.05 : 0;
  const total = beforePayment - pixDiscount;

  return {
    lines,
    subtotal,
    bundleDiscount,
    couponDiscount,
    pixDiscount,
    total,
    freeShippingRemaining: FREE_SHIPPING_ENABLED
      ? 0
      : Math.max(0, 299 - total),
  };
}

function isCartItem(value: unknown): value is CartItem {
  if (!value || typeof value !== 'object') return false;
  const item = value as Partial<CartItem>;
  return Number.isInteger(item.pid)
    && typeof item.size === 'string'
    && (item.color === undefined || typeof item.color === 'string')
    && Number.isInteger(item.qty)
    && Number(item.qty) > 0;
}
