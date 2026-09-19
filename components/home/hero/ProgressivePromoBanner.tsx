"use client";

import { tierCells } from "../../cart/notices/ProgressiveDiscountNotice";
import { usePromotionSettings } from "../../../lib/use-promotion-settings";

const ordinalWord = ["", "1ª", "2ª", "3ª", "4ª", "5ª", "6ª", "7ª", "8ª", "9ª", "10ª"];

/**
 * Destaque da promoção cumulativa na home, logo abaixo do hero. Só aparece com
 * o desconto progressivo ligado no painel e ao menos uma faixa maior que zero;
 * o "até N%" é a maior faixa salva, então acompanha o painel sozinho.
 */
export function ProgressivePromoBanner({ href = "/produtos" }: { href?: string }) {
  const { progressive } = usePromotionSettings();
  if (!progressive.enabled || !progressive.tiers.some((pct) => pct > 0)) return null;

  const cells = tierCells(progressive);
  const maxPct = Math.max(...cells.map((cell) => cell.pct));
  const steps = cells
    .filter((cell) => cell.pct > 0)
    .map((cell, index, list) => {
      const from = cell.label.endsWith("+") ? `a partir da ${ordinalWord[cell.position]}` : `a ${cell.label} peça`;
      const sep = index === 0 ? "" : index === list.length - 1 ? " e " : ", ";
      return `${sep}${from} ${index === 0 ? "sai com " : ""}${cell.pct}% OFF`;
    })
    .join("");

  return (
    <section
      className="border-b border-bubble-ink bg-bubble-cream px-6 py-6 md:px-10"
      aria-label="Promoção cumulativa"
      data-testid="progressive-promo-banner"
    >
      <div className="mx-auto grid max-w-[1240px] items-center gap-5 border-[1.5px] border-bubble-ink bg-bubble-white px-5 py-5 md:grid-cols-[auto_minmax(0,1fr)_auto] md:gap-7 md:px-7">
        <div className="font-display text-[2.6rem] leading-none tracking-[-.04em] text-bubble-danger md:text-[3rem]">
          {maxPct}%
          <span className="mt-1 block font-sans text-[.6rem] font-bold uppercase tracking-[.14em] text-bubble-ink">
            até de desconto
          </span>
        </div>
        <div className="min-w-0">
          <h3 className="font-sans text-[1rem] font-bold text-bubble-ink md:text-[1.05rem]">
            Aproveite a promoção cumulativa
          </h3>
          <p className="mt-1 text-[.8rem] leading-relaxed text-bubble-ink/65">
            Quanto mais peças no carrinho, maior o desconto: {steps}.
            {progressive.stackWithOtherDiscounts ? " Vale junto com as peças que já estão em promoção." : ""}
          </p>
          <ul className="mt-3 flex gap-1 font-sans text-[.62rem] font-semibold uppercase tracking-[.06em]" aria-label="Faixas de desconto">
            {cells.map((cell) => (
              <li
                key={cell.position}
                className={`flex-1 px-1 py-[6px] text-center ${cell.pct > 0 ? "bg-bubble-ink text-bubble-cream" : "bg-bubble-cream2 text-bubble-ink/70"}`}
              >
                {cell.label} · {cell.pct > 0 ? `${cell.pct}%` : "cheio"}
              </li>
            ))}
          </ul>
        </div>
        <a
          href={href}
          className="inline-flex min-h-12 items-center justify-center border border-bubble-ink bg-bubble-ink px-6 py-3 font-sans text-[.7rem] font-semibold uppercase tracking-[.14em] text-bubble-cream transition-colors hover:bg-bubble-brown"
        >
          Montar carrinho
        </a>
      </div>
    </section>
  );
}
