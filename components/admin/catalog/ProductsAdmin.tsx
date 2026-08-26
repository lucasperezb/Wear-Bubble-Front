"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowDown, ArrowUp } from "lucide-react";
import {
  Product,
  type ProductImage,
  apiFetch,
  money,
} from "../../../lib/api";
import {
  catalogCategory,
  categoryFilterOptions,
  categoryMatches,
} from "../../../lib/product-filters";
import {
  sortProductSizes,
  standardProductSizes,
} from "../../../lib/product-sizes";
import { productPrice } from "../../../lib/pricing";
import { useBodyScrollLock } from "../../../lib/use-body-scroll-lock";
import { ProductIcon } from "../../shared";
import {
  createEmptyProductDraft,
  defaultSports,
  productCategories,
  productIcons,
} from "../shared/constants";
import {
  adminNote,
  outlineButton,
  primaryButton,
  productInput,
  productLabel,
  stockBadge,
} from "../shared/styles";
import type {
  ColorDraft,
  Notify,
  OnSaved,
  ProductDraft,
} from "../shared/types";
import { productPayload, validateProductDraft } from "../shared/utils";
import { deleteDemoProduct, saveDemoProduct } from "../../../lib/demo-store";

type ProductsAdminProps = {
  products: Product[];
  sports: string[];
  onSaved: OnSaved;
  notify: Notify;
  demoMode?: boolean;
};

type ProductAdminFilters = {
  cat: string;
  size: string;
  sport: string;
  sort: string;
};

const initialProductAdminFilters: ProductAdminFilters = {
  cat: "all",
  size: "",
  sport: "",
  sort: "rel",
};

export function ProductsAdmin({ products, sports, onSaved, notify, demoMode = false }: ProductsAdminProps) {
  const [editor, setEditor] = useState<"new" | number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [reordering, setReordering] = useState(false);
  const [filters, setFilters] = useState<ProductAdminFilters>(
    initialProductAdminFilters,
  );
  const editingProduct =
    typeof editor === "number"
      ? products.find((product) => product.id === editor) || null
      : null;
  const deletingProduct =
    deletingId === null
      ? null
      : products.find((product) => product.id === deletingId) || null;
  const filteredProducts = useMemo(() => {
    let list = [...products];
    if (filters.cat !== "all") {
      list = list.filter((product) => categoryMatches(product.cat, filters.cat));
    }
    if (filters.size) {
      list = list.filter((product) =>
        sortProductSizes(product.sizes).includes(filters.size),
      );
    }
    if (filters.sport) {
      list = list.filter((product) => product.sports?.includes(filters.sport));
    }
    if (filters.sort === "price-asc") {
      list.sort((first, second) => productPrice(first) - productPrice(second));
    }
    if (filters.sort === "price-desc") {
      list.sort((first, second) => productPrice(second) - productPrice(first));
    }
    if (filters.sort === "stock-asc") {
      list.sort((first, second) => first.stock - second.stock);
    }
    if (filters.sort === "stock-desc") {
      list.sort((first, second) => second.stock - first.stock);
    }
    return list;
  }, [filters, products]);

  const updateFilters = (patch: Partial<ProductAdminFilters>) =>
    setFilters((current) => ({ ...current, ...patch }));

  const canReorder =
    filters.cat === "all" &&
    !filters.size &&
    !filters.sport &&
    filters.sort === "rel";

  async function moveProduct(index: number, direction: -1 | 1) {
    if (!canReorder || reordering) return;
    const target = index + direction;
    if (target < 0 || target >= products.length) return;
    const productIds = products.map((product) => product.id);
    [productIds[index], productIds[target]] = [
      productIds[target],
      productIds[index],
    ];
    setReordering(true);
    try {
      await apiFetch("/products/catalog-order", {
        method: "PATCH",
        body: JSON.stringify({ productIds }),
      });
      await onSaved();
      notify("Ordem dos produtos atualizada na loja.");
    } catch (error) {
      notify(
        error instanceof Error
          ? error.message
          : "Não foi possível alterar a ordem dos produtos.",
      );
    } finally {
      setReordering(false);
    }
  }

  async function toggleVisibility(product: Product) {
    try {
      if (demoMode) saveDemoProduct({ active: !product.active }, product.id);
      else await apiFetch(`/products/${product.id}`, {
          method: "PATCH",
          body: JSON.stringify({ active: !product.active }),
        });
      await onSaved();
      notify(product.active ? "Produto ocultado da loja." : "Produto publicado.");
    } catch (error) {
      notify(
        error instanceof Error
          ? error.message
          : "Não foi possível alterar a visibilidade.",
      );
    }
  }

  return (
    <>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4 border-b border-bubble-line pb-5">
        <div>
          <h4 className="text-xl">Produtos</h4>
          <p className="mt-1 text-[.72rem] text-bubble-ink/55">
            {filteredProducts.length} de {products.length} produto{products.length === 1 ? "" : "s"} cadastrado
            {products.length === 1 ? "" : "s"}.
          </p>
        </div>
        <button
          className={`${primaryButton} px-5 py-3 text-[.68rem]`}
          onClick={() => setEditor("new")}
        >
          + Adicionar produto
        </button>
      </div>
      <ProductAdminFilterBar
        filters={filters}
        sports={sports}
        onFilter={updateFilters}
        onClear={() => setFilters(initialProductAdminFilters)}
      />
      {!canReorder ? (
        <p className="mb-3 border border-bubble-line bg-bubble-cream2 px-4 py-3 text-[.7rem] text-bubble-ink/55">
          Limpe os filtros e selecione “Ordenar” para alterar a ordem da vitrine.
        </p>
      ) : null}
      <div className="overflow-hidden border border-bubble-line bg-bubble-white">
        {filteredProducts.map((product, index) => (
          <ProductAdminRow
            key={product.id}
            product={product}
            onEdit={() => setEditor(product.id)}
            onDelete={() => setDeletingId(product.id)}
            onToggle={() => void toggleVisibility(product)}
            onMoveUp={() => void moveProduct(index, -1)}
            onMoveDown={() => void moveProduct(index, 1)}
            canMoveUp={canReorder && index > 0}
            canMoveDown={canReorder && index < products.length - 1}
            reordering={reordering}
          />
        ))}
        {!filteredProducts.length ? (
          <div className="p-6 text-center text-[.8rem] text-bubble-ink/55">
            Nenhum produto encontrado com estes filtros.
          </div>
        ) : null}
      </div>
      <p className={adminNote}>
        Use as setas para definir a sequência da vitrine. Edite detalhes e
        imagens dentro do modal. Ocultar remove o produto da loja sem apagar
        pedidos anteriores.
      </p>
      {editor ? (
        <ProductEditorModal
          product={editingProduct}
          sports={sports}
          onClose={() => setEditor(null)}
          onSaved={onSaved}
          notify={notify}
          demoMode={demoMode}
        />
      ) : null}
      {deletingProduct ? (
        <DeleteProductModal
          product={deletingProduct}
          onClose={() => setDeletingId(null)}
          onDeleted={async () => {
            await onSaved();
            setDeletingId(null);
          }}
          notify={notify}
          demoMode={demoMode}
        />
      ) : null}
    </>
  );
}

