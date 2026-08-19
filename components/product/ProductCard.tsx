import { Product, money } from '../../lib/api';
import { pixPrice, productHasPromotion, productPrice, promotionPct } from '../../lib/pricing';
import { ProductIcon } from '../shared/ProductIcon';
import { useRef } from 'react';

type ProductCardProps = {
  product: Product;
  href: string;
};

export function ProductCard({ product, href }: ProductCardProps) {
  const visualRef = useRef<HTMLDivElement>(null);
  const mediaRef = useRef<HTMLDivElement>(null);
  const out = product.stock <= 0;
  const low = product.stock > 0 && product.stock <= 5;
  const finalPrice = productPrice(product);
  const promo = productHasPromotion(product);

  function move(event: React.MouseEvent<HTMLElement>) {
    if (!visualRef.current || !mediaRef.current) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width - 0.5;
    const y = (event.clientY - bounds.top) / bounds.height - 0.5;
    visualRef.current.style.transform = `perspective(900px) rotateX(${-y * 4}deg) rotateY(${x * 5}deg) scale(1.025)`;
    mediaRef.current.style.transform = `translate(${x * 10}px, ${y * 10}px) scale(1.075)`;
  }

  function reset() {
    if (visualRef.current) visualRef.current.style.transform = '';
    if (mediaRef.current) mediaRef.current.style.transform = '';
  }

  return (
    <a
      href={href}
      className={`group relative flex cursor-pointer flex-col bg-bubble-white transition-[transform,box-shadow] duration-300 hover:z-10 hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(23,19,14,.18)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-bubble-ink ${out ? 'opacity-55' : ''}`}
      onMouseMove={move}
      onMouseLeave={reset}
      aria-label={`Ver detalhes de ${product.name}`}
    >
      <div ref={visualRef} className="relative flex aspect-[3/4] items-center justify-center overflow-hidden bg-[linear-gradient(160deg,#EAE2CC,#F3EDDD)] transition-transform duration-500 ease-out will-change-transform">
        {out ? <span className="absolute left-3.5 top-3.5 z-[2] bg-bubble-ink/70 px-2.5 py-[5px] font-sans text-[.6rem] font-bold uppercase tracking-[.12em] text-bubble-white max-[520px]:left-2 max-[520px]:top-2 max-[520px]:text-[.5rem]">Esgotado</span> : promo ? <span className="absolute left-3.5 top-3.5 z-[2] bg-bubble-danger px-2.5 py-[5px] font-sans text-[.6rem] font-bold uppercase tracking-[.12em] text-bubble-white max-[520px]:left-2 max-[520px]:top-2 max-[520px]:text-[.5rem]">{promotionPct(product)}% OFF</span> : product.collectionName ? <span className="absolute left-3.5 top-3.5 z-[2] max-w-[calc(100%-28px)] truncate bg-bubble-ink px-2.5 py-[5px] font-sans text-[.6rem] font-bold uppercase tracking-[.12em] text-bubble-white max-[520px]:left-2 max-[520px]:top-2 max-[520px]:max-w-[calc(100%-16px)] max-[520px]:px-2 max-[520px]:text-[.5rem]">{product.collectionName}</span> : null}
        <div ref={mediaRef} className="flex size-full items-center justify-center transition-transform duration-500 ease-out will-change-transform [&_svg]:w-[46%] [&_svg]:opacity-[.88]">
          {product.image ? <img className="size-full object-cover" src={product.image} alt={product.name} /> : <ProductIcon icon={product.icon} />}
        </div>
        <span className="pointer-events-none absolute bottom-4 left-1/2 z-[3] -translate-x-1/2 translate-y-3 whitespace-nowrap rounded-full bg-bubble-cream/95 px-4 py-2 font-sans text-[.58rem] font-semibold uppercase tracking-[.14em] text-bubble-ink opacity-0 shadow-bubble transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          Ver de perto · →
        </span>
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
            {promo ? <span className="block text-[.72rem] text-bubble-ink/45 line-through">{money.format(product.price)}</span> : null}
            <span className="text-[1.05rem] font-semibold text-bubble-ink max-[520px]:text-[.98rem]">{money.format(finalPrice)}</span>
            <span className="block text-[.66rem] font-semibold text-bubble-success max-[520px]:text-[.58rem]">{money.format(pixPrice(product))} no Pix</span>
          </div>
          <span className="border border-bubble-ink bg-transparent px-3.5 py-2 text-center font-sans text-[.64rem] font-bold uppercase tracking-[.1em] transition-all group-hover:bg-bubble-ink group-hover:text-bubble-white max-[520px]:w-full max-[520px]:py-2.5 max-[520px]:text-[.58rem]">Ver peça</span>
        </div>
      </div>
    </a>
  );
}
