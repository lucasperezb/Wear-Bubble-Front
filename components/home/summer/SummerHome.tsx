"use client";

import { Product, money } from "../../../lib/api";
import { productPrice } from "../../../lib/pricing";
import {
  productImagesForColor,
  orderedProductImages,
} from "../../../lib/product-images";
import { productPath } from "../../../lib/product-url";
import { SUMMER, type FizzHome, topNotIncluded } from "../../../lib/season";
import { ProductCard } from "../../product/catalog/ProductCard";
import { BenefitsStrip, RotatingSeal, SummerBubbles } from "../../season";
import { ProductIcon, SafeImage } from "../../shared";

type SummerProps = {
  /** Peças escolhidas no painel (lib/season.ts → resolveFizzHome). */
  home: FizzHome;
  loading?: boolean;
  demoMode?: boolean;
};

const button =
  "inline-flex min-h-13 items-center justify-center border border-bubble-ink px-7 py-4 font-sans text-[.72rem] font-semibold uppercase tracking-[.14em] transition-all";

function withDemo(href: string, demoMode?: boolean) {
  return `${href}${demoMode ? (href.includes("?") ? "&demo=1" : "?demo=1") : ""}`;
}

function imageFor(product: Product | undefined, color: string, index = 0) {
  if (!product) return null;
  const images = productImagesForColor(product, color);
  return (images[index] || images[0])?.url || product.image || null;
}

/** Hero da coleção + faixa preta + faixa de vantagens. */
export function SummerHero({ home, demoMode }: SummerProps) {
  const { main, mainColor, side: second } = home;
  const mainImage = imageFor(main, mainColor);
  const secondImage = second
    ? imageFor(second, second.colors?.[0]?.n || "")
    : null;

  return (
    <>
      <section
        id="top"
        className="wb-efervescente relative overflow-hidden border-b border-bubble-ink px-6 py-12 md:px-10 md:py-16 lg:min-h-[640px] lg:py-20"
      >
        <SummerBubbles />
        <svg
          className="pointer-events-none absolute left-[22%] top-[34%] z-0 h-auto w-[min(420px,80vw)] -translate-x-1/2 -translate-y-1/2 text-bubble-ink opacity-[.07]"
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
        <div className="relative mx-auto grid max-w-[1240px] items-center gap-12 lg:grid-cols-[1fr_1fr] lg:gap-16">
          <div className="relative z-10 min-w-0">
            <span className="inline-flex items-center gap-2 rounded-full border border-bubble-ink bg-bubble-sun px-3.5 py-[6px] font-sans text-[.62rem] font-semibold uppercase tracking-[.16em]">
              <span
                className="size-1.5 rounded-full bg-bubble-ink"
                aria-hidden="true"
              />
              Nova coleção · Verão
            </span>
            <h1 className="mt-5 text-[clamp(2.8rem,8vw,5.6rem)] leading-[.92] tracking-[-.03em]">
              Coleção
              <br />
              {SUMMER.collectionName}
            </h1>
            <p className="m-0 mt-4 font-serif text-[clamp(1.1rem,2.2vw,1.65rem)]">
              <em className="font-semibold">vista bubble</em> —{" "}
              {SUMMER.heroLine}.
            </p>
            <p className="m-0 mt-5 max-w-[520px] font-serif text-[clamp(.98rem,1.4vw,1.08rem)] italic leading-[1.7] text-bubble-ink/70">
              {SUMMER.heroText}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href="#novidades"
                className={`${button} bg-bubble-ink text-bubble-white hover:bg-bubble-brown`}
              >
                Ver as novas peças
              </a>
              <a
                href="#conjunto"
                className={`${button} bg-transparent text-bubble-ink hover:bg-bubble-ink hover:text-bubble-white`}
              >
                Montar meu conjunto
              </a>
            </div>
          </div>

          <div className="relative z-10 flex min-w-0 items-end justify-center gap-4 sm:gap-5">
            {main ? (
              <a
                href={withDemo(productPath(main), demoMode)}
                className="group relative block aspect-[4/5] w-full max-w-[400px] flex-[1.6] border border-bubble-ink bg-[linear-gradient(145deg,#e5dcc5,#f5f0e4)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-bubble-ink"
                aria-label={`Abrir ${main.name}`}
              >
                <div className="flex size-full items-center justify-center overflow-hidden [&_svg]:w-[44%] [&_svg]:text-bubble-brown">
                  {mainImage ? (
                    <SafeImage
                      src={mainImage}
                      alt={`${main.name} · ${mainColor}`}
                      className="size-full object-cover transition-transform duration-700 group-hover:scale-[1.025]"
                      fetchPriority="high"
                      decoding="async"
                      fallback={<ProductIcon icon={main.icon} />}
                    />
                  ) : (
                    <ProductIcon icon={main.icon} />
                  )}
                </div>
                <RotatingSeal className="absolute right-2 top-2 z-10 size-[88px] sm:-right-8 sm:-top-8 sm:size-[118px]" />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-bubble-ink/85 via-bubble-ink/35 to-transparent px-4 pb-4 pt-16 text-bubble-white sm:px-6 sm:pb-6 sm:pt-24">
                  <span className="font-sans text-[.56rem] font-semibold uppercase tracking-[.18em] text-bubble-white/80">
                    Destaque do verão
                  </span>
                  <strong className="mt-1 block font-serif text-[1.05rem] font-normal leading-tight sm:text-[1.6rem]">
                    {main.name}
                    {mainColor ? ` · ${mainColor.toLowerCase()}` : ""}
                  </strong>
                  <div className="mt-1 flex flex-wrap items-end justify-between gap-2">
                    <span className="font-sans text-[.82rem] font-semibold sm:text-sm">
                      {money.format(productPrice(main))}
                      {topNotIncluded(main) ? (
                        <span className="font-serif text-[.72rem] font-normal italic text-bubble-white/80">
                          {" "}
                          · top não incluso
                        </span>
                      ) : null}
                    </span>
                    <span className="hidden border-b border-bubble-white pb-0.5 font-sans text-[.6rem] font-semibold uppercase tracking-[.12em] sm:block">
                      Ver a peça →
                    </span>
                  </div>
                </div>
              </a>
            ) : (
              <div className="aspect-[4/5] w-full max-w-[400px] flex-[1.6] animate-pulse border border-bubble-ink/20 bg-bubble-cream2" />
            )}
            {second ? (
              <a
                href={withDemo(productPath(second), demoMode)}
                className="group mb-2 flex min-w-0 flex-1 flex-col gap-2 max-[420px]:hidden focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-bubble-ink"
                aria-label={`Abrir ${second.name}`}
              >
                <span className="relative block aspect-[3/4] overflow-hidden border border-bubble-ink bg-bubble-cream2 [&_svg]:mx-auto [&_svg]:mt-[30%] [&_svg]:w-1/2">
                  {secondImage ? (
                    <SafeImage
                      src={secondImage}
                      alt={second.name}
                      className="size-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                      loading="lazy"
                      decoding="async"
                      fallback={<ProductIcon icon={second.icon} />}
                    />
                  ) : (
                    <ProductIcon icon={second.icon} />
                  )}
                  <span className="absolute left-2.5 top-2.5 bg-bubble-sun px-2 py-1 font-sans text-[.56rem] font-bold uppercase tracking-[.12em]">
                    Novo
                  </span>
                </span>
                <span className="font-serif text-[.9rem] leading-tight">
                  {second.name}
                </span>
                <span className="font-sans text-[.84rem] font-semibold">
                  {money.format(productPrice(second))}
                </span>
              </a>
            ) : null}
          </div>
        </div>
      </section>

      <SummerMarquee />
      <BenefitsStrip />
    </>
  );
}

