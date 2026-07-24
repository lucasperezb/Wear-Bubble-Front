import type { Coupon, Order, Product } from '../../lib/api';

export type ColorDraft = { n: string; h: string; q?: number | string };
export type ProductDraft = Product & { sizesText: string };

export type AdminDump = {
  products: Product[];
  orders: Order[];
  coupons: Coupon[];
  leads: Array<Record<string, unknown>>;
  users: Array<Record<string, unknown>>;
  events: Array<Record<string, unknown>>;
  pii_vault?: Array<Record<string, unknown>>;
  deletion_reports?: Array<Record<string, unknown>>;
};

export type AdminTab = 'dash' | 'products' | 'ship' | 'customers' | 'coupons' | 'combos' | 'db';
export type Notify = (message: string) => void;
export type OnSaved = () => Promise<void>;
