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
 * Aviso do desconto progressivo na sacola e no carrinho: o que já foi ganho
 * e quanto falta para a próxima faixa.
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
      <p className={`mt-1 text-bubble-ink/70 ${compact ? "text-[.7rem]" : "text-[.74rem]"} leading-relaxed`}>
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
    </div>
  );
}
