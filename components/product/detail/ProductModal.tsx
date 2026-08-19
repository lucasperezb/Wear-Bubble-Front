import { Product, money } from '../../../lib/api';
import { ProductIcon, SizeGuideDialog } from '../../shared';
import { useEffect, useState } from 'react';
import { useBodyScrollLock } from '../../../lib/use-body-scroll-lock';
import { availableVariantSizes, sortProductSizes } from '../../../lib/product-sizes';
import { pixPrice, productHasPromotion, productPrice, promotionPct } from '../../../lib/pricing';

type ProductModalProps = {
  product: Product | null;
  selectedSize: string;
  onSize: (size: string) => void;
  onClose: () => void;
  onAdd: (product: Product, size: string, color: string) => void;
};

export function ProductModal({ product, selectedSize, onSize, onClose, onAdd }: ProductModalProps) {
  useBodyScrollLock(Boolean(product));
  const [selectedImageId, setSelectedImageId] = useState('');
  const [selectedColorName, setSelectedColorName] = useState('');
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);

  useEffect(() => {
    setSizeGuideOpen(false);
    const primary =
      product?.images?.find((image) => image.isPrimary) ||
      product?.images?.[0];
    setSelectedImageId(primary?.id || 'legacy');
  }, [product?.id, product?.images]);

  useEffect(() => {
    if (!product) {
      setSelectedColorName('');
      return;
    }
    const configured = product.colors?.some(
      (color) => (color.sizes || []).length,
    );
    const firstColor =
      (configured
        ? product.colors.find((color) =>
            color.sizes?.some((item) => Number(item.q) > 0),
          )
        : product.colors?.[0]) || product.colors?.[0];
    setSelectedColorName(firstColor?.n || '');
    const firstSize = configured
      ? availableVariantSizes(firstColor?.sizes || [])[0] || ''
      : sortProductSizes(product.sizes)[0] || '';
    onSize(firstSize);
  }, [product?.id]);

  if (!product) return null;
  const hasVariantStock = product.colors?.some(
    (color) => (color.sizes || []).length,
  );
  const selectedColor =
    product.colors?.find((color) => color.n === selectedColorName) ||
    product.colors?.[0];
  const availableSizes = hasVariantStock
    ? availableVariantSizes(selectedColor?.sizes || [])
    : sortProductSizes(product.sizes);
  const selectedStock = hasVariantStock
    ? Math.max(
        0,
        Number(
          (selectedColor?.sizes || []).find(
            (item) => item.size.toUpperCase() === selectedSize.toUpperCase(),
          )?.q,
        ) || 0,
      )
    : product.stock;
  const out = selectedStock <= 0;
  const finalPrice = productPrice(product);
  const promo = productHasPromotion(product);
  const gallery = product.images?.length
    ? [...product.images].sort(
        (a, b) =>
          Number(b.isPrimary) - Number(a.isPrimary) ||
          a.position - b.position,
      )
    : product.image
      ? [
          {
            id: 'legacy',
            url: product.image,
            altText: product.name,
            position: 0,
            isPrimary: true,
          },
        ]
      : [];
  const selectedImage =
    gallery.find((image) => image.id === selectedImageId) || gallery[0];
  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center bg-bubble-ink/65 p-5 max-[620px]:items-end max-[620px]:p-0">
      <div className="max-h-[92vh] w-[850px] max-w-[96vw] overflow-y-auto bg-bubble-white shadow-bubble max-[620px]:h-[100dvh] max-[620px]:max-h-none max-[620px]:w-full max-[620px]:max-w-none">
        <div className="sticky top-0 z-20 flex items-center justify-between border-b border-bubble-ink bg-bubble-white px-[22px] py-[19px] max-[620px]:px-4 max-[620px]:py-3"><h3 className="truncate pr-3 text-[1.2rem] max-[620px]:text-base">{product.name}</h3><button className="flex size-10 shrink-0 items-center justify-center border border-bubble-ink bg-transparent text-[1.6rem] leading-none text-bubble-ink" onClick={onClose} aria-label="Fechar">&times;</button></div>
        <div className="p-6 max-[620px]:p-4">
          <div className="grid grid-cols-2 gap-[30px] max-[980px]:grid-cols-1">
            <div>
              <div className="relative flex min-h-[430px] items-center justify-center overflow-hidden bg-[linear-gradient(160deg,#EAE2CC,#F3EDDD)] max-[620px]:aspect-[4/5] max-[620px]:min-h-0 [&_svg]:w-[52%] [&_svg]:opacity-90">
                {promo ? <span className="absolute left-3.5 top-3.5 z-[2] bg-bubble-danger px-2.5 py-[5px] font-sans text-[.6rem] font-bold uppercase tracking-[.12em] text-bubble-white">{promotionPct(product)}% OFF</span> : product.collectionName ? <span className="absolute left-3.5 top-3.5 z-[2] bg-bubble-ink px-2.5 py-[5px] font-sans text-[.6rem] font-bold uppercase tracking-[.12em] text-bubble-white">{product.collectionName}</span> : null}
                {selectedImage ? (
                  <img
                    className="absolute inset-0 size-full object-cover"
                    src={selectedImage.url}
                    alt={selectedImage.altText || product.name}
                  />
                ) : (
                  <ProductIcon icon={product.icon} />
                )}
              </div>
              {gallery.length > 1 ? (
                <div className="mt-3 grid grid-cols-5 gap-2 max-[420px]:grid-cols-4">
                  {gallery.map((image) => (
                    <button
                      type="button"
                      className={`aspect-[3/4] overflow-hidden border bg-bubble-cream ${selectedImage?.id === image.id ? 'border-bubble-ink' : 'border-bubble-line'}`}
                      key={image.id}
                      onClick={() => setSelectedImageId(image.id)}
                      aria-label="Selecionar imagem do produto"
                    >
                      <img
                        className="size-full object-cover"
                        src={image.url}
                        alt=""
                      />
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
            <div>
              <div className="mb-2 text-[.68rem] uppercase tracking-[.12em] text-bubble-ink/50">{product.cat} · {product.sub}</div>
              <h3 className="text-[1.6rem] leading-[1.2]">{product.name}</h3>
              <div className="mt-2 flex items-center gap-1.5 text-[.7rem] text-bubble-ink/55"><span className="text-[.78rem] tracking-px text-bubble-candy">{'★'.repeat(Math.round(product.rating))}</span> {product.rating} · {product.reviews} avaliações</div>
              {promo ? <div className="mt-4 text-[.84rem] text-bubble-ink/45 line-through">{money.format(product.price)}</div> : null}
              <div className={`${promo ? 'mt-1' : 'mt-4'} font-display text-[1.8rem] text-bubble-ink`}>{money.format(finalPrice)}</div>
              <div className="mt-0.5 text-[.72rem] font-semibold text-bubble-success">{money.format(pixPrice(product))} no Pix (5% OFF)</div>
              <p className="my-4 font-serif text-[.85rem] leading-[1.65] text-bubble-ink/65">{product.desc}</p>
              {product.sports?.length ? <div className="my-2.5 flex flex-wrap items-center gap-1.5 text-[.8rem]"><b>Recomendado para:</b> {product.sports.map((sport) => <span className="rounded-[20px] border border-bubble-line bg-bubble-ink/10 px-[9px] py-[3px] font-sans text-[.6rem] font-bold uppercase tracking-[.05em] text-bubble-brown" key={sport}>{sport}</span>)}</div> : null}
              <div className="mb-[18px] border-y border-bubble-line py-[11px] text-[.72rem] leading-[1.6] text-bubble-ink/55"><b>Material:</b> {product.material} · <b>Estoque:</b> {out ? 'Esgotado' : `${selectedStock} un.`} · Troca grátis em 30 dias</div>
              {product.colors?.length ? (
                <>
                  <div className="font-sans text-[.68rem] font-bold uppercase tracking-[.12em] text-bubble-ink/60">
                    Cor{selectedColor ? ` · ${selectedColor.n}` : ''}
                  </div>
                  <div className="mb-[18px] mt-2 flex flex-wrap gap-2">
                    {product.colors.map((color) => {
                      const colorStock = hasVariantStock
                        ? (color.sizes || []).reduce(
                            (total, item) =>
                              total + Math.max(0, Number(item.q) || 0),
                            0,
                          )
                        : product.stock;
                      const active = color.n === selectedColor?.n;
                      return (
                        <button
                          key={color.n}
                          type="button"
                          className={`flex items-center gap-2 border px-3 py-2 text-[.72rem] font-semibold disabled:cursor-not-allowed disabled:opacity-40 ${active ? 'border-bubble-ink bg-bubble-ink text-bubble-white' : 'border-bubble-line bg-bubble-cream'}`}
                          onClick={() => {
                            setSelectedColorName(color.n);
                            const nextSizes = hasVariantStock
                              ? availableVariantSizes(color.sizes || [])
                              : sortProductSizes(product.sizes);
                            if (!nextSizes.includes(selectedSize)) {
                              onSize(nextSizes[0] || '');
                            }
                          }}
                          disabled={colorStock <= 0}
                          aria-pressed={active}
                        >
                          <span
                            className="size-4 rounded-full border border-current/25"
                            style={{ backgroundColor: color.h }}
                          />
                          {color.n}
                        </button>
                      );
                    })}
                  </div>
                </>
              ) : null}
              <div className="flex items-center justify-between gap-3">
                <div className="font-sans text-[.68rem] font-bold uppercase tracking-[.12em] text-bubble-ink/60">Tamanho</div>
                <button
                  type="button"
                  className="border-0 bg-transparent p-0 font-sans text-[.68rem] font-semibold text-bubble-brown underline underline-offset-4 transition-colors hover:text-bubble-ink"
                  onClick={() => setSizeGuideOpen(true)}
                >
                  Ver guia de medidas
                </button>
              </div>
              <div className="mb-[18px] mt-2 flex flex-wrap gap-2">{availableSizes.map((size) => <button key={size} className={`size-[42px] border text-[.76rem] font-semibold disabled:cursor-not-allowed disabled:opacity-45 ${selectedSize === size ? 'border-bubble-ink bg-bubble-ink text-bubble-white' : 'border-bubble-line bg-bubble-cream'}`} onClick={() => onSize(size)} disabled={out}>{size}</button>)}</div>
              <button className="inline-flex w-full items-center justify-center gap-2 border border-transparent bg-bubble-ink px-[30px] py-[15px] font-sans text-[.78rem] font-semibold uppercase tracking-[.14em] text-bubble-white transition-all hover:border-bubble-ink hover:bg-bubble-white hover:text-bubble-ink disabled:cursor-not-allowed disabled:opacity-45" disabled={out || !selectedSize || (product.colors?.length > 0 && !selectedColor)} onClick={() => onAdd(product, selectedSize, selectedColor?.n || '')}>
                {out ? 'Esgotado' : `Adicionar à sacola · ${money.format(finalPrice)}`}
              </button>
            </div>
          </div>
        </div>
      </div>
      <SizeGuideDialog
        open={sizeGuideOpen}
        onClose={() => setSizeGuideOpen(false)}
      />
    </div>
  );
}