function ProductAdminFilterBar({
  filters,
  sports,
  onFilter,
  onClear,
}: {
  filters: ProductAdminFilters;
  sports: string[];
  onFilter: (patch: Partial<ProductAdminFilters>) => void;
  onClear: () => void;
}) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-2.5 border border-bubble-line bg-bubble-cream2 p-3">
      {categoryFilterOptions.map(({ value, label }) => (
        <button
          type="button"
          key={value}
          className={`${filters.cat === value ? "border-bubble-ink bg-bubble-ink text-bubble-white" : "border-bubble-line bg-bubble-white text-bubble-ink/60"} border px-3 py-2 font-sans text-[.62rem] font-bold uppercase tracking-[.08em]`}
          onClick={() => onFilter({ cat: value })}
        >
          {label}
        </button>
      ))}
      <select
        className={`${productInput} w-auto min-w-[118px] py-2 text-[.72rem]`}
        value={filters.size}
        onChange={(event) => onFilter({ size: event.target.value })}
      >
        <option value="">Tamanho</option>
        {standardProductSizes.map((size) => (
          <option key={size}>{size}</option>
        ))}
      </select>
      <select
        className={`${productInput} w-auto min-w-[136px] py-2 text-[.72rem]`}
        value={filters.sport}
        onChange={(event) => onFilter({ sport: event.target.value })}
      >
        <option value="">Esporte</option>
        {sports.map((sport) => (
          <option key={sport}>{sport}</option>
        ))}
      </select>
      <select
        className={`${productInput} w-auto min-w-[152px] py-2 text-[.72rem]`}
        value={filters.sort}
        onChange={(event) => onFilter({ sort: event.target.value })}
      >
        <option value="rel">Ordenar</option>
        <option value="price-asc">Menor preço</option>
        <option value="price-desc">Maior preço</option>
        <option value="stock-desc">Maior quantidade</option>
        <option value="stock-asc">Menor quantidade</option>
      </select>
      <button
        type="button"
        className="border-0 bg-transparent font-sans text-[.68rem] font-semibold text-bubble-brown underline"
        onClick={onClear}
      >
        Limpar filtros
      </button>
    </div>
  );
}