function SummerMarquee() {
  // Duas metades iguais: a animação anda -50% e recomeça.
  const half = (
    <>
      <b>Coleção {SUMMER.collectionName}</b>
      <span>O verão chegou</span>
      <span>5% off no Pix</span>
      <span>Conjunto com 5% off</span>
      <span>Troca em 30 dias</span>
    </>
  );
  return (
    <div
      className="overflow-hidden whitespace-nowrap bg-bubble-ink py-[13px] text-bubble-cream"
      aria-hidden="true"
    >
      <div className="inline-block animate-marquee font-sans text-[.72rem] font-semibold uppercase tracking-[.2em] motion-reduce:animate-none [&_b]:mx-7 [&_b]:font-semibold [&_b]:text-bubble-sun [&_span]:mx-7">
        {half}
        {half}
        {half}
        {half}
      </div>
    </div>
  );
}

/** "As novidades": peças escolhidas no painel, com cores clicáveis e tamanhos. */
export function SummerNews({ home, loading, demoMode }: SummerProps) {
  const products = home.news;
  return (
    <section id="novidades" className="py-[85px] max-[520px]:py-12">
      <div className="mx-auto max-w-[1200px] px-8 max-[520px]:px-3.5">
        <div className="mb-9 flex flex-wrap items-end justify-between gap-4 max-[520px]:mb-5">
          <div>
            <span className="flex items-center gap-2 font-sans text-[.66rem] font-semibold uppercase tracking-[.24em]">
              <span
                className="size-2 rounded-full bg-bubble-sun"
                aria-hidden="true"
              />
              Nova coleção · {SUMMER.collectionName}
            </span>
            <h2 className="mt-2 text-[2.6rem] max-[520px]:text-[2rem]">
              As <span className="wb-marca">novidades</span>
            </h2>
          </div>
          <p className="m-0 max-w-[380px] text-[.9rem] italic leading-[1.6] text-bubble-ink/60">
            Toque na cor para ver a peça. Clique na foto para tecido, medidas e
            sugestão de conjunto.
          </p>
        </div>
        <div className="grid grid-cols-5 gap-x-3 gap-y-9 max-[1100px]:grid-cols-4 max-[980px]:grid-cols-3 max-[720px]:grid-cols-2 max-[720px]:gap-x-2 max-[720px]:gap-y-7">
          {loading && !products.length
            ? Array.from({ length: 5 }, (_, index) => (
                <div
                  key={index}
                  className="aspect-[3/4] animate-pulse bg-bubble-cream2"
                />
              ))
            : products
                .slice(0, 10)
                .map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    href={withDemo(productPath(product), demoMode)}
                    showSizes
                  />
                ))}
        </div>
        <div className="mt-11 flex justify-center">
          <a
            href={withDemo(SUMMER.collectionHref, demoMode)}
            className={`${button} bg-transparent text-bubble-ink hover:bg-bubble-ink hover:text-bubble-white`}
          >
            Ver toda a coleção {SUMMER.collectionName}
          </a>
        </div>
      </div>
    </section>
  );
}

