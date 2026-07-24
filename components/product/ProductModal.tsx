import { Product, money } from '../../lib/api';
import { ProductIcon } from '../shared/ProductIcon';

type ProductModalProps = {
  product: Product | null;
  selectedSize: string;
  onSize: (size: string) => void;
  onClose: () => void;
  onAdd: (product: Product, size: string) => void;
};

export function ProductModal({ product, selectedSize, onSize, onClose, onAdd }: ProductModalProps) {
  if (!product) return null;
  const out = product.stock <= 0;
  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center bg-bubble-ink/65 p-5">
      <div className="max-h-[92vh] w-[850px] max-w-[96vw] overflow-y-auto bg-bubble-white shadow-bubble">
        <div className="flex items-center justify-between border-b border-bubble-ink px-[22px] py-[19px]"><h3 className="text-[1.2rem]">{product.name}</h3><button className="border-0 bg-transparent text-[1.6rem] leading-none text-bubble-ink" onClick={onClose}>&times;</button></div>
        <div className="p-6">
          <div className="grid grid-cols-2 gap-[30px] max-[980px]:grid-cols-1">
            <div className="relative flex min-h-[430px] items-center justify-center overflow-hidden bg-[linear-gradient(160deg,#EAE2CC,#F3EDDD)] [&_svg]:w-[52%] [&_svg]:opacity-90">
              {product.tag ? <span className={`absolute left-3.5 top-3.5 z-[2] px-2.5 py-[5px] font-sans text-[.6rem] font-bold uppercase tracking-[.12em] ${product.tag.includes('Limitada') ? 'bg-bubble-ink text-bubble-candy' : 'bg-bubble-ink text-bubble-white'}`}>{product.tag}</span> : null}<ProductIcon icon={product.icon} />
            </div>
            <div>
              <div className="mb-2 text-[.68rem] uppercase tracking-[.12em] text-bubble-ink/50">{product.cat} · {product.sub}</div>
              <h3 className="text-[1.6rem] leading-[1.2]">{product.name}</h3>
              <div className="mt-2 flex items-center gap-1.5 text-[.7rem] text-bubble-ink/55"><span className="text-[.78rem] tracking-px text-bubble-candy">{'★'.repeat(Math.round(product.rating))}</span> {product.rating} · {product.reviews} avaliacoes</div>
              <div className="mt-4 font-display text-[1.8rem] text-bubble-ink">{money.format(product.price)}</div>
              <div className="mt-0.5 text-[.72rem] font-semibold text-bubble-success">{money.format(product.price * 0.95)} no Pix (5% OFF)</div>
              <p className="my-4 font-serif text-[.85rem] leading-[1.65] text-bubble-ink/65">{product.desc}</p>
              {product.sports?.length ? <div className="my-2.5 flex flex-wrap items-center gap-1.5 text-[.8rem]"><b>Recomendado para:</b> {product.sports.map((sport) => <span className="rounded-[20px] border border-bubble-line bg-bubble-ink/10 px-[9px] py-[3px] font-sans text-[.6rem] font-bold uppercase tracking-[.05em] text-bubble-brown" key={sport}>{sport}</span>)}</div> : null}
              <div className="mb-[18px] border-y border-bubble-line py-[11px] text-[.72rem] leading-[1.6] text-bubble-ink/55"><b>Material:</b> {product.material} · <b>Estoque:</b> {out ? 'Esgotado' : `${product.stock} un.`} · Troca gratis em 30 dias</div>
              <div className="font-sans text-[.68rem] font-bold uppercase tracking-[.12em] text-bubble-ink/60">Tamanho</div>
              <div className="mb-[18px] mt-2 flex flex-wrap gap-2">{product.sizes.map((size) => <button key={size} className={`size-[42px] border text-[.76rem] font-semibold disabled:cursor-not-allowed disabled:opacity-45 ${selectedSize === size ? 'border-bubble-ink bg-bubble-ink text-bubble-white' : 'border-bubble-line bg-bubble-cream'}`} onClick={() => onSize(size)} disabled={out}>{size}</button>)}</div>
              <button className="inline-flex w-full items-center justify-center gap-2 border border-transparent bg-bubble-ink px-[30px] py-[15px] font-sans text-[.78rem] font-semibold uppercase tracking-[.14em] text-bubble-white transition-all hover:border-bubble-ink hover:bg-bubble-white hover:text-bubble-ink disabled:cursor-not-allowed disabled:opacity-45" disabled={out || !selectedSize} onClick={() => onAdd(product, selectedSize)}>
                {out ? 'Esgotado' : `Adicionar a sacola · ${money.format(product.price)}`}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
