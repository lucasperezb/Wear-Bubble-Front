import type { FizzLayoutConfig, Product } from "./api";
import { collectionSlug } from "./collections";

/**
 * Tema de verão + coleção Fizz: textos e padrões do layout "Coleção Fizz ·
 * Verão". Quem liga o tema é o painel (Vitrines do site → publicar layout);
 * a escolha das peças também vem de lá, e os nomes abaixo só servem de
 * reserva enquanto nada foi escolhido.
 */

const collectionEnv = process.env.NEXT_PUBLIC_SUMMER_COLLECTION;

export const SUMMER = {
  season: "Verão 2026",
  /** Nome da coleção como cadastrado nas peças (campo Coleção no painel). */
  collectionName: collectionEnv?.trim() || "Fizz",
  get collectionSlug() {
    return collectionSlug(this.collectionName);
  },
  get collectionHref() {
    return `/colecoes/${this.collectionSlug}`;
  },
  tagline: "A bolha do verão está prestes a estourar.",
  heroLine: "o verão chegou borbulhando",
  heroText:
    "A bolha do verão está prestes a estourar. A Fizz foi feita para isso: short com bolso, flare de cintura em V, macaquinho, tops levinhos e short-saia, em cores que vão do café ao verde limão.",
  /** Peça do card grande do hero, na cor indicada; a segunda vai ao lado. */
  hero: {
    productName: "Short Fizz Pocket",
    color: "Café",
    secondaryProductName: "Short-saia Fizz",
  },
  story: {
    text: "Sabe aquele chiadinho quando você abre uma bebida gelada num dia de calor? É daí que vem o nome. A Fizz é a nossa coleção de verão: peças leves pra treinar cedo, emendar com o resto do dia e sair do jeito que estiver.",
    points: ["Bolso de verdade", "Modelagem que acompanha", "Cores de verão"],
    /** Fotos da seção "A coleção": peça, cor e posição na galeria daquela cor. */
    images: [
      {
        productName: "Short Fizz Pocket",
        color: "Café",
        index: 1,
        label: "Look completo",
      },
      {
        productName: "Short Fizz Pocket",
        color: "Preto",
        index: 1,
        label: "Bolso lateral",
      },
      {
        productName: "Calça Fizz Flare",
        color: "Preto",
        index: 1,
        label: "Cintura em V",
      },
    ],
  },
  /** Até 3 destaques por peça na página de produto. */
  highlights: {
    "Short Fizz Pocket": ["Leve pro calor", "Bolso lateral", "Cintura alta"],
  } as Record<string, string[]>,
  /** Detalhes da peça (acordeão "Detalhes"). */
  details: {
    "Short Fizz Pocket": [
      "Cintura alta com cós largo",
      "Bolso lateral que segura o celular",
      "Comprimento no meio da coxa",
    ],
  } as Record<string, string[]>,
  /** Peças fotografadas com um top que não acompanha. */
  topNotIncluded: ["Short Fizz Pocket", "Calça Fizz Flare"],
};

const normalize = (value: string) =>
  value.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

export function sameName(a: string, b: string) {
  return normalize(a) === normalize(b);
}

export function isSummerCollection(product: Pick<Product, "collectionName">) {
  return (
    !!product.collectionName &&
    collectionSlug(product.collectionName) === SUMMER.collectionSlug
  );
}

/** Peças publicadas da coleção de verão, na ordem do catálogo. */
export function summerProducts(products: Product[]) {
  return products
    .filter(
      (product) => product.active !== false && isSummerCollection(product),
    )
    .sort((a, b) => (a.catalogPosition || 0) - (b.catalogPosition || 0));
}

export function findProductByName(products: Product[], name: string) {
  return products.find((product) => sameName(product.name, name));
}

/** Configurado ou escrito na descrição ("vendido sem o top", "top não incluso"). */
export function topNotIncluded(product: Product) {
  return (
    SUMMER.topNotIncluded.some((name) => sameName(name, product.name)) ||
    /sem o top|top n[aã]o inclu/i.test(product.desc || "")
  );
}

export function productHighlights(product: Product) {
  const key = Object.keys(SUMMER.highlights).find((name) =>
    sameName(name, product.name),
  );
  return key ? SUMMER.highlights[key].slice(0, 3) : [];
}

export function productDetails(product: Product) {
  const key = Object.keys(SUMMER.details).find((name) =>
    sameName(name, product.name),
  );
  return key ? SUMMER.details[key] : [];
}

export type FizzHome = {
  main?: Product;
  mainColor: string;
  side?: Product;
  /** "As novidades", na ordem escolhida no painel. */
  news: Product[];
  story: Array<{ label: string; product?: Product; color: string; index: number }>;
};

const colorOf = (product: Product | undefined, wanted: string) =>
  product?.colors?.find((item) => sameName(item.n, wanted))?.n || "";

/**
 * Peças da home de verão: o que foi escolhido no painel e, enquanto nada foi
 * escolhido, as peças da coleção (com os nomes padrão de lib/season.ts).
 */
export function resolveFizzHome(
  all: Product[],
  config: FizzLayoutConfig | null | undefined,
): FizzHome {
  const published = all.filter((product) => product.active !== false);
  const byId = (id: number | null | undefined) =>
    id ? published.find((product) => product.id === id) : undefined;
  const collection = summerProducts(all);
  const chosen = (config?.newsProductIds || [])
    .map(byId)
    .filter((product): product is Product => !!product);
  const news = chosen.length ? chosen : collection;

  const main =
    byId(config?.heroProductId) ||
    findProductByName(collection, SUMMER.hero.productName) ||
    news[0];
  const mainColor =
    colorOf(main, config?.heroColor || "") ||
    colorOf(main, SUMMER.hero.color) ||
    main?.colors?.[0]?.n ||
    "";
  const side =
    byId(config?.sideProductId) ||
    findProductByName(collection, SUMMER.hero.secondaryProductName) ||
    news.find((product) => product.id !== main?.id);

  const story = SUMMER.story.images.map((fallback, position) => {
    const slot = config?.storyImages?.[position];
    const product = byId(slot?.productId);
    if (product) {
      return {
        label: slot?.label || fallback.label,
        product,
        color: colorOf(product, slot?.color || "") || product.colors?.[0]?.n || "",
        index: slot?.imageIndex || 0,
      };
    }
    const named = findProductByName(collection, fallback.productName);
    return {
      label: slot?.label || fallback.label,
      product: named,
      color: colorOf(named, fallback.color),
      index: fallback.index,
    };
  });

  return { main, mainColor, side, news, story };
}
