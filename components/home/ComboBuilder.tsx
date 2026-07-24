import { Product, money } from '../../lib/api';
import { ProductIcon } from '../shared/ProductIcon';

type ComboBuilderProps = {
  products: Product[];
  bottomId: number | null;
  topId: number | null;
  bottomSize: string;
  topSize: string;
  onSelectBottom: (product: Product) => void;
  onSelectTop: (product: Product) => void;
  onBottomSize: (size: string) => void;
  onTopSize: (size: string) => void;
  onAdd: () => void;
};

export function ComboBuilder({ products, bottomId, topId, bottomSize, topSize, onSelectBottom, onSelectTop, onBottomSize, onTopSize, onAdd }: ComboBuilderProps) {
  const active = products.filter((product) => product.active && product.stock > 0);
  const bottoms = active.filter((product) => product.cat === 'Parte de baixo');
  const tops = active.filter((product) => product.cat === 'Top');
  const bottom = products.find((product) => product.id === bottomId);
  const top = products.find((product) => product.id === topId);
  const full = bottom && top ? bottom.price + top.price : 0;
  const discounted = full * 0.95;

  const option = (product: Product, kind: 'bottom' | 'top') => {
    const selected = kind === 'bottom' ? bottomId === product.id : topId === product.id;
    const size = kind === 'bottom' ? bottomSize : topSize;
    const onSize = kind === 'bottom' ? onBottomSize : onTopSize;
    return (
      <div className={`mb-2.5 flex cursor-pointer items-center gap-3.5 border p-[12px_14px] transition-all ${selected ? 'border-bubble-ink bg-bubble-ink/[.07]' : 'border-bubble-line bg-bubble-cream'}`} key={product.id} onClick={() => (kind === 'bottom' ? onSelectBottom(product) : onSelectTop(product))}>
        <div className="flex size-[44px] h-[52px] shrink-0 items-center justify-center bg-bubble-white [&_svg]:w-3/5"><ProductIcon icon={product.icon} /></div>
        <div><div className="text-[.82rem] font-medium">{product.name}</div><div className="text-[.74rem] font-semibold text-bubble-ink">{money.format(product.price)}</div></div>
        <select className="ml-auto border border-bubble-line bg-bubble-white px-2 py-[7px] font-inherit text-[.72rem]" value={size || product.sizes[0]} disabled={!selected} onClick={(event) => event.stopPropagation()} onChange={(event) => onSize(event.target.value)}>
          {product.sizes.map((item) => <option key={item}>{item}</option>)}
        </select>
      </div>
    );
  };

  return (
    <section className="border-y border-bubble-line bg-bubble-white py-[85px]" id="conjunto">
      <div className="mx-auto max-w-[1200px] px-8">
        <div className="mb-9 flex flex-wrap items-end justify-between gap-4">
          <div><span className="font-sans text-[.72rem] font-semibold uppercase tracking-[.32em] text-bubble-brown">Compre o look completo</span><h2 className="text-[2.6rem]">Monte seu Conjunto · 5% OFF</h2></div>
          <p className="max-w-[380px] text-[.9rem] italic leading-[1.6] text-bubble-ink/60">Escolha uma parte de baixo + um top e leve o conjunto com 5% de desconto aplicado direto na sacola.</p>
        </div>
        <div className="mt-2.5 grid grid-cols-2 gap-[34px] max-[980px]:grid-cols-1">
          <div><h4 className="mb-3.5 font-sans text-[.72rem] font-bold uppercase tracking-[.16em] text-bubble-brown">1 · Escolha a parte de baixo</h4>{bottoms.map((product) => option(product, 'bottom'))}</div>
          <div><h4 className="mb-3.5 font-sans text-[.72rem] font-bold uppercase tracking-[.16em] text-bubble-brown">2 · Escolha o top</h4>{tops.map((product) => option(product, 'top'))}</div>
        </div>
        <div className="mt-[26px] flex flex-wrap items-center justify-between gap-4 border-bubble-ink bg-bubble-ink p-6 font-serif text-bubble-cream">
          {bottom && top ? (
            <>
              <div>
                <div className="text-[.72rem] uppercase tracking-[.12em] text-bubble-cream/60">Seu conjunto</div>
                <div className="mt-1 text-[.9rem]">{bottom.name} + {top.name}</div>
              </div>
              <div className="text-right">
                <span className="text-[.85rem] text-bubble-cream/50 line-through">{money.format(full)}</span>
                <div className="font-display text-[1.8rem] text-bubble-candy">{money.format(discounted)}</div>
                <div className="text-[.7rem] font-bold uppercase tracking-[.1em] text-bubble-candy">Voce economiza {money.format(full - discounted)}</div>
              </div>
              <button className="inline-flex items-center justify-center gap-2 border border-transparent bg-bubble-ink px-[30px] py-[15px] font-sans text-[.78rem] font-semibold uppercase tracking-[.14em] text-bubble-white transition-all hover:border-bubble-ink hover:bg-bubble-white hover:text-bubble-ink" onClick={onAdd}>Adicionar conjunto</button>
            </>
          ) : <div className="text-[.84rem] text-bubble-cream/70">Escolha uma parte de baixo e um top para ver o preco do conjunto com 5% OFF.</div>}
        </div>
      </div>
    </section>
  );
}
