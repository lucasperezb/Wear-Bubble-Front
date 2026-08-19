"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Product,
  ShowcaseKey,
  ShowcaseMap,
  apiFetch,
  money,
} from "../../lib/api";
import { ProductIcon } from "../shared/ProductIcon";
import { saveButton } from "./admin.styles";
import type { Notify } from "./admin.types";
import { readDemoShowcases, writeDemoShowcase } from "../../lib/demo-store";

const pages: Array<{ key: ShowcaseKey; label: string; path: string }> = [
  { key: "home", label: "Página principal", path: "/" },
];

export function ShowcasesAdmin({
  products,
  notify,
  demoMode = false,
  onSaved,
}: {
  products: Product[];
  notify: Notify;
  demoMode?: boolean;
  onSaved?: () => void | Promise<void>;
}) {
  const [pageKey, setPageKey] = useState<ShowcaseKey>("home");
  const [showcases, setShowcases] = useState<ShowcaseMap | null>(null);
  const [heroId, setHeroId] = useState(0);
  const [ids, setIds] = useState<number[]>([0, 0, 0, 0]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const available = useMemo(
    () => products.filter((product) => product.active && product.stock > 0),
    [products],
  );

  useEffect(() => {
    if (demoMode) {
      setShowcases(readDemoShowcases());
      setLoading(false);
      return;
    }
    setLoading(true);
    apiFetch<ShowcaseMap>("/products/showcases")
      .then((response) => setShowcases(response))
      .catch((error) =>
        notify(error instanceof Error ? error.message : "Não foi possível carregar as vitrines."),
      )
      .finally(() => setLoading(false));
  }, [demoMode, notify]);

  useEffect(() => {
    const selected = showcases?.[pageKey]?.map((product) => product.id) || [];
    setIds([...selected, 0, 0, 0, 0].slice(0, 4));
  }, [pageKey, showcases]);

  useEffect(() => {
    setHeroId(showcases?.hero?.[0]?.id || 0);
  }, [showcases]);

  async function save() {
    if (!heroId) {
      notify("Selecione a peça de destaque principal.");
      return;
    }
    if (ids.some((id) => !id) || new Set(ids).size !== 4) {
      notify("Selecione quatro produtos diferentes para esta página.");
      return;
    }
    setSaving(true);
    try {
      let response: ShowcaseMap;
      if (demoMode) {
        writeDemoShowcase("hero", [heroId]);
        response = writeDemoShowcase(pageKey, ids);
      } else {
        await apiFetch<ShowcaseMap>("/products/showcases/hero", {
          method: "PATCH",
          body: JSON.stringify({ productIds: [heroId] }),
        });
        response = await apiFetch<ShowcaseMap>(`/products/showcases/${pageKey}`, {
          method: "PATCH",
          body: JSON.stringify({ productIds: ids }),
        });
      }
      setShowcases(response);
      await onSaved?.();
      notify("Vitrine da página atualizada.");
    } catch (error) {
      notify(error instanceof Error ? error.message : "Não foi possível salvar a vitrine.");
    } finally {
      setSaving(false);
    }
  }

  const currentPage = pages.find((page) => page.key === pageKey)!;

  return (
    <>
      <div className="mb-5 border border-bubble-candy bg-bubble-candy/15 p-4 text-[.72rem] leading-relaxed">
        <b>Vitrine da página principal.</b> Escolha uma peça exclusiva para o grande destaque no início do site e, separadamente, as quatro peças da seção “Em destaque”. As demais páginas são preenchidas automaticamente pela categoria e pelo nome da coleção informados no cadastro de cada produto.
      </div>
      <div className="mb-5 flex flex-wrap gap-2">
        {pages.map((page) => (
          <button
            key={page.key}
            type="button"
            onClick={() => setPageKey(page.key)}
            className={`${page.key === pageKey ? "bg-bubble-ink text-bubble-cream" : "bg-bubble-white text-bubble-ink"} border border-bubble-ink px-4 py-3 font-sans text-[.65rem] font-bold uppercase tracking-[.1em]`}
          >
            {page.label}
          </button>
        ))}
      </div>

      <div className="border border-bubble-line bg-bubble-white p-5 sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-3 border-b border-bubble-line pb-5">
          <div>
            <span className="font-sans text-[.6rem] font-bold uppercase tracking-[.14em] text-bubble-ink/40">Editando</span>
            <h3 className="mt-1 text-2xl">{currentPage.label}</h3>
          </div>
          <a href={`${currentPage.path}${demoMode ? "?demo=1" : ""}`} target="_blank" rel="noreferrer" className="font-sans text-[.65rem] font-bold uppercase tracking-[.1em] underline">Visualizar página ↗</a>
        </div>

        {loading ? <p className="py-10 text-center text-sm text-bubble-ink/50">Carregando seleção...</p> : (
          <>
            <div className="mt-5 border border-bubble-candy bg-bubble-candy/10 p-4 sm:p-5">
              <div className="mb-4">
                <span className="font-sans text-[.6rem] font-bold uppercase tracking-[.14em] text-bubble-brown">Abertura do site</span>
                <h4 className="mt-1 text-xl">Peça de destaque</h4>
                <p className="mt-1 text-[.72rem] text-bubble-ink/55">Esta escolha é independente das quatro peças exibidas abaixo.</p>
              </div>
              <div className="grid max-w-[620px] grid-cols-[78px_1fr] gap-4 border border-bubble-line bg-bubble-cream p-3">
                {(() => {
                  const selected = available.find((product) => product.id === heroId);
                  return (
                    <>
                      <div className="flex aspect-[3/4] items-center justify-center overflow-hidden bg-bubble-white [&_img]:size-full [&_img]:object-cover [&_svg]:w-3/5">
                        {selected?.image ? <img src={selected.image} alt="" /> : selected ? <ProductIcon icon={selected.icon} /> : <span className="font-display text-2xl text-bubble-ink/25">★</span>}
                      </div>
                      <label className="self-center font-sans text-[.6rem] font-bold uppercase tracking-[.1em] text-bubble-ink/45">
                        Destaque principal
                        <select value={heroId} onChange={(event) => setHeroId(Number(event.target.value))} className="mt-2 w-full border border-bubble-line bg-bubble-white px-3 py-3 font-serif text-[.8rem] normal-case tracking-normal text-bubble-ink">
                          <option value={0}>Selecione uma peça</option>
                          {available.map((product) => <option key={product.id} value={product.id}>{product.name} · {money.format(product.price)}</option>)}
                        </select>
                      </label>
                    </>
                  );
                })()}
              </div>
            </div>
            <h4 className="mt-7 text-xl">Quatro peças em destaque</h4>
            <div className="mt-4 grid gap-4 lg:grid-cols-2">
            {ids.map((id, position) => {
              const selected = available.find((product) => product.id === id);
              return (
                <div key={position} className="grid grid-cols-[78px_1fr] gap-4 border border-bubble-line bg-bubble-cream p-3">
                  <div className="flex aspect-[3/4] items-center justify-center overflow-hidden bg-bubble-white [&_img]:size-full [&_img]:object-cover [&_svg]:w-3/5">
                    {selected?.image ? <img src={selected.image} alt="" /> : selected ? <ProductIcon icon={selected.icon} /> : <span className="font-display text-2xl text-bubble-ink/25">{position + 1}</span>}
                  </div>
                  <label className="self-center font-sans text-[.6rem] font-bold uppercase tracking-[.1em] text-bubble-ink/45">
                    Posição {position + 1}
                    <select
                      value={id}
                      onChange={(event) => setIds((current) => current.map((value, index) => index === position ? Number(event.target.value) : value))}
                      className="mt-2 w-full border border-bubble-line bg-bubble-white px-3 py-3 font-serif text-[.8rem] normal-case tracking-normal text-bubble-ink"
                    >
                      <option value={0}>Selecione uma peça</option>
                      {available.map((product) => (
                        <option key={product.id} value={product.id} disabled={ids.some((selectedId, index) => index !== position && selectedId === product.id)}>
                          {product.name} · {money.format(product.price)}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              );
            })}
            </div>
          </>
        )}
      </div>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-4 border border-bubble-line bg-bubble-white p-4">
        <p className="text-[.72rem] text-bubble-ink/55">Somente peças publicadas e com estoque podem ser selecionadas.</p>
        <button type="button" className={saveButton} disabled={loading || saving} onClick={() => void save()}>
          {saving ? "Salvando..." : "Salvar vitrine"}
        </button>
      </div>
    </>
  );
}