function ProductAdminRow({
  product,
  onEdit,
  onDelete,
  onToggle,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
  reordering,
}: {
  product: Product;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
  reordering: boolean;
}) {
  const stockKind =
    product.stock <= 0 ? "out" : product.stock <= 5 ? "low" : "ok";
  const stockLabel =
    product.stock <= 0
      ? "Esgotado"
      : product.stock <= 5
        ? `${product.stock} un.`
        : `${product.stock} un.`;
  return (
    <article className="grid grid-cols-[64px_minmax(0,1fr)_110px_110px_auto] items-center gap-4 border-b border-bubble-line p-4 last:border-b-0 max-[760px]:grid-cols-[58px_minmax(0,1fr)_auto] max-[760px]:gap-3">
      <div className="flex aspect-[3/4] w-16 items-center justify-center overflow-hidden bg-bubble-cream2 max-[760px]:w-[58px] [&_svg]:w-3/5">
        {product.image ? (
          <img className="size-full object-cover" src={product.image} alt="" />
        ) : (
          <ProductIcon icon={product.icon} />
        )}
      </div>
      <div className="min-w-0">
        <div className="truncate font-serif text-base font-semibold">
          {product.name}
        </div>
        <div className="mt-1 truncate text-[.68rem] uppercase tracking-[.08em] text-bubble-ink/45">
          #{product.id} · {product.cat} · {product.material || "Sem material"}
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5 min-[761px]:hidden">
          <span className={stockBadge(stockKind)}>{stockLabel}</span>
          <span className="text-[.7rem] font-semibold">
            {money.format(product.price)}
          </span>
        </div>
      </div>
      <div className="max-[760px]:hidden">
        <span className={stockBadge(stockKind)}>{stockLabel}</span>
      </div>
      <div className="text-[.78rem] font-semibold max-[760px]:hidden">
        {money.format(product.price)}
        <span className="mt-1 block text-[.62rem] font-normal text-bubble-ink/45">
          {product.images?.length || 0} imagem
          {(product.images?.length || 0) === 1 ? "" : "s"}
        </span>
      </div>
      <div className="flex items-center justify-end gap-2 max-[760px]:col-start-3 max-[760px]:row-span-2 max-[760px]:row-start-1 max-[760px]:flex-col">
        <div className="flex gap-1" aria-label="Ordenar produto na vitrine">
          <button
            type="button"
            className="flex size-9 items-center justify-center border border-bubble-line text-bubble-ink transition-colors hover:border-bubble-ink disabled:cursor-not-allowed disabled:opacity-25"
            onClick={onMoveUp}
            disabled={!canMoveUp || reordering}
            aria-label={`Mover ${product.name} para cima`}
          >
            <ArrowUp size={15} />
          </button>
          <button
            type="button"
            className="flex size-9 items-center justify-center border border-bubble-line text-bubble-ink transition-colors hover:border-bubble-ink disabled:cursor-not-allowed disabled:opacity-25"
            onClick={onMoveDown}
            disabled={!canMoveDown || reordering}
            aria-label={`Mover ${product.name} para baixo`}
          >
            <ArrowDown size={15} />
          </button>
        </div>
        <button
          type="button"
          className={`min-w-[72px] border px-3 py-2 font-sans text-[.58rem] font-bold uppercase tracking-[.08em] ${
            product.active
              ? "border-bubble-success text-bubble-success"
              : "border-bubble-line text-bubble-ink/45"
          }`}
          onClick={onToggle}
        >
          {product.active ? "Visível" : "Oculto"}
        </button>
        <button
          type="button"
          className="min-w-[72px] border border-bubble-ink px-3 py-2 font-sans text-[.58rem] font-bold uppercase tracking-[.08em]"
          onClick={onEdit}
        >
          Editar
        </button>
        <button
          type="button"
          className="min-w-[72px] px-3 py-1 font-sans text-[.58rem] font-bold uppercase tracking-[.08em] text-bubble-danger"
          onClick={onDelete}
        >
          Excluir
        </button>
      </div>
    </article>
  );
}

