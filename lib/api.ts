export type Product = {
  id: number;
  name: string;
  cat: string;
  sub: string;
  price: number;
  tag: string;
  icon: string;
  rating: number;
  reviews: number;
  stock: number;
  active: boolean;
  sizes: string[];
  material: string;
  pair: number;
  sports: string[];
  colors: Array<{ n: string; h: string }>;
  desc: string;
  image?: string | null;
};

export type User = {
  uid: string;
  email: string;
  role: "customer" | "manager";
  name: string;
  emailVerified: boolean;
};

export type VerificationRequired = {
  verificationRequired: true;
  email: string;
};

export type AccountProfile = {
  uid: string;
  name: string;
  email: string;
  taxId: string;
  phone: string;
};

export type AccountAddress = {
  id: string;
  label: string;
  cep: string;
  street: string;
  neighborhood: string;
  number: string;
  reference: string;
  city: string;
  state: string;
  isDefault: boolean;
};

export type Order = {
  id: string;
  number: string;
  date: number;
  total: number;
  method: string;
  coupon: string | null;
  status: "pending" | "paid" | "canceled";
  shipStage: number;
  tracking?: string;
  items: Array<{
    pid: number;
    name: string;
    size: string;
    qty: number;
    price: number;
  }>;
};

export type Coupon = {
  code: string;
  pct: number;
  active: boolean;
  uses: number;
  expiresAt?: number | null;
  maxUses?: number | null;
  minSubtotal?: number;
  assignedTo?: string;
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "/api";

export async function apiFetch<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      ...(init.body ? { "content-type": "application/json" } : {}),
      ...init.headers,
    },
  });
  const text = await response.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    throw new Error(
      response.ok
        ? "A API retornou uma resposta invalida."
        : `Erro ${response.status}`,
    );
  }
  if (!response.ok) {
    const error = data as { message?: string | string[]; error?: string };
    const validationMessage = Array.isArray(error.message)
      ? error.message[0]?.replace(/^customer\./, "")
      : error.message;
    throw new Error(
      validationMessage || error.error || `Erro ${response.status}`,
    );
  }
  return data as T;
}

export const money = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});
