import type { Product } from '../../lib/api';
import { money } from '../../lib/api';
import { productPrice } from '../../lib/pricing';
import { ProductIcon } from '../shared/ProductIcon';

type HeroProps = {
  product?: Product;
  productHref?: string;
};

export function Hero({ product, productHref }: HeroProps) {
  return (
    <>
      <section className="relative overflow-hidden border-b border-bubble-ink bg-bubble-cream px-6 py-12 md:px-10 md:py-16 lg:min-h-[680px] lg:py-20" id="top">
        <div className="relative mx-auto grid max-w-[1240px] items-center gap-10 lg:grid-cols-[.9fr_1.1fr] lg:gap-16">
          <div className="relative z-10 max-w-[590px] text-center lg:text-left">
            <svg className="pointer-events-none absolute left-1/2 top-[30%] -z-10 h-auto w-[min(520px,100%)] -translate-x-1/2 -translate-y-1/2 opacity-[.075]" viewBox="0 0 200 200" aria-hidden="true">
              <circle cx="100" cy="96" r="62" fill="none" stroke="currentColor" strokeWidth="9" />
              <path d="M66 64 Q96 40 130 58" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
              <circle cx="156" cy="152" r="12" fill="currentColor" />
            </svg>
            <span className="font-sans text-[.68rem] font-semibold uppercase tracking-[.28em] text-bubble-brown">Moda fitness feminina · Coleção Core</span>
            <h1 className="mt-5 text-[clamp(3.2rem,6.3vw,6rem)] leading-[.92] tracking-[-.035em]">Estoure<br />seus limites.</h1>
            <p className="m-0 mt-4 font-serif text-[clamp(1.25rem,2.4vw,1.8rem)] font-semibold italic">vista bubble.</p>
            <p className="mx-auto mt-6 max-w-[540px] font-serif text-[clamp(1rem,1.7vw,1.25rem)] italic leading-[1.65] text-bubble-ink/70 lg:mx-0">Peças de toque macio, conforto e design versátil para acompanhar você dentro e fora do treino.</p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">
              <a href="#colecao" className="inline-flex min-h-13 items-center justify-center border border-bubble-ink bg-bubble-ink px-7 py-4 font-sans text-[.72rem] font-semibold uppercase tracking-[.14em] text-bubble-white transition-all hover:bg-bubble-brown">Conhecer a Coleção Core</a>
              <a href="#conjunto" className="inline-flex min-h-13 items-center justify-center border border-bubble-ink bg-transparent px-7 py-4 font-sans text-[.72rem] font-semibold uppercase tracking-[.14em] text-bubble-ink transition-all hover:bg-bubble-ink hover:text-bubble-white">Montar meu conjunto</a>
            </div>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 font-sans text-[.63rem] font-semibold uppercase tracking-[.1em] text-bubble-ink/60 lg:justify-start">
              <span>Frete grátis acima de R$ 199</span>
              <span className="hidden size-1 rounded-full bg-bubble-brown sm:block" aria-hidden="true" />
              <span>5% de desconto no Pix</span>
            </div>
          </div>
          <div className="relative mx-auto w-full max-w-[650px]">
            <div className="absolute -right-5 -top-5 size-28 rounded-full bg-bubble-candy/35 blur-2xl" aria-hidden="true" />
            <a href={productHref || "#colecao"} className="group relative block aspect-[5/6] w-full cursor-pointer overflow-hidden border border-bubble-ink bg-[linear-gradient(145deg,#e5dcc5,#f5f0e4)] text-left transition-shadow duration-300 hover:shadow-[0_28px_70px_rgba(23,19,14,.2)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-bubble-ink" aria-label={product ? `Abrir página de ${product.name}` : 'Conhecer a Coleção Core'}>
              <div className="size-full transition-transform duration-700 ease-out group-hover:scale-[1.035] [&_svg]:mx-auto [&_svg]:h-full [&_svg]:w-[52%] [&_svg]:text-bubble-brown">
                {product?.image ? <img src={product.image} alt={product.name} className="size-full object-cover" /> : <ProductIcon icon={product?.icon} />}
              </div>
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-bubble-ink/80 via-bubble-ink/30 to-transparent px-5 pb-5 pt-24 text-bubble-white sm:px-7 sm:pb-7">
                <span className="font-sans text-[.58rem] font-semibold uppercase tracking-[.18em] text-bubble-white/75">Destaque da coleção</span>
                <div className="mt-2 flex items-end justify-between gap-4">
                  <div>
                    <strong className="block max-w-[420px] font-serif text-lg leading-tight sm:text-2xl">{product?.name || 'Coleção Core'}</strong>
                    {product ? <span className="mt-1 block text-sm">{money.format(productPrice(product))}</span> : null}
                  </div>
                  <span className="shrink-0 border-b border-bubble-white pb-1 font-sans text-[.62rem] font-semibold uppercase tracking-[.12em] transition-transform duration-300 group-hover:translate-x-1">Ver a peça →</span>
                </div>
              </div>
            </a>
          </div>
        </div>
      </section>
      <div className="overflow-hidden whitespace-nowrap bg-bubble-ink py-[13px] text-bubble-cream">
        <div className="inline-block animate-marquee font-sans text-[.72rem] uppercase tracking-[.24em] [&_span]:mx-7 [&_span]:text-bubble-cream/85">
          <span>COLEÇÃO CORE NO AR</span> FRETE GRÁTIS A PARTIR DE R$ 199 <span>5% OFF NO PIX</span> CONJUNTO COM 5% OFF <span>TROCA EM 30 DIAS</span> COLEÇÃO CORE NO AR <span>FRETE GRÁTIS A PARTIR DE R$ 199</span> 5% OFF NO PIX <span>CONJUNTO COM 5% OFF</span> TROCA EM 30 DIAS
        </div>
      </div>
    </>
  );
}
