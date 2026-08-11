import { useEffect, useState } from "react";
import { Product } from "../../lib/api";
import { categoryFilterOptions } from "../../lib/product-filters";
import { standardProductSizes } from "../../lib/product-sizes";
import { ProductCard } from "./ProductCard";

const PRODUCTS_PER_PAGE = 8;

type Filters = {
  cat: string;
  size: string;
  sport: string;
  sort: string;
};

type ProductCatalogProps = {
  filters: Filters;
  sports: string[];
  products: Product[];
  loading: boolean;
  error: string;
  onFilter: (patch: Partial<Filters>) => void;
  onClear: () => void;
  onOpen: (product: Product) => void;
  onRetry: () => void;
};

export function ProductCatalog({
  filters,
  sports,
  products,
  loading,
  error,
  onFilter,
  onClear,
  onOpen,
  onRetry,
}: ProductCatalogProps) {
  const [page, setPage] = useState(0);
  const totalPages = Math.max(1, Math.ceil(products.length / PRODUCTS_PER_PAGE));
  const currentPage = Math.min(page, totalPages - 1);
  const paginatedProducts = products.slice(
    currentPage * PRODUCTS_PER_PAGE,
    (currentPage + 1) * PRODUCTS_PER_PAGE,
  );

  useEffect(() => {
    setPage(0);
  }, [filters.cat, filters.size, filters.sport, filters.sort]);

  useEffect(() => {
    setPage((current) => Math.min(current, totalPages - 1));
  }, [totalPages]);

  return (
    <section id="colecao" className="py-[85px] max-[520px]:py-10">
      <div className="mx-auto max-w-[1200px] px-8 max-[520px]:px-3.5">
        <div className="mb-9 flex flex-wrap items-end justify-between gap-4 max-[520px]:mb-5">
          <div>
            <span className="font-sans text-[.72rem] font-semibold uppercase tracking-[.32em] text-bubble-brown max-[520px]:text-[.6rem] max-[520px]:tracking-[.2em]">
              Coleção 01 · Linha feminina
            </span>
            <h2 className="text-[2.6rem] max-[520px]:mt-1 max-[520px]:text-[2rem]">
              Performance Line
            </h2>
          </div>
          <p className="max-w-[380px] text-[.9rem] italic leading-[1.6] text-bubble-ink/60 max-[520px]:hidden">
            Clique na peça para ver detalhes, tecido e sugestão de conjunto.
            Peças da coleção não voltam ao estoque.
          </p>
        </div>

        <div className="mb-[26px] flex flex-wrap items-center gap-2.5 max-[520px]:mb-4 max-[520px]:max-h-[88px] max-[520px]:overflow-y-auto">
          {categoryFilterOptions.map(({ value, label }) => (
            <button
              key={value}
              className={`${filters.cat === value ? "border-bubble-ink bg-bubble-ink text-bubble-white" : "border-bubble-line bg-bubble-white text-bubble-ink/60"} border px-[18px] py-[9px] font-sans text-[.7rem] font-semibold uppercase tracking-[.1em]`}
              onClick={() => onFilter({ cat: value })}
            >
              {label}
            </button>
          ))}
          <select
            className="cursor-pointer border border-bubble-line bg-bubble-white px-3 py-[9px] font-sans text-[.72rem] font-semibold tracking-[.04em] text-bubble-ink/70"
            value={filters.size}
            onChange={(event) => onFilter({ size: event.target.value })}
          >
            <option value="">Tamanho</option>
            {standardProductSizes.map((size) => (
              <option key={size}>{size}</option>
            ))}
          </select>
          <select
            className="cursor-pointer border border-bubble-line bg-bubble-white px-3 py-[9px] font-sans text-[.72rem] font-semibold tracking-[.04em] text-bubble-ink/70"
            value={filters.sport}
            onChange={(event) => onFilter({ sport: event.target.value })}
          >
            <option value="">Esporte</option>
            {sports.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
          <select
            className="cursor-pointer border border-bubble-line bg-bubble-white px-3 py-[9px] font-sans text-[.72rem] font-semibold tracking-[.04em] text-bubble-ink/70"
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
            className="border-0 bg-transparent font-sans text-[.68rem] font-semibold text-bubble-brown underline"
            onClick={onClear}
          >
            Limpar filtros
          </button>
          <span className="ml-auto text-[.7rem] text-bubble-ink/50">
            {products.length} peça{products.length !== 1 ? "s" : ""}
          </span>
        </div>

        <div className="grid grid-cols-4 gap-0.5 border border-bubble-ink bg-bubble-cream2 max-[980px]:grid-cols-2 max-[350px]:grid-cols-1">
          {loading ? (
            <div className="col-span-full flex min-h-[220px] flex-col items-center justify-center gap-2.5 border border-bubble-ink/10 bg-bubble-cream2 p-8 text-center">
              Carregando a coleção...
            </div>
          ) : null}
          {!loading && error ? (
            <div className="col-span-full flex min-h-[220px] flex-col items-center justify-center gap-2.5 border border-bubble-ink/10 bg-bubble-cream2 p-8 text-center">
              <strong>Não foi possível carregar a coleção.</strong>
              <span className="text-[.82rem] text-bubble-ink/65">{error}</span>
              <button
                className="inline-flex items-center justify-center gap-2 border border-bubble-ink bg-transparent px-[30px] py-[15px] font-sans text-[.78rem] font-semibold uppercase tracking-[.14em] text-bubble-ink transition-all hover:bg-bubble-ink hover:text-bubble-white"
                onClick={onRetry}
              >
                Tentar novamente
              </button>
            </div>
          ) : null}
          {!loading && !error && !products.length ? (
            <div className="col-span-full flex min-h-[220px] flex-col items-center justify-center gap-2.5 border border-bubble-ink/10 bg-bubble-cream2 p-8 text-center">
              Nenhuma peça encontrada com estes filtros.
            </div>
          ) : null}
          {!loading && !error
            ? paginatedProducts.map((product) => (
                <ProductCard key={product.id} product={product} onOpen={onOpen} />
              ))
            : null}
        </div>

        {!loading && !error && totalPages > 1 ? (
          <div className="mt-5 flex items-center justify-center gap-4">
            <button
              type="button"
              aria-label="Ver peças anteriores"
              disabled={currentPage === 0}
              className="flex h-11 w-11 items-center justify-center border border-bubble-ink bg-bubble-white font-sans text-xl text-bubble-ink transition-colors hover:bg-bubble-ink hover:text-bubble-white disabled:cursor-not-allowed disabled:border-bubble-line disabled:text-bubble-ink/25 disabled:hover:bg-bubble-white"
              onClick={() => setPage((current) => Math.max(0, current - 1))}
            >
              ←
            </button>
            <span className="min-w-[62px] text-center font-sans text-[.68rem] font-semibold uppercase tracking-[.14em] text-bubble-ink/60">
              {currentPage + 1} / {totalPages}
            </span>
            <button
              type="button"
              aria-label="Ver próximas peças"
              disabled={currentPage === totalPages - 1}
              className="flex h-11 w-11 items-center justify-center border border-bubble-ink bg-bubble-white font-sans text-xl text-bubble-ink transition-colors hover:bg-bubble-ink hover:text-bubble-white disabled:cursor-not-allowed disabled:border-bubble-line disabled:text-bubble-ink/25 disabled:hover:bg-bubble-white"
              onClick={() =>
                setPage((current) => Math.min(totalPages - 1, current + 1))
              }
            >
              →
            </button>
          </div>
        ) : null}
      </div>
    </section>
  );
}
