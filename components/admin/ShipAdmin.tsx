'use client';

import { useState } from 'react';
import { Order, apiFetch, money } from '../../lib/api';
import { shippingStages } from './admin.constants';
import { adminNote, adminTable, saveButton } from './admin.styles';
import type { Notify, OnSaved } from './admin.types';

export function ShipAdmin({ orders, onSaved, notify }: { orders: Order[]; onSaved: OnSaved; notify: Notify }) {
  async function save(order: Order, shipStage: number, tracking: string) {
    try {
      await apiFetch(`/orders/${order.id}/ship`, { method: 'PATCH', body: JSON.stringify({ shipStage, tracking }) });
      await onSaved();
      notify(`Envio do #${order.number} atualizado.`);
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Nao foi possivel atualizar envio.');
    }
  }

  return (
    <>
      <div className="mb-[18px] border border-bubble-candy bg-bubble-candy/15 px-[13px] py-[11px] text-[.68rem] leading-[1.6] text-bubble-ink"><b>Controle de entrega.</b> Defina o estagio de cada pedido. O cliente ve a atualizacao em Minha Conta.</div>
      <table className={adminTable}>
        <thead><tr><th>Pedido</th><th>Cliente</th><th>Itens</th><th>Total</th><th>Rastreio</th><th>Estagio</th><th></th></tr></thead>
        <tbody>
          {orders.length === 0 ? <tr><td colSpan={7} className="p-[26px] text-center text-bubble-ink/50">Nenhum pedido ainda.</td></tr> : null}
          {orders.map((order) => <ShipRow key={order.id} order={order} onSave={save} />)}
        </tbody>
      </table>
      <p className={adminNote}>Linha do tempo: Confirmado {'>'} Pagamento {'>'} Separacao {'>'} Enviado {'>'} Em transito {'>'} Entregue.</p>
    </>
  );
}

function ShipRow({ order, onSave }: { order: Order; onSave: (order: Order, shipStage: number, tracking: string) => Promise<void> }) {
  const [shipStage, setShipStage] = useState(order.shipStage || 0);
  const [tracking, setTracking] = useState((order as Order & { tracking?: string }).tracking || '');

  return (
    <tr>
      <td>#{order.number}<br /><span className="text-[.7rem] leading-[1.6] text-bubble-ink/55">{new Date(order.date).toLocaleDateString('pt-BR')}</span></td>
      <td className="font-mono text-[.7rem]">{(order as Order & { customerId?: string }).customerId || 'anon'}</td>
      <td>{order.items.map((item) => `${item.qty}x ${item.name}${item.color ? ` (${item.color}, ${item.size})` : ` (${item.size})`}`).join(', ')}</td>
      <td>{money.format(order.total)}</td>
      <td><input value={tracking} onChange={(event) => setTracking(event.target.value)} placeholder="Codigo ou link" /></td>
      <td><select value={shipStage} onChange={(event) => setShipStage(Number(event.target.value))}>{shippingStages.map((stage, index) => <option key={stage} value={index}>{stage}</option>)}</select></td>
      <td><button className={saveButton} onClick={() => onSave(order, shipStage, tracking)}>Salvar</button></td>
    </tr>
  );
}
