"use client";

import { Product } from "../../../lib/api";
import { blackFridayEndLabel, blackFridayOffer } from "../../../lib/black-friday";
import { productHasPromotion } from "../../../lib/pricing";
import { orderedProductImages } from "../../../lib/product-images";
import { productPath } from "../../../lib/product-url";
import { findProductByName, summerProducts } from "../../../lib/season";
import { useBlackFridayCountdown } from "../../../lib/use-black-friday";
import { ProductCard } from "../../product/catalog/ProductCard";
import { SafeImage } from "../../shared";

type Props = { products: Product[]; loading?: boolean; demoMode?: boolean };

const btn =
  "inline-flex min-h-13 items-center justify-center border-2 px-7 py-4 font-sans text-[.74rem] font-semibold uppercase tracking-[.16em] transition-colors";
const label = "font-sans text-[.68rem] font-semibold uppercase tracking-[.22em]";

function withDemo(href: string, demoMode?: boolean) {
  return `${href}${demoMode ? (href.includes("?") ? "&demo=1" : "?demo=1") : ""}`;
}
const img = (p?: Product) => (p ? orderedProductImages(p)[0]?.url || p.image || "" : "");
const two = (n: number) => String(n).padStart(2, "0");

/** Peças da vitrine: as da coleção de verão com desconto; sem desconto, a coleção inteira. */
function offerProducts(products: Product[]) {
  const published = products.filter((p) => p.active !== false);
  const fizz = summerProducts(products);
  const onSale = published.filter(productHasPromotion);
  const fizzOnSale = fizz.filter(productHasPromotion);
  const list = fizzOnSale.length ? [...fizzOnSale, ...onSale.filter((p) => !fizzOnSale.includes(p))] : onSale.length ? onSale : fizz;
  return list.slice(0, 8);
}

function Countdown({ compact }: { compact?: boolean }) {
  const c = useBlackFridayCountdown();
  const parts: Array<[string, number | undefined]> = [
    ["dias", c?.days], ["horas", c?.hours], ["min", c?.minutes], ["seg", c?.seconds],
  ];
  if (compact) return <>{c ? `${two(c.days)}D ${two(c.hours)}H ${two(c.minutes)}M` : "--"}</>;
  return (
    <div className="flex gap-2.5" aria-label="Tempo até o fim da Black Friday">
      {parts.map(([name, value]) => (
        <div key={name} className="w-[84px] border-2 border-bubble-cream/20 py-3 text-center max-[520px]:w-[68px]">
          <b className="block font-display text-[2.2rem] leading-none max-[520px]:text-[1.6rem]">{value === undefined ? "--" : two(value)}</b>
          <span className={`${label} mt-1.5 block text-[.6rem] text-bubble-cream/55`}>{name}</span>
        </div>
      ))}
    </div>
  );
}

/** Barra do topo durante a Black (substitui a do Header na home). */
export function BlackFridayBar() {
  return (
    <div className="bg-bubble-sun px-4 py-[9px] text-center font-sans text-[.72rem] font-semibold uppercase tracking-[.16em] text-bubble-ink">
      Black Friday Bubble · {blackFridayOffer}
      <span className="max-[520px]:hidden"> · termina em <Countdown compact /> · +5% OFF no Pix</span>
    </div>
  );
}

