import type { Product } from '../../lib/api';
import type { ColorDraft, ProductDraft } from './admin.types';

export function productPayload(draft: ProductDraft) {
  return {
    name: draft.name.trim(),
    cat: draft.cat,
    sub: draft.sub || draft.cat,
    icon: draft.icon,
    material: draft.material,
    price: Math.max(0, Number(draft.price) || 0),
    stock: Math.max(0, Number(draft.stock) || 0),
    tag: draft.tag || '',
    active: draft.active !== false,
    sizes: draft.sizesText.split(',').map((item) => item.trim().toUpperCase()).filter(Boolean),
    sports: draft.sports || [],
    colors: ((draft.colors || []) as ColorDraft[])
      .map((color) => ({ ...color, q: color.q === '' ? undefined : Number(color.q) || undefined }))
      .filter((color) => color.n || color.h) as Product['colors'],
    desc: draft.desc || '',
    pair: Number(draft.pair) || 0,
    image: draft.image || null,
  };
}

export function validateProductDraft(draft: ProductDraft) {
  if (!draft.name.trim()) return 'Informe o nome do produto.';
  if (!Number.isFinite(Number(draft.price)) || Number(draft.price) <= 0) return 'Informe um preco maior que zero.';
  if (!Number.isFinite(Number(draft.stock)) || Number(draft.stock) < 0) return 'Informe um estoque valido.';
  const sizes = draft.sizesText.split(',').map((item) => item.trim()).filter(Boolean);
  if (!sizes.length) return 'Informe pelo menos um tamanho.';
  if (draft.image && !/^https?:\/\//i.test(draft.image)) return 'A imagem precisa ser uma URL começando com http:// ou https://.';
  return '';
}

export function iconForCategory(category: string) {
  if (category === 'Parte de baixo') return 'legging';
  if (category === 'Casaco') return 'jacket';
  if (category === 'Acessorio') return 'sock';
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
  if (!street && !city && !cep) return <span className="text-bubble-danger">Sem endereco cadastrado</span>;
  return <>{street}{city ? <><br />{city}</> : null}{cep ? <> - CEP {cep}</> : null}</>;
}
