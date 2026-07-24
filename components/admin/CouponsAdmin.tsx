'use client';

import { useState } from 'react';
import { Coupon, Order, apiFetch, money } from '../../lib/api';
import { adminNote, adminTable, field, primaryButton, smallButton, stockBadge } from './admin.styles';
import type { Notify, OnSaved } from './admin.types';

export function CouponsAdmin({ coupons, orders, onSaved, notify }: { coupons: Coupon[]; orders: Order[]; onSaved: OnSaved; notify: Notify }) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState({ code: '', pct: 10, expiresAt: '', maxUses: '', minSubtotal: '', assignedTo: '' });

  async function createCoupon() {
    try {
      await apiFetch('/coupons', {
        method: 'POST',
        body: JSON.stringify({
          code: draft.code,
          pct: Number(draft.pct),
          expiresAt: draft.expiresAt ? new Date(`${draft.expiresAt}T23:59:59`).getTime() : null,
          maxUses: draft.maxUses ? Number(draft.maxUses) : null,
          minSubtotal: draft.minSubtotal ? Number(draft.minSubtotal) : 0,
          assignedTo: draft.assignedTo,
        }),
      });
      setAdding(false);
      setDraft({ code: '', pct: 10, expiresAt: '', maxUses: '', minSubtotal: '', assignedTo: '' });
      await onSaved();
      notify('Cupom criado.');
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Nao foi possivel criar cupom.');
    }
  }

  return (
    <>
      <div className="mb-3.5 flex justify-end">
        <button className={`${primaryButton} px-4 py-[9px] text-[.68rem]`} onClick={() => setAdding((current) => !current)}>Criar cupom</button>
      </div>
      {adding ? (
        <div className="mb-5 border border-bubble-line bg-bubble-white p-5">
          <h4 className="mb-4 font-sans text-[.78rem] font-bold uppercase tracking-[.1em] text-bubble-ink">Novo cupom</h4>
          <div className="grid grid-cols-2 gap-3">
            <div className={field}><label>Codigo</label><input value={draft.code} onChange={(event) => setDraft({ ...draft, code: event.target.value.toUpperCase() })} placeholder="EX: JULIA10" /></div>
            <div className={field}><label>Desconto (%)</label><input type="number" min="1" max="90" value={draft.pct} onChange={(event) => setDraft({ ...draft, pct: Number(event.target.value) })} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className={field}><label>Validade</label><input type="date" value={draft.expiresAt} onChange={(event) => setDraft({ ...draft, expiresAt: event.target.value })} /></div>
            <div className={field}><label>Limite de usos</label><input type="number" min="1" value={draft.maxUses} onChange={(event) => setDraft({ ...draft, maxUses: event.target.value })} placeholder="ilimitado" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className={field}><label>Compra minima R$</label><input type="number" min="0" step="0.01" value={draft.minSubtotal} onChange={(event) => setDraft({ ...draft, minSubtotal: event.target.value })} placeholder="0" /></div>
            <div className={field}><label>Atribuido a</label><input value={draft.assignedTo} onChange={(event) => setDraft({ ...draft, assignedTo: event.target.value })} placeholder="Ex: Julia" /></div>
          </div>
          <button className={primaryButton} onClick={createCoupon}>Criar cupom</button>
        </div>
      ) : null}
      <table className={adminTable}>
        <thead><tr><th>Codigo</th><th className="w-[88px]">%</th><th>Atribuido a</th><th>Validade</th><th className="w-[88px]">Usos</th><th className="w-[88px]">Pedidos</th><th className="w-[88px]">Receita gerada</th><th>Status</th><th></th></tr></thead>
        <tbody>
          {coupons.length === 0 ? <tr><td colSpan={9} className="p-[26px] text-center text-bubble-ink/50">Nenhum cupom ainda.</td></tr> : null}
          {coupons.map((coupon) => <CouponRow key={coupon.code} coupon={coupon} orders={orders} onSaved={onSaved} notify={notify} />)}
        </tbody>
      </table>
      <p className={adminNote}>Cupom generico para primeira compra, codigo por embaixadora para medir receita, e codigos curtos para campanhas.</p>
    </>
  );
}

function CouponRow({ coupon, orders, onSaved, notify }: { coupon: Coupon; orders: Order[]; onSaved: OnSaved; notify: Notify }) {
  const [draft, setDraft] = useState({
    pct: coupon.pct,
    assignedTo: coupon.assignedTo || '',
    expiresAt: coupon.expiresAt ? new Date(coupon.expiresAt).toISOString().slice(0, 10) : '',
  });
  const usedOrders = orders.filter((order) => order.coupon === coupon.code);
  const revenue = usedOrders.reduce((sum, order) => sum + order.total, 0);
  const statusKind = coupon.active === false ? 'out' : coupon.expiresAt && Date.now() > coupon.expiresAt ? 'low' : 'ok';
  const statusLabel = coupon.active === false ? 'Pausado' : coupon.expiresAt && Date.now() > coupon.expiresAt ? 'Expirado' : 'Ativo';

  async function patch(body: Record<string, unknown>, message: string) {
    try {
      await apiFetch(`/coupons/${coupon.code}`, { method: 'PATCH', body: JSON.stringify(body) });
      await onSaved();
      notify(message);
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Nao foi possivel salvar cupom.');
    }
  }

  return (
    <tr>
      <td className="font-bold tracking-px">{coupon.code}</td>
      <td className="w-[88px]"><input className="max-w-[58px]" type="number" min="1" max="90" value={draft.pct} onChange={(event) => setDraft({ ...draft, pct: Number(event.target.value) })} /></td>
      <td><input className="min-w-[140px]" value={draft.assignedTo} onChange={(event) => setDraft({ ...draft, assignedTo: event.target.value })} /></td>
      <td><input type="date" value={draft.expiresAt} onChange={(event) => setDraft({ ...draft, expiresAt: event.target.value })} /></td>
      <td className="w-[88px]">{coupon.uses || 0}{coupon.maxUses ? ` / ${coupon.maxUses}` : ''}</td>
      <td className="w-[88px]">{usedOrders.length}</td>
      <td className="w-[88px] font-semibold text-bubble-ink">{money.format(revenue)}</td>
      <td><span className={stockBadge(statusKind)}>{statusLabel}</span></td>
      <td className="whitespace-nowrap">
        <button className={smallButton} onClick={() => patch({ pct: draft.pct, assignedTo: draft.assignedTo, expiresAt: draft.expiresAt ? new Date(`${draft.expiresAt}T23:59:59`).getTime() : null }, `Cupom ${coupon.code} atualizado.`)}>Salvar</button>
        <button className={smallButton} onClick={() => patch({ active: coupon.active === false }, coupon.active === false ? `Cupom ${coupon.code} ativado.` : `Cupom ${coupon.code} pausado.`)}>{coupon.active === false ? 'Ativar' : 'Pausar'}</button>
      </td>
    </tr>
  );
}
