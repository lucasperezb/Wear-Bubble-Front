"use client";

import { useEffect, useMemo, useState } from "react";
import { Layers, Tag } from "lucide-react";
import { Product, apiFetch, money } from "../../../lib/api";
import { productHasPromotion, productPrice, promotionPct } from "../../../lib/pricing";
import {
  PROGRESSIVE_MAX_PCT,
  PROGRESSIVE_MAX_TIERS,
  calculateProgressiveDiscount,
  clampPct,
  type ProgressiveSettings,
  type PromotionSettings,
} from "../../../lib/progressive-discount";
import { primePromotionSettings } from "../../../lib/use-promotion-settings";
import { describeProgressiveTiers } from "../../cart";
import { ProductIcon } from "../../shared";
import { adminNote, outlineButton, primaryButton, productInput, productLabel, smallButton } from "../shared/styles";
import type { Notify, OnSaved } from "../shared/types";

type PromotionsAdminProps = {
  onSaved: OnSaved;
  notify: Notify;
};

type PromotionTab = "individual" | "progressive";

const tabs: Array<{ key: PromotionTab; label: string; icon: typeof Tag; hint: string }> = [
  { key: "individual", label: "Individuais", icon: Tag, hint: "Desconto fixo por peça" },
  { key: "progressive", label: "Cumulativas", icon: Layers, hint: "Desconto progressivo por quantidade" },
];

