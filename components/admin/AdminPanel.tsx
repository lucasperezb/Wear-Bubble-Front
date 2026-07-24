'use client';

import { useEffect, useMemo, useState } from 'react';
import { apiFetch } from '../../lib/api';
import { adminTabs, defaultSports, emptyAdminDump } from './admin.constants';
import type { AdminDump, AdminTab } from './admin.types';
import { CombosAdmin } from './CombosAdmin';
import { CouponsAdmin } from './CouponsAdmin';
import { CustomersAdmin } from './CustomersAdmin';
import { DatabaseAdmin } from './DatabaseAdmin';
import { Dashboard } from './Dashboard';
import { ProductsAdmin } from './ProductsAdmin';
import { ShipAdmin } from './ShipAdmin';

type AdminPanelProps = {
  open: boolean;
  managerLabel: string;
  onClose: () => void;
  onChanged: () => void;
  notify: (message: string) => void;
};

export function AdminPanel({ open, managerLabel, onClose, onChanged, notify }: AdminPanelProps) {
  const [tab, setTab] = useState<AdminTab>('dash');
  const [dump, setDump] = useState<AdminDump>(emptyAdminDump);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) void refresh();
  }, [open]);

  async function refresh() {
    setLoading(true);
    try {
      setDump(await apiFetch<AdminDump>('/admin/db'));
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Nao foi possivel carregar o painel.');
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
    onChanged();
  };

  return (
    <div className={`fixed inset-0 z-[700] overflow-y-auto bg-bubble-cream transition-transform duration-[350ms] ${open ? 'translate-y-0' : 'translate-y-full'}`}>
      <div className="sticky top-0 z-10 flex items-center justify-between bg-bubble-ink px-8 py-4 text-bubble-cream">
        <h3 className="text-[1.4rem] text-bubble-cream">painel <span className="text-bubble-candy">bubble</span></h3>
        <div className="flex items-center gap-3 text-[.72rem]">
          <span>{managerLabel}</span>
          <button className="border-0 bg-bubble-brown px-[18px] py-[9px] font-sans text-[.7rem] font-bold uppercase tracking-[.12em] text-bubble-white" onClick={onClose}>Voltar a loja</button>
        </div>
      </div>
      <div className="mx-auto max-w-[1200px] px-8 pb-20 pt-[34px]">
        <div className="mb-[30px] flex flex-wrap gap-2">
          {adminTabs.map((item) => (
            <button
              key={item.id}
              className={`border px-[22px] py-[11px] font-sans text-[.72rem] font-bold uppercase tracking-[.1em] ${tab === item.id ? 'border-bubble-ink bg-bubble-ink text-bubble-candy' : 'border-bubble-line bg-bubble-white text-bubble-ink/55'}`}
              onClick={() => setTab(item.id)}
            >
              {item.label}
            </button>
          ))}
          <button className="border border-bubble-line bg-bubble-white px-[22px] py-[11px] font-sans text-[.72rem] font-bold uppercase tracking-[.1em] text-bubble-ink/55" onClick={refresh}>
            {loading ? 'Carregando...' : 'Atualizar'}
          </button>
        </div>

        {tab === 'dash' && <Dashboard dump={dump} />}
        {tab === 'products' && <ProductsAdmin products={dump.products} sports={sports} onSaved={refreshProducts} notify={notify} />}
        {tab === 'ship' && <ShipAdmin orders={dump.orders} onSaved={refresh} notify={notify} />}
        {tab === 'customers' && <CustomersAdmin dump={dump} />}
        {tab === 'coupons' && <CouponsAdmin coupons={dump.coupons} orders={dump.orders} onSaved={refresh} notify={notify} />}
        {tab === 'combos' && <CombosAdmin products={dump.products} onSaved={refreshProducts} notify={notify} />}
        {tab === 'db' && <DatabaseAdmin dump={dump} />}
      </div>
    </div>
  );
}
