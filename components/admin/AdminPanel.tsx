'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Database,
  LayoutDashboard,
  Layers3,
  Images,
  LogOut,
  Menu,
  Package,
  PanelsTopLeft,
  RefreshCw,
  RotateCcw,
  ShoppingBag,
  TicketPercent,
  BadgePercent,
  Truck,
  Users,
  X,
  type LucideIcon,
} from 'lucide-react';
import { apiFetch } from '../../lib/api';
import { useBodyScrollLock } from '../../lib/use-body-scroll-lock';
import {
  adminTabs,
  defaultSports,
  emptyAdminDump,
  parseAdminDump,
} from './shared/constants';
import type { AdminDump, AdminTab } from './shared/types';
import { CombosAdmin } from './catalog/CombosAdmin';
import { HeroCarouselAdmin } from './catalog/HeroCarouselAdmin';
import { ProductsAdmin } from './catalog/ProductsAdmin';
import { PromotionsAdmin } from './catalog/PromotionsAdmin';
import { ShowcasesAdmin } from './catalog/ShowcasesAdmin';
import { CouponsAdmin } from './commerce/CouponsAdmin';
import { OrdersAdmin } from './commerce/OrdersAdmin';
import { CustomersAdmin } from './customers/CustomersAdmin';
import { Dashboard } from './dashboard/Dashboard';
import { DatabaseAdmin } from './data/DatabaseAdmin';
import { ReturnsAdmin } from './fulfillment/ReturnsAdmin';
import { ShipAdmin } from './fulfillment/ShipAdmin';
import { readDemoProducts } from '../../lib/demo-store';
import type { HeroConfig } from '../../lib/api';

type AdminPanelProps = {
  open: boolean;
  managerLabel: string;
  onClose: () => void;
  onChanged: () => void | Promise<void>;
  notify: (message: string) => void;
  demoMode?: boolean;
};

