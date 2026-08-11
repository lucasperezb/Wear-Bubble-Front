export const standardProductSizes = ["P", "M", "G"];

const sizeRank = new Map(standardProductSizes.map((size, index) => [size, index]));

export function normalizeProductSize(size: string) {
  return size.trim().toUpperCase();
}

export function sortProductSizes(sizes: string[] = []) {
  return Array.from(
    new Set(sizes.map(normalizeProductSize).filter(Boolean)),
  ).sort(compareProductSizes);
}

export function availableVariantSizes(
  sizes: Array<{ size: string; q: number }> = [],
) {
  return sortProductSizes(
    sizes
      .filter((item) => Number(item.q) > 0)
      .map((item) => item.size),
  );
}

export function sortSizeStockEntries<T extends { size: string }>(sizes: T[]) {
  return [...sizes].sort((first, second) =>
    compareProductSizes(first.size, second.size),
  );
}

function compareProductSizes(first: string, second: string) {
  const firstSize = normalizeProductSize(first);
  const secondSize = normalizeProductSize(second);
  const firstRank = sizeRank.get(firstSize);
  const secondRank = sizeRank.get(secondSize);

  if (firstRank !== undefined && secondRank !== undefined) {
    return firstRank - secondRank;
  }
  if (firstRank !== undefined) return -1;
  if (secondRank !== undefined) return 1;
  return firstSize.localeCompare(secondSize, "pt-BR");
}
