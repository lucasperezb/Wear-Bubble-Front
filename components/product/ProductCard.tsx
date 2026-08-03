import { Product, money } from '../../lib/api';
import { ProductIcon } from '../shared/ProductIcon';

type ProductCardProps = {
  product: Product;
  onOpen: (product: Product) => void;
};

export function ProductCard({ product, onOpen }: ProductCardProps) {
  const out = product.stock <= 0;
  const low = product.stock > 0 && product.stock <= 5;

  return (
    <div className={`group relative flex cursor-pointer flex-col bg-bubble-white ${out ? 'opacity-55' : ''}`} onClick={() => onOpen(product)}>
      <div className="relative flex aspect-[3/4] items-center justify-center overflow-hidden bg-[linear-gradient(160deg,#EAE2CC,#F3EDDD)] [&_svg]:w-[46%] [&_svg]:opacity-[.88] [&_svg]:transition-transform [&_svg]:duration-[400ms] group-hover:[&_svg]:scale-[1.06] group-hover:[&_svg]:-rotate-2">
        {out ? <span className="absolute left-3.5 top-3.5 z-[2] bg-bubble-ink/70 px-2.5 py-[5px] font-sans text-[.6rem] font-bold uppercase tracking-[.12em] text-bubble-white max-[520px]:left-2 max-[520px]:top-2 max-[520px]:text-[.5rem]">Esgotado</span> : product.tag ? <span className={`absolute left-3.5 top-3.5 z-[2] px-2.5 py-[5px] font-sans text-[.6rem] font-bold uppercase tracking-[.12em] max-[520px]:left-2 max-[520px]:top-2 max-[520px]:max-w-[calc(100%-16px)] max-[520px]:truncate max-[520px]:px-2 max-[520px]:text-[.5rem] ${product.tag.includes('Limitada') ? 'bg-bubble-ink text-bubble-candy' : 'bg-bubble-ink text-bubble-white'}`}>{product.tag}</span> : null}
        {product.image ? (
          <img
            className="size-full object-cover transition-transform duration-[400ms] group-hover:scale-[1.03]"
            src={product.image}
            alt={product.name}
          />
        ) : (
          <ProductIcon icon={product.icon} />
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 px-5 pb-5 pt-[22px] max-[520px]:gap-1.5 max-[520px]:px-3 max-[520px]:pb-3 max-[520px]:pt-3.5">
        <div className="text-[.7rem] uppercase tracking-[.1em] text-bubble-ink/50 max-[520px]:truncate max-[520px]:text-[.58rem]">{product.sub}<span className="max-[520px]:hidden"> · <span className="text-[.62rem] text-bubble-ink/45">{product.material}</span></span></div>
        {product.sports?.length ? (
          <div className="my-[5px] flex flex-wrap gap-[5px] max-[520px]:hidden">{product.sports.map((sport) => <span className="rounded-[20px] border border-bubble-line bg-bubble-ink/10 px-[9px] py-[3px] font-sans text-[.6rem] font-bold uppercase tracking-[.05em] text-bubble-brown" key={sport}>{sport}</span>)}</div>
        ) : null}
        <div className="font-serif text-base font-semibold leading-[1.35] max-[520px]:min-h-[2.55rem] max-[520px]:overflow-hidden max-[520px]:text-[.92rem] max-[520px]:leading-[1.35] max-[520px]:[display:-webkit-box] max-[520px]:[-webkit-box-orient:vertical] max-[520px]:[-webkit-line-clamp:2]">{product.name}</div>
        <div className="flex items-center gap-1.5 text-[.7rem] text-bubble-ink/55 max-[520px]:hidden"><span className="text-[.78rem] tracking-px text-bubble-candy">{'★'.repeat(Math.round(product.rating))}</span> {product.rating} ({product.reviews})</div>
        {low ? <div className="mt-1 text-[.66rem] font-bold text-bubble-danger">Últimas {product.stock} unidades</div> : null}
        <div className="mt-auto flex items-center justify-between gap-2.5 pt-[18px] max-[520px]:flex-col max-[520px]:items-stretch max-[520px]:gap-2 max-[520px]:pt-2.5">
          <div>
            <span className="text-[1.05rem] font-semibold text-bubble-ink max-[520px]:text-[.98rem]">{money.format(product.price)}</span>
            <span className="block text-[.66rem] font-semibold text-bubble-success max-[520px]:text-[.58rem]">{money.format(product.price * 0.95)} no Pix</span>
          </div>
          <button className="border border-bubble-ink bg-transparent px-3.5 py-2 font-sans text-[.64rem] font-bold uppercase tracking-[.1em] transition-all hover:bg-bubble-ink hover:text-bubble-white max-[520px]:w-full max-[520px]:py-2.5 max-[520px]:text-[.58rem]" type="button">Ver peça</button>
        </div>
      </div>
    </div>
  );
}