export function PromotionsAdmin({ onSaved, notify }: PromotionsAdminProps) {
  const [tab, setTab] = useState<PromotionTab>("individual");
  const [products, setProducts] = useState<Product[]>([]);
  const [settings, setSettings] = useState<PromotionSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [switching, setSwitching] = useState<PromotionTab | null>(null);
  const visibleProducts = useMemo(
    () => products.filter((product) => product.active !== false),
    [products],
  );

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      apiFetch<Product[]>("/products/admin"),
      apiFetch<PromotionSettings>("/promotions/settings"),
    ])
      .then(([productsRes, settingsRes]) => {
        if (cancelled) return;
        setProducts(productsRes);
        setSettings(settingsRes);
      })
      .catch((error) => {
        notify(
          error instanceof Error
            ? error.message
            : "Não foi possível carregar as promoções.",
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

  async function saveSettings(
    patch: { individualEnabled?: boolean; progressive?: Partial<ProgressiveSettings> },
    successMessage: string,
  ) {
    const saved = await apiFetch<PromotionSettings>("/promotions/admin/settings", {
      method: "PATCH",
      body: JSON.stringify(patch),
    });
    setSettings(saved);
    primePromotionSettings(saved);
    await onSaved();
    notify(successMessage);
    return saved;
  }

  async function toggle(which: PromotionTab, enabled: boolean) {
    setSwitching(which);
    try {
      if (which === "individual") {
        await saveSettings(
          { individualEnabled: enabled },
          enabled
            ? "Promoções individuais ativadas na loja."
            : "Promoções individuais desativadas. Os percentuais continuam salvos.",
        );
      } else {
        await saveSettings(
          { progressive: { enabled } },
          enabled
            ? "Desconto progressivo ativado na loja."
            : "Desconto progressivo desativado.",
        );
      }
    } catch (error) {
      notify(
        error instanceof Error
          ? error.message
          : "Não foi possível alterar a promoção.",
      );
    } finally {
      setSwitching(null);
    }
  }

  if (loading || !settings) return <p className={adminNote}>Carregando promoções...</p>;

  return (
    <>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4 border-b border-bubble-line pb-5">
        <div>
          <h4 className="text-xl">Promoções</h4>
          <p className="mt-1 text-[.72rem] text-bubble-ink/55">
            Duas promoções independentes: cada uma tem a própria chave de ativação e as duas podem valer ao mesmo tempo.
          </p>
        </div>
        <div className="flex border border-bubble-ink" role="tablist" aria-label="Tipo de promoção">
          {tabs.map(({ key, label, icon: Icon }) => {
            const enabled = key === "individual" ? settings.individualEnabled : settings.progressive.enabled;
            return (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={tab === key}
                onClick={() => setTab(key)}
                className={`flex items-center gap-2 px-4 py-[9px] font-sans text-[.66rem] font-semibold uppercase tracking-[.1em] transition-colors ${tab === key ? "bg-bubble-ink text-bubble-white" : "bg-transparent text-bubble-ink hover:bg-bubble-cream2"}`}
              >
                <Icon size={13} strokeWidth={2} />
                {label}
                <span
                  className={`size-1.5 rounded-full ${enabled ? "bg-bubble-success" : tab === key ? "bg-bubble-white/40" : "bg-bubble-ink/25"}`}
                  aria-label={enabled ? "ativada" : "desativada"}
                />
              </button>
            );
          })}
        </div>
      </div>

      {tab === "individual" ? (
        <>
          <MasterSwitch
            enabled={settings.individualEnabled}
            busy={switching === "individual"}
            title="Promoções individuais"
            description={
              settings.individualEnabled
                ? "A loja mostra o preço promocional das peças com desconto cadastrado."
                : "A loja mostra todas as peças a preço cheio. Os percentuais abaixo ficam salvos para quando você religar."
            }
            onChange={(enabled) => void toggle("individual", enabled)}
          />
          <IndividualPromotions
            products={visibleProducts}
            enabled={settings.individualEnabled}
            onProducts={setProducts}
            onSaved={onSaved}
            notify={notify}
          />
        </>
      ) : (
        <>
          <MasterSwitch
            enabled={settings.progressive.enabled}
            busy={switching === "progressive"}
            title="Desconto progressivo por quantidade"
            description={
              settings.progressive.enabled
                ? `Ativo na loja: ${describeProgressiveTiers(settings.progressive) || "sem faixas"}.`
                : "Desligado. A loja não mostra nem aplica o desconto por quantidade."
            }
            onChange={(enabled) => void toggle("progressive", enabled)}
          />
          <ProgressivePromotions
            settings={settings.progressive}
            individualEnabled={settings.individualEnabled}
            products={visibleProducts}
            onSave={(progressive) =>
              saveSettings({ progressive }, "Faixas do desconto progressivo salvas.")
            }
            notify={notify}
          />
        </>
      )}
    </>
  );
}

function MasterSwitch({
  enabled,
  busy,
  title,
  description,
  onChange,
}: {
  enabled: boolean;
  busy: boolean;
  title: string;
  description: string;
  onChange: (enabled: boolean) => void;
}) {
  return (
    <div className={`mb-5 flex flex-wrap items-center justify-between gap-4 border px-4 py-4 sm:px-5 ${enabled ? "border-bubble-success/60 bg-bubble-success/5" : "border-bubble-line bg-bubble-white"}`}>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-sans text-[.68rem] font-bold uppercase tracking-[.14em] text-bubble-ink/75">{title}</span>
          <span className={`px-2 py-[3px] font-sans text-[.56rem] font-bold uppercase tracking-[.12em] ${enabled ? "bg-bubble-success text-bubble-white" : "bg-bubble-ink/10 text-bubble-ink/60"}`}>
            {enabled ? "Ativada" : "Desativada"}
          </span>
        </div>
        <p className="mt-1 text-[.72rem] leading-relaxed text-bubble-ink/60">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        disabled={busy}
        onClick={() => onChange(!enabled)}
        className={`flex shrink-0 items-center gap-3 border px-3 py-2 font-sans text-[.62rem] font-semibold uppercase tracking-[.1em] transition-colors disabled:opacity-50 ${enabled ? "border-bubble-ink bg-bubble-ink text-bubble-white hover:bg-bubble-brown" : "border-bubble-ink bg-transparent text-bubble-ink hover:bg-bubble-cream2"}`}
      >
        <span className={`relative h-[18px] w-[34px] rounded-full transition-colors ${enabled ? "bg-bubble-success" : "bg-bubble-ink/25"}`} aria-hidden="true">
          <span className={`absolute top-[2px] size-[14px] rounded-full bg-bubble-white transition-[left] ${enabled ? "left-[18px]" : "left-[2px]"}`} />
        </span>
        {busy ? "Salvando..." : enabled ? "Desativar" : "Ativar"}
      </button>
    </div>
  );
}

function IndividualPromotions({
  products,
  enabled,
  onProducts,
  onSaved,
  notify,
}: {
  products: Product[];
  enabled: boolean;
  onProducts: (products: Product[]) => void;
  onSaved: OnSaved;
  notify: Notify;
}) {
  const [drafts, setDrafts] = useState<Record<number, number>>({});
  const [savingId, setSavingId] = useState<number | null>(null);

  useEffect(() => {
    setDrafts(
      Object.fromEntries(
        products.map((product) => [product.id, promotionPct(product)]),
      ),
    );
  }, [products]);

  async function save(product: Product) {
    const promoPct = normalizePct(drafts[product.id]);
    setSavingId(product.id);
    try {
      await apiFetch(`/products/${product.id}`, {
        method: "PATCH",
        body: JSON.stringify({ promoPct }),
      });
      const refreshed = await apiFetch<Product[]>("/products/admin");
      onProducts(refreshed);
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
      <p className="mb-3 text-[.72rem] text-bubble-ink/55">
        {products.length} peça{products.length === 1 ? "" : "s"} ativa{products.length === 1 ? "" : "s"} na vitrine principal.
      </p>
      <div className={`overflow-hidden border border-bubble-line bg-bubble-white ${enabled ? "" : "opacity-70"}`}>
        {products.map((product) => {
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
                  <img className="size-full object-cover" src={product.image} alt="" loading="lazy" decoding="async" />
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
                  <div className={`mt-2 font-sans text-[.62rem] font-bold uppercase tracking-[.08em] ${enabled ? "text-bubble-danger" : "text-bubble-ink/40"}`}>
                    {enabled ? `Promoção atual · ${current}% OFF` : `${current}% OFF salvo · pausado`}
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
        {!products.length ? (
          <div className="p-6 text-center text-[.8rem] text-bubble-ink/55">
            Nenhuma peça ativa na vitrine principal.
          </div>
        ) : null}
      </div>
    </>
  );
}

const ordinal = ["", "1ª", "2ª", "3ª", "4ª", "5ª", "6ª", "7ª", "8ª", "9ª", "10ª"];

function ProgressivePromotions({
  settings,
  individualEnabled,
  products,
  onSave,
  notify,
}: {
  settings: ProgressiveSettings;
  individualEnabled: boolean;
  products: Product[];
  onSave: (progressive: Partial<ProgressiveSettings>) => Promise<PromotionSettings>;
  notify: Notify;
}) {
  const [draft, setDraft] = useState<ProgressiveSettings>(settings);
  const [saving, setSaving] = useState(false);
  const [simulatedPrice, setSimulatedPrice] = useState(
    products[0] ? Number(products[0].price) : 119.9,
  );

  useEffect(() => {
    setDraft(settings);
  }, [settings]);

  const changed =
    JSON.stringify({ ...draft, enabled: settings.enabled }) !==
    JSON.stringify(settings);
  const tiersValid = draft.tiers.some((pct) => pct > 0);

  function updateTier(index: number, value: unknown) {
    setDraft((current) => ({
      ...current,
      tiers: current.tiers.map((pct, position) =>
        position === index ? clampPct(value) : pct,
      ),
    }));
  }

  async function save() {
    if (!tiersValid) {
      notify("Informe pelo menos uma faixa com desconto maior que zero.");
      return;
    }
    setSaving(true);
    try {
      await onSave({
        tiers: draft.tiers,
        extendLast: draft.extendLast,
        stackWithOtherDiscounts: draft.stackWithOtherDiscounts,
      });
    } catch (error) {
      notify(
        error instanceof Error
          ? error.message
          : "Não foi possível salvar as faixas.",
      );
    } finally {
      setSaving(false);
    }
  }

  const simulation = Array.from({ length: draft.tiers.length + 1 }, (_, index) => {
    const count = index + 1;
    const units = Array.from({ length: count }, (__, unit) => ({
      key: String(unit),
      price: simulatedPrice,
      eligible: true,
    }));
    const result = calculateProgressiveDiscount(units, { ...draft, enabled: true });
    const gross = simulatedPrice * count;
    return {
      count,
      gross,
      net: Math.round((gross - result.discount) * 100) / 100,
      effectivePct: result.effectivePct,
    };
  });

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(360px,.9fr)]">
      <section className="border border-bubble-line bg-bubble-white p-4 sm:p-5">
        <h5 className="font-sans text-[.66rem] font-bold uppercase tracking-[.14em] text-bubble-ink/70">Faixas de desconto</h5>
        <p className="mt-1 text-[.72rem] leading-relaxed text-bubble-ink/55">
          A peça mais cara do carrinho paga cheio. A partir da 2ª, cada peça recebe a % da sua faixa — a mais barata fica com a maior. Peças com quantidade contam uma a uma.
        </p>

        <div className="mt-4 space-y-2">
          <div className="grid grid-cols-[minmax(0,1fr)_120px_36px] items-center gap-3 font-sans text-[.58rem] font-bold uppercase tracking-[.1em] text-bubble-ink/45">
            <span>Peça</span>
            <span>Desconto (%)</span>
            <span />
          </div>
          <div className="grid grid-cols-[minmax(0,1fr)_120px_36px] items-center gap-3 text-[.8rem] text-bubble-ink/60">
            <span>1ª peça</span>
            <span className="border border-transparent px-[11px] py-[9px] text-[.82rem]">0 — preço cheio</span>
            <span />
          </div>
          {draft.tiers.map((pct, index) => (
            <div key={index} className="grid grid-cols-[minmax(0,1fr)_120px_36px] items-center gap-3 text-[.8rem]">
              <span>{ordinal[index + 2] || `${index + 2}ª`} peça</span>
              <input
                className={`${productInput} text-[.82rem]`}
                type="number"
                min="0"
                max={PROGRESSIVE_MAX_PCT}
                step="1"
                value={pct}
                aria-label={`Desconto na ${index + 2}ª peça`}
                onChange={(event) => updateTier(index, event.target.value)}
              />
              <button
                type="button"
                aria-label={`Remover faixa da ${index + 2}ª peça`}
                disabled={draft.tiers.length <= 1 || index !== draft.tiers.length - 1}
                onClick={() =>
                  setDraft((current) => ({ ...current, tiers: current.tiers.slice(0, -1) }))
                }
                className="flex size-9 items-center justify-center border border-bubble-line text-lg leading-none text-bubble-ink/60 hover:border-bubble-ink hover:text-bubble-ink disabled:cursor-not-allowed disabled:opacity-30"
              >
                ×
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          className={`${smallButton} mt-3`}
          disabled={draft.tiers.length >= PROGRESSIVE_MAX_TIERS}
          onClick={() =>
            setDraft((current) => ({
              ...current,
              tiers: [...current.tiers, current.tiers[current.tiers.length - 1] ?? 10],
            }))
          }
        >
          + Adicionar faixa ({draft.tiers.length + 2}ª peça)
        </button>

        <div className="mt-5 space-y-3 border-t border-bubble-line pt-4">
          <label className="flex cursor-pointer items-start gap-3 text-[.78rem]">
            <input
              type="checkbox"
              className="mt-[3px] size-4 accent-bubble-ink"
              checked={draft.extendLast}
              onChange={(event) => setDraft((current) => ({ ...current, extendLast: event.target.checked }))}
            />
            <span>
              <span className="block font-semibold">Repetir a última faixa nas peças seguintes</span>
              <span className="block text-[.7rem] text-bubble-ink/55">
                Com {draft.tiers.length + 1} faixas, a {draft.tiers.length + 2}ª peça em diante {draft.extendLast ? `ganha ${draft.tiers[draft.tiers.length - 1] ?? 0}%` : "paga preço cheio"}.
              </span>
            </span>
          </label>
          <label className="flex cursor-pointer items-start gap-3 text-[.78rem]">
            <input
              type="checkbox"
              className="mt-[3px] size-4 accent-bubble-ink"
              checked={draft.stackWithOtherDiscounts}
              onChange={(event) =>
                setDraft((current) => ({ ...current, stackWithOtherDiscounts: event.target.checked }))
              }
            />
            <span>
              <span className="block font-semibold">Acumular com promoções individuais e conjuntos</span>
              <span className="block text-[.7rem] text-bubble-ink/55">
                {draft.stackWithOtherDiscounts
                  ? "Peças já em promoção ou em conjunto também entram na contagem e recebem o progressivo por cima."
                  : "Peças em promoção individual ou em conjunto ficam fora do progressivo — só o preço cheio participa, como na planilha."}
                {!individualEnabled ? " (As individuais estão desligadas, então hoje nenhuma peça é excluída por promoção.)" : ""}
              </span>
            </span>
          </label>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-bubble-line pt-4">
          <p className="text-[.7rem] text-bubble-ink/55">
            {tiersValid ? describeProgressiveTiers({ ...draft, enabled: true }) : "Informe pelo menos uma faixa maior que zero."}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              className={`${outlineButton} px-3 py-2 text-[.58rem]`}
              disabled={saving || !changed}
              onClick={() => setDraft(settings)}
            >
              Descartar
            </button>
            <button
              type="button"
              className={`${primaryButton} px-4 py-2 text-[.58rem]`}
              disabled={saving || !changed || !tiersValid}
              onClick={() => void save()}
            >
              {saving ? "Salvando..." : "Salvar faixas"}
            </button>
          </div>
        </div>
      </section>

      <section className="border border-bubble-line bg-bubble-white p-4 sm:p-5">
        <h5 className="font-sans text-[.66rem] font-bold uppercase tracking-[.14em] text-bubble-ink/70">Simulador</h5>
        <p className="mt-1 text-[.72rem] leading-relaxed text-bubble-ink/55">
          Receita e desconto efetivo levando 1 a {draft.tiers.length + 1} unidades da mesma peça, com as faixas acima (mesmo que ainda não salvas).
        </p>
        <div className="mt-4 grid grid-cols-2 gap-2.5">
          <div>
            <label className={productLabel} htmlFor="progressive-sim-product">Peça</label>
            <select
              id="progressive-sim-product"
              className={productInput}
              value=""
              onChange={(event) => {
                const product = products.find((item) => item.id === Number(event.target.value));
                if (product) setSimulatedPrice(Number(product.price));
              }}
            >
              <option value="">Escolher da vitrine…</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name} · {money.format(product.price)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={productLabel} htmlFor="progressive-sim-price">Preço cheio (R$)</label>
            <input
              id="progressive-sim-price"
              className={productInput}
              type="number"
              min="0"
              step="0.10"
              value={simulatedPrice}
              onChange={(event) => setSimulatedPrice(Math.max(0, Number(event.target.value) || 0))}
            />
          </div>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full border-collapse text-[.78rem] tabular-nums">
            <thead>
              <tr className="bg-bubble-ink text-left font-sans text-[.58rem] font-bold uppercase tracking-[.12em] text-bubble-candy">
                <th className="px-3 py-2">Un.</th>
                <th className="px-3 py-2">Preço cheio</th>
                <th className="px-3 py-2">Com desconto</th>
                <th className="px-3 py-2">Desc. efetivo</th>
              </tr>
            </thead>
            <tbody>
              {simulation.map((row) => (
                <tr key={row.count} className="border-b border-bubble-line last:border-b-0">
                  <td className="px-3 py-2 font-semibold">{row.count}</td>
                  <td className="px-3 py-2 text-bubble-ink/60">{money.format(row.gross)}</td>
                  <td className="px-3 py-2 font-semibold">{money.format(row.net)}</td>
                  <td className={`px-3 py-2 ${row.effectivePct > 0 ? "text-bubble-success" : "text-bubble-ink/45"}`}>
                    {row.effectivePct.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className={adminNote}>
          O desconto efetivo é a média das faixas sobre o total de unidades — é o mesmo cálculo da planilha de precificação.
        </p>
      </section>
    </div>
  );
}

function normalizePct(value: unknown) {
  return Math.min(90, Math.max(0, Math.round(Number(value) || 0)));
}
