import type { ProductDraft, AdminDump, AdminTab } from './admin.types';

export const adminTabs: Array<{ id: AdminTab; label: string }> = [
  { id: 'dash', label: 'Dashboard' },
  { id: 'products', label: 'Produtos' },
  { id: 'ship', label: 'Envios' },
  { id: 'customers', label: 'Clientes' },
  { id: 'coupons', label: 'Cupons' },
  { id: 'combos', label: 'Conjuntos' },
  { id: 'db', label: 'Banco' },
];

export const productCategories = ['Top', 'Parte de baixo', 'Casaco', 'Acessorio'];
export const productIcons = ['legging', 'top', 'shorts', 'wideleg', 'regata', 'jacket', 'sock'];
export const defaultSports = ['Musculacao', 'Yoga/Pilates', 'Funcional/HIIT', 'Corrida', 'Ciclismo', 'Crossfit', 'Casual/Dia a dia'];
export const shippingStages = ['Confirmado', 'Pagamento', 'Separacao', 'Enviado', 'Em transito', 'Entregue'];

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
  sizesText: 'P, M, G, GG',
  material: '',
  pair: 0,
  sports: [],
  colors: [{ n: 'Preto', h: '#2B1420' }],
  desc: '',
  image: null,
});
