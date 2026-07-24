'use client';

import { useEffect, useState } from 'react';
import { Product, apiFetch, money } from '../../lib/api';
import { ProductIcon } from '../shared/ProductIcon';
import { createEmptyProductDraft, productCategories, productIcons } from './admin.constants';
import { adminNote, chartCard, outlineButton, primaryButton, productInput, productLabel, saveButton, stockBadge } from './admin.styles';
import type { ColorDraft, Notify, OnSaved, ProductDraft } from './admin.types';
import { iconForCategory, productPayload, validateProductDraft } from './admin.utils';

type ProductsAdminProps = {
  products: Product[];
  sports: string[];
  onSaved: OnSaved;
  notify: Notify;
};

export function ProductsAdmin({ products, sports, onSaved, notify }: ProductsAdminProps) {
  const [adding, setAdding] = useState(false);

  return (
    <>
      <div className={`${chartCard} mb-[18px]`}>
        <h4>Esportes do filtro da loja</h4>
        <p className="mb-3 text-[.7rem] leading-[1.6] text-bubble-ink/55">Estes sao os esportes que aparecem no filtro Esporte da loja e nas opcoes de cada peca.</p>
        <div className="flex flex-wrap gap-2">
          {sports.map((sport) => <span className="inline-flex items-center gap-1.5 border border-bubble-line bg-bubble-cream px-3 py-1.5 text-[.78rem]" key={sport}>{sport}</span>)}
        </div>
      </div>
      <div className="mb-3.5 flex justify-end">
        <button className={`${primaryButton} px-4 py-[9px] text-[.68rem]`} onClick={() => setAdding((current) => !current)}>Adicionar produto</button>
      </div>
      {adding ? <NewProductForm sports={sports} onSaved={async () => { setAdding(false); await onSaved(); notify('Produto cadastrado e publicado na loja.'); }} notify={notify} /> : null}
      <div className="grid grid-cols-[repeat(auto-fill,minmax(340px,1fr))] gap-4">
        {products.map((product) => <ProductAdminCard key={product.id} product={product} sports={sports} onSaved={async () => { await onSaved(); notify('Produto atualizado na loja.'); }} notify={notify} />)}
      </div>
      <p className={adminNote}>Cada cartao mostra todas as informacoes do produto. Alteracoes entram no ar ao clicar em Salvar. Desligar Visivel oculta o produto sem apagar o historico.</p>
    </>
  );
}

