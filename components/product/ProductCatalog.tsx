import { Product } from '../../lib/api';
import { ProductCard } from './ProductCard';

type Filters = {
  cat: string;
  size: string;
  material: string;
  sport: string;
  stock: string;
  sort: string;
};

type ProductCatalogProps = {
  filters: Filters;
  materials: string[];
  sports: string[];
  products: Product[];
  loading: boolean;
  error: string;
  onFilter: (patch: Partial<Filters>) => void;
  onClear: () => void;
  onOpen: (product: Product) => void;
  onRetry: () => void;
};

export function ProductCatalog({ filters, materials, sports, products, loading, error, onFilter, onClear, onOpen, onRetry }: ProductCatalogProps) {
  const categories = [
    ['all', 'Tudo'],
    ['Top', 'Tops'],
    ['Parte de baixo', 'Partes de baixo'],
    ['Casaco', 'Casacos'],
    ['Acessorio', 'Acessorios'],
    ['Acessório', 'Acessorios'],
  ];

  return (
    <section id="colecao" className="py-[85px]">
      <div className="mx-auto max-w-[1200px] px-8">
        <div className="mb-9 flex flex-wrap items-end justify-between gap-4">
          <div><span className="font-sans text-[.72rem] font-semibold uppercase tracking-[.32em] text-bubble-brown">Colecao 01 · Linha feminina</span><h2 className="text-[2.6rem]">Performance Line</h2></div>
          <p className="max-w-[380px] text-[.9rem] italic leading-[1.6] text-bubble-ink/60">Clique na peca para ver detalhes, tecido e sugestao de conjunto. Pecas da colecao nao voltam ao estoque.</p>
        </div>
        <div className="mb-[26px] flex flex-wrap items-center gap-2.5">
          {categories.slice(0, 5).map(([value, label]) => (
            <button key={value} className={`${filters.cat === value ? 'border-bubble-ink bg-bubble-ink text-bubble-white' : 'border-bubble-line bg-bubble-white text-bubble-ink/60'} border px-[18px] py-[9px] font-sans text-[.7rem] font-semibold uppercase tracking-[.1em]`} onClick={() => onFilter({ cat: value })}>{label}</button>
          ))}
          <select className="border border-bubble-line bg-bubble-white px-3 py-[9px] font-sans text-[.72rem] font-semibold tracking-[.04em] text-bubble-ink/70" value={filters.size} onChange={(event) => onFilter({ size: event.target.value })}>
            <option value="">Tamanho</option><option>P</option><option>M</option><option>G</option><option>GG</option><option>U</option>
          </select>
          <select className="border border-bubble-line bg-bubble-white px-3 py-[9px] font-sans text-[.72rem] font-semibold tracking-[.04em] text-bubble-ink/70" value={filters.material} onChange={(event) => onFilter({ material: event.target.value })}>
            <option value="">Material</option>{materials.map((item) => <option key={item}>{item}</option>)}
          </select>
          <select className="border border-bubble-line bg-bubble-white px-3 py-[9px] font-sans text-[.72rem] font-semibold tracking-[.04em] text-bubble-ink/70" value={filters.sport} onChange={(event) => onFilter({ sport: event.target.value })}>
            <option value="">Esporte</option>{sports.map((item) => <option key={item}>{item}</option>)}
          </select>
          <select className="border border-bubble-line bg-bubble-white px-3 py-[9px] font-sans text-[.72rem] font-semibold tracking-[.04em] text-bubble-ink/70" value={filters.stock} onChange={(event) => onFilter({ stock: event.target.value })}>
            <option value="">Disponibilidade</option><option value="in">Em estoque</option><option value="low">Ultimas unidades</option>
          </select>
          <select className="border border-bubble-line bg-bubble-white px-3 py-[9px] font-sans text-[.72rem] font-semibold tracking-[.04em] text-bubble-ink/70" value={filters.sort} onChange={(event) => onFilter({ sort: event.target.value })}>
            <option value="rel">Ordenar: Relevancia</option><option value="asc">Menor preco</option><option value="desc">Maior preco</option><option value="rating">Melhor avaliadas</option>
          </select>
          <button className="border-0 bg-transparent font-sans text-[.68rem] font-semibold text-bubble-brown underline" onClick={onClear}>Limpar filtros</button>
          <span className="ml-auto text-[.7rem] text-bubble-ink/50">{products.length} peca{products.length !== 1 ? 's' : ''}</span>
        </div>
        <div className="grid grid-cols-4 gap-0.5 border border-bubble-ink bg-bubble-ink max-[980px]:grid-cols-2">
          {loading ? <div className="col-span-full flex min-h-[220px] flex-col items-center justify-center gap-2.5 border border-bubble-ink/10 bg-bubble-cream2 p-8 text-center">Carregando a colecao...</div> : null}
          {!loading && error ? (
            <div className="col-span-full flex min-h-[220px] flex-col items-center justify-center gap-2.5 border border-bubble-ink/10 bg-bubble-cream2 p-8 text-center">
              <strong>Nao foi possivel carregar a colecao.</strong>
              <span className="text-[.82rem] text-bubble-ink/65">{error}</span>
              <button className="inline-flex items-center justify-center gap-2 border border-bubble-ink bg-transparent px-[30px] py-[15px] font-sans text-[.78rem] font-semibold uppercase tracking-[.14em] text-bubble-ink transition-all hover:bg-bubble-ink hover:text-bubble-white" onClick={onRetry}>Tentar novamente</button>
            </div>
          ) : null}
          {!loading && !error && !products.length ? <div className="col-span-full flex min-h-[220px] flex-col items-center justify-center gap-2.5 border border-bubble-ink/10 bg-bubble-cream2 p-8 text-center">Nenhuma peca encontrada com estes filtros.</div> : null}
          {!loading && !error ? products.map((product) => <ProductCard key={product.id} product={product} onOpen={onOpen} />) : null}
        </div>
      </div>
    </section>
  );
}
