"use client";

import { useEffect, useMemo, useState } from "react";
import { Product, apiFetch, money } from "../../lib/api";
import { ProductIcon } from "../shared/ProductIcon";
import { chartCard, saveButton } from "./admin.styles";
import type { Notify, OnSaved } from "./admin.types";

export function CombosAdmin({
  products,
  onSaved,
  notify,
}: {
  products: Product[];
  onSaved: OnSaved;
  notify: Notify;
}) {
  const bottoms = useMemo(
    () => available(products, "Parte de baixo"),
    [products],
  );
  const tops = useMemo(() => available(products, "Top"), [products]);
  const [bottomIds, setBottomIds] = useState<number[]>(() =>
    selectedIds(bottoms),
  );
  const [topIds, setTopIds] = useState<number[]>(() => selectedIds(tops));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setBottomIds(selectedIds(bottoms));
    setTopIds(selectedIds(tops));
  }, [bottoms, tops]);

  async function save() {
    if (!validSelection(bottomIds) || !validSelection(topIds)) {
      notify("Selecione três produtos diferentes em cada categoria.");
      return;
    }
    setSaving(true);
    try {
      await apiFetch("/products/bundle-selection", {
        method: "PATCH",
        body: JSON.stringify({ bottomIds, topIds }),
      });
      await onSaved();
      notify("Vitrine de conjuntos atualizada com 3 partes de baixo e 3 tops.");
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

  return (
    <>
      <div className="mb-[18px] border border-bubble-candy bg-bubble-candy/15 px-[13px] py-[11px] text-[.68rem] leading-[1.6] text-bubble-ink">
        <b>Vitrine de conjuntos.</b> Escolha exatamente 3 partes de baixo e 3
        tops. Somente essas seis peças aparecerão no configurador da loja, na
        ordem definida abaixo.
      </div>
      <div className="grid grid-cols-2 gap-5 max-[980px]:grid-cols-1">
        <SelectionGroup
          title="Partes de baixo"
          products={bottoms}
          ids={bottomIds}
          onIds={setBottomIds}
        />
        <SelectionGroup
          title="Tops"
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
          disabled={saving || bottoms.length < 3 || tops.length < 3}
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
  return (
    <div className={chartCard}>
      <h4>{title}</h4>
      <div className="mt-4 space-y-3">
        {[0, 1, 2].map((position) => {
          const selected = products.find(
            (product) => product.id === ids[position],
          );
          return (
            <div
              className="grid grid-cols-[58px_minmax(0,1fr)] items-center gap-3 border border-bubble-line bg-bubble-cream p-3"
              key={position}
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
                  value={ids[position] || 0}
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
                        (id, index) => index !== position && id === product.id,
                      )}
                      key={product.id}
                      value={product.id}
                    >
                      {product.name} · {money.format(product.price)}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function available(products: Product[], category: string) {
  return products.filter(
    (product) =>
      product.active && product.stock > 0 && product.cat === category,
  );
}

function selectedIds(products: Product[]) {
  const ids = products
    .filter((product) => product.bundlePosition > 0)
    .sort((first, second) => first.bundlePosition - second.bundlePosition)
    .slice(0, 3)
    .map((product) => product.id);
  return [...ids, 0, 0, 0].slice(0, 3);
}

function validSelection(ids: number[]) {
  return (
    ids.length === 3 && ids.every((id) => id > 0) && new Set(ids).size === 3
  );
}
