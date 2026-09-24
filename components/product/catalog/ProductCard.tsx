import { Product, money } from '../../../lib/api';
import { productHasPromotion, productPrice, promotionPct } from '../../../lib/pricing';
import { orderedProductImages } from '../../../lib/product-images';
import { ProductIcon, PromoBadge, SafeImage } from '../../shared';

type ProductCardProps = {
  product: Product;
  href: string;
};

const MAX_SWATCHES = 5;

export function ProductCard({ product, href }: ProductCardProps) {
  const out = product.stock <= 0;
  const low = product.stock > 0 && product.stock <= 5;
  const finalPrice = productPrice(product);
  const promo = productHasPromotion(product);
  const gallery = orderedProductImages(product);
  const primary = product.image || gallery[0]?.url || null;
  const secondary = gallery.find((image) => image.url !== primary)?.url || null;
  const colors = product.colors || [];

  return (
    <a
      href={href}
      className={`group flex min-w-0 flex-col focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-bubble-ink ${out ? 'opacity-55' : ''}`}
      aria-label={`Ver detalhes de ${product.name}`}
    >
      <div className="relative flex aspect-[3/4] items-center justify-center overflow-hidden bg-[linear-gradient(160deg,#EAE2CC,#F3EDDD)] [&_svg]:w-[46%] [&_svg]:opacity-[.88]">
        {primary ? (
          <SafeImage className="size-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]" src={primary} alt={product.name} loading="lazy" decoding="async" fallback={<ProductIcon icon={product.icon} />} />
        ) : (
          <ProductIcon icon={product.icon} />
        )}
        {secondary ? (
          <SafeImage className="absolute inset-0 hidden size-full object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100 [@media(hover:hover)]:block" src={secondary} alt="" loading="lazy" decoding="async" />
        ) : null}
        {out ? (
          <span className="absolute left-3 top-3 z-[2] bg-bubble-ink/70 px-2.5 py-[5px] font-sans text-[.6rem] font-bold uppercase tracking-[.12em] text-bubble-white max-[520px]:left-2 max-[520px]:top-2">Esgotado</span>
        ) : product.collectionName ? (
          <span className="absolute left-3 top-3 z-[2] max-w-[calc(100%-76px)] truncate bg-bubble-ink px-2.5 py-[5px] font-sans text-[.6rem] font-bold uppercase tracking-[.12em] text-bubble-white max-[520px]:left-2 max-[520px]:top-2 max-[520px]:max-w-[calc(100%-64px)] max-[520px]:px-2">{product.collectionName}</span>
        ) : null}
        {promo && !out ? <PromoBadge pct={promotionPct(product)} /> : null}
        {low ? (
          <span className="absolute bottom-3 left-3 z-[2] bg-bubble-white/90 px-2 py-1 font-sans text-[.56rem] font-bold uppercase tracking-[.1em] text-bubble-danger max-[520px]:bottom-2 max-[520px]:left-2">Últimas {product.stock} unidades</span>
        ) : null}
      </div>
      <div className="flex flex-col gap-1 pt-3 max-[520px]:pt-2.5">
        <div className="line-clamp-2 font-serif text-[.95rem] leading-[1.3] underline-offset-4 group-hover:underline max-[520px]:text-[.88rem]">{product.name}</div>
        <div className="flex flex-wrap items-baseline gap-x-2 font-sans text-[.9rem] font-semibold max-[520px]:text-[.84rem]">
          {promo ? <span className="text-[.76rem] font-normal text-bubble-ink/45 line-through">{money.format(product.price)}</span> : null}
          <span className={promo ? 'text-bubble-danger' : 'text-bubble-ink'}>{money.format(finalPrice)}</span>
        </div>
        {colors.length > 1 ? (
          <div className="mt-1 flex items-center gap-1.5" aria-label={`${colors.length} cores`}>
            {colors.slice(0, MAX_SWATCHES).map((color) => (
              <span key={color.n} title={color.n} className="size-3 rounded-full border border-bubble-ink/20" style={{ background: color.h }} />
            ))}
            {colors.length > MAX_SWATCHES ? <span className="font-sans text-[.66rem] text-bubble-ink/55">+{colors.length - MAX_SWATCHES}</span> : null}
          </div>
        ) : null}
      </div>
    </a>
  );
}
