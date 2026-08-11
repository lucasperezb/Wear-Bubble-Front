"use client";

import { useEffect, useMemo, useState } from "react";
import { Product, apiFetch, money } from "../../lib/api";
import { productHasPromotion, productPrice, promotionPct } from "../../lib/pricing";
import { ProductIcon } from "../shared/ProductIcon";
import { outlineButton, primaryButton, productInput } from "./admin.styles";
import type { Notify, OnSaved } from "./admin.types";

type PromotionsAdminProps = {
  products: Product[];
  onSaved: OnSaved;
  notify: Notify;
};

export function PromotionsAdmin({
  products,
  onSaved,
  notify,
}: PromotionsAdminProps) {
  const visibleProducts = useMemo(
    () => products.filter((product) => product.active !== false),
    [products],
  );
  const [drafts, setDrafts] = useState<Record<number, number>>({});
  const [savingId, setSavingId] = useState<number | null>(null);

  useEffect(() => {
    setDrafts(
      Object.fromEntries(
        visibleProducts.map((product) => [product.id, promotionPct(product)]),
      ),
    );
  }, [visibleProducts]);

  async function save(product: Product) {
    const promoPct = normalizePct(drafts[product.id]);
    setSavingId(product.id);
    try {
      await apiFetch(`/products/${product.id}`, {
        method: "PATCH",
        body: JSON.stringify({ promoPct }),
      });
      await onSaved();
      notify(
        promoPct > 0
          ? `Promoção de ${promoPct}% aplicada em ${product.name}.`
          : `Promoção removida de ${product.name}.`,
      );
    } catch (error) {
      notify(
        error instanceof Error
          ? error.message
          : "Não foi possível salvar a promoção.",
      );
    } finally {
      setSavingId(null);
    }
  }

  return (
    <>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4 border-b border-bubble-line pb-5">
        <div>
          <h4 className="text-xl">Promoções</h4>
          <p className="mt-1 text-[.72rem] text-bubble-ink/55">
            {visibleProducts.length} peça
            {visibleProducts.length === 1 ? "" : "s"} ativa
            {visibleProducts.length === 1 ? "" : "s"} na vitrine principal.
          </p>
        </div>
      </div>

      <div className="overflow-hidden border border-bubble-line bg-bubble-white">
        {visibleProducts.map((product) => {
          const current = promotionPct(product);
          const draft = normalizePct(drafts[product.id]);
          const preview = productPrice({ ...product, promoPct: draft });
          const changed = draft !== current;
          const saving = savingId === product.id;
          return (
            <article
              className="grid grid-cols-[64px_minmax(0,1fr)_120px_180px_auto] items-center gap-4 border-b border-bubble-line p-4 last:border-b-0 max-[860px]:grid-cols-[58px_minmax(0,1fr)_auto] max-[860px]:gap-3"
              key={product.id}
            >
              <div className="flex aspect-[3/4] w-16 items-center justify-center overflow-hidden bg-bubble-cream2 max-[860px]:w-[58px] [&_svg]:w-3/5">
                {product.image ? (
                  <img className="size-full object-cover" src={product.image} alt="" />
                ) : (
                  <ProductIcon icon={product.icon} />
                )}
              </div>
              <div className="min-w-0">
                <div className="truncate font-serif text-base font-semibold">
                  {product.name}
                </div>
                <div className="mt-1 truncate text-[.68rem] uppercase tracking-[.08em] text-bubble-ink/45">
                  #{product.id} · {product.cat} · {product.stock} un.
                </div>
                {productHasPromotion(product) ? (
                  <div className="mt-2 font-sans text-[.62rem] font-bold uppercase tracking-[.08em] text-bubble-danger">
                    Promoção atual · {current}% OFF
                  </div>
                ) : null}
              </div>
              <div className="text-[.78rem] max-[860px]:hidden">
                <span className={draft > 0 ? "text-bubble-ink/45 line-through" : "font-semibold"}>
                  {money.format(product.price)}
                </span>
                {draft > 0 ? (
                  <span className="mt-1 block font-semibold text-bubble-ink">
                    {money.format(preview)}
                  </span>
                ) : null}
              </div>
              <label className="font-sans text-[.58rem] font-bold uppercase tracking-[.1em] text-bubble-ink/45 max-[860px]:col-span-2 max-[860px]:col-start-2">
                Desconto (%)
                <input
                  className={`${productInput} mt-1 py-2 text-[.82rem]`}
                  type="number"
                  min="0"
                  max="90"
                  step="1"
                  value={drafts[product.id] ?? 0}
                  onChange={(event) =>
                    setDrafts((currentDrafts) => ({
                      ...currentDrafts,
                      [product.id]: normalizePct(event.target.value),
                    }))
                  }
                />
              </label>
              <div className="flex items-center justify-end gap-2 max-[860px]:col-span-3 max-[860px]:justify-start">
                <button
                  type="button"
                  className={`${outlineButton} px-3 py-2 text-[.58rem] text-bubble-danger`}
                  disabled={saving || draft === 0}
                  onClick={() => {
                    setDrafts((currentDrafts) => ({
                      ...currentDrafts,
                      [product.id]: 0,
                    }));
                  }}
                >
                  Remover
                </button>
                <button
                  type="button"
                  className={`${primaryButton} px-4 py-2 text-[.58rem]`}
                  disabled={saving || !changed}
                  onClick={() => void save(product)}
                >
                  {saving ? "Salvando..." : "Salvar"}
                </button>
              </div>
            </article>
          );
        })}
        {!visibleProducts.length ? (
          <div className="p-6 text-center text-[.8rem] text-bubble-ink/55">
            Nenhuma peça ativa na vitrine principal.
          </div>
        ) : null}
      </div>
    </>
  );
}

function normalizePct(value: unknown) {
  return Math.min(90, Math.max(0, Math.round(Number(value) || 0)));
}
