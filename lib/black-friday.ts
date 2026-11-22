/**
 * Black Friday Bubble (camada visual da home).
 *
 * Liga sozinha entre startsAt e endsAt (horário de Brasília) e some depois,
 * sem novo deploy. Para ver antes da data, abra o site com ?bf=1.
 * O desconto de cada peça continua vindo do promoPct configurado no painel;
 * aqui só fica o texto anunciado ("até X% OFF") e as datas.
 *
 * Variáveis (todas opcionais):
 *   NEXT_PUBLIC_BF_ENABLED=false        desliga a campanha
 *   NEXT_PUBLIC_BF_STARTS_AT=ISO 8601   início
 *   NEXT_PUBLIC_BF_ENDS_AT=ISO 8601     fim (a contagem conta até aqui)
 *   NEXT_PUBLIC_BF_MAX_PCT=30           maior desconto anunciado; vazio = sem número
 */

const flag = process.env.NEXT_PUBLIC_BF_ENABLED;

function date(value: string | undefined, fallback: string) {
  return value && !Number.isNaN(Date.parse(value)) ? value : fallback;
}

const pct = Math.round(Number(process.env.NEXT_PUBLIC_BF_MAX_PCT));

export const BLACK_FRIDAY = {
  enabled: flag !== "false" && flag !== "0",
  startsAt: date(process.env.NEXT_PUBLIC_BF_STARTS_AT, "2026-11-24T00:00:00-03:00"),
  endsAt: date(process.env.NEXT_PUBLIC_BF_ENDS_AT, "2026-11-30T23:59:59-03:00"),
  /** Maior desconto anunciado. null = as artes não citam número. */
  maxPct: pct > 0 && pct <= 90 ? pct : null,
};

/** "Até 30% OFF" ou "Preço de Black" quando não há número definido. */
export const blackFridayOffer = BLACK_FRIDAY.maxPct
  ? `Até ${BLACK_FRIDAY.maxPct}% OFF`
  : "Preço de Black";

export function blackFridayEndsAtMs() {
  return Date.parse(BLACK_FRIDAY.endsAt);
}

/** Campanha no ar agora. `preview` força ligada (usado com ?bf=1). */
export function blackFridayActive(now = Date.now(), preview = false) {
  if (!BLACK_FRIDAY.enabled) return false;
  if (preview) return true;
  return now >= Date.parse(BLACK_FRIDAY.startsAt) && now <= blackFridayEndsAtMs();
}

/** "domingo, 30/11, às 23h59" — usado no texto de término. */
export function blackFridayEndLabel() {
  const d = new Date(blackFridayEndsAtMs());
  const fmt = (o: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", ...o }).format(d);
  return `${fmt({ weekday: "long" })}, ${fmt({ day: "2-digit", month: "2-digit" })}, às ${fmt({ hour: "2-digit", minute: "2-digit" }).replace(":", "h")}`;
}
