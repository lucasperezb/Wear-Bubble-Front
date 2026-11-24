"use client";

import type { ReactNode } from "react";
import { BlackFridayConfig, Product, money } from "../../../lib/api";
import { BF_MAX_OFFERS } from "../../../lib/black-friday";
import { promotionPct } from "../../../lib/pricing";
import type { Notify } from "../shared/types";

type ThumbProps = { product?: Product; color?: string; placeholder: string };

type Props = {
  value: BlackFridayConfig;
  available: Product[];
  notify: Notify;
  onChange: (patch: Partial<BlackFridayConfig>) => void;
  thumb: (props: ThumbProps) => ReactNode;
};

const label = "font-sans text-[.6rem] font-bold uppercase tracking-[.1em] text-bubble-ink/50";
const field = "mt-1.5 w-full border border-bubble-line bg-bubble-white px-3 py-2.5 font-serif text-[.8rem] normal-case tracking-normal text-bubble-ink";
const eyebrow = "font-sans text-[.6rem] font-bold uppercase tracking-[.14em] text-bubble-brown";

/** ISO → valor de <input type="datetime-local"> no horário de Brasília (UTC-3). */
function toLocalInput(iso: string) {
  const time = Date.parse(iso);
  return Number.isNaN(time) ? "" : new Date(time - 3 * 3_600_000).toISOString().slice(0, 16);
}

/** 23:59 vale até o último segundo do minuto. */
const fromLocalInput = (value: string) => `${value.slice(0, 16)}:59-03:00`;

