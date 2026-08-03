import type { ProductDraft, AdminDump, AdminTab } from './admin.types';

export const adminTabs: Array<{ id: AdminTab; label: string }> = [
  { id: 'dash', label: 'Dashboard' },
  { id: 'products', label: 'Produtos' },
  { id: 'orders', label: 'Pedidos' },
  { id: 'ship', label: 'Envios' },
  { id: 'customers', label: 'Clientes' },
  { id: 'coupons', label: 'Cupons' },
  { id: 'combos', label: 'Conjuntos' },
  { id: 'db', label: 'Banco' },
];

export const productCategories = ['Top', 'Parte de baixo', 'Casaco', 'Acessório'];
export const productIcons = ['legging', 'top', 'shorts', 'wideleg', 'regata', 'jacket', 'sock'];
export const defaultSports = ['Musculação', 'Yoga/Pilates', 'Funcional/HIIT', 'Corrida', 'Ciclismo', 'Crossfit', 'Casual/Dia a dia'];
export const shippingStages = ['Confirmado', 'Pagamento', 'Separação', 'Enviado', 'Em trânsito', 'Entregue'];

export const emptyAdminDump: AdminDump = {
  products: [],
  orders: [],
  coupons: [],
  leads: [],
  users: [],
  events: [],
  pii_vault: [],
  deletion_reports: [],
};

export function parseAdminDump(value: unknown): AdminDump {
  if (!value || typeof value !== 'object') {
    throw new Error('A API retornou dados inválidos para o painel.');
  }

  const dump = value as Partial<AdminDump>;
  const requiredCollections: Array<keyof AdminDump> = [
    'products',
    'orders',
    'coupons',
    'leads',
    'users',
    'events',
  ];

  if (requiredCollections.some((key) => !Array.isArray(dump[key]))) {
    throw new Error('A API retornou dados incompletos para o painel.');
  }

  return {
    products: dump.products!,
    orders: dump.orders!,
    coupons: dump.coupons!,
    leads: dump.leads!,
    users: dump.users!,
    events: dump.events!,
    pii_vault: Array.isArray(dump.pii_vault) ? dump.pii_vault : [],
    deletion_reports: Array.isArray(dump.deletion_reports)
      ? dump.deletion_reports
      : [],
  };
}

export const createEmptyProductDraft = (): ProductDraft => ({
  id: 0,
  name: '',
  cat: 'Top',
  sub: '',
  price: 0,
  tag: '',
  icon: 'top',
  rating: 5,
  reviews: 0,
  stock: 0,
  active: true,
  sizes: ['P', 'M', 'G', 'GG'],
  material: '',
  pair: 0,
  sports: [],
  colors: [{ n: 'Preto', h: '#2B1420' }],
  desc: '',
  image: null,
  images: [],
});
