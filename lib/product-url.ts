export function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** /produto/12-conjunto-canelado-areia — o id continua sendo a chave; o nome é para leitura/SEO. */
export function productPath(product: { id: number; name: string }) {
  const slug = slugify(product.name);
  return `/produto/${product.id}${slug ? `-${slug}` : ""}`;
}

export function parseProductParam(param: string) {
  return Number.parseInt(decodeURIComponent(param), 10);
}
