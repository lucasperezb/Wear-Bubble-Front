import type { BlackFridayConfig, Product } from "./api";
import { productHasPromotion } from "./pricing";
import { findProductByName, summerProducts } from "./season";

/**
 * Layout "Black Friday" da página inicial. Quem publica e edita é o gerente
 * (Vitrines do site); a API devolve o layout anterior quando o prazo acaba.
 * O desconto de cada peça continua vindo do promoPct cadastrado nela.
 * Para ver sem publicar, abra o site com ?bf=1.
 */

export const BF_MAX_OFFERS = 12;

export const emptyBlackFridayConfig = (): BlackFridayConfig => ({
  maxPct: 0,
  endsAt: "2026-11-30T23:59:59-03:00",
  heroText:
    "A Fizz com preço de Black, e ainda 5% off no Pix e 5% off montando seu conjunto. Quantidade limitada.",
  hero: [0, 1, 2].map(() => ({ productId: null, color: "" })),
  offerProductIds: [],
  trainings: [
    ["Musculação", "bolso que segura o celular"],
    ["Pilates", "cintura em V, boca flare"],
    ["Beach tennis", "cara de saia, short por baixo"],
    ["Corrida", "uma peça só, look pronto"],
  ].map(([sport, line]) => ({ productId: null, color: "", sport, line })),
});

/** Peças usadas enquanto o gerente deixa "Automático". */
const HERO_NAMES = ["Short Fizz Pocket", "Calça Fizz Flare", "Macaquinho Fizz"];
const TRAINING_NAMES = ["Short Fizz Pocket", "Calça Fizz Flare", "Short-saia Fizz", "Macaquinho Fizz"];

/** "Até 30% OFF", ou "Preço de Black" quando não há número definido. */
export function blackFridayOffer(config: BlackFridayConfig) {
  return config.maxPct > 0 ? `Até ${config.maxPct}% OFF` : "Preço de Black";
}

export function blackFridayRunning(config: BlackFridayConfig, now = Date.now()) {
  return Date.parse(config.endsAt) > now;
}

/** "segunda-feira, 30/11, às 23h59" */
export function blackFridayEndLabel(config: BlackFridayConfig) {
  const end = new Date(config.endsAt);
  const part = (options: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", ...options }).format(end);
  const time = part({ hour: "2-digit", minute: "2-digit" }).replace(":", "h");
  return `${part({ weekday: "long" })}, ${part({ day: "2-digit", month: "2-digit" })}, às ${time}`;
}

/** Vitrine automática: peças com desconto (a coleção primeiro); sem nenhuma, a coleção. */
function automaticOffers(published: Product[]) {
  const collection = summerProducts(published);
  const onSale = published.filter(productHasPromotion);
  if (!onSale.length) return collection.slice(0, 8);
  const first = collection.filter(productHasPromotion);
  return [...first, ...onSale.filter((product) => !first.includes(product))].slice(0, 8);
}

export function resolveBlackFriday(all: Product[], config: BlackFridayConfig) {
  const published = all.filter((product) => product.active !== false);
  const byId = (id: number | null) =>
    id ? published.find((product) => product.id === id) : undefined;
  const chosen = config.offerProductIds
    .map(byId)
    .filter((product): product is Product => Boolean(product));
  return {
    hero: config.hero
      .map((slot, index) => {
        const picked = byId(slot.productId);
        return {
          product: picked || findProductByName(published, HERO_NAMES[index] || ""),
          color: picked ? slot.color : "",
        };
      })
      .filter((slot): slot is { product: Product; color: string } => Boolean(slot.product)),
    offers: chosen.length ? chosen : automaticOffers(published),
    trainings: config.trainings.flatMap((slot, index) => {
      const picked = byId(slot.productId);
      const product = picked || findProductByName(published, TRAINING_NAMES[index] || "");
      return product ? [{ ...slot, product, color: picked ? slot.color : "" }] : [];
    }),
  };
}
