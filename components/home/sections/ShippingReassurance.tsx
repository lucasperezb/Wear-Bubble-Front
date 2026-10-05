"use client";

import { useFreeShippingPromo } from "../../../lib/use-free-shipping-promo";

/** Faixa de garantias da campanha de frete grátis; some sozinha fora do período. */
export function ShippingReassurance({ collectionHref }: { collectionHref: string }) {
  const shippingPromo = useFreeShippingPromo();
  if (!shippingPromo.active) return null;
  const items = [
    ["Para todo o Brasil", "A entrega é por nossa conta, em qualquer região."],
    ["Sem cupom", "O frete sai zerado direto na sacola."],
    ["O mês inteiro", `Válido ${shippingPromo.period}.`],
  ];
  return (
    <section
      className="mx-auto mb-14 max-w-[1200px] px-8 max-[620px]:mb-10 max-[620px]:px-4"
      aria-label="Frete grátis em outubro"
    >
      <div className="grid border border-bubble-ink bg-bubble-cream md:grid-cols-[repeat(3,1fr)_auto]">
        {items.map(([title, text]) => (
          <div
            key={title}
            className="border-b border-bubble-ink px-6 py-5 md:border-b-0 md:border-r"
          >
            <strong className="block font-sans text-[.72rem] font-semibold uppercase tracking-[.16em]">
              {title}
            </strong>
            <p className="m-0 mt-1.5 font-serif text-[.95rem] italic text-bubble-ink/70">
              {text}
            </p>
          </div>
        ))}
        <div className="flex items-center px-6 py-4">
          <a
            href={collectionHref}
            className="inline-flex min-h-12 w-full items-center justify-center border border-bubble-ink px-6 py-3 font-sans text-[.7rem] font-semibold uppercase tracking-[.14em] text-bubble-ink transition-colors hover:bg-bubble-ink hover:text-bubble-white md:w-auto"
          >
            Ver toda a coleção
          </a>
        </div>
      </div>
    </section>
  );
}
