"use client";

import { useEffect, useState } from "react";
import { money, type HeroConfig, type Product } from "../../../lib/api";
import { productPrice } from "../../../lib/pricing";
import { ProductIcon } from "../../shared";

type HeroProps = {
  config: HeroConfig;
  product?: Product;
  productHref?: string;
  collectionHref?: string;
};

export function Hero({
  config,
  product,
  productHref,
  collectionHref = "/produtos",
}: HeroProps) {
  const slides = config.slides.filter((slide) => slide.active);

  return (
    <>
      {config.enabled && slides.length ? (
        <HeroCarousel slides={slides} />
      ) : (
        <StaticHero
          product={product}
          productHref={productHref}
          collectionHref={collectionHref}
        />
      )}
      <PromoMarquee />
    </>
  );
}

function HeroCarousel({ slides }: { slides: HeroConfig["slides"] }) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    setCurrent((index) => Math.min(index, slides.length - 1));
  }, [slides.length]);

  useEffect(() => {
    if (
      slides.length < 2 ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;
    const timer = window.setInterval(
      () => setCurrent((index) => (index + 1) % slides.length),
      6500,
    );
    return () => window.clearInterval(timer);
  }, [slides.length]);

  const goTo = (index: number) =>
    setCurrent((index + slides.length) % slides.length);

  return (
    <section
      id="top"
      className="relative h-[clamp(520px,64vw,720px)] overflow-hidden border-b border-bubble-ink bg-bubble-ink max-[620px]:h-[520px]"
      aria-roledescription="carrossel"
      aria-label="Destaques da Wear Bubble"
    >
      {slides.map((slide, index) => (
        <a
          key={slide.id}
          href={slide.linkUrl}
          className={`absolute inset-0 block transition-opacity duration-700 motion-reduce:transition-none ${
            index === current
              ? "pointer-events-auto opacity-100"
              : "pointer-events-none opacity-0"
          }`}
          aria-hidden={index !== current}
          tabIndex={index === current ? 0 : -1}
          aria-label={`${slide.altText || "Campanha Wear Bubble"}. Abrir destino.`}
        >
          <img
            className="size-full object-cover"
            src={slide.imageUrl}
            alt={slide.altText || "Campanha Wear Bubble"}
          />
        </a>
      ))}

      {slides.length > 1 ? (
        <>
          <button
            type="button"
            className="absolute left-0 top-1/2 z-10 flex size-12 -translate-y-1/2 items-center justify-center bg-bubble-white/85 text-2xl text-bubble-ink transition-colors hover:bg-bubble-white max-[620px]:size-11"
            onClick={() => goTo(current - 1)}
            aria-label="Imagem anterior"
          >
            ‹
          </button>
          <button
            type="button"
            className="absolute right-0 top-1/2 z-10 flex size-12 -translate-y-1/2 items-center justify-center bg-bubble-white/85 text-2xl text-bubble-ink transition-colors hover:bg-bubble-white max-[620px]:size-11"
            onClick={() => goTo(current + 1)}
            aria-label="Próxima imagem"
          >
            ›
          </button>
          <div
            className="absolute bottom-5 left-1/2 z-10 flex -translate-x-1/2 gap-2"
            aria-label="Escolher imagem"
          >
            {slides.map((slide, index) => (
              <button
                key={slide.id}
                type="button"
                className={`h-2.5 rounded-full border border-bubble-white shadow-sm transition-all ${
                  index === current
                    ? "w-8 bg-bubble-white"
                    : "w-2.5 bg-bubble-ink/35 hover:bg-bubble-white/70"
                }`}
                onClick={() => goTo(index)}
                aria-label={`Ir para imagem ${index + 1}`}
                aria-current={index === current ? "true" : undefined}
              />
            ))}
          </div>
        </>
      ) : null}
    </section>
  );
}