export function AdminPanel({ open, managerLabel, onClose, onChanged, notify, demoMode = false }: AdminPanelProps) {
  useBodyScrollLock(open);
  const [tab, setTab] = useState<AdminTab>('dash');
  const [dump, setDump] = useState<AdminDump>(emptyAdminDump);
  const [loading, setLoading] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [heroConfig, setHeroConfig] = useState<HeroConfig>({
    enabled: false,
    slides: [],
  });

  useEffect(() => {
    if (open) void refresh();
  }, [open]);

  async function refresh() {
    setLoading(true);
    try {
      if (demoMode) {
        setDump({ ...emptyAdminDump, products: readDemoProducts() });
        return;
      }
      const [response, hero] = await Promise.all([
        apiFetch<unknown>('/admin/db'),
        apiFetch<HeroConfig>('/hero/admin'),
      ]);
      setDump(parseAdminDump(response));
      setHeroConfig(hero);
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Não foi possível carregar o painel.');
    } finally {
      setLoading(false);
    }
  }

  const sports = useMemo(() => {
    const used = dump.products.flatMap((product) => product.sports || []);
    return Array.from(new Set([...defaultSports, ...used])).filter(Boolean);
  }, [dump.products]);

  const refreshProducts = async () => {
    await refresh();
    await onChanged();
  };

  const visibleTabs = demoMode
    ? adminTabs.filter((item) => item.id === 'dash' || item.id === 'products' || item.id === 'showcases')
    : adminTabs;
  const currentLabel = visibleTabs.find((item) => item.id === tab)?.label || 'Painel';

  return (
    <div className={`fixed inset-0 z-[700] overflow-hidden bg-bubble-cream transition-transform duration-[350ms] ${open ? 'translate-y-0' : 'translate-y-full'}`}>
      <div className="flex h-full min-h-0">
        {menuOpen ? (
          <button
            className="fixed inset-0 z-20 bg-bubble-ink/45 lg:hidden"
            onClick={() => setMenuOpen(false)}
            aria-label="Fechar menu"
          />
        ) : null}

        <aside
          className={`fixed inset-y-0 left-0 z-30 flex w-[260px] flex-col bg-bubble-ink text-bubble-cream shadow-bubble transition-transform duration-300 lg:static lg:translate-x-0 lg:shadow-none ${
            menuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="flex h-[76px] shrink-0 items-center justify-between border-b border-bubble-cream/15 px-6">
            <h3 className="text-[1.28rem] text-bubble-cream">
              painel <span className="text-bubble-candy">bubble</span>
            </h3>
            <button
              className="flex size-9 items-center justify-center border border-bubble-cream/20 lg:hidden"
              onClick={() => setMenuOpen(false)}
              aria-label="Fechar menu"
            >
              <X size={18} />
            </button>
          </div>

          <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-5" aria-label="Navegação do painel">
            {visibleTabs.map((item) => {
              const Icon = adminTabIcons[item.id];
              const active = tab === item.id;
              return (
                <button
                  key={item.id}
                  className={`flex w-full items-center gap-3 border-l-2 px-4 py-3 text-left font-sans text-[.69rem] font-bold uppercase tracking-[.1em] transition-colors ${
                    active
                      ? 'border-bubble-candy bg-bubble-cream/10 text-bubble-candy'
                      : 'border-transparent text-bubble-cream/60 hover:bg-bubble-cream/[.06] hover:text-bubble-cream'
                  }`}
                  onClick={() => {
                    setTab(item.id);
                    setMenuOpen(false);
                  }}
                >
                  <Icon size={17} strokeWidth={1.8} />
                  {item.label}
                </button>
              );
            })}
          </nav>

          <div className="shrink-0 border-t border-bubble-cream/15 p-4">
            <div className="mb-3 truncate px-2 text-[.68rem] text-bubble-cream/50">
              {managerLabel}
            </div>
            <button
              className="flex w-full items-center justify-center gap-2 border border-bubble-cream/25 px-4 py-3 font-sans text-[.66rem] font-bold uppercase tracking-[.1em] text-bubble-cream hover:bg-bubble-cream hover:text-bubble-ink"
              onClick={onClose}
            >
              <LogOut size={16} />
              Voltar à loja
            </button>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex h-[68px] shrink-0 items-center justify-between border-b border-bubble-line bg-bubble-white px-4 sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <button
                className="flex size-10 shrink-0 items-center justify-center border border-bubble-line lg:hidden"
                onClick={() => setMenuOpen(true)}
                aria-label="Abrir menu"
              >
                <Menu size={20} />
              </button>
              <div className="min-w-0">
                <div className="font-sans text-[.58rem] font-bold uppercase tracking-[.14em] text-bubble-ink/40">
                  {demoMode ? 'Demonstração local' : 'Painel administrativo'}
                </div>
                <h2 className="truncate text-xl sm:text-2xl">{currentLabel}</h2>
              </div>
            </div>
            <button
              className="flex items-center gap-2 border border-bubble-line bg-bubble-white px-3 py-2.5 font-sans text-[.63rem] font-bold uppercase tracking-[.1em] text-bubble-ink/60 hover:border-bubble-ink hover:text-bubble-ink sm:px-4"
              onClick={refresh}
              disabled={loading}
            >
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
              <span className="hidden sm:inline">{loading ? 'Atualizando' : 'Atualizar dados'}</span>
            </button>
          </header>

          <main className="min-h-0 flex-1 overflow-y-auto">
            <div className="mx-auto max-w-[1440px] px-4 pb-16 pt-5 sm:px-6 sm:pt-7 lg:px-8 lg:pt-8">
              {tab === 'dash' && <Dashboard dump={dump} />}
              {tab === 'products' && <ProductsAdmin products={dump.products} sports={sports} onSaved={refreshProducts} notify={notify} demoMode={demoMode} />}
              {tab === 'orders' && <OrdersAdmin orders={dump.orders} onSaved={refresh} notify={notify} />}
              {tab === 'ship' && <ShipAdmin orders={dump.orders} onSaved={refresh} notify={notify} />}
              {tab === 'returns' && <ReturnsAdmin orders={dump.orders} notify={notify} />}
              {tab === 'customers' && <CustomersAdmin dump={dump} />}
              {tab === 'coupons' && <CouponsAdmin coupons={dump.coupons} orders={dump.orders} onSaved={refresh} notify={notify} />}
              {tab === 'promotions' && <PromotionsAdmin products={dump.products} onSaved={refreshProducts} notify={notify} />}
              {tab === 'showcases' && <ShowcasesAdmin products={dump.products} notify={notify} demoMode={demoMode} onSaved={onChanged} />}
              {tab === 'hero' && <HeroCarouselAdmin config={heroConfig} onConfig={setHeroConfig} onPublished={onChanged} notify={notify} />}
              {tab === 'combos' && <CombosAdmin products={dump.products} onSaved={refreshProducts} notify={notify} />}
              {tab === 'db' && <DatabaseAdmin dump={dump} />}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

const adminTabIcons: Record<AdminTab, LucideIcon> = {
  dash: LayoutDashboard,
  products: Package,
  orders: ShoppingBag,
  ship: Truck,
  returns: RotateCcw,
  customers: Users,
  coupons: TicketPercent,
  promotions: BadgePercent,
  showcases: PanelsTopLeft,
  hero: Images,
  combos: Layers3,
  db: Database,
};
