import type { Product, ProductImage } from "./api";

export function orderedProductImages(product: Product): ProductImage[] {
  const gallery = [...(product.images || [])].sort(
    (first, second) =>
      Number(second.isPrimary) - Number(first.isPrimary) ||
      first.position - second.position,
  );
  if (gallery.length) return gallery;
  return product.image
    ? [
        {
          id: "legacy",
          url: product.image,
          altText: product.name,
          colorName: null,
          position: 0,
          isPrimary: true,
        },
      ]
    : [];
}

export function productImagesForColor(
  product: Product,
  colorName: string,
): ProductImage[] {
  const gallery = orderedProductImages(product);
  const wanted = normalizeColor(colorName);
  if (!wanted) return gallery;

  const matching = gallery.filter(
    (image) => normalizeColor(image.colorName || "") === wanted,
  );
  const shared = gallery.filter((image) => !normalizeColor(image.colorName || ""));
  if (matching.length) return [...matching, ...shared];
  if (shared.length) return shared;
  return gallery;
}

export function productImageUrlForColor(
  product: Product,
  colorName: string,
) {
  return productImagesForColor(product, colorName)[0]?.url || null;
}

function normalizeColor(value: string) {
  return value.trim().toLocaleLowerCase("pt-BR");
}
