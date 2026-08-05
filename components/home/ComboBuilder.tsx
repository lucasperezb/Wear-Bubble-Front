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

  return (
    <section className="border-y border-bubble-line bg-bubble-white py-[85px]" id="conjunto">
      <div className="mx-auto max-w-[1240px] px-8 max-[620px]:px-4">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-5">
          <div>
            <span className="font-sans text-[.72rem] font-semibold uppercase tracking-[.32em] text-bubble-brown">
              Seu look, suas escolhas
            </span>
            <h2 className="mt-1 text-[clamp(2.2rem,5vw,3.4rem)] leading-none">
              Monte seu Conjunto
            </h2>
          </div>
          <div className="max-w-[430px] border-l-2 border-bubble-candy pl-5">
            <div className="font-sans text-sm font-bold uppercase tracking-[.12em] text-bubble-ink">
              Qualquer top + parte de baixo · 5% OFF
            </div>
            <p className="mt-1 text-[.88rem] leading-[1.55] text-bubble-ink/60">
              Combine livremente. Cor e tamanho podem ser diferentes em cada peça.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-[minmax(0,1fr)_44px_minmax(0,1fr)] items-stretch gap-5 max-[760px]:grid-cols-[minmax(0,1fr)_28px_minmax(0,1fr)] max-[520px]:gap-2">
          <SelectedPiece
            label="Parte de baixo"
            product={selectedBottom}
            color={bottomColor}
            size={bottomSize}
          />
          <div className="flex items-center justify-center font-display text-[2.5rem] text-bubble-candy max-[520px]:text-[1.8rem]">+</div>
          <SelectedPiece
            label="Top"
            product={selectedTop}
            color={topColor}
            size={topSize}
          />
        </div>

        <div className="mt-12 grid grid-cols-2 gap-10 max-[900px]:grid-cols-1">
          <ChoiceColumn
            step="1"
            title="Escolha a parte de baixo"
            empty="Nenhuma parte de baixo disponível no momento."
            products={bottoms}
            selectedId={bottomId}
            selectedColor={bottomColor}
            selectedSize={bottomSize}
            opposite={selectedTop}
            onSelect={onSelectBottom}
            onColor={onBottomColor}
            onSize={onBottomSize}
          />
          <ChoiceColumn
            step="2"
            title="Escolha o top"
            empty="Nenhum top disponível no momento."
            products={tops}
            selectedId={topId}
            selectedColor={topColor}
            selectedSize={topSize}
            opposite={selectedBottom}
            onSelect={onSelectTop}
            onColor={onTopColor}
            onSize={onTopSize}
          />
        </div>

        <div className="sticky bottom-0 z-20 mt-10 border border-bubble-ink bg-bubble-ink p-6 font-serif text-bubble-cream shadow-[0_-12px_30px_rgba(43,20,32,.12)] max-[620px]:p-4">
          {selectedBottom && selectedTop ? (
            <div className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-8 max-[760px]:grid-cols-2 max-[520px]:gap-3">
              <div className="min-w-0 max-[760px]:col-span-2">
                <div className="font-sans text-[.64rem] font-bold uppercase tracking-[.14em] text-bubble-cream/55">Seu conjunto</div>
                <div className="mt-1 truncate text-[.95rem]">{selectedBottom.name} + {selectedTop.name}</div>
              </div>
              <div className="text-right max-[520px]:text-left">
                <span className="text-[.8rem] text-bubble-cream/45 line-through">{money.format(full)}</span>
                <div className="font-display text-[2rem] leading-none text-bubble-candy">{money.format(discounted)}</div>
                <div className="mt-1 font-sans text-[.6rem] font-bold uppercase tracking-[.08em] text-bubble-candy">Economize {money.format(full - discounted)}</div>
              </div>
              <button className="inline-flex min-h-12 items-center justify-center border border-bubble-candy bg-bubble-candy px-7 py-3 font-sans text-[.72rem] font-bold uppercase tracking-[.12em] text-bubble-ink transition-all hover:border-bubble-white hover:bg-bubble-white max-[520px]:px-4" onClick={onAdd}>
                Adicionar conjunto
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-5 max-[620px]:flex-col max-[620px]:items-start">
              <div>
                <div className="font-sans text-[.64rem] font-bold uppercase tracking-[.14em] text-bubble-candy">5% OFF no look completo</div>
                <div className="mt-1 text-[.9rem] text-bubble-cream/70">Escolha uma peça de cada lado para ver seu conjunto.</div>
              </div>
              <div className="font-sans text-[.68rem] uppercase tracking-[.1em] text-bubble-cream/45">
                {selectedBottom || selectedTop ? '1 de 2 peças escolhidas' : 'Comece pela peça que preferir'}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function ChoiceColumn({
  step,
  title,
  empty,
  products,
  selectedId,
  selectedColor,
  selectedSize,
  opposite,
  onSelect,
  onColor,
  onSize,
}: {
  step: string;
  title: string;
  empty: string;
  products: Product[];
  selectedId: number | null;
  selectedColor: string;
  selectedSize: string;
  opposite?: Product;
  onSelect: (product: Product) => void;
  onColor: (color: string, size: string) => void;
  onSize: (size: string) => void;
}) {
  return (
    <div>
      <div className="mb-4 flex items-center gap-3 border-b border-bubble-line pb-3">
        <span className="flex size-8 items-center justify-center rounded-full bg-bubble-ink font-sans text-xs font-bold text-bubble-white">{step}</span>
        <h3 className="font-sans text-[.78rem] font-bold uppercase tracking-[.14em] text-bubble-brown">{title}</h3>
      </div>
      {products.length ? (
        <div className="grid max-h-[920px] grid-cols-2 gap-4 overflow-y-auto pr-1 max-[420px]:gap-2">
          {products.map((product) => (
            <ProductChoice
              key={product.id}
              product={product}
              selected={selectedId === product.id}
              suggested={Boolean(opposite && productsCanPair(product, opposite))}
              color={selectedColor}
              size={selectedSize}
              onSelect={() => onSelect(product)}
              onColor={onColor}
              onSize={onSize}
            />
          ))}
        </div>
      ) : (
        <p className="border border-bubble-line bg-bubble-cream p-5 text-sm text-bubble-ink/60">{empty}</p>
      )}
    </div>
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

function SelectedPiece({ label, product, color, size }: { label: string; product?: Product; color: string; size: string }) {
  return (
    <div className={`relative min-h-[360px] overflow-hidden border ${product ? 'border-bubble-ink bg-bubble-cream2' : 'border-dashed border-bubble-line bg-bubble-cream'}`}>
      {product ? (
        <>
          <div className="absolute inset-0"><ProductImage product={product} /></div>
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-bubble-ink via-bubble-ink/85 to-transparent px-5 pb-5 pt-16 text-bubble-white max-[520px]:px-3 max-[520px]:pb-3">
            <div className="font-sans text-[.58rem] font-bold uppercase tracking-[.13em] text-bubble-candy">{label}</div>
            <div className="mt-1 truncate font-serif text-lg font-semibold max-[520px]:text-sm">{product.name}</div>
            <div className="mt-1 font-sans text-[.68rem] text-bubble-cream/70">{color || 'Escolha a cor'} · Tam. {size || '—'}</div>
          </div>
        </>
      ) : (
        <div className="flex h-full min-h-[360px] flex-col items-center justify-center p-6 text-center text-bubble-ink/40">
          <div className="font-display text-6xl">+</div>
          <div className="mt-3 font-sans text-[.68rem] font-bold uppercase tracking-[.14em]">Escolha {label.toLowerCase()}</div>
        </div>
      )}
    </div>
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
