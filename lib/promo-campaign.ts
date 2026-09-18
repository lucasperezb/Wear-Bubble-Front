/**
 * Campanha promocional da loja (camada visual).
 *
 * Só controla o que aparece: barra do topo, pílula do hero, contador, link no
 * menu, filtro "Em promoção". O desconto em si continua vindo do promoPct de
 * cada peça e das faixas do desconto progressivo, configurados no painel.
 *
 * Para encerrar a campanha: NEXT_PUBLIC_PROMO_ENABLED=false ou deixar a data
 * de término passar. Para trocar a data: NEXT_PUBLIC_PROMO_ENDS_AT (ISO 8601).
 */

const enabledFlag = process.env.NEXT_PUBLIC_PROMO_ENABLED;
const endsAtEnv = process.env.NEXT_PUBLIC_PROMO_ENDS_AT;

export const PROMO_CAMPAIGN = {
  enabled: enabledFlag !== "false" && enabledFlag !== "0",
  /** Maior desconto anunciado ("até 40%"). */
  maxPct: Math.max(1, Math.min(90, Number(process.env.NEXT_PUBLIC_PROMO_MAX_PCT) || 40)),
  /** Fim da campanha; o contador do hero conta até aqui. */
  endsAt: endsAtEnv && !Number.isNaN(Date.parse(endsAtEnv)) ? endsAtEnv : "2026-09-27T23:59:59-03:00",
  /** Página do catálogo já filtrada pelas peças com desconto. */
  href: "/produtos?promo=1",
};

export const promoLabel = `Até ${PROMO_CAMPAIGN.maxPct}% OFF`;

export function promoEndsAtMs() {
  return Date.parse(PROMO_CAMPAIGN.endsAt);
}

/** Campanha ligada e ainda dentro do prazo. */
export function promoCampaignActive(now = Date.now()) {
  return PROMO_CAMPAIGN.enabled && promoEndsAtMs() > now;
}

export type Countdown = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  /** true quando o prazo já passou. */
  expired: boolean;
};

export function countdownTo(targetMs: number, now = Date.now()): Countdown {
  const remaining = Math.max(0, targetMs - now);
  const total = Math.floor(remaining / 1000);
  return {
    days: Math.floor(total / 86400),
    hours: Math.floor((total % 86400) / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
    expired: remaining <= 0,
  };
}
