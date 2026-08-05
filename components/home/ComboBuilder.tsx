import { useState } from 'react';
import { Product, money } from '../../lib/api';
import { ProductIcon } from '../shared/ProductIcon';

type ComboBuilderProps = {
  products: Product[];
  bottomId: number | null;
  topId: number | null;
  bottomColor: string;
  topColor: string;
  bottomSize: string;
  topSize: string;
  onSelectBottom: (product: Product) => void;
  onSelectTop: (product: Product) => void;
  onBottomColor: (color: string, size: string) => void;
  onTopColor: (color: string, size: string) => void;
  onBottomSize: (size: string) => void;
  onTopSize: (size: string) => void;
  onAdd: () => void;
};

export function ComboBuilder({
  products,
  bottomId,
  topId,
  bottomColor,
  topColor,
  bottomSize,
  topSize,
  onSelectBottom,
  onSelectTop,
  onBottomColor,
  onTopColor,
  onBottomSize,
  onTopSize,
  onAdd,
}: ComboBuilderProps) {
  const active = products.filter((product) => product.active && product.stock > 0);
  const allBottoms = active.filter((product) => product.cat === 'Parte de baixo');
  const allTops = active.filter((product) => product.cat === 'Top');
  const selectedBottom = allBottoms.find((product) => product.id === bottomId);
  const selectedTop = allTops.find((product) => product.id === topId);
  const bottoms = orderSuggestedFirst(allBottoms, selectedTop);
  const tops = orderSuggestedFirst(allTops, selectedBottom);
  const full = selectedBottom && selectedTop ? selectedBottom.price + selectedTop.price : 0;
  const discounted = full * 0.95;
  const [activeStep, setActiveStep] = useState<'bottom' | 'top'>(bottomId && !topId ? 'top' : 'bottom');
  const showingBottoms = activeStep === 'bottom';
  const visibleProducts = showingBottoms ? bottoms : tops;
  const selectedId = showingBottoms ? bottomId : topId;
  const selectedColor = showingBottoms ? bottomColor : topColor;
  const selectedSize = showingBottoms ? bottomSize : topSize;
  const opposite = showingBottoms ? selectedTop : selectedBottom;
  const selectProduct = (product: Product) => {
    if (showingBottoms) {
      onSelectBottom(product);
      setActiveStep('top');
      return;
    }
    onSelectTop(product);
  };

  return (
    <section className="border-y border-bubble-line bg-bubble-cream py-[78px]" id="conjunto">
      <div className="mx-auto max-w-[1200px] px-8 max-[620px]:px-4">
        <div className="mb-9 flex flex-wrap items-end justify-between gap-5">
          <div>
            <span className="font-sans text-[.72rem] font-semibold uppercase tracking-[.32em] text-bubble-brown">
              Seu look, suas escolhas
            </span>
            <h2 className="mt-1 text-[clamp(2.2rem,5vw,3.4rem)] leading-none">
              Monte seu Conjunto
            </h2>
          </div>
          <div className="bg-bubble-candy px-4 py-2 font-sans text-[.7rem] font-bold uppercase tracking-[.12em] text-bubble-ink">
            Qualquer combinação · 5% OFF
          </div>
        </div>

        <div className="grid grid-cols-[minmax(320px,.8fr)_minmax(0,1.35fr)] items-start gap-8 max-[900px]:grid-cols-1">
          <aside className="border border-bubble-line bg-bubble-white p-5 max-[900px]:order-2">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-sans text-[.72rem] font-bold uppercase tracking-[.15em] text-bubble-brown">Seu conjunto</h3>
              <span className="font-sans text-[.6rem] uppercase tracking-[.1em] text-bubble-ink/45">
                {[selectedBottom, selectedTop].filter(Boolean).length}/2 peças
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <SelectedPiece label="Parte de baixo" product={selectedBottom} color={bottomColor} size={bottomSize} onClick={() => setActiveStep('bottom')} />
              <SelectedPiece label="Top" product={selectedTop} color={topColor} size={topSize} onClick={() => setActiveStep('top')} />
            </div>
            <div className="mt-5 border-t border-bubble-line pt-5">
              {selectedBottom && selectedTop ? (
                <>
                  <div className="flex items-end justify-between gap-4">
                    <div>
                      <div className="font-sans text-[.6rem] font-bold uppercase tracking-[.12em] text-bubble-ink/45">Total com 5% OFF</div>
                      <div className="mt-1 font-display text-[2.2rem] leading-none text-bubble-brown">{money.format(discounted)}</div>
                    </div>
                    <div className="text-right font-sans text-[.66rem] uppercase tracking-[.06em] text-bubble-ink/50">
                      <div className="line-through">{money.format(full)}</div>
                      <div className="mt-1 font-bold text-bubble-brown">Economize {money.format(full - discounted)}</div>
                    </div>
                  </div>
                  <button className="mt-5 w-full bg-bubble-ink px-5 py-4 font-sans text-[.7rem] font-bold uppercase tracking-[.13em] text-bubble-white transition-colors hover:bg-bubble-brown" onClick={onAdd}>
                    Adicionar conjunto
                  </button>
                </>
              ) : (
                <div className="py-2 text-center">
                  <div className="font-sans text-[.65rem] font-bold uppercase tracking-[.12em] text-bubble-brown">5% OFF no conjunto completo</div>
                  <p className="mt-2 text-[.82rem] text-bubble-ink/55">Escolha uma peça de cada categoria.</p>
                </div>
              )}
            </div>
          </aside>

          <div className="min-w-0 border border-bubble-line bg-bubble-white max-[900px]:order-1">
            <div className="grid grid-cols-2 border-b border-bubble-line">
              <StepTab active={activeStep === 'bottom'} done={Boolean(selectedBottom)} number="1" label="Parte de baixo" onClick={() => setActiveStep('bottom')} />
              <StepTab active={activeStep === 'top'} done={Boolean(selectedTop)} number="2" label="Top" onClick={() => setActiveStep('top')} />
            </div>
            <div className="p-5 max-[520px]:p-3">
              <div className="mb-4 flex items-center justify-between gap-4">
                <div>
                  <h3 className="font-serif text-lg font-semibold">Escolha {showingBottoms ? 'a parte de baixo' : 'o top'}</h3>
                  <p className="mt-1 text-[.78rem] text-bubble-ink/50">Clique em uma peça para selecionar. Depois escolha cor e tamanho.</p>
                </div>
                <span className="shrink-0 font-sans text-[.6rem] uppercase tracking-[.1em] text-bubble-ink/40">{visibleProducts.length} opções</span>
              </div>
              {visibleProducts.length ? (
                <div className="grid max-h-[720px] grid-cols-2 gap-4 overflow-y-auto pr-1 max-[520px]:gap-2">
                  {visibleProducts.map((product) => (
                    <ProductChoice
                      key={product.id}
                      product={product}
                      selected={selectedId === product.id}
                      suggested={Boolean(opposite && productsCanPair(product, opposite))}
                      color={selectedColor}
                      size={selectedSize}
                      onSelect={() => selectProduct(product)}
                      onColor={showingBottoms ? onBottomColor : onTopColor}
                      onSize={showingBottoms ? onBottomSize : onTopSize}
                    />
                  ))}
                </div>
              ) : (
                <p className="border border-bubble-line bg-bubble-cream p-5 text-sm text-bubble-ink/60">Nenhum produto disponível nesta categoria.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function StepTab({ active, done, number, label, onClick }: { active: boolean; done: boolean; number: string; label: string; onClick: () => void }) {
  return (
    <button className={`flex items-center justify-center gap-3 px-4 py-5 font-sans text-[.7rem] font-bold uppercase tracking-[.12em] transition-colors ${active ? 'bg-bubble-ink text-bubble-white' : 'bg-bubble-white text-bubble-ink/50 hover:bg-bubble-cream'}`} onClick={onClick}>
      <span className={`flex size-6 items-center justify-center rounded-full border text-[.62rem] ${active ? 'border-bubble-candy text-bubble-candy' : done ? 'border-bubble-brown bg-bubble-brown text-bubble-white' : 'border-bubble-line'}`}>
        {done ? '✓' : number}
      </span>
      {label}
    </button>
  );
}

function ProductChoice({
  product,
  selected,
  suggested,
  color,
  size,
  onSelect,
  onColor,
  onSize,
}: {
  product: Product;
  selected: boolean;
  suggested: boolean;
  color: string;
  size: string;
  onSelect: () => void;
  onColor: (color: string, size: string) => void;
  onSize: (size: string) => void;
}) {
  const colors = availableColors(product);
  const selectedColor = colors.find((item) => item.n === color)?.n || colors[0]?.n || '';
  const sizes = availableSizes(product, selectedColor);
  const selectedSize = sizes.includes(size) ? size : sizes[0] || '';

  return (
    <div
      className={`group relative cursor-pointer overflow-hidden border-2 bg-bubble-white transition-all ${selected ? 'border-bubble-ink shadow-[0_12px_30px_rgba(43,20,32,.14)]' : 'border-bubble-line hover:border-bubble-ink/45'}`}
      onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') onSelect();
      }}
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-bubble-cream2">
        <ProductImage product={product} />
        <div className="absolute left-2.5 top-2.5 flex flex-wrap gap-1.5">
          {selected ? <span className="bg-bubble-ink px-2.5 py-1 font-sans text-[.56rem] font-bold uppercase tracking-[.09em] text-bubble-white">Selecionado</span> : null}
          {suggested ? <span className="bg-bubble-candy px-2.5 py-1 font-sans text-[.56rem] font-bold uppercase tracking-[.09em] text-bubble-ink">Sugestão</span> : null}
        </div>
      </div>
      <div className="p-4 max-[520px]:p-2.5">
        <div className="min-h-[2.6rem] font-serif text-[.95rem] font-semibold leading-[1.35] max-[520px]:text-[.82rem]">{product.name}</div>
        <div className="mt-1 font-sans text-[.78rem] font-bold text-bubble-ink">{money.format(product.price)}</div>
        <div className={`mt-3 grid grid-cols-[minmax(0,1fr)_82px] gap-2 transition-opacity max-[520px]:grid-cols-1 ${selected ? 'opacity-100' : 'pointer-events-none opacity-35'}`}>
          <label className="font-sans text-[.55rem] font-bold uppercase tracking-[.08em] text-bubble-ink/50">
            Cor
            <select
              className="mt-1 w-full border border-bubble-line bg-bubble-white px-2 py-2 font-serif text-[.72rem] normal-case tracking-normal text-bubble-ink"
              value={selectedColor}
              disabled={!selected}
              onClick={(event) => event.stopPropagation()}
              onChange={(event) => {
                const nextColor = event.target.value;
                onColor(nextColor, availableSizes(product, nextColor)[0] || '');
              }}
            >
              {colors.map((item) => <option key={item.n} value={item.n}>{item.n}</option>)}
            </select>
          </label>
          <label className="font-sans text-[.55rem] font-bold uppercase tracking-[.08em] text-bubble-ink/50">
            Tamanho
            <select
              className="mt-1 w-full border border-bubble-line bg-bubble-white px-2 py-2 font-serif text-[.72rem] normal-case tracking-normal text-bubble-ink"
              value={selectedSize}
              disabled={!selected}
              onClick={(event) => event.stopPropagation()}
              onChange={(event) => onSize(event.target.value)}
            >
              {sizes.map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
        </div>
      </div>
    </div>
  );
}

function SelectedPiece({ label, product, color, size, onClick }: { label: string; product?: Product; color: string; size: string; onClick: () => void }) {
  return (
    <button className={`group relative aspect-[4/5] w-full overflow-hidden border text-left transition-colors ${product ? 'border-bubble-ink bg-bubble-cream2' : 'border-dashed border-bubble-line bg-bubble-cream hover:border-bubble-ink'}`} onClick={onClick}>
      {product ? (
        <>
          <div className="absolute inset-0"><ProductImage product={product} /></div>
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-bubble-ink via-bubble-ink/85 to-transparent px-3 pb-3 pt-12 text-bubble-white">
            <div className="font-sans text-[.58rem] font-bold uppercase tracking-[.13em] text-bubble-candy">{label}</div>
            <div className="mt-1 truncate font-serif text-sm font-semibold">{product.name}</div>
            <div className="mt-1 font-sans text-[.58rem] text-bubble-cream/70">{color || 'Escolha a cor'} · Tam. {size || '—'}</div>
          </div>
        </>
      ) : (
        <div className="flex size-full flex-col items-center justify-center p-3 text-center text-bubble-ink/40">
          <div className="font-display text-5xl">+</div>
          <div className="mt-2 font-sans text-[.58rem] font-bold uppercase tracking-[.12em]">Escolha {label.toLowerCase()}</div>
        </div>
      )}
    </button>
  );
}

function ProductImage({ product }: { product: Product }) {
  return product.image ? (
    <img className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.025]" src={product.image} alt={product.name} />
  ) : (
    <div className="flex size-full items-center justify-center [&_svg]:w-2/5"><ProductIcon icon={product.icon} /></div>
  );
}

function productsCanPair(first: Product, second: Product) {
  return first.pair === second.id || second.pair === first.id;
}

function orderSuggestedFirst(products: Product[], opposite?: Product) {
  if (!opposite) return products;
  return [...products].sort(
    (first, second) => Number(productsCanPair(second, opposite)) - Number(productsCanPair(first, opposite)),
  );
}

function availableColors(product: Product) {
  const configured = (product.colors || []).filter((color) => (color.sizes || []).length);
  if (!configured.length) return product.colors || [];
  return configured.filter((color) => (color.sizes || []).some((item) => Number(item.q) > 0));
}

function availableSizes(product: Product, colorName: string) {
  const configured = (product.colors || []).some((color) => (color.sizes || []).length);
  if (!configured) return product.sizes || [];
  const color = product.colors.find((item) => item.n === colorName);
  return (color?.sizes || []).filter((item) => Number(item.q) > 0).map((item) => item.size);
}