function StaticHero({
  product,
  productHref,
  collectionHref,
}: Pick<HeroProps, "product" | "productHref" | "collectionHref">) {
  return (
    <section
      className="relative overflow-hidden border-b border-bubble-ink bg-bubble-cream px-6 py-12 md:px-10 md:py-16 lg:min-h-[680px] lg:py-20"
      id="top"
    >
      <div className="relative mx-auto grid max-w-[1240px] grid-cols-[minmax(0,1fr)_minmax(120px,42%)] items-start gap-x-4 gap-y-8 sm:gap-x-8 lg:grid-cols-[.9fr_1.1fr] lg:items-center lg:gap-x-16 lg:gap-y-0">
        <svg
          className="pointer-events-none absolute left-1/2 top-[26%] z-0 h-auto w-[min(360px,86vw)] -translate-x-1/2 -translate-y-1/2 opacity-[.075] sm:w-[min(460px,70vw)] lg:left-[24%] lg:top-[35%] lg:w-[min(520px,42vw)]"
          viewBox="0 0 200 200"
          aria-hidden="true"
        >
          <circle
            cx="100"
            cy="96"
            r="62"
            fill="none"
            stroke="currentColor"
            strokeWidth="9"
          />
          <path
            d="M66 64 Q96 40 130 58"
            fill="none"
            stroke="currentColor"
            strokeWidth="6"
            strokeLinecap="round"
          />
          <circle cx="156" cy="152" r="12" fill="currentColor" />
        </svg>
        <div className="relative z-10 col-start-1 row-start-1 min-w-0 max-w-[590px] text-left">
          <span className="font-sans text-[.56rem] font-semibold uppercase tracking-[.16em] text-bubble-brown sm:text-[.68rem] sm:tracking-[.28em]">
            Moda fitness feminina · Coleção Core
          </span>
          <h1 className="mt-4 text-[clamp(2.15rem,10vw,3.2rem)] leading-[.92] tracking-[-.035em] sm:mt-5 sm:text-[clamp(3rem,8vw,5rem)] lg:text-[clamp(3.2rem,6.3vw,6rem)]">
            Estoure
            <br />
            seus limites.
          </h1>
          <p className="m-0 mt-3 font-serif text-[clamp(1rem,3vw,1.8rem)] font-semibold italic sm:mt-4">
            vista bubble.
          </p>
        </div>
        <div className="relative z-10 col-span-2 row-start-2 text-center lg:col-span-1 lg:col-start-1 lg:text-left">
          <p className="mx-auto mt-6 max-w-[540px] font-serif text-[clamp(1rem,1.7vw,1.25rem)] italic leading-[1.65] text-bubble-ink/70 lg:mx-0">
            Peças de toque macio, conforto e design versátil para acompanhar
            você dentro e fora do treino.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">
            <a
              href={collectionHref}
              className="inline-flex min-h-13 items-center justify-center border border-bubble-ink bg-bubble-ink px-7 py-4 font-sans text-[.72rem] font-semibold uppercase tracking-[.14em] text-bubble-white transition-all hover:bg-bubble-brown"
            >
              Conhecer a Coleção Core
            </a>
            <a
              href="#conjunto"
              className="inline-flex min-h-13 items-center justify-center border border-bubble-ink bg-transparent px-7 py-4 font-sans text-[.72rem] font-semibold uppercase tracking-[.14em] text-bubble-ink transition-all hover:bg-bubble-ink hover:text-bubble-white"
            >
              Montar meu conjunto
            </a>
          </div>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 font-sans text-[.63rem] font-semibold uppercase tracking-[.1em] text-bubble-ink/60 lg:justify-start">
            <span>Frete grátis acima de R$ 199</span>
            <span
              className="hidden size-1 rounded-full bg-bubble-brown sm:block"
              aria-hidden="true"
            />
            <span>5% de desconto no Pix</span>
          </div>
        </div>
        <div className="relative col-start-2 row-start-1 mx-auto w-full max-w-[340px] self-center sm:max-w-[400px] lg:row-span-2 lg:max-w-[450px]">
          <div
            className="absolute -right-5 -top-5 size-28 rounded-full bg-bubble-candy/35 blur-2xl max-[620px]:hidden"
            aria-hidden="true"
          />
          <a
            href={productHref || "#colecao"}
            className="group relative block aspect-[4/5] w-full cursor-pointer overflow-hidden border border-bubble-ink bg-[linear-gradient(145deg,#e5dcc5,#f5f0e4)] text-left transition-shadow duration-300 hover:shadow-[0_28px_70px_rgba(23,19,14,.2)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-bubble-ink"
            aria-label={
              product
                ? `Abrir página de ${product.name}`
                : "Conhecer a Coleção Core"
            }
          >
            <div className="flex size-full items-center justify-center transition-transform duration-700 ease-out group-hover:scale-[1.025] [&_svg]:h-auto [&_svg]:max-h-[62%] [&_svg]:w-auto [&_svg]:max-w-[44%] [&_svg]:text-bubble-brown">
              {product?.image ? (
                <img
                  src={product.image}
                  alt={product.name}
                  className="size-full object-cover"
                />
              ) : (
                <ProductIcon icon={product?.icon} />
              )}
            </div>
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-bubble-ink/80 via-bubble-ink/30 to-transparent px-5 pb-5 pt-24 text-bubble-white max-[620px]:hidden sm:px-7 sm:pb-7">
              <span className="font-sans text-[.58rem] font-semibold uppercase tracking-[.18em] text-bubble-white/75">
                Destaque da coleção
              </span>
              <div className="mt-2 flex items-end justify-between gap-4 max-[420px]:flex-col max-[420px]:items-start max-[420px]:gap-3">
                <div>
                  <strong className="block max-w-[420px] font-serif text-lg leading-tight sm:text-2xl">
                    {product?.name || "Coleção Core"}
                  </strong>
                  {product ? (
                    <span className="mt-1 block text-sm">
                      {money.format(productPrice(product))}
                    </span>
                  ) : null}
                </div>
                <span className="shrink-0 border-b border-bubble-white pb-1 font-sans text-[.62rem] font-semibold uppercase tracking-[.12em] transition-transform duration-300 group-hover:translate-x-1">
                  Ver a peça →
                </span>
              </div>
            </div>
          </a>
        </div>
      </div>
    </section>
  );
}

function PromoMarquee() {
  return (
    <div className="overflow-hidden whitespace-nowrap bg-bubble-ink py-[13px] text-bubble-cream">
      <div className="inline-block animate-marquee font-sans text-[.72rem] uppercase tracking-[.24em] [&_span]:mx-7 [&_span]:text-bubble-cream/85">
        <span>COLEÇÃO CORE NO AR</span> FRETE GRÁTIS DE LANÇAMENTO{" "}
        <span>5% OFF NO PIX</span> CONJUNTO COM 5% OFF{" "}
        <span>TROCA EM 30 DIAS</span> COLEÇÃO CORE NO AR{" "}
        <span>FRETE GRÁTIS EM TODOS OS PEDIDOS</span> 5% OFF NO PIX{" "}
        <span>CONJUNTO COM 5% OFF</span> TROCA EM 30 DIAS
      </div>
    </div>
  );
}