export function BlackFridayHome({ products, loading, demoMode }: Props) {
  const offers = offerProducts(products);
  const fizz = summerProducts(products);
  const pick = (name: string) => findProductByName(products, name) || fizz[0];
  const heroMain = pick("Short Fizz Pocket");
  const heroA = pick("Calça Fizz Flare");
  const heroB = pick("Macaquinho Fizz");
  const treinos = [
    { sport: "Musculação", name: "Short Fizz Pocket", line: "bolso que segura o celular" },
    { sport: "Pilates", name: "Calça Fizz Flare", line: "cintura em V, boca flare" },
    { sport: "Beach tennis", name: "Short-saia Fizz", line: "cara de saia, short por baixo" },
    { sport: "Corrida", name: "Macaquinho Fizz", line: "uma peça só, look pronto" },
  ].map((t) => ({ ...t, product: findProductByName(products, t.name) }))
    .filter((t) => t.product);

  return (
    <div className="bg-bubble-ink text-bubble-cream">
      {/* HERO */}
      <section id="top" className={`mx-auto grid max-w-[1200px] items-center gap-12 px-8 py-16 max-[520px]:px-4 max-[520px]:py-9 ${heroMain ? "lg:grid-cols-[1.05fr_1fr]" : ""}`}>
        <div>
          <span className={`${label} text-bubble-sun`}>Black Friday · Coleção Fizz</span>
          <h1 className="mt-4 font-display text-[clamp(3.4rem,9vw,7.4rem)] uppercase leading-[.9] text-bubble-cream">
            Black<br />Friday<br />Bubble
          </h1>
          <p className="mt-4 font-display text-[clamp(2.2rem,5.5vw,4.6rem)] uppercase leading-[.95] text-bubble-sun">{blackFridayOffer}</p>
          <p className="mt-6 max-w-[500px] font-serif text-[1.15rem] leading-[1.55] text-bubble-cream/80 max-[520px]:text-base">
            A Fizz com preço de Black, e ainda 5% off no Pix e 5% off montando seu conjunto. Quantidade limitada.
          </p>
          <div className="mt-7"><Countdown /></div>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href="#ofertas" className={`${btn} border-bubble-sun bg-bubble-sun text-bubble-ink hover:bg-bubble-cream hover:border-bubble-cream`}>Ver ofertas</a>
            <a href="#conjunto" className={`${btn} border-bubble-cream text-bubble-cream hover:bg-bubble-cream hover:text-bubble-ink`}>Montar meu conjunto</a>
          </div>
        </div>
        {heroMain ? <div className="grid h-[600px] grid-cols-[1.4fr_1fr] gap-3 max-[720px]:h-[420px]">
          {[heroMain].map((p) => p && (
            <a key={p.id} href={withDemo(productPath(p), demoMode)} className="relative overflow-hidden border-2 border-bubble-cream">
              <SafeImage src={img(p)} alt={p.name} className="size-full object-cover object-[30%_30%]" />
              <span className={`${label} absolute bottom-3 left-3 bg-bubble-sun px-2.5 py-1.5 text-bubble-ink`}>{p.name}</span>
            </a>
          ))}
          <div className="grid grid-rows-2 gap-3">
            {[heroA, heroB].map((p, i) => p && (
              <a key={`${p.id}-${i}`} href={withDemo(productPath(p), demoMode)} className="relative overflow-hidden border-2 border-bubble-cream">
                <SafeImage src={img(p)} alt={p.name} className="size-full object-cover object-top" />
                <span className={`${label} absolute bottom-3 left-3 bg-bubble-sun px-2.5 py-1.5 text-[.6rem] text-bubble-ink`}>{p.name}</span>
              </a>
            ))}
          </div>
        </div> : null}
      </section>

      {/* FAIXA */}
      <div className="overflow-hidden border-y border-bubble-ink bg-bubble-cream py-4 text-bubble-ink" aria-hidden="true">
        <div className="flex w-max animate-marquee whitespace-nowrap font-sans text-[.82rem] font-semibold uppercase tracking-[.2em]">
          {Array.from({ length: 2 }, (_, k) => (
            <span key={k} className="flex">
              {["Black Friday Bubble", "+5% OFF no Pix", "Conjunto com 5% OFF", "Troca em 30 dias", "Quantidade limitada"].map((t) => (
                <span key={t} className="px-7">{t} ●</span>
              ))}
            </span>
          ))}
        </div>
      </div>

      {/* OFERTAS */}
      {loading || offers.length ? <section id="ofertas" className="mx-auto max-w-[1200px] px-8 py-[85px] max-[520px]:px-3.5 max-[520px]:py-12">
        <div className="mb-9 flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className={`${label} text-bubble-sun`}>As ofertas</span>
            <h2 className="mt-2 font-display text-[3.4rem] uppercase leading-[.92] text-bubble-cream max-[520px]:text-[2.3rem]">Preço de Black</h2>
          </div>
          <p className="m-0 max-w-[360px] font-serif text-[.92rem] italic text-bubble-cream/60">Toque na cor para ver a peça. Short e calça são vendidos sem o top.</p>
        </div>
        <div className="grid grid-cols-4 gap-x-4 gap-y-10 rounded-none bg-bubble-cream p-5 text-bubble-ink max-[980px]:grid-cols-3 max-[720px]:grid-cols-2 max-[720px]:gap-x-2 max-[720px]:p-2.5">
          {loading && !offers.length
            ? Array.from({ length: 4 }, (_, i) => <div key={i} className="aspect-[3/4] animate-pulse bg-bubble-cream2" />)
            : offers.map((p) => <ProductCard key={p.id} product={p} href={withDemo(productPath(p), demoMode)} showSizes />)}
        </div>
        <div className="mt-10 flex justify-center">
          <a href={withDemo("/promocoes", demoMode)} className={`${btn} border-bubble-cream text-bubble-cream hover:bg-bubble-cream hover:text-bubble-ink`}>Ver todas as peças em promoção</a>
        </div>
      </section> : null}

      {/* POR TREINO */}
      {treinos.length ? (
        <section className="mx-auto max-w-[1200px] px-8 pb-[85px] max-[520px]:px-3.5 max-[520px]:pb-12">
          <span className={`${label} text-bubble-sun`}>Compre pelo seu treino</span>
          <h2 className="mb-8 mt-2 font-display text-[3.4rem] uppercase leading-[.92] max-[520px]:text-[2.3rem]">Qual modo é o seu?</h2>
          <div className="grid grid-cols-4 border border-bubble-cream/20 max-[720px]:grid-cols-2">
            {treinos.map((t) => (
              <a key={t.sport} href={withDemo(productPath(t.product as Product), demoMode)} className="group relative h-[420px] overflow-hidden border-r border-bubble-cream/20 last:border-r-0 max-[720px]:h-[250px] max-[720px]:border-b">
                <SafeImage src={img(t.product)} alt={t.name} className="absolute inset-0 size-full object-cover object-top brightness-[.6] grayscale transition duration-300 group-hover:brightness-90 group-hover:grayscale-0" />
                <div className="absolute inset-x-5 bottom-5 max-[520px]:inset-x-3 max-[520px]:bottom-3">
                  <span className={`${label} text-bubble-sun`}>{t.sport}</span>
                  <h3 className="mt-1 font-display text-[1.9rem] uppercase leading-[.95] text-bubble-cream max-[520px]:text-[1.15rem]">{t.name}</h3>
                  <p className="mt-1.5 font-serif text-[.92rem] italic text-bubble-cream/85 max-[520px]:text-[.78rem]">{t.line}</p>
                </div>
              </a>
            ))}
          </div>
        </section>
      ) : null}

      {/* GARANTIAS */}
      <div className="mx-auto grid max-w-[1200px] grid-cols-4 border-y border-bubble-cream/20 max-[720px]:grid-cols-2">
        {[
          ["Troca em 30 dias", "não serviu, a gente resolve"],
          ["5% off no Pix", "somado ao preço de Black"],
          ["Conjunto 5% off", "na aba Monte seu look"],
          ["Dúvida de tamanho?", "chama no direct, a gente responde"],
        ].map(([t, s]) => (
          <div key={t} className="border-r border-bubble-cream/20 px-7 py-8 last:border-r-0 max-[720px]:border-b max-[720px]:px-4">
            <b className="block font-display text-[1.25rem] uppercase leading-tight max-[520px]:text-base">{t}</b>
            <span className="mt-2 block font-serif text-[.92rem] italic text-bubble-cream/60">{s}</span>
          </div>
        ))}
      </div>

      {/* FAQ */}
      <section className="mx-auto grid max-w-[1200px] gap-12 px-8 py-[85px] max-[520px]:gap-5 max-[520px]:px-4 max-[520px]:py-12 lg:grid-cols-[1fr_1.4fr]">
        <div>
          <span className={`${label} text-bubble-sun`}>Antes de fechar o carrinho</span>
          <h2 className="mt-2 font-display text-[3rem] uppercase leading-[.92] max-[520px]:text-[2.2rem]">Perguntas<br />rápidas</h2>
        </div>
        <div>
          {[
            ["Até quando vale a Black?", `Até ${blackFridayEndLabel()}, ou enquanto durar o estoque.`],
            ["O top das fotos vem junto?", "Não. O Short Fizz Pocket e a Calça Fizz Flare são vendidos sem o top."],
            ["Os descontos se somam?", "Sim: preço de Black, mais 5% montando o conjunto e mais 5% pagando no Pix."],
            ["Posso trocar peça comprada na Black?", "Pode, em até 30 dias."],
          ].map(([q, a], i) => (
            <details key={q} open={i === 0} className="group border-b border-bubble-cream/20 py-5">
              <summary className="flex cursor-pointer list-none justify-between font-sans text-[1.1rem] font-medium tracking-[.03em] [&::-webkit-details-marker]:hidden">
                {q}<span className="text-bubble-sun group-open:rotate-45 transition-transform">+</span>
              </summary>
              <p className="mt-3 font-serif leading-[1.55] text-bubble-cream/75">{a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* BARRA FIXA NO CELULAR */}
      <a href="#ofertas" className="fixed inset-x-0 bottom-0 z-[150] flex items-center justify-between bg-bubble-sun px-4 py-3.5 font-sans text-[.74rem] font-semibold uppercase tracking-[.12em] text-bubble-ink md:hidden">
        <span>Black · termina em <Countdown compact /></span><span>Ver ofertas →</span>
      </a>
      <div className="h-12 md:hidden" aria-hidden="true" />
    </div>
  );
}