function NewProductForm({ sports, onSaved, notify }: { sports: string[]; onSaved: OnSaved; notify: Notify }) {
  const [draft, setDraft] = useState<ProductDraft>(createEmptyProductDraft);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function save() {
    const validation = validateProductDraft(draft);
    if (validation) {
      setError(validation);
      return;
    }
    setSaving(true);
    setError('');
    try {
      await apiFetch('/products', { method: 'POST', body: JSON.stringify(productPayload(draft)) });
      setDraft(createEmptyProductDraft());
      await onSaved();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Nao foi possivel cadastrar produto.';
      setError(message);
      notify(message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mb-5 overflow-hidden border border-bubble-line bg-bubble-white">
      <div className="grid grid-cols-[minmax(230px,.7fr)_minmax(0,1.5fr)] max-[760px]:grid-cols-1">
        <div className="flex flex-col gap-4 bg-bubble-ink p-[22px] text-bubble-cream">
          <div>
            <h4 className="mb-2 text-bubble-candy">Novo produto</h4>
            <p className="m-0 text-[.7rem] leading-[1.6] text-bubble-cream/70">Cadastre a peca completa e publique na loja em um clique.</p>
          </div>
          <ProductPreview draft={draft} />
          <div className="flex flex-wrap gap-2">
            {productCategories.map((category) => (
              <button
                className={`inline-flex cursor-pointer items-center gap-1.5 border bg-bubble-cream/5 px-3 py-1.5 text-[.78rem] text-bubble-cream ${draft.cat === category ? 'border-bubble-candy' : 'border-bubble-cream/30'}`}
                key={category}
                onClick={() => setDraft((current) => ({ ...current, cat: category, sub: current.sub || category, icon: iconForCategory(category) }))}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
        <div className="bg-bubble-white p-5">
          <ProductFields draft={draft} sports={sports} onDraft={setDraft} showImageField />
          {error ? <div className="mt-3 text-[.76rem] text-bubble-danger">{error}</div> : null}
          <div className="mt-4 flex gap-2.5">
            <button className={primaryButton} onClick={save} disabled={saving}>{saving ? 'Publicando...' : 'Cadastrar e publicar'}</button>
            <button className={outlineButton} onClick={() => { setDraft(createEmptyProductDraft()); setError(''); }}>Limpar</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProductPreview({ draft }: { draft: ProductDraft }) {
  const color = draft.colors?.[0];
  return (
    <div className="border border-bubble-cream/25 bg-bubble-cream/[.06]">
      <div className="flex aspect-[3/4] items-center justify-center overflow-hidden" style={{ background: color?.h || '#EAE2CC' }}>
        {draft.image ? <img src={draft.image} alt="" className="size-full object-cover" /> : <div className="w-[52%] text-bubble-cream"><ProductIcon icon={draft.icon} /></div>}
      </div>
      <div className="p-3.5">
        <div className="text-[.66rem] uppercase tracking-[.1em] text-bubble-cream/60">{draft.cat || 'Categoria'}</div>
        <div className="my-1.5 font-serif text-base leading-[1.35]">{draft.name || 'Nome da peca'}</div>
        <div className="flex items-end justify-between gap-2.5">
          <span className="font-bold text-bubble-candy">{money.format(Number(draft.price) || 0)}</span>
          <span className={stockBadge(draft.stock <= 0 ? 'out' : draft.stock <= 5 ? 'low' : 'ok')}>{draft.stock || 0} un.</span>
        </div>
      </div>
    </div>
  );
}

function ProductAdminCard({ product, sports, onSaved, notify }: { product: Product; sports: string[]; onSaved: OnSaved; notify: Notify }) {
  const [draft, setDraft] = useState<ProductDraft>({ ...product, sizesText: (product.sizes || []).join(', ') });
  const stockKind = draft.stock <= 0 ? 'out' : draft.stock <= 5 ? 'low' : 'ok';
  const stockLabel = draft.stock <= 0 ? 'Esgotado' : draft.stock <= 5 ? 'Baixo' : 'OK';

  useEffect(() => {
    setDraft({ ...product, sizesText: (product.sizes || []).join(', ') });
  }, [product]);

  async function save() {
    try {
      await apiFetch(`/products/${product.id}`, { method: 'PATCH', body: JSON.stringify(productPayload(draft)) });
      await onSaved();
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Nao foi possivel salvar produto.');
    }
  }

  async function remove() {
    if (!window.confirm(`Excluir "${product.name}" definitivamente?`)) return;
    try {
      await apiFetch(`/products/${product.id}`, { method: 'DELETE' });
      await onSaved();
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Nao foi possivel excluir produto.');
    }
  }

  return (
    <article className="flex flex-col rounded border border-bubble-line bg-bubble-white p-[18px]">
      <div className="mb-3 flex items-center gap-3">
        <div className="flex h-16 w-[52px] shrink-0 items-center justify-center overflow-hidden rounded-sm border border-bubble-line bg-bubble-cream2 [&_img]:size-full [&_img]:object-cover [&_svg]:size-full">{product.image ? <img src={product.image} alt="" /> : <ProductIcon icon={draft.icon} />}</div>
        <div className="flex flex-1 flex-col gap-[5px]">
          <div className="font-mono text-[.72rem] text-bubble-ink/55">Produto #{product.id}</div>
          <span className={stockBadge(stockKind)}>{stockLabel}</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <span className="text-[.56rem] font-bold uppercase tracking-[.1em] text-bubble-ink/50">Visivel</span>
          <button className={`relative h-5 w-[38px] rounded-[10px] border-0 transition-colors after:absolute after:top-0.5 after:size-4 after:rounded-full after:bg-bubble-white after:transition-[left] ${draft.active ? 'bg-bubble-success after:left-5' : 'bg-bubble-line after:left-0.5'}`} onClick={() => setDraft((current) => ({ ...current, active: !current.active }))} aria-label="Mostrar ou ocultar na loja" />
        </div>
      </div>
      <ProductFields draft={draft} sports={sports} onDraft={setDraft} />
      <div className="mt-4 flex flex-wrap gap-2 border-t border-bubble-line pt-3.5">
        <button className={`${saveButton} flex-1 text-center`} onClick={save}>Salvar alteracoes</button>
        <button className={`${saveButton} bg-bubble-danger`} onClick={remove}>Excluir</button>
      </div>
    </article>
  );
}

function ProductFields({ draft, sports, onDraft, showImageField = false }: { draft: ProductDraft; sports: string[]; onDraft: (next: ProductDraft) => void; showImageField?: boolean }) {
  const update = (patch: Partial<ProductDraft>) => onDraft({ ...draft, ...patch });

  return (
    <>
      <label className={productLabel}>Nome</label>
      <input className={productInput} value={draft.name} onChange={(event) => update({ name: event.target.value })} />
      {showImageField ? (
        <>
          <label className={productLabel}>Imagem do produto (URL)</label>
          <input className={productInput} value={draft.image || ''} onChange={(event) => update({ image: event.target.value.trim() || null })} placeholder="https://..." />
        </>
      ) : null}
      <div className="grid grid-cols-2 gap-2.5">
        <div>
          <label className={productLabel}>Categoria</label>
          <select className={productInput} value={draft.cat} onChange={(event) => update({ cat: event.target.value })}>
            {productCategories.map((category) => <option key={category}>{category}</option>)}
          </select>
        </div>
        <div><label className={productLabel}>Tipo (subcategoria)</label><input className={productInput} value={draft.sub || ''} onChange={(event) => update({ sub: event.target.value })} placeholder="Ex: Legging" /></div>
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        <div>
          <label className={productLabel}>Icone</label>
          <select className={productInput} value={draft.icon} onChange={(event) => update({ icon: event.target.value })}>
            {productIcons.map((icon) => <option key={icon}>{icon}</option>)}
          </select>
        </div>
        <div><label className={productLabel}>Material</label><input className={productInput} value={draft.material || ''} onChange={(event) => update({ material: event.target.value })} placeholder="Ex: Suplex Power" /></div>
      </div>
      <div className="grid grid-cols-3 gap-2.5 max-[520px]:grid-cols-2">
        <div><label className={productLabel}>Preco (R$)</label><input className={productInput} type="number" step="0.10" min="0" value={draft.price} onChange={(event) => update({ price: Number(event.target.value) })} /></div>
        <div><label className={productLabel}>Estoque</label><input className={productInput} type="number" min="0" value={draft.stock} onChange={(event) => update({ stock: Number(event.target.value) })} /></div>
        <div><label className={productLabel}>Selo</label><input className={productInput} value={draft.tag || ''} onChange={(event) => update({ tag: event.target.value })} placeholder="Colecao 01" /></div>
      </div>
      <label className={productLabel}>Tamanhos (separados por virgula)</label>
      <input className={productInput} value={draft.sizesText} onChange={(event) => update({ sizesText: event.target.value })} placeholder="P, M, G, GG" />
      <label className={productLabel}>Esportes recomendados</label>
      <div className="flex flex-wrap gap-2">
        {sports.map((sport) => (
          <label className="inline-flex w-auto cursor-pointer items-center gap-1.5 rounded-[20px] border border-bubble-line bg-bubble-cream px-3 py-[7px] text-[.72rem] font-semibold has-[:checked]:border-bubble-brown has-[:checked]:bg-bubble-brown has-[:checked]:text-bubble-white" key={sport}>
            <input className="w-auto p-0" type="checkbox" checked={(draft.sports || []).includes(sport)} onChange={(event) => {
              const current = draft.sports || [];
              update({ sports: event.target.checked ? [...current, sport] : current.filter((item) => item !== sport) });
            }} /> {sport}
          </label>
        ))}
      </div>
      <label className={productLabel}>Cores e estoque por cor <span className="ml-1">{(draft.colors || []).map((color, index) => <span className="ml-0.5 inline-block size-3 rounded-full border border-bubble-line align-middle" key={`${color.n}-${index}`} title={color.n} style={{ background: color.h }} />)}</span></label>
      <ColorEditor colors={(draft.colors || []) as ColorDraft[]} onColors={(colors) => update({ colors: colors as Product['colors'] })} />
      <div className="mt-1 text-[.66rem] text-bubble-ink/50">Clique no quadradinho para escolher a cor na paleta. A qtd e o estoque daquela cor.</div>
      <label className={productLabel}>Descricao</label>
      <textarea className={`${productInput} resize-y leading-[1.5]`} rows={2} value={draft.desc || ''} onChange={(event) => update({ desc: event.target.value })} placeholder="Descricao da peca" />
    </>
  );
}

function ColorEditor({ colors, onColors }: { colors: ColorDraft[]; onColors: (colors: ColorDraft[]) => void }) {
  const list = colors.length ? colors : [{ n: '', h: '#17130E' }];
  return (
    <div className="flex flex-col gap-2">
      {list.map((color, index) => (
        <div className="grid grid-cols-[46px_1fr_74px_30px] items-center gap-2" key={index}>
          <input className="h-9 w-[46px] cursor-pointer border border-bubble-line bg-bubble-cream p-0.5" type="color" value={color.h || '#17130E'} onChange={(event) => onColors(list.map((item, i) => i === index ? { ...item, h: event.target.value } : item))} />
          <input className="w-full border border-bubble-line bg-bubble-cream px-2.5 py-2 text-[.8rem] text-bubble-ink focus:bg-bubble-white focus:outline focus:outline-2" placeholder="Nome da cor" value={color.n || ''} onChange={(event) => onColors(list.map((item, i) => i === index ? { ...item, n: event.target.value } : item))} />
          <input className="w-full border border-bubble-line bg-bubble-cream px-2.5 py-2 text-[.8rem] text-bubble-ink focus:bg-bubble-white focus:outline focus:outline-2" type="number" placeholder="Qtd" value={color.q ?? ''} onChange={(event) => onColors(list.map((item, i) => i === index ? { ...item, q: event.target.value } : item))} />
          <button className="size-[30px] border border-bubble-line bg-transparent text-[1.05rem] leading-none text-bubble-danger hover:border-bubble-danger hover:bg-bubble-danger hover:text-bubble-white" onClick={() => onColors(list.filter((_, i) => i !== index))}>x</button>
        </div>
      ))}
      <button className="mt-2 w-full border border-dashed border-bubble-line bg-transparent px-3 py-[9px] font-sans text-[.66rem] font-semibold uppercase tracking-[.12em] text-bubble-ink hover:border-bubble-ink hover:bg-bubble-cream2" onClick={() => onColors([...list, { n: '', h: '#17130E' }])}>Adicionar cor</button>
    </div>
  );
}
