import type { Product } from '../../../lib/api';

export type ColorDraft = Product['colors'][number];
export type ProductDraft = Product;

export type AdminUser = {
  uid: string;
  role: string;
  marketingOptIn: boolean;
  emailVerified: boolean;
  createdAt: number;
};

export type AdminCustomerProfile = {
  uid: string;
  name: string;
  email: string;
  city: string;
};

export type AdminCustomers = {
  users: AdminUser[];
  profiles: AdminCustomerProfile[];
};

export type AdminEvent = {
  type: string;
  pid: number;
  ts: number;
  actor: string;
};

export type AdminTab =
  | 'dash'
  | 'products'
  | 'ship'
  | 'customers'
  | 'coupons'
  | 'promotions'
  | 'showcases'
  | 'hero'
  | 'combos';
export type Notify = (message: string) => void;
export type OnSaved = () => Promise<void>;