export function BlackFridayEditor({ value, available, notify, onChange, thumb }: Props) {
  const byId = (id: number | null) => available.find((product) => product.id === id);
  const chosen = value.offerProductIds
    .map(byId)
    .filter((product): product is Product => Boolean(product));
  const realMax = Math.max(0, ...(chosen.length ? chosen : available).map(promotionPct));
  const withoutDiscount = chosen.filter((product) => promotionPct(product) === 0);
  const expired = Date.parse(value.endsAt) <= Date.now();

  function replace<K extends "hero" | "trainings">(key: K, position: number, patch: Partial<BlackFridayConfig[K][number]>) {
    const list = value[key] as Array<BlackFridayConfig[K][number]>;
    onChange({ [key]: list.map((slot, index) => (index === position ? { ...slot, ...patch } : slot)) });
  }

  function toggleOffer(id: number) {
    const ids = value.offerProductIds;
    if (ids.includes(id)) return onChange({ offerProductIds: ids.filter((item) => item !== id) });
    if (ids.length >= BF_MAX_OFFERS) return notify(`"Preço de Black" mostra no máximo ${BF_MAX_OFFERS} peças.`);
    onChange({ offerProductIds: [...ids, id] });
  }

  function pieceFields(key: "hero" | "trainings", position: number) {
    const slot = value[key][position];
    const product = byId(slot.productId);
    return (
      <>
        <label className={label}>
          Peça
          <select
            value={slot.productId || 0}
            onChange={(event) => {
              const id = Number(event.target.value) || null;
              replace(key, position, { productId: id, color: byId(id)?.colors?.[0]?.n || "" });
            }}
            className={field}
          >
            <option value={0}>Automático</option>
            {available.map((item) => <option key={item.id} value={item.id}>{item.name} · {money.format(item.price)}</option>)}
          </select>
        </label>
        <label className={label}>
          Cor da foto
          <select value={slot.color} disabled={!product?.colors?.length} onChange={(event) => replace(key, position, { color: event.target.value })} className={field}>
            {(product?.colors || []).map((color) => <option key={color.n} value={color.n}>{color.n}</option>)}
            {!product?.colors?.length ? <option value="">—</option> : null}
          </select>
        </label>
      </>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="border border-bubble-line bg-bubble-cream p-4">
        <span className={eyebrow}>Campanha</span>
        <h4 className="mt-1 text-lg">Desconto anunciado e término</h4>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <label className={label}>
            Maior desconto anunciado (%)
            <input
              type="number" min={0} max={90} inputMode="numeric"
              value={value.maxPct || ""}
              placeholder={'Vazio mostra "Preço de Black"'}
              onChange={(event) => onChange({ maxPct: Math.max(0, Math.min(90, Math.round(Number(event.target.value)) || 0)) })}
              className={field}
            />
          </label>
          <label className={label}>
            Termina em (horário de Brasília)
            <input
              type="datetime-local"
              value={toLocalInput(value.endsAt)}
              onChange={(event) => { if (event.target.value) onChange({ endsAt: fromLocalInput(event.target.value) }); }}
              className={field}
            />
          </label>
          <label className={`${label} md:col-span-2`}>
            Texto do banner
            <textarea rows={2} maxLength={220} value={value.heroText} onChange={(event) => onChange({ heroText: event.target.value })} className={field} />
          </label>
        </div>
        {value.maxPct > realMax ? (
          <p role="alert" className="mt-3 text-[.76rem] text-bubble-danger">
            O banner anuncia até {value.maxPct}%, mas o maior desconto cadastrado nestas peças é {realMax}%. Ajuste o número ou o desconto das peças em Produtos.
          </p>
        ) : null}
        {expired ? <p role="alert" className="mt-3 text-[.76rem] text-bubble-danger">O término já passou. Escolha uma data futura para publicar.</p> : null}
      </div>

      <div className="border border-bubble-sun bg-bubble-peach/45 p-4">
        <span className={eyebrow}>Banner</span>
        <h4 className="mt-1 text-lg">Três fotos</h4>
        <div className="mt-3 grid gap-3 lg:grid-cols-3">
          {value.hero.map((slot, position) => (
            <div key={position} className="grid grid-cols-[64px_1fr] gap-3 border border-bubble-line bg-bubble-white p-3">
              {thumb({ product: byId(slot.productId), color: slot.color, placeholder: String(position + 1) })}
              <div className="flex flex-col gap-2">
                <span className={label}>{position === 0 ? "Foto grande" : `Foto menor ${position}`}</span>
                {pieceFields("hero", position)}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="border border-bubble-line bg-bubble-cream p-4">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
          <div>
            <span className={eyebrow}>Seção &quot;Preço de Black&quot;</span>
            <h4 className="mt-1 text-lg">{chosen.length ? `Peças que aparecem · ${chosen.length} de até ${BF_MAX_OFFERS}` : "Automático · peças com desconto"}</h4>
          </div>
          <span className="text-[.74rem] italic text-bubble-ink/60">Toque para incluir ou tirar. Sem nenhuma escolhida, entram as peças com desconto.</span>
        </div>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(130px,1fr))] gap-2.5">
          {available.map((product) => {
            const position = value.offerProductIds.indexOf(product.id);
            const on = position >= 0;
            const pct = promotionPct(product);
            return (
              <button
                key={product.id}
                type="button"
                aria-pressed={on}
                onClick={() => toggleOffer(product.id)}
                className={`${on ? "border-2 border-bubble-ink" : "border border-dashed border-bubble-ink/40 opacity-70 hover:opacity-100"} cursor-pointer bg-bubble-white p-2 text-left text-bubble-ink`}
              >
                <span className="relative block">
                  {thumb({ product, placeholder: "+" })}
                  <span className={`${on ? "bg-bubble-sun" : "border border-bubble-ink bg-bubble-white"} absolute left-1.5 top-1.5 flex h-[22px] min-w-[22px] items-center justify-center px-1.5 font-sans text-[.68rem] font-bold`}>{on ? position + 1 : "+"}</span>
                </span>
                <span className="mt-2 block font-serif text-[.8rem] leading-tight">{product.name}</span>
                <span className="mt-0.5 block font-sans text-[.74rem] font-semibold">{money.format(product.price)}</span>
                <span className={`mt-0.5 block text-[.68rem] italic ${pct ? "text-bubble-success" : "text-bubble-ink/55"}`}>{pct ? `${pct}% de desconto` : "Sem desconto"}</span>
              </button>
            );
          })}
        </div>
        {withoutDiscount.length ? (
          <p role="alert" className="mt-3 text-[.76rem] text-bubble-danger">
            Sem desconto cadastrado: {withoutDiscount.map((product) => product.name).join(", ")}. Estas peças aparecem em &quot;Preço de Black&quot; com preço cheio.
          </p>
        ) : null}
      </div>

      <div className="border border-bubble-line bg-bubble-cream p-4">
        <span className={eyebrow}>Seção &quot;Qual modo é o seu?&quot;</span>
        <h4 className="mt-1 text-lg">Peças por treino</h4>
        <div className="mt-3 grid gap-3 lg:grid-cols-2">
          {value.trainings.map((slot, position) => (
            <div key={position} className="grid grid-cols-[64px_1fr] gap-3 border border-bubble-line bg-bubble-white p-3">
              {thumb({ product: byId(slot.productId), color: slot.color, placeholder: String(position + 1) })}
              <div className="grid grid-cols-2 gap-2">
                <label className={label}>
                  Treino
                  <input value={slot.sport} maxLength={30} onChange={(event) => replace("trainings", position, { sport: event.target.value })} className={field} />
                </label>
                <label className={label}>
                  Frase
                  <input value={slot.line} maxLength={60} onChange={(event) => replace("trainings", position, { line: event.target.value })} className={field} />
                </label>
                {pieceFields("trainings", position)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
