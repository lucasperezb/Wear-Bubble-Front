import type { Product } from './api';

export type ProductSearchResult = {
  product: Product;
  score: number;
};

export function normalizeSearchText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function productSearchText(product: Product) {
  return normalizeSearchText(
    [
      product.name,
      product.cat,
      product.sub,
      product.material,
      product.collectionName,
      ...(product.sports || []),
      product.desc,
    ]
      .filter(Boolean)
      .join(' '),
  );
}

function similarity(left: string, right: string) {
  if (left === right) return 1;
  if (left.includes(right) || right.includes(left)) return 0.86;
  if (!left || !right) return 0;
  const previous = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let row = 1; row <= left.length; row += 1) {
    let diagonal = previous[0];
    previous[0] = row;
    for (let column = 1; column <= right.length; column += 1) {
      const above = previous[column];
      previous[column] = Math.min(
        previous[column] + 1,
        previous[column - 1] + 1,
        diagonal + (left[row - 1] === right[column - 1] ? 0 : 1),
      );
      diagonal = above;
    }
  }
  return 1 - previous[right.length] / Math.max(left.length, right.length);
}

function scoreProduct(product: Product, queryTokens: string[]) {
  const fields = productSearchText(product).split(' ');
  const score = queryTokens.reduce((total, queryToken) => {
    const best = Math.max(...fields.map((field) => similarity(field, queryToken)));
    return total + best;
  }, 0);
  return score / queryTokens.length;
}

export function searchProducts(products: Product[], query: string) {
  const tokens = normalizeSearchText(query)
    .split(' ')
    .filter((token) => token.length > 1);
  if (!tokens.length) return [];
  return products
    .filter((product) => product.active !== false)
    .map((product) => ({ product, score: scoreProduct(product, tokens) }))
    .sort((left, right) =>
      right.score - left.score || right.product.rating - left.product.rating,
    );
}

export function matchingProducts(products: Product[], query: string) {
  return searchProducts(products, query).filter(({ score }) => score >= 0.56);
}
