import { catalogCategory } from "./product-filters";
import { normalizeProductSize, sortProductSizes } from "./product-sizes";

/**
 * Guia de medidas de uma peça.
 * `rows` mapeia tamanho ("P") -> campo ("busto") -> valor em cm, como texto
 * para aceitar faixas ("82–86"). Campos ausentes caem no padrão da categoria.
 */
export type ProductMeasurements = {
  rows: Record<string, Record<string, string>>;
  notes?: string;
};

export type MeasurementField =
  | "numeracao"
  | "busto"
  | "cintura"
  | "quadril"
  | "comprimento";

export const measurementFields: Record<
  MeasurementField,
  { label: string; unit: string; hint: string }
> = {
  numeracao: {
    label: "Numeração",
    unit: "",
    hint: "Equivalência com o tamanho numérico brasileiro.",
  },
  busto: {
    label: "Busto",
    unit: "cm",
    hint: "Contorno na parte mais larga do busto, com a fita reta nas costas.",
  },
  cintura: {
    label: "Cintura",
    unit: "cm",
    hint: "Contorno na parte mais fina do tronco, acima do umbigo.",
  },
  quadril: {
    label: "Quadril",
    unit: "cm",
    hint: "Contorno na parte mais larga do quadril, com os pés juntos.",
  },
  comprimento: {
    label: "Comprimento",
    unit: "cm",
    hint: "Da cintura até a barra da peça, com ela esticada sobre uma superfície.",
  },
};

export const measurementFieldOrder: MeasurementField[] = [
  "numeracao",
  "busto",
  "cintura",
  "quadril",
  "comprimento",
];

/** Quais colunas cada categoria mostra no guia. */
export function measurementFieldsForCategory(category: string): MeasurementField[] {
  const normalized = catalogCategory(category);
  if (normalized === "Blusas/Top")
    return ["numeracao", "busto", "cintura", "comprimento"];
  if (normalized === "Shorts/Calça")
    return ["numeracao", "cintura", "quadril", "comprimento"];
  return ["numeracao", "busto", "cintura", "quadril"];
}

/** Medidas do corpo por tamanho, em cm. Comprimento varia por peça e fica em branco. */
const bodyDefaults: Record<string, Partial<Record<MeasurementField, string>>> = {
  PP: { numeracao: "34", busto: "78–82", cintura: "58–62", quadril: "84–88" },
  P: { numeracao: "36–38", busto: "82–86", cintura: "62–66", quadril: "88–92" },
  M: { numeracao: "38–40", busto: "86–90", cintura: "66–70", quadril: "92–96" },
  G: { numeracao: "42–44", busto: "90–96", cintura: "70–76", quadril: "96–102" },
  GG: { numeracao: "46–48", busto: "96–102", cintura: "76–82", quadril: "102–108" },
  XG: { numeracao: "50–52", busto: "102–108", cintura: "82–88", quadril: "108–114" },
};

/** Orientação de caimento por categoria, mostrada no rodapé do guia. */
export function fitAdviceForCategory(category: string) {
  const normalized = catalogCategory(category);
  if (normalized === "Shorts/Calça")
    return "Tecido com alta elasticidade e cós largo. Entre dois tamanhos, escolha o menor para mais compressão ou o maior para mais conforto.";
  if (normalized === "Blusas/Top")
    return "Modelagem justa ao corpo com sustentação média. Entre dois tamanhos, escolha o maior se preferir mais mobilidade.";
  return "As peças do conjunto seguem a mesma tabela. Entre dois tamanhos, escolha o menor para mais compressão ou o maior para mais conforto.";
}

export function defaultMeasurements(
  category: string,
  sizes: string[],
): ProductMeasurements {
  const fields = measurementFieldsForCategory(category);
  const rows: ProductMeasurements["rows"] = {};
  for (const size of sortProductSizes(sizes)) {
    const base = bodyDefaults[normalizeProductSize(size)] || {};
    rows[size] = Object.fromEntries(
      fields.map((field) => [field, base[field] || ""]),
    );
  }
  return { rows };
}

export type ResolvedSizeGuide = {
  sizes: string[];
  fields: MeasurementField[];
  rows: Record<string, Record<MeasurementField, string>>;
  notes: string;
  fitAdvice: string;
  /** true quando alguma célula veio do produto, não do padrão da categoria. */
  customized: boolean;
};

/**
 * Guia final de uma peça: padrão da categoria sobreposto pelo que o gerente
 * preencheu. Colunas sem nenhum valor são omitidas.
 */
export function resolveSizeGuide(product: {
  cat: string;
  sizes: string[];
  measurements?: ProductMeasurements | null;
}): ResolvedSizeGuide {
  const sizes = sortProductSizes(product.sizes);
  const defaults = defaultMeasurements(product.cat, sizes);
  const custom = product.measurements?.rows || {};
  const candidateFields = measurementFieldsForCategory(product.cat);

  let customized = false;
  const rows: ResolvedSizeGuide["rows"] = {};
  for (const size of sizes) {
    const customRow = custom[size] || custom[normalizeProductSize(size)] || {};
    const row = {} as Record<MeasurementField, string>;
    for (const field of candidateFields) {
      const own = String(customRow[field] ?? "").trim();
      if (own) customized = true;
      row[field] = own || defaults.rows[size]?.[field] || "";
    }
    rows[size] = row;
  }

  const fields = candidateFields.filter((field) =>
    sizes.some((size) => rows[size][field]),
  );

  return {
    sizes,
    fields,
    rows,
    notes: (product.measurements?.notes || "").trim(),
    fitAdvice: fitAdviceForCategory(product.cat),
    customized,
  };
}

/** Passos de "como medir", na ordem em que aparecem no guia. */
export const howToMeasure: Array<{ field: MeasurementField; title: string; text: string }> = [
  { field: "busto", title: "Busto", text: measurementFields.busto.hint },
  { field: "cintura", title: "Cintura", text: measurementFields.cintura.hint },
  { field: "quadril", title: "Quadril", text: measurementFields.quadril.hint },
];

export const MEASUREMENT_VALUE_MAX_LENGTH = 24;
export const MEASUREMENT_NOTES_MAX_LENGTH = 240;
