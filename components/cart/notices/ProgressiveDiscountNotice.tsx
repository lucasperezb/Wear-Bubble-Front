import { money } from "../../../lib/api";
import {
  progressivePctForPosition,
  type ProgressiveResult,
  type ProgressiveSettings,
} from "../../../lib/progressive-discount";

type ProgressiveDiscountNoticeProps = {
  settings: ProgressiveSettings;
  progressive: ProgressiveResult;
  discount: number;
  nextStep: { position: number; pct: number } | null;
  compact?: boolean;
};

const ordinal = ["", "1ª", "2ª", "3ª", "4ª", "5ª", "6ª", "7ª", "8ª", "9ª", "10ª"];

export function describeProgressiveTiers(settings: ProgressiveSettings) {
  const tiers = settings.tiers.filter((pct) => pct > 0);
  if (!tiers.length) return "";
  const parts = settings.tiers
    .map((pct, index) => ({ position: index + 2, pct }))
    .filter((tier) => tier.pct > 0)
    .map((tier) => `${ordinal[tier.position] || `${tier.position}ª`} peça ${tier.pct}% OFF`);
  const last = settings.tiers.length + 1;
  const beyond = settings.extendLast
    ? progressivePctForPosition(last + 1, settings.tiers, true)
    : 0;
  return beyond
    ? `${parts.join(" · ")} · a partir da ${last + 1}ª, ${beyond}% OFF`
    : parts.join(" · ");
}

/**
 * Uma célula da barra por posição (1ª peça sem desconto, depois cada faixa).
 * Com extendLast a última célula vira "Nª+" porque vale dali em diante.
 */
function tierCells(settings: ProgressiveSettings) {
  const last = settings.tiers.length + 1;
  return Array.from({ length: last }, (_, index) => {
    const position = index + 1;
    const pct = progressivePctForPosition(position, settings.tiers, settings.extendLast);
    const open = settings.extendLast && position === last;
    return {
      position,
      pct,
      label: `${ordinal[position] || `${position}ª`}${open ? "+" : ""}`,
    };
  });
}

/**
 * Aviso do desconto progressivo na sacola e no carrinho: o que já foi ganho,
 * quanto falta para a próxima faixa e uma barra com todas as faixas.
 */
export function ProgressiveDiscountNotice({
  settings,
  progressive,
  discount,
  nextStep,
  compact = false,
}: ProgressiveDiscountNoticeProps) {
  if (!settings.enabled || !settings.tiers.some((pct) => pct > 0)) return null;
  const earned = discount > 0;
  const hint = nextStep
    ? `Adicione mais 1 peça e ganhe ${nextStep.pct}% nela.`
    : "";
  const cells = tierCells(settings);
  const maxPct = Math.max(...cells.map((cell) => cell.pct));
  const maxCell = cells.find((cell) => cell.pct === maxPct);
  const missingForMax = maxCell
    ? Math.max(0, maxCell.position - progressive.eligibleCount)
    : 0;

  return (
    <div
      className={`border border-bubble-ink/20 bg-bubble-cream2/60 ${compact ? "px-3 py-2.5" : "px-4 py-3"}`}
      role="status"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <span className="font-sans text-[.6rem] font-bold uppercase tracking-[.14em] text-bubble-brown">
          Desconto progressivo
        </span>
        {earned ? (
          <span className="font-sans text-[.68rem] font-semibold text-bubble-success">
            Você economiza {money.format(discount)}
          </span>
        ) : null}
      </div>

      <div
        className={`grid gap-1 ${compact ? "mt-2" : "mt-2.5"}`}
        style={{ gridTemplateColumns: `repeat(${cells.length}, minmax(0, 1fr))` }}
        aria-hidden="true"
      >
        {cells.map((cell) => {
          const reached = progressive.eligibleCount >= cell.position;
          return (
            <div key={cell.position} className="min-w-0">
              <div
                className={`h-1.5 transition-colors ${reached ? "bg-bubble-success" : "bg-bubble-ink/15"}`}
              />
              <div
                className={`mt-1 truncate font-sans text-[.56rem] uppercase tracking-[.06em] ${
                  reached ? "font-bold text-bubble-success" : "text-bubble-ink/55"
                }`}
              >
                {cell.label}
                {cell.pct ? ` ${cell.pct}%` : ""}
              </div>
            </div>
          );
        })}
      </div>

      <p className={`mt-1.5 text-bubble-ink/70 ${compact ? "text-[.7rem]" : "text-[.74rem]"} leading-relaxed`}>
        {earned && hint ? hint : describeProgressiveTiers(settings)}
        {earned && !hint && settings.tiers.length
          ? " Você já está na maior faixa."
          : ""}
      </p>
      {!earned && hint && progressive.eligibleCount === 1 ? (
        <p className={`mt-1 font-semibold text-bubble-ink ${compact ? "text-[.7rem]" : "text-[.74rem]"}`}>
          {hint}
        </p>
      ) : null}
      {missingForMax > 0 && maxPct > 0 ? (
        <p className={`mt-1 font-sans font-semibold uppercase tracking-[.08em] text-bubble-brown ${compact ? "text-[.6rem]" : "text-[.64rem]"}`}>
          {missingForMax === 1
            ? `Falta 1 peça para chegar nos ${maxPct}% OFF`
            : `Faltam ${missingForMax} peças para chegar nos ${maxPct}% OFF`}
        </p>
      ) : null}
    </div>
  );
}
