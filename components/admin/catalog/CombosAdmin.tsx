"use client";

import { useEffect, useMemo, useState } from "react";
import { Product, apiFetch, money } from "../../../lib/api";
import { isBottomCategory, isTopCategory } from "../../../lib/product-filters";
import { ProductIcon } from "../../shared";
import { adminNote, chartCard, saveButton } from "../shared/styles";
import type { Notify, OnSaved } from "../shared/types";

export function CombosAdmin({
  onSaved,
  notify,
}: {
  onSaved: OnSaved;
  notify: Notify;
}) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const bottoms = useMemo(
    () => available(products, isBottomCategory),
    [products],
  );
  const tops = useMemo(() => available(products, isTopCategory), [products]);
  const [bottomIds, setBottomIds] = useState<number[]>([0]);
  const [topIds, setTopIds] = useState<number[]>([0]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    apiFetch<Product[]>("/products/admin")
      .then((data) => {
        if (!cancelled) setProducts(data);
      })
      .catch((error) => {
        notify(
          error instanceof Error
            ? error.message
            : "Não foi possível carregar os produtos.",
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setBottomIds(selectedIds(bottoms));
    setTopIds(selectedIds(tops));
  }, [bottoms, tops]);

  async function save() {
    if (!validSelection(bottomIds) || !validSelection(topIds)) {
      notify("Preencha as posições abertas com produtos diferentes em cada coluna.");
      return;
    }
    setSaving(true);
    try {
      await apiFetch("/products/bundle-selection", {
        method: "PATCH",
        body: JSON.stringify({ bottomIds, topIds }),
      });
      const refreshed = await apiFetch<Product[]>("/products/admin");
      setProducts(refreshed);
      await onSaved();
      notify("Vitrine de conjuntos atualizada.");
    } catch (error) {
      notify(
        error instanceof Error
          ? error.message
          : "Não foi possível salvar a vitrine.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className={adminNote}>Carregando produtos...</p>;

  return (
    <>
      <div className="mb-[18px] border border-bubble-candy bg-bubble-candy/15 px-[13px] py-[11px] text-[.68rem] leading-[1.6] text-bubble-ink">
        <b>Vitrine de conjuntos.</b> Adicione ou remova peças em cada coluna
        para definir o que aparece no configurador da loja, na ordem abaixo.
      </div>
      <div className="grid grid-cols-2 gap-5 max-[980px]:grid-cols-1">
        <SelectionGroup
          title="Shorts/Calça"
          products={bottoms}
          ids={bottomIds}
          onIds={setBottomIds}
        />
        <SelectionGroup
          title="Blusas/Top"
          products={tops}
          ids={topIds}
          onIds={setTopIds}
        />
      </div>
      <div className="mt-5 flex items-center justify-between gap-4 border border-bubble-line bg-bubble-white p-4">
        <p className="text-[.72rem] text-bubble-ink/55">
          Produtos ocultos ou sem estoque não podem ser escolhidos para a
          vitrine.
        </p>
        <button
          className={saveButton}
          disabled={saving || !bottoms.length || !tops.length}
          onClick={() => void save()}
        >
          {saving ? "Salvando..." : "Salvar vitrine"}
        </button>
      </div>
    </>
  );
}

function SelectionGroup({
  title,
  products,
  ids,
  onIds,
}: {
  title: string;
  products: Product[];
  ids: number[];
  onIds: (ids: number[]) => void;
}) {
  function addPosition() {
    if (ids.length >= products.length) return;
    onIds([...ids, 0]);
  }

  function removePosition(position: number) {
    if (ids.length <= 1) return;
    onIds(ids.filter((_, index) => index !== position));
  }

  return (
    <div className={chartCard}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h4>{title}</h4>
        <button
          type="button"
          className="border border-bubble-ink bg-bubble-white px-3 py-2 font-sans text-[.6rem] font-bold uppercase tracking-[.1em] text-bubble-ink transition-colors hover:bg-bubble-ink hover:text-bubble-white disabled:cursor-not-allowed disabled:border-bubble-line disabled:text-bubble-ink/30 disabled:hover:bg-bubble-white"
          disabled={ids.length >= products.length}
          onClick={addPosition}
        >
          + Adicionar peça
        </button>
      </div>
      <div className="mt-4 space-y-3">
        {ids.map((id, position) => {
          const selected = products.find((product) => product.id === id);
          return (
            <div
              className="grid grid-cols-[58px_minmax(0,1fr)_auto] items-center gap-3 border border-bubble-line bg-bubble-cream p-3 max-[520px]:grid-cols-[58px_minmax(0,1fr)]"
              key={`${position}-${id || "empty"}`}
            >
              <div className="flex h-[68px] w-[58px] items-center justify-center overflow-hidden bg-bubble-white [&_img]:size-full [&_img]:object-cover [&_svg]:w-3/5">
                {selected?.image ? (
                  <img src={selected.image} alt="" />
                ) : selected ? (
                  <ProductIcon icon={selected.icon} />
                ) : (
                  <span className="font-display text-2xl text-bubble-ink/25">
                    {position + 1}
                  </span>
                )}
              </div>
              <label className="font-sans text-[.58rem] font-bold uppercase tracking-[.1em] text-bubble-ink/45">
                Posição {position + 1}
                <select
                  className="mt-1.5 w-full border border-bubble-line bg-bubble-white px-3 py-2.5 font-serif text-[.78rem] normal-case tracking-normal text-bubble-ink"
                  value={id || 0}
                  onChange={(event) => {
                    const next = [...ids];
                    next[position] = Number(event.target.value);
                    onIds(next);
                  }}
                >
                  <option value={0}>Selecione um produto</option>
                  {products.map((product) => (
                    <option
                      disabled={ids.some(
                        (selectedId, index) =>
                          index !== position && selectedId === product.id,
                      )}
                      key={product.id}
                      value={product.id}
                    >
                      {product.name} · {money.format(product.price)}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                className="border border-bubble-line bg-bubble-white px-3 py-2 font-sans text-[.58rem] font-bold uppercase tracking-[.08em] text-bubble-danger disabled:cursor-not-allowed disabled:text-bubble-ink/25 max-[520px]:col-start-2 max-[520px]:justify-self-start"
                disabled={ids.length <= 1}
                onClick={() => removePosition(position)}
              >
                Remover
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function available(
  products: Product[],
  matchesCategory: (category: string) => boolean,
) {
  return products.filter(
    (product) =>
      product.active && product.stock > 0 && matchesCategory(product.cat),
  );
}

function selectedIds(products: Product[]) {
  const ids = products
    .filter((product) => product.bundlePosition > 0)
    .sort((first, second) => first.bundlePosition - second.bundlePosition)
    .map((product) => product.id);
  return ids.length ? ids : [0];
}

function validSelection(ids: number[]) {
  return (
    ids.length >= 1 &&
    ids.every((id) => id > 0) &&
    new Set(ids).size === ids.length
  );
}