function ProductEditorModal({
  product,
  sports,
  onClose,
  onSaved,
  notify,
  demoMode = false,
}: {
  product: Product | null;
  sports: string[];
  onClose: () => void;
  onSaved: OnSaved;
  notify: Notify;
  demoMode?: boolean;
}) {
  useBodyScrollLock(true);
  const editing = Boolean(product);
  const [draft, setDraft] = useState<ProductDraft>(() =>
    product ? { ...product, cat: catalogCategory(product.cat) } : createEmptyProductDraft(),
  );
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const previews = useObjectUrls(files);

  useEffect(() => {
    setDraft(
      product ? { ...product, cat: catalogCategory(product.cat) } : createEmptyProductDraft(),
    );
    setFiles([]);
    setError("");
  }, [product?.id]);

  async function save() {
    const validation = validateProductDraft(draft);
    if (validation) {
      setError(validation);
      return;
    }
    setSaving(true);
    setError("");
    let created: Product | null = null;
    try {
      if (demoMode) {
        created = saveDemoProduct(productPayload(draft), product?.id);
      } else if (product) {
        await apiFetch(`/products/${product.id}`, {
          method: "PATCH",
          body: JSON.stringify(productPayload(draft)),
        });
      } else {
        created = await apiFetch<Product>("/products", {
          method: "POST",
          body: JSON.stringify(productPayload(draft)),
        });
        if (files.length) await uploadProductImages(created.id, files);
      }
      await onSaved();
      onClose();
      notify(
        product
          ? "Produto atualizado na loja."
          : "Produto cadastrado e publicado na loja.",
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : `Não foi possível ${editing ? "salvar" : "cadastrar"} o produto.`;
      setError(message);
      notify(message);
      if (created && !demoMode) {
        await apiFetch(`/products/${created.id}`, { method: 'DELETE' }).catch(
          () => undefined,
        );
      }
    } finally {
      setSaving(false);
    }
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[900] flex items-center justify-center bg-bubble-ink/70 p-5 max-[760px]:p-0"
      role="dialog"
      aria-modal="true"
      aria-label={editing ? "Editar produto" : "Adicionar produto"}
    >
      <div className="flex max-h-[94vh] w-[1080px] max-w-[96vw] flex-col overflow-hidden bg-bubble-white shadow-bubble max-[760px]:h-[100dvh] max-[760px]:max-h-none max-[760px]:max-w-none">
        <div className="flex shrink-0 items-center justify-between border-b border-bubble-ink px-6 py-4">
          <div>
            <h3 className="text-xl">
              {editing ? "Editar produto" : "Adicionar produto"}
            </h3>
            <p className="mt-1 text-[.68rem] text-bubble-ink/50">
              {editing
                ? `Produto #${product?.id}`
                : "Preencha os dados para publicar na loja."}
            </p>
          </div>
          <button
            type="button"
            className="flex size-10 items-center justify-center border border-bubble-ink text-2xl"
            onClick={onClose}
            aria-label="Fechar modal"
          >
            ×
          </button>
        </div>
        <div className="grid min-h-0 flex-1 grid-cols-[280px_minmax(0,1fr)] overflow-hidden max-[760px]:block max-[760px]:overflow-y-auto">
          <aside className="overflow-y-auto border-r border-bubble-line bg-bubble-cream2 p-5 text-bubble-ink max-[760px]:overflow-visible max-[760px]:border-b max-[760px]:border-r-0">
            <ProductPreview draft={draft} previewUrl={previews[0]} />
            {product ? (
              <div className="mt-4 bg-bubble-white p-3 text-bubble-ink">
                <ProductImagesManager
                  product={product}
                  onSaved={async () => {
                    await onSaved();
                  }}
                  notify={notify}
                />
              </div>
            ) : (
              <div className="mt-4 text-bubble-ink">
                <PendingImagePicker
                  files={files}
                  previews={previews}
                  onFiles={setFiles}
                />
              </div>
            )}
          </aside>
          <div className="overflow-y-auto p-6 max-[760px]:overflow-visible max-[760px]:p-4">
            <ProductFields draft={draft} sports={sports} onDraft={setDraft} />
            {error ? (
              <div className="mt-4 border border-bubble-danger/30 bg-bubble-danger/10 p-3 text-[.76rem] text-bubble-danger">
                {error}
              </div>
            ) : null}
          </div>
        </div>
        <div className="flex shrink-0 justify-end gap-2.5 border-t border-bubble-line bg-bubble-white px-6 py-4">
          <button className={outlineButton} onClick={onClose} disabled={saving}>
            Cancelar
          </button>
          <button className={primaryButton} onClick={save} disabled={saving}>
            {saving
              ? "Salvando..."
              : editing
                ? "Salvar alterações"
                : "Cadastrar e publicar"}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function ProductPreview({ draft, previewUrl }: { draft: ProductDraft; previewUrl?: string }) {
  const color = draft.colors?.[0];
  return (
    <div className="border border-bubble-line bg-bubble-white">
      <div className="flex aspect-[3/4] items-center justify-center overflow-hidden" style={{ background: color?.h || '#EAE2CC' }}>
        {previewUrl || draft.image ? <img src={previewUrl || draft.image || ''} alt="" className="size-full object-cover" /> : <div className="w-[52%] text-bubble-white"><ProductIcon icon={draft.icon} /></div>}
      </div>
      <div className="p-3.5">
        <div className="text-[.66rem] uppercase tracking-[.1em] text-bubble-ink/45">{draft.cat ? catalogCategory(draft.cat) : 'Categoria'}</div>
        <div className="my-1.5 font-serif text-base leading-[1.35]">{draft.name || 'Nome da peça'}</div>
        <div className="flex items-end justify-between gap-2.5">
          <span className="font-bold text-bubble-ink">{money.format(Number(draft.price) || 0)}</span>
          <span className={stockBadge(draft.stock <= 0 ? 'out' : draft.stock <= 5 ? 'low' : 'ok')}>{draft.stock || 0} un.</span>
        </div>
      </div>
    </div>
  );
}

function DeleteProductModal({
  product,
  onClose,
  onDeleted,
  notify,
  demoMode = false,
}: {
  product: Product;
  onClose: () => void;
  onDeleted: OnSaved;
  notify: Notify;
  demoMode?: boolean;
}) {
  useBodyScrollLock(true);
  const [deleting, setDeleting] = useState(false);

  async function remove() {
    setDeleting(true);
    try {
      if (demoMode) deleteDemoProduct(product.id);
      else await apiFetch(`/products/${product.id}`, { method: "DELETE" });
      await onDeleted();
      notify("Produto excluído.");
    } catch (error) {
      notify(
        error instanceof Error
          ? error.message
          : "Não foi possível excluir o produto.",
      );
      setDeleting(false);
    }
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[950] flex items-center justify-center bg-bubble-ink/75 p-5"
      role="alertdialog"
      aria-modal="true"
      aria-label="Confirmar exclusão"
    >
      <div className="w-[440px] max-w-full bg-bubble-white p-7 shadow-bubble">
        <span className="font-sans text-[.62rem] font-bold uppercase tracking-[.14em] text-bubble-danger">
          Exclusão permanente
        </span>
        <h3 className="mt-2 text-2xl">Excluir este produto?</h3>
        <p className="mt-3 text-[.82rem] leading-[1.65] text-bubble-ink/60">
          “{product.name}” e suas imagens serão removidos. Os pedidos anteriores
          permanecem registrados.
        </p>
        <div className="mt-6 flex justify-end gap-2.5">
          <button className={outlineButton} onClick={onClose} disabled={deleting}>
            Cancelar
          </button>
          <button
            className={`${primaryButton} bg-bubble-danger`}
            onClick={() => void remove()}
            disabled={deleting}
          >
            {deleting ? "Excluindo..." : "Sim, excluir"}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function ProductFields({ draft, sports, onDraft }: { draft: ProductDraft; sports: string[]; onDraft: (next: ProductDraft) => void }) {
  const update = (patch: Partial<ProductDraft>) => onDraft({ ...draft, ...patch });
  const [customSport, setCustomSport] = useState('');
  const [hiddenSports, setHiddenSports] = useState<string[]>([]);
  const variantEntries = (draft.colors || []).flatMap(
    (color) => color.sizes || [],
  );
  const sizes = sortProductSizes([
    ...standardProductSizes,
    ...(draft.sizes || []),
    ...variantEntries.map((item) => item.size),
  ]);
  const hasVariantStock = variantEntries.length > 0;
  const totalStock = hasVariantStock
    ? variantEntries.reduce(
        (total, item) => total + Math.max(0, Number(item.q) || 0),
        0,
      )
    : draft.stock;
  const availableSports = Array.from(
    new Set([...sports, ...(draft.sports || [])]),
  );
  const customSelectedSports = (draft.sports || []).filter(
    (sport) => !isDefaultSport(sport),
  );
  const selectableSports = availableSports.filter(
    (sport) =>
      !hiddenSports.includes(sport) &&
      (isDefaultSport(sport) || !(draft.sports || []).includes(sport)),
  );

  useEffect(() => {
    setCustomSport('');
    setHiddenSports([]);
  }, [draft.id]);

  function addCustomSport() {
    const label = customSport.trim();
    if (!label) return;
    const existing = availableSports.find(
      (sport) => sport.toLocaleLowerCase('pt-BR') === label.toLocaleLowerCase('pt-BR'),
    );
    const selected = draft.sports || [];
    if (!selected.some(
      (sport) => sport.toLocaleLowerCase('pt-BR') === label.toLocaleLowerCase('pt-BR'),
    )) {
      update({ sports: [...selected, existing || label] });
    }
    setCustomSport('');
  }

  return (
    <>
      <label className={productLabel}>Nome</label>
      <input className={productInput} value={draft.name} onChange={(event) => update({ name: event.target.value })} />
      <div className="grid grid-cols-2 gap-2.5">
        <div>
          <label className={productLabel}>Categoria</label>
          <select className={productInput} value={draft.cat} onChange={(event) => update({ cat: event.target.value })}>
            {productCategories.map((category) => <option key={category}>{category}</option>)}
          </select>
        </div>
        <div><label className={productLabel}>Tipo (subcategoria)</label><input className={productInput} value={draft.sub || ''} onChange={(event) => update({ sub: event.target.value })} placeholder="Ex: Legging" /></div>
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        <div>
          <label className={productLabel}>Ícone</label>
          <select className={productInput} value={draft.icon} onChange={(event) => update({ icon: event.target.value })}>
            {productIcons.map((icon) => <option key={icon}>{icon}</option>)}
          </select>
        </div>
        <div><label className={productLabel}>Material</label><input className={productInput} value={draft.material || ''} onChange={(event) => update({ material: event.target.value })} placeholder="Ex: Suplex Power" /></div>
      </div>
      <div className="grid grid-cols-3 gap-2.5 max-[620px]:grid-cols-1">
        <div><label className={productLabel}>Preço (R$)</label><input className={productInput} type="number" step="0.10" min="0" value={draft.price} onChange={(event) => update({ price: Number(event.target.value) })} /></div>
        <div><label className={productLabel}>Estoque total</label><input className={productInput} type="number" min="0" value={totalStock} readOnly={hasVariantStock} onChange={(event) => update({ stock: Number(event.target.value) })} /></div>
        <div><label className={productLabel}>Coleção</label><input className={productInput} value={draft.collectionName || ''} onChange={(event) => update({ collectionName: event.target.value })} placeholder="Ex: Core" /></div>
      </div>
      <p className="mt-2 text-[.68rem] leading-relaxed text-bubble-ink/50">Digite um nome existente ou informe um nome novo para criar automaticamente uma coleção.</p>
      <div className="mt-3 border border-bubble-line bg-bubble-cream/60 p-3">
        <div className="font-sans text-[.62rem] font-bold uppercase tracking-[.1em] text-bubble-ink/55">Dados para PAC e SEDEX</div>
        <div className="grid grid-cols-4 gap-2.5 max-[620px]:grid-cols-2">
          <div><label className={productLabel}>Peso (kg)</label><input className={productInput} type="number" step="0.001" min="0.001" value={draft.weight} onChange={(event) => update({ weight: Number(event.target.value) })} /></div>
          <div><label className={productLabel}>Largura (cm)</label><input className={productInput} type="number" min="1" value={draft.width} onChange={(event) => update({ width: Number(event.target.value) })} /></div>
          <div><label className={productLabel}>Altura (cm)</label><input className={productInput} type="number" min="1" value={draft.height} onChange={(event) => update({ height: Number(event.target.value) })} /></div>
          <div><label className={productLabel}>Comprimento (cm)</label><input className={productInput} type="number" min="1" value={draft.length} onChange={(event) => update({ length: Number(event.target.value) })} /></div>
        </div>
      </div>
      <label className={productLabel}>Esportes recomendados</label>
      <div className="flex flex-wrap gap-2">
        {selectableSports.map((sport) => (
          <label className="inline-flex w-auto cursor-pointer items-center gap-1.5 rounded-[20px] border border-bubble-line bg-bubble-cream px-3 py-[7px] text-[.72rem] font-semibold has-[:checked]:border-bubble-brown has-[:checked]:bg-bubble-brown has-[:checked]:text-bubble-white" key={sport}>
            <input className="w-auto p-0" type="checkbox" checked={(draft.sports || []).includes(sport)} onChange={(event) => {
              const current = draft.sports || [];
              update({ sports: event.target.checked ? [...current, sport] : current.filter((item) => item !== sport) });
            }} /> {sport}
          </label>
        ))}
      </div>
      {customSelectedSports.length ? (
        <div className="mt-2 max-w-[520px] space-y-2">
          <div className="font-sans text-[.6rem] font-bold uppercase tracking-[.1em] text-bubble-ink/50">
            Marcações personalizadas
          </div>
          {customSelectedSports.map((sport, index) => (
            <div className="flex gap-2" key={`custom-sport-${index}`}>
              <input
                className={productInput}
                value={sport}
                maxLength={80}
                aria-label={`Editar marcação ${sport}`}
                onChange={(event) => {
                  const nextLabel = event.target.value;
                  if (sports.includes(sport)) {
                    setHiddenSports((current) =>
                      current.includes(sport) ? current : [...current, sport],
                    );
                  }
                  update({
                    sports: (draft.sports || []).map((item) =>
                      item === sport ? nextLabel : item,
                    ),
                  });
                }}
                onBlur={() => {
                  if (!sport.trim()) {
                    update({
                      sports: (draft.sports || []).filter(
                        (item) => item !== sport,
                      ),
                    });
                  }
                }}
              />
              <button
                type="button"
                className={`${outlineButton} shrink-0 px-4 text-bubble-danger`}
                onClick={() =>
                  update({
                    sports: (draft.sports || []).filter(
                      (item) => item !== sport,
                    ),
                  })
                }
              >
                Remover
              </button>
            </div>
          ))}
        </div>
      ) : null}
      <div className="mt-2 flex max-w-[520px] gap-2">
        <input
          className={productInput}
          value={customSport}
          onChange={(event) => setCustomSport(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              addCustomSport();
            }
          }}
          placeholder="Nova marcação, ex: Beach tennis"
          maxLength={80}
        />
        <button
          type="button"
          className={`${outlineButton} shrink-0 px-4`}
          onClick={addCustomSport}
          disabled={!customSport.trim()}
        >
          Adicionar
        </button>
      </div>
      <label className={productLabel}>Cores e estoque por tamanho <span className="ml-1">{(draft.colors || []).map((color, index) => <span className="ml-0.5 inline-block size-3 rounded-full border border-bubble-line align-middle" key={`${color.n}-${index}`} title={color.n} style={{ background: color.h }} />)}</span></label>
      <ColorEditor colors={(draft.colors || []) as ColorDraft[]} sizes={sizes} onColors={(colors) => update({ colors: colors as Product['colors'] })} />
      <div className="mt-1 text-[.66rem] text-bubble-ink/50">Defina a quantidade disponível de cada tamanho em cada cor. O estoque total é calculado automaticamente.</div>
      <label className={productLabel}>Descrição</label>
      <textarea className={`${productInput} resize-y leading-[1.5]`} rows={2} value={draft.desc || ''} onChange={(event) => update({ desc: event.target.value })} placeholder="Descrição da peça" />
    </>
  );
}

function PendingImagePicker({
  files,
  previews,
  onFiles,
}: {
  files: File[];
  previews: string[];
  onFiles: (files: File[]) => void;
}) {
  return (
    <div className="mb-4 border border-bubble-line bg-bubble-cream p-4">
      <div className="mb-1 font-sans text-[.66rem] font-bold uppercase tracking-[.1em]">
        Imagens do produto
      </div>
      <p className="mb-3 text-[.68rem] text-bubble-ink/55">
        Até 8 imagens JPEG, PNG ou WebP. A primeira será a principal.
      </p>
      <label className={`${outlineButton} cursor-pointer px-4 py-2.5`}>
        Selecionar imagens
        <input
          className="hidden"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          onChange={(event) =>
            onFiles(validateImageFiles(Array.from(event.target.files || [])))
          }
        />
      </label>
      {files.length ? (
        <div className="mt-3 grid grid-cols-4 gap-2 max-[520px]:grid-cols-2">
          {files.map((file, index) => (
            <div
              className="relative aspect-[3/4] overflow-hidden border border-bubble-line bg-bubble-white"
              key={`${file.name}-${file.lastModified}`}
            >
              <img
                className="size-full object-cover"
                src={previews[index]}
                alt=""
              />
              {index === 0 ? (
                <span className="absolute left-1.5 top-1.5 bg-bubble-ink px-1.5 py-1 font-sans text-[.5rem] uppercase text-bubble-white">
                  Principal
                </span>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function ProductImagesManager({
  product,
  onSaved,
  notify,
}: {
  product: Product;
  onSaved: OnSaved;
  notify: Notify;
}) {
  const [busy, setBusy] = useState(false);
  const images = orderedImages(product.images || []);

  async function act(request: () => Promise<unknown>, success: string) {
    setBusy(true);
    try {
      await request();
      await onSaved();
      notify(success);
    } catch (error) {
      notify(
        error instanceof Error
          ? error.message
          : "Não foi possível atualizar as imagens.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function upload(files: File[]) {
    if (!files.length) return;
    if (images.length + files.length > 8) {
      notify("Cada produto pode ter no máximo 8 imagens.");
      return;
    }
    await act(
      () => uploadProductImages(product.id, files),
      "Imagens enviadas para o produto.",
    );
  }

  async function move(index: number, direction: -1 | 1) {
    const next = [...images];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    await act(
      () =>
        apiFetch(`/products/${product.id}/images/order`, {
          method: "PATCH",
          body: JSON.stringify({ imageIds: next.map((image) => image.id) }),
        }),
      "Ordem das imagens atualizada.",
    );
  }

  return (
    <div className="mt-4 border-t border-bubble-line pt-4">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="font-sans text-[.64rem] font-bold uppercase tracking-[.1em]">
            Galeria ({images.length}/8)
          </div>
          <div className="mt-1 text-[.62rem] text-bubble-ink/50">
            Defina a capa, associe cada foto à cor e use as setas para organizar.
          </div>
        </div>
        <label
          className={`${outlineButton} cursor-pointer px-3 py-2 text-[.6rem] ${busy || images.length >= 8 ? "pointer-events-none opacity-45" : ""}`}
        >
          Adicionar
          <input
            className="hidden"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            disabled={busy || images.length >= 8}
            onChange={(event) => {
              void upload(
                validateImageFiles(Array.from(event.target.files || [])),
              );
              event.target.value = "";
            }}
          />
        </label>
      </div>
      {images.length ? (
        <div className="grid grid-cols-2 gap-2">
          {images.map((image, index) => (
            <div
              className={`overflow-hidden border bg-bubble-cream ${image.isPrimary ? "border-bubble-ink" : "border-bubble-line"}`}
              key={image.id}
            >
              <div className="relative aspect-[3/4]">
                <img
                  className="size-full object-cover"
                  src={image.url}
                  alt={image.altText || product.name}
                />
                {image.isPrimary ? (
                  <span className="absolute left-1.5 top-1.5 bg-bubble-ink px-1.5 py-1 font-sans text-[.5rem] uppercase text-bubble-white">
                    Principal
                  </span>
                ) : null}
                {image.colorName ? (
                  <span className="absolute bottom-1.5 left-1.5 bg-bubble-white/90 px-1.5 py-1 font-sans text-[.5rem] font-bold uppercase text-bubble-ink">
                    {image.colorName}
                  </span>
                ) : null}
              </div>
              <label className="block border-t border-bubble-line p-2 font-sans text-[.54rem] font-bold uppercase tracking-[.08em] text-bubble-ink/55">
                Cor da foto
                <select
                  className="mt-1 h-8 w-full border border-bubble-line bg-bubble-white px-2 font-serif text-[.7rem] font-normal normal-case tracking-normal text-bubble-ink"
                  value={image.colorName || ""}
                  disabled={busy}
                  onChange={(event) => {
                    const colorName = event.target.value;
                    void act(
                      () =>
                        apiFetch(
                          `/products/${product.id}/images/${image.id}`,
                          {
                            method: "PATCH",
                            body: JSON.stringify({ colorName }),
                          },
                        ),
                      colorName
                        ? `Imagem associada à cor ${colorName}.`
                        : "Imagem definida para todas as cores.",
                    );
                  }}
                >
                  <option value="">Todas as cores</option>
                  {product.colors.map((color) => (
                    <option key={color.n} value={color.n}>
                      {color.n}
                    </option>
                  ))}
                </select>
              </label>
              <div className="grid grid-cols-4 border-t border-bubble-line [&_button]:min-h-8 [&_button]:border-r [&_button]:border-bubble-line [&_button]:text-[.66rem] last:[&_button]:border-r-0">
                <button
                  type="button"
                  disabled={busy || index === 0}
                  onClick={() => void move(index, -1)}
                  aria-label="Mover imagem para a esquerda"
                >
                  ←
                </button>
                <button
                  type="button"
                  disabled={busy || index === images.length - 1}
                  onClick={() => void move(index, 1)}
                  aria-label="Mover imagem para a direita"
                >
                  →
                </button>
                <button
                  type="button"
                  disabled={busy || image.isPrimary}
                  onClick={() =>
                    void act(
                      () =>
                        apiFetch(
                          `/products/${product.id}/images/${image.id}/primary`,
                          { method: "PATCH" },
                        ),
                      "Imagem principal atualizada.",
                    )
                  }
                  aria-label="Definir como principal"
                  title="Definir como principal"
                >
                  ★
                </button>
                <button
                  type="button"
                  disabled={busy}
                  className="text-bubble-danger"
                  onClick={() =>
                    void act(
                      () =>
                        apiFetch(
                          `/products/${product.id}/images/${image.id}`,
                          { method: "DELETE" },
                        ),
                      "Imagem removida.",
                    )
                  }
                  aria-label="Excluir imagem"
                >
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="border border-dashed border-bubble-line p-4 text-center text-[.68rem] text-bubble-ink/45">
          Nenhuma imagem enviada.
        </div>
      )}
    </div>
  );
}

async function uploadProductImages(productId: number, files: File[]) {
  const body = new FormData();
  files.forEach((file) => body.append("images", file));
  return apiFetch<Product>(`/products/${productId}/images`, {
    method: "POST",
    body,
  });
}

function validateImageFiles(files: File[]) {
  const accepted = new Set(["image/jpeg", "image/png", "image/webp"]);
  const valid = files
    .filter((file) => accepted.has(file.type) && file.size <= 5 * 1024 * 1024)
    .slice(0, 8);
  return valid;
}

function orderedImages(images: ProductImage[]) {
  return [...images].sort(
    (a, b) =>
      Number(b.isPrimary) - Number(a.isPrimary) ||
      a.position - b.position,
  );
}

function useObjectUrls(files: File[]) {
  const urls = useMemo(() => files.map((file) => URL.createObjectURL(file)), [
    files,
  ]);
  useEffect(
    () => () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
    },
    [urls],
  );
  return urls;
}

function ColorEditor({ colors, sizes, onColors }: { colors: ColorDraft[]; sizes: string[]; onColors: (colors: ColorDraft[]) => void }) {
  const list = colors.length ? colors : [{ n: '', h: '#17130E' }];
  return (
    <div className="flex flex-col gap-2">
      {list.map((color, index) => (
        <div className="border border-bubble-line bg-bubble-cream p-3" key={index}>
          <div className="grid grid-cols-[46px_1fr_30px] items-center gap-2">
            <input className="h-9 w-[46px] cursor-pointer border border-bubble-line bg-bubble-white p-0.5" type="color" value={color.h || '#17130E'} onChange={(event) => onColors(list.map((item, i) => i === index ? { ...item, h: event.target.value } : item))} />
            <input className="w-full border border-bubble-line bg-bubble-white px-2.5 py-2 text-[.8rem] text-bubble-ink focus:outline focus:outline-2" placeholder="Nome da cor" value={color.n || ''} onChange={(event) => onColors(list.map((item, i) => i === index ? { ...item, n: event.target.value } : item))} />
            <button type="button" className="size-[30px] border border-bubble-line bg-transparent text-[1.05rem] leading-none text-bubble-danger hover:border-bubble-danger hover:bg-bubble-danger hover:text-bubble-white" onClick={() => onColors(list.filter((_, i) => i !== index))}>x</button>
          </div>
          <div className="mt-3 grid grid-cols-5 gap-2 max-[520px]:grid-cols-2">
            {sizes.map((size) => {
              const stock = color.sizes?.find((item) => item.size === size);
              return (
                <label className="text-[.62rem] font-semibold uppercase text-bubble-ink/60" key={size}>
                  {size}
                  <input
                    className="mt-1 w-full border border-bubble-line bg-bubble-white px-2 py-2 text-[.78rem] text-bubble-ink"
                    type="number"
                    min="0"
                    placeholder="0"
                    value={stock?.q ?? ''}
                    onChange={(event) => {
                      const remaining = (color.sizes || []).filter(
                        (item) => item.size !== size,
                      );
                      const nextSizes = event.target.value === ''
                        ? remaining
                        : [...remaining, { size, q: Math.max(0, Number(event.target.value) || 0) }];
                      onColors(list.map((item, i) =>
                        i === index ? { ...item, sizes: nextSizes } : item,
                      ));
                    }}
                  />
                </label>
              );
            })}
          </div>
        </div>
      ))}
      <button className="mt-2 w-full border border-dashed border-bubble-line bg-transparent px-3 py-[9px] font-sans text-[.66rem] font-semibold uppercase tracking-[.12em] text-bubble-ink hover:border-bubble-ink hover:bg-bubble-cream2" onClick={() => onColors([...list, { n: '', h: '#17130E' }])}>Adicionar cor</button>
    </div>
  );
}

function isDefaultSport(sport: string) {
  return defaultSports.some(
    (item) =>
      item.toLocaleLowerCase('pt-BR') === sport.toLocaleLowerCase('pt-BR'),
  );
}
