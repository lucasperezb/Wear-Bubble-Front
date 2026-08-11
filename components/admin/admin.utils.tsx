import type { Product } from '../../lib/api';
import { catalogCategory } from '../../lib/product-filters';
import {
  normalizeProductSize,
  sortProductSizes,
  sortSizeStockEntries,
} from '../../lib/product-sizes';
import type { ColorDraft, ProductDraft } from './admin.types';

export function productPayload(draft: ProductDraft) {
  const colors = ((draft.colors || []) as ColorDraft[])
    .map((color) => ({
      n: color.n.trim(),
      h: color.h,
      sizes: sortSizeStockEntries(
        (color.sizes || [])
          .map((item) => ({
            size: normalizeProductSize(item.size),
            q: Math.max(0, Number(item.q) || 0),
          }))
          .filter((item) => item.size),
      ),
    }))
    .filter((color) => color.n || color.h);
  const variantEntries = colors.flatMap((color) => color.sizes);
  const sizes = sortProductSizes(
    variantEntries.length ? variantEntries.map((item) => item.size) : draft.sizes,
  );
  const stock = variantEntries.length
    ? variantEntries.reduce((total, item) => total + item.q, 0)
    : Math.max(0, Number(draft.stock) || 0);
  const sports = (draft.sports || []).reduce<string[]>((items, sport) => {
    const label = sport.trim();
    if (
      label &&
      !items.some(
        (item) =>
          item.toLocaleLowerCase('pt-BR') === label.toLocaleLowerCase('pt-BR'),
      )
    ) {
      items.push(label);
    }
    return items;
  }, []);
  const pair = Number(draft.pair) || 0;
  return {
    name: draft.name.trim(),
    cat: draft.cat,
    sub: draft.sub || draft.cat,
    icon: draft.icon,
    material: draft.material,
    price: Math.max(0, Number(draft.price) || 0),
    promoPct: Math.min(90, Math.max(0, Number(draft.promoPct) || 0)),
    stock,
    tag: draft.tag || '',
    active: draft.active !== false,
    sizes,
    sports,
    colors: colors as Product['colors'],
    desc: draft.desc || '',
    ...(pair > 0 ? { pair } : {}),
    image: draft.image || null,
  };
}

export function validateProductDraft(draft: ProductDraft) {
  if (!draft.name.trim()) return 'Informe o nome do produto.';
  if (!Number.isFinite(Number(draft.price)) || Number(draft.price) <= 0) return 'Informe um preço maior que zero.';
  if (!Number.isFinite(Number(draft.stock)) || Number(draft.stock) < 0) return 'Informe um estoque válido.';
  const sizes = Array.from(
    new Set(
      (draft.colors || [])
        .flatMap((color) => color.sizes || [])
        .map((item) => item.size)
        .concat(draft.sizes || [])
        .filter(Boolean),
    ),
  );
  if (!sizes.length) return 'Informe pelo menos um tamanho.';
  if (draft.image && !/^https?:\/\//i.test(draft.image)) return 'A imagem precisa ser uma URL começando com http:// ou https://.';
  return '';
}

export function iconForCategory(category: string) {
  const normalized = catalogCategory(category);
  if (normalized === 'Shorts/Calça') return 'legging';
  if (normalized === 'Conjunto') return 'wideleg';
  if (normalized === 'Blusas/Top') return 'top';
  if (category === 'Parte de baixo') return 'legging';
  if (category === 'Casaco') return 'jacket';
  if (category === 'Acessório') return 'sock';
  return 'top';
}

export function lastNDays(n: number) {
  return Array.from({ length: n }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (n - 1 - index));
    return dayKey(date.getTime());
  });
}

export function dayKey(ts: number) {
  return new Date(ts).toISOString().slice(0, 10);
}

export function maskId(uid: string) {
  return uid ? `${uid.slice(0, 4)}...${uid.slice(-4)}` : '-';
}

export function addressLine(profile: Record<string, unknown>) {
  const street = [profile.street, profile.number, profile.complement].filter(Boolean).join(', ');
  const city = String(profile.city || '');
  const cep = String(profile.cep || '');
  if (!street && !city && !cep) return <span className="text-bubble-danger">Sem endereço cadastrado</span>;
  return <>{street}{city ? <><br />{city}</> : null}{cep ? <> - CEP {cep}</> : null}</>;
}
