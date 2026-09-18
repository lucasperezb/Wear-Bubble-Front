'use client';

import { useRouter } from 'next/navigation';
import type { Product } from '../../../lib/api';
import { calculateCart, type CartItem } from '../../../lib/cart';
import { productPrice } from '../../../lib/pricing';
import { FREE_SHIPPING_MINIMUM } from '../../../lib/store-config';
import { useBodyScrollLock } from '../../../lib/use-body-scroll-lock';
import { usePromotionSettings } from '../../../lib/use-promotion-settings';
import { ProgressiveDiscountNotice } from '../notices/ProgressiveDiscountNotice';
import { ProductIcon } from '../../shared';

export type { CartItem } from '../../../lib/cart';

type CartDrawerProps = {
  open: boolean;
  cart: CartItem[];
  products: Product[];
  onQty: (pid: number, size: string, color: string | undefined, bundle: string | null | undefined, delta: number) => void;
  onClose: () => void;
};

export function CartDrawer({ open, cart, products, onQty, onClose }: CartDrawerProps) {
  useBodyScrollLock(open);
  const router = useRouter();
  const promotionSettings = usePromotionSettings();
  const { lines, subtotal, freeShippingSubtotal, freeShippingRemaining, progressive, progressiveDiscount, nextProgressiveStep } = calculateCart(cart, products, null, 'Cartão de crédito', promotionSettings);
  const progress = Math.min(100, (freeShippingSubtotal / FREE_SHIPPING_MINIMUM) * 100);

  function goToCart() {
    onClose();
    router.push('/carrinho');
  }

  return (
    <>
      <div className={`fixed inset-0 z-[400] bg-bubble-ink/50 transition-opacity duration-200 ${open ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'}`} onClick={onClose} />
      <div
        className={`fixed right-0 top-0 z-[500] flex h-[100dvh] w-[440px] max-w-[94vw] flex-col bg-bubble-white transition-transform duration-300 motion-reduce:transition-none ${open ? 'translate-x-0 shadow-drawer' : 'invisible translate-x-full'}`}
        role="dialog"
        aria-modal="true"
        aria-label="Sua sacola"
        aria-hidden={!open}
        inert={!open}
      >
        <div className="flex items-center justify-between border-b border-bubble-ink py-3 pl-[26px] pr-3 max-[520px]:pl-4">
          <h3 className="text-[1.4rem]">Sua Sacola</h3>
          <button type="button" className="flex size-11 items-center justify-center border-0 bg-transparent text-2xl leading-none text-bubble-ink" onClick={onClose} aria-label="Fechar sacola">&times;</button>
        </div>
        <div className="flex-1 overflow-y-auto overscroll-contain px-[26px] py-5 max-[520px]:px-4">
          {!lines.length ? (
            <div className="px-2.5 py-[60px] text-center text-[.86rem] leading-[1.7] text-bubble-ink/50">Sua sacola está vazia.<br />A Coleção Core tem estoque limitado — garanta suas peças.</div>
          ) : (
            <>
              <div className="mb-[18px]">
                <div className={`mb-2 text-[.74rem] ${freeShippingRemaining <= 0 ? 'font-semibold text-bubble-success' : 'text-bubble-ink/70 [&_b]:text-bubble-brown'}`}>
                  {freeShippingRemaining <= 0 ? (
                    <>Você ganhou <b>FRETE GRÁTIS</b>!</>
                  ) : (
                    <>Faltam <b>R$ {freeShippingRemaining.toFixed(2).replace('.', ',')}</b> para o frete grátis</>
                  )}
                </div>
                <div className="h-1.5 overflow-hidden rounded-[3px] bg-bubble-cream2"><div className="h-full rounded-[3px] bg-gradient-to-r from-bubble-ink to-bubble-candy transition-[width] duration-[400ms]" style={{ width: `${progress}%` }} /></div>
              </div>
              <div className="mb-[18px]">
                <ProgressiveDiscountNotice settings={promotionSettings.progressive} progressive={progressive} discount={progressiveDiscount} nextStep={nextProgressiveStep} compact />
              </div>
              {lines.map(({ item, product }) => (
                <div className="flex gap-3.5 border-b border-bubble-line py-4" key={`${item.pid}-${item.color || 'legacy'}-${item.size}-${item.bundle || 'single'}`}>
                  <div className="flex h-[74px] w-[62px] shrink-0 items-center justify-center overflow-hidden bg-bubble-cream2 [&_svg]:w-3/5">
                    {product.image ? (
                      <img className="size-full object-cover" src={product.image} alt="" loading="lazy" decoding="async" />
                    ) : (
                      <ProductIcon icon={product.icon} />
                    )}
                  </div>
                  <div className="flex flex-1 flex-col gap-[3px]">
                    {item.bundle ? <div className="text-[.64rem] font-bold uppercase tracking-[.06em] text-bubble-success">Conjunto · 5% OFF</div> : null}
                    <div className="text-[.85rem] font-medium">{product.name}</div>
                    <div className="text-[.7rem] text-bubble-ink/50">{item.color ? `Cor ${item.color} · ` : ''}Tam. {item.size} · R$ {productPrice(product).toFixed(2).replace('.', ',')} un.</div>
                    <div className="mt-1.5 flex items-center gap-2.5 [&_button]:size-9 [&_button]:border [&_button]:border-bubble-line [&_button]:bg-transparent [&_button]:text-[.95rem]">
                      <button type="button" aria-label="Diminuir quantidade" onClick={() => onQty(item.pid, item.size, item.color, item.bundle, -1)}>−</button><span className="min-w-4 text-center">{item.qty}</span><button type="button" aria-label="Aumentar quantidade" onClick={() => onQty(item.pid, item.size, item.color, item.bundle, 1)}>+</button>
                    </div>
                    <button type="button" className="-ml-1 mt-0.5 self-start border-0 bg-transparent px-1 py-2 text-[.72rem] text-bubble-brown underline" onClick={() => onQty(item.pid, item.size, item.color, item.bundle, -item.qty)}>Remover</button>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
        {lines.length ? (
          <div className="border-t border-bubble-ink px-[26px] pt-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] max-[520px]:px-4">
            {progressiveDiscount > 0 ? <div className="mb-2 flex items-center justify-between text-[.8rem] text-bubble-success"><span>Desconto progressivo</span><span>-R$ {progressiveDiscount.toFixed(2).replace('.', ',')}</span></div> : null}
            <div className="mb-3 flex items-center justify-between text-[1.05rem] font-semibold"><span>Subtotal</span><span>R$ {(subtotal - progressiveDiscount).toFixed(2).replace('.', ',')}</span></div>
            <button className="inline-flex w-full items-center justify-center gap-2 border border-transparent bg-bubble-ink px-[30px] py-[15px] font-sans text-[.78rem] font-semibold uppercase tracking-[.14em] text-bubble-white transition-all hover:border-bubble-ink hover:bg-bubble-white hover:text-bubble-ink" onClick={goToCart}>
              Ir para o carrinho
            </button>
          </div>
        ) : null}
      </div>
    </>
  );
}
