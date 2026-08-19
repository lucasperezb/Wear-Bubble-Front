export type Product = {
  id: number;
  name: string;
  cat: string;
  sub: string;
  price: number;
  promoPct: number;
  tag: string;
  collectionName?: string;
  icon: string;
  rating: number;
  reviews: number;
  stock: number;
  active: boolean;
  sizes: string[];
  material: string;
  pair: number;
  bundlePosition: number;
  sports: string[];
  colors: Array<{
    n: string;
    h: string;
    sizes?: Array<{ size: string; q: number }>;
  }>;
  desc: string;
  image?: string | null;
  images?: ProductImage[];
};

export type ShowcaseKey = "hero" | "home" | "core" | "tops" | "bottoms" | "sets";
export type ShowcaseMap = Record<ShowcaseKey, Product[]>;

export type ProductImage = {
  id: string;
  url: string;
  altText: string;
  position: number;
  isPrimary: boolean;
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
  customerId?: string;
  number: string;
  date: number;
  total: number;
  method: string;
  coupon: string | null;
  couponPct?: number;
  status: "pending" | "paid" | "canceled";
  shipStage: number;
  tracking?: string;
  gateway?: string;
  asaasCustomerId?: string;
  asaasPaymentId?: string;
  paidAt?: number;
  deliveredAt?: number;
  delivery?: {
    name: string;
    email: string;
    taxId: string;
    phone: string;
    cep: string;
    street: string;
    neighborhood: string;
    number: string;
    reference: string;
    city: string;
    state: string;
  };
  shipping?: {
    serviceId: number;
    name: string;
    company: string;
    price: number;
    deliveryTime: number;
  };
  items: Array<{
    id?: number;
    pid: number;
    name: string;
    size: string;
    color?: string;
    qty: number;
    price: number;
  }>;
};

export type ReturnRequest = {
  id: string;
  protocol: string;
  orderId: string;
  customerUid: string;
  kind: "exchange" | "return" | "defect";
  reason: string;
  details: string;
  status:
    | "requested"
    | "approved"
    | "awaiting_posting"
    | "returning"
    | "received"
    | "inspecting"
    | "completed"
    | "rejected"
    | "canceled";
  publicNote: string;
  postingCode: string | null;
  returnTracking: string | null;
  postingExpiresAt: number | null;
  resolution: "credit" | "refund" | null;
  resolutionAmount: number;
  creditCode: string | null;
  requestedAt: number;
  approvedAt: number | null;
  postedAt: number | null;
  receivedAt: number | null;
  resolvedAt: number | null;
  items: Array<{
    id: number;
    orderItemId: number;
    quantity: number;
    unitRefundValue: number;
    condition: "pending" | "resellable" | "damaged";
  }>;
  events: Array<{
    id: number;
    status: string;
    label: string;
    message: string;
    occurredAt: number;
  }>;
};

export type StoreCredit = {
  id: string;
  code: string;
  initialAmount: number;
  balance: number;
  status: "active" | "used" | "expired" | "canceled";
  expiresAt: number;
  returnRequestId: string;
};

export type Coupon = {
  code: string;
  pct: number;
  active: boolean;
  uses: number;
  expiresAt?: number | null;
  maxUses?: number | null;
  maxUsesPerCustomer?: number | null;
  minSubtotal?: number;
  assignedTo?: string;
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "/api";

export async function apiFetch<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const isFormData =
    typeof FormData !== "undefined" && init.body instanceof FormData;
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    cache: init.cache ?? "no-store",
    credentials: "include",
    headers: {
      ...(init.body && !isFormData
        ? { "content-type": "application/json" }
        : {}),
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
        ? "A API retornou uma resposta inválida."
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
