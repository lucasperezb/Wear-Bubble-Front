/** Valor mínimo para frete grátis fora de campanha. Aceita 0. */
const baseMinimumEnv = process.env.NEXT_PUBLIC_FREE_SHIPPING_MINIMUM;
const baseMinimum =
  baseMinimumEnv === undefined || baseMinimumEnv === ""
    ? 299
    : Number(baseMinimumEnv);
export const FREE_SHIPPING_MINIMUM = Number.isFinite(baseMinimum)
  ? Math.max(0, baseMinimum)
  : 299;

/**
 * Campanha de frete grátis em qualquer valor. Padrão: outubro de 2026 no
 * horário de Brasília. Avaliada a cada render, então volta sozinha ao mínimo
 * normal quando o prazo acaba, sem novo deploy. A API aplica as mesmas datas.
 */
function campaignDate(value: string | undefined, fallback: string) {
  return value && !Number.isNaN(Date.parse(value)) ? value : fallback;
}

export const FREE_SHIPPING_PROMO = {
  startsAt: campaignDate(
    process.env.NEXT_PUBLIC_FREE_SHIPPING_PROMO_STARTS_AT,
    "2026-10-01T00:00:00-03:00",
  ),
  endsAt: campaignDate(
    process.env.NEXT_PUBLIC_FREE_SHIPPING_PROMO_ENDS_AT,
    "2026-10-31T23:59:59-03:00",
  ),
};

export function freeShippingPromoActive(now = Date.now()) {
  return (
    now >= Date.parse(FREE_SHIPPING_PROMO.startsAt) &&
    now <= Date.parse(FREE_SHIPPING_PROMO.endsAt)
  );
}

/** Mínimo vigente agora: 0 durante a campanha. */
export function freeShippingMinimum(now = Date.now()) {
  return freeShippingPromoActive(now) ? 0 : FREE_SHIPPING_MINIMUM;
}

/** "outubro" — mês da campanha para os textos do site. */
export function freeShippingPromoMonthLabel() {
  return new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(FREE_SHIPPING_PROMO.startsAt));
}
