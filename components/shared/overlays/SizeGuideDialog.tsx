"use client";

import { useEffect, useState } from "react";
import type { Product } from "../../../lib/api";
import { clothingCategories } from "../../../lib/product-filters";
import { normalizeProductSize } from "../../../lib/product-sizes";
import {
  howToMeasure,
  measurementFields,
  resolveSizeGuide,
} from "../../../lib/size-guide";
import { useBodyScrollLock } from "../../../lib/use-body-scroll-lock";

type SizeGuideProduct = Pick<Product, "name" | "cat" | "sizes" | "measurements">;

type SizeGuideDialogProps = {
  open: boolean;
  onClose: () => void;
  product?: SizeGuideProduct | null;
  selectedSize?: string;
};

/** Tamanhos mostrados no guia genérico do rodapé, quando não há peça. */
const genericSizes = ["PP", "P", "M", "G", "GG"];

/** Ordem de exibição das letras; o que não estiver aqui mantém a ordem do guia. */
const sizeDisplayOrder = ["PP", "P", "M", "G", "GG", "XG"];

function orderGuideSizes(sizes: string[]) {
  return [...sizes].sort((first, second) => {
    const firstRank = sizeDisplayOrder.indexOf(first);
    const secondRank = sizeDisplayOrder.indexOf(second);
    if (firstRank !== -1 && secondRank !== -1) return firstRank - secondRank;
    if (firstRank !== -1) return -1;
    if (secondRank !== -1) return 1;
    return 0;
  });
}

const linkButtonClass =
  "border-0 bg-transparent p-0 font-sans text-[.68rem] font-semibold text-bubble-brown underline underline-offset-4 transition-colors hover:text-bubble-ink";

const eyebrowClass =
  "font-sans text-[.62rem] font-semibold uppercase tracking-[.18em] text-bubble-brown";