/** "A coleção": fundo pêssego, três fotos e a história da Fizz. */
export function SummerStory({ home }: SummerProps) {
  const fallback = home.news.flatMap((product) =>
    orderedProductImages(product).map((image) => image.url),
  );
  const photos = home.story.map((slot, position) => ({
    label: slot.label,
    url:
      imageFor(slot.product, slot.color, slot.index) ||
      fallback[position] ||
      null,
  }));

  return (
    <section className="relative overflow-hidden border-y border-bubble-ink bg-bubble-peach">
      <span
        className="pointer-events-none absolute -right-16 -top-24 size-[260px] rounded-full border-[16px] border-bubble-sun/70 max-[720px]:hidden"
        aria-hidden="true"
      />
      <span
        className="pointer-events-none absolute right-[13%] top-[120px] size-[46px] rounded-full border-[6px] border-bubble-sun/70 max-[720px]:hidden"
        aria-hidden="true"
      />
      <div className="relative mx-auto grid max-w-[1200px] items-center gap-12 px-8 py-[72px] max-[520px]:px-4 max-[520px]:py-12 lg:grid-cols-[1.05fr_.95fr]">
        <div className="grid grid-cols-2 gap-3">
          {photos.map((photo, index) => (
            <figure
              key={photo.label}
              className={`relative m-0 overflow-hidden border border-bubble-ink bg-bubble-cream2 ${index === 0 ? "row-span-2" : "aspect-square"}`}
            >
              {photo.url ? (
                <SafeImage
                  src={photo.url}
                  alt={photo.label}
                  className="size-full object-cover"
                  loading="lazy"
                  decoding="async"
                />
              ) : null}
              <figcaption className="absolute bottom-2.5 left-2.5 bg-bubble-cream-light px-2 py-1 font-sans text-[.56rem] font-semibold uppercase tracking-[.12em]">
                {photo.label}
              </figcaption>
            </figure>
          ))}
        </div>
        <div className="min-w-0">
          <span className="font-sans text-[.66rem] font-semibold uppercase tracking-[.24em]">
            A coleção
          </span>
          <h2 className="mt-3 text-[2.6rem] leading-none max-[520px]:text-[2.1rem]">
            {SUMMER.collectionName}
          </h2>
          <p className="m-0 mt-5 max-w-[520px] text-[1rem] italic leading-[1.7] text-bubble-ink/75">
            {SUMMER.story.text}
          </p>
          <ol className="m-0 mt-6 flex list-none flex-col gap-3 p-0">
            {SUMMER.story.points.map((point, index) => (
              <li key={point} className="flex items-baseline gap-4">
                <span className="font-display text-[1rem]">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="font-serif text-[1rem] font-semibold">
                  {point}
                </span>
              </li>
            ))}
          </ol>
          <a
            href="#conjunto"
            className={`${button} mt-8 bg-bubble-ink text-bubble-white hover:bg-bubble-brown`}
          >
            Montar meu conjunto · 5% OFF
          </a>
        </div>
      </div>
    </section>
  );
}
