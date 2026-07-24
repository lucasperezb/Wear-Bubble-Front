'use client';

import { useState } from 'react';
import { Product, apiFetch, money } from '../../lib/api';
import { ProductIcon } from '../shared/ProductIcon';
import { adminTable, chartCard, saveButton } from './admin.styles';
import type { Notify, OnSaved } from './admin.types';

export function CombosAdmin({ products, onSaved, notify }: { products: Product[]; onSaved: OnSaved; notify: Notify }) {
  async function savePair(product: Product, pair: number) {
    try {
      await apiFetch(`/products/${product.id}`, { method: 'PATCH', body: JSON.stringify({ pair }) });
      await onSaved();
      notify(pair ? `Par de "${product.name}" atualizado.` : `Par de "${product.name}" removido.`);
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Nao foi possivel salvar conjunto.');
    }
  }

  return (
    <>
      <div className="mb-[18px] border border-bubble-candy bg-bubble-candy/15 px-[13px] py-[11px] text-[.68rem] leading-[1.6] text-bubble-ink"><b>Conjuntos.</b> O par escolhido aparece no modal da peca como Complete o conjunto.</div>
      <div className={chartCard}>
        <h4>Par de cada produto</h4>
        <table className={adminTable}>
          <thead><tr><th className="min-w-[190px]">Produto</th><th className="min-w-[190px]">Par sugerido</th><th></th></tr></thead>
          <tbody>
            {products.map((product) => <PairRow key={product.id} product={product} products={products} onSave={savePair} />)}
          </tbody>
        </table>
      </div>
    </>
  );
}

function PairRow({ product, products, onSave }: { product: Product; products: Product[]; onSave: (product: Product, pair: number) => Promise<void> }) {
  const [pair, setPair] = useState(product.pair || 0);
  return (
    <tr>
      <td className="min-w-[190px]"><div className="flex items-center gap-2.5"><div className="flex h-[46px] w-9 shrink-0 items-center justify-center overflow-hidden rounded-sm border border-bubble-line bg-bubble-cream2 [&_img]:size-full [&_img]:object-cover [&_svg]:size-full">{product.image ? <img src={product.image} alt="" /> : <ProductIcon icon={product.icon} />}</div><span className="text-[.8rem]">#{product.id} - {product.name}</span></div></td>
      <td className="min-w-[190px]"><select value={pair} onChange={(event) => setPair(Number(event.target.value))}><option value={0}>-- nenhum --</option>{products.filter((item) => item.id !== product.id).map((item) => <option key={item.id} value={item.id}>#{item.id} - {item.name} ({money.format(item.price)})</option>)}</select></td>
      <td><button className={saveButton} onClick={() => onSave(product, pair)}>Salvar</button></td>
    </tr>
  );
}