export function SizeGuideDialog({
  open,
  onClose,
  product = null,
  selectedSize = "",
}: SizeGuideDialogProps) {
  useBodyScrollLock(open);
  const [showChart, setShowChart] = useState(false);
  const [category, setCategory] = useState(clothingCategories[0]);

  useEffect(() => {
    if (open) setShowChart(false);
  }, [open]);

  useEffect(() => {
    if (!open) return;

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose, open]);

  if (!open) return null;

  const guide = product
    ? resolveSizeGuide(product)
    : resolveSizeGuide({ cat: category, sizes: genericSizes });
  const sizes = orderGuideSizes(guide.sizes);
  const currentSize = normalizeProductSize(selectedSize);

  return (
    <div
      className="fixed inset-0 z-[950] flex items-center justify-center bg-bubble-ink/75 p-5 max-[620px]:p-0"
      role="dialog"
      aria-modal="true"
      aria-labelledby="size-guide-title"
      onClick={(event) => {
        event.stopPropagation();
        onClose();
      }}
    >
      <div
        className={`${showChart ? "w-[980px]" : "w-[720px]"} flex max-h-[92vh] max-w-full flex-col overflow-hidden border border-bubble-ink bg-bubble-white shadow-bubble max-[620px]:max-h-[100dvh] max-[620px]:border-0`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between gap-4 border-b border-bubble-ink px-5 py-4 max-[620px]:px-4 max-[620px]:py-3">
          <div className="min-w-0">
            <h3 id="size-guide-title" className="text-xl max-[620px]:text-lg">
              Guia de medidas
            </h3>
            <p className="m-0 mt-0.5 truncate font-sans text-[.66rem] uppercase tracking-[.12em] text-bubble-ink/55">
              {product ? product.name : "Referência por categoria"}
            </p>
          </div>
          <button
            type="button"
            className="flex size-10 shrink-0 items-center justify-center border border-bubble-ink bg-transparent text-2xl leading-none text-bubble-ink"
            onClick={onClose}
            aria-label="Fechar guia de medidas"
          >
            ×
          </button>
        </div>

        {showChart ? (
          <div className="min-h-0 flex-1 overflow-auto bg-bubble-cream p-3 max-[620px]:p-2">
            <div className="mb-3 flex justify-end px-2 pt-1">
              <button
                type="button"
                className={linkButtonClass}
                onClick={() => setShowChart(false)}
              >
                Voltar ao guia
              </button>
            </div>
            <img
              className="mx-auto h-auto max-w-full"
              src="/tabela-de-medidas.png"
              alt="Tabela de medidas feminina Wear Bubble: tamanhos 36 a 44"
            />
          </div>
        ) : (
          <div className="min-h-0 flex-1 overflow-auto bg-bubble-cream p-5 max-[620px]:p-4">
            {!product ? (
              <div className="mb-5 flex border border-bubble-ink" role="group" aria-label="Categoria">
                {clothingCategories.map((item) => {
                  const active = item === category;
                  return (
                    <button
                      key={item}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setCategory(item)}
                      className={`${active ? "bg-bubble-ink text-bubble-cream" : "bg-transparent text-bubble-ink hover:bg-bubble-cream2"} flex-1 border-0 px-2 py-2.5 font-sans text-[.62rem] font-semibold uppercase tracking-[.12em] transition-colors`}
                    >
                      {item}
                    </button>
                  );
                })}
              </div>
            ) : null}

            <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
              <span className={eyebrowClass}>Medidas do corpo em centímetros</span>
              {product && currentSize && sizes.includes(currentSize) ? (
                <span className="font-sans text-[.62rem] uppercase tracking-[.12em] text-bubble-ink/55">
                  Selecionado · {currentSize}
                </span>
              ) : null}
            </div>

            <div className="overflow-x-auto border border-bubble-ink bg-bubble-white">
              <table className="w-full border-collapse text-left font-sans text-[.78rem]">
                <thead>
                  <tr>
                    <th
                      scope="col"
                      className="whitespace-nowrap border-b border-bubble-ink px-3 py-2.5 text-[.62rem] font-semibold uppercase tracking-[.12em] text-bubble-ink/60"
                    >
                      Tamanho
                    </th>
                    {guide.fields.map((field) => (
                      <th
                        key={field}
                        scope="col"
                        className="whitespace-nowrap border-b border-bubble-ink px-3 py-2.5 text-[.62rem] font-semibold uppercase tracking-[.12em] text-bubble-ink/60"
                      >
                        {measurementFields[field].label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sizes.map((size) => {
                    const current = Boolean(product) && size === currentSize;
                    return (
                      <tr
                        key={size}
                        aria-current={current ? "true" : undefined}
                        className={`${current ? "bg-bubble-ink text-bubble-cream" : "text-bubble-ink"} border-b border-bubble-line last:border-b-0`}
                      >
                        <th
                          scope="row"
                          className="whitespace-nowrap px-3 py-2.5 text-left font-semibold"
                        >
                          {size}
                        </th>
                        {guide.fields.map((field) => (
                          <td
                            key={field}
                            className="whitespace-nowrap px-3 py-2.5 tabular-nums"
                          >
                            {guide.rows[size]?.[field] || "—"}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="mt-6">
              <span className={eyebrowClass}>Como medir</span>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                {howToMeasure.map((step) => (
                  <div key={step.field} className="border border-bubble-line bg-bubble-white p-3">
                    <div className="font-sans text-[.68rem] font-semibold uppercase tracking-[.12em]">
                      {step.title}
                    </div>
                    <p className="m-0 mt-1 text-[.74rem] leading-[1.55] text-bubble-ink/65">
                      {step.text}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <p className="m-0 mt-5 text-[.8rem] italic leading-[1.6] text-bubble-ink/60">
              {guide.fitAdvice}
            </p>
            {guide.notes ? (
              <p className="m-0 mt-3 border-l-2 border-bubble-ink pl-3 text-[.8rem] leading-[1.55] text-bubble-ink">
                {guide.notes}
              </p>
            ) : null}

            <div className="mt-6 flex flex-wrap items-center justify-between gap-2 border-t border-bubble-line pt-4">
              <span className="text-[.7rem] text-bubble-ink/45">
                Prefere a numeração 36–44?
              </span>
              <button
                type="button"
                className={linkButtonClass}
                onClick={() => setShowChart(true)}
              >
                Ver tabela completa
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
