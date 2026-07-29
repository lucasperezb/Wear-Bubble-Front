'use client';

import { useRouter } from 'next/navigation';
import type { Product } from '../../lib/api';
import { calculateCart, type CartItem } from '../../lib/cart';
import { FREE_SHIPPING_ENABLED } from '../../lib/store-config';
import { useBodyScrollLock } from '../../lib/use-body-scroll-lock';
import { ProductIcon } from '../shared/ProductIcon';

export type { CartItem } from '../../lib/cart';

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
  const { lines, subtotal, freeShippingRemaining } = calculateCart(cart, products, null, 'Cartao de credito');
  const progress = FREE_SHIPPING_ENABLED
    ? 100
    : Math.min(100, (subtotal / 299) * 100);

  function goToCart() {
    onClose();
    router.push('/carrinho');
  }

  return (
    <>
      <div className={`fixed inset-0 z-[400] bg-bubble-ink/50 transition-opacity duration-200 ${open ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'}`} onClick={onClose} />
      <div className={`fixed right-0 top-0 z-[500] flex h-full w-[440px] max-w-[94vw] flex-col bg-bubble-white shadow-drawer transition-transform duration-300 ${open ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-center justify-between border-b border-bubble-ink px-[26px] py-[22px]">
          <h3 className="text-[1.4rem]">Sua Sacola</h3>
          <button className="border-0 bg-transparent text-2xl leading-none text-bubble-ink" onClick={onClose}>&times;</button>
        </div>
        <div className="flex-1 overflow-y-auto px-[26px] py-5">
          {!lines.length ? (
            <div className="px-2.5 py-[60px] text-center text-[.86rem] leading-[1.7] text-bubble-ink/50">Sua sacola esta vazia.<br />A Colecao 01 tem estoque limitado — garanta suas pecas.</div>
          ) : (
            <>
              <div className="mb-[18px]">
                <div className={`mb-2 text-[.74rem] ${freeShippingRemaining <= 0 ? 'font-semibold text-bubble-success' : 'text-bubble-ink/70 [&_b]:text-bubble-brown'}`}>
                  {FREE_SHIPPING_ENABLED ? (
                    <>Lancamento Bubble: <b>FRETE GRATIS</b> em todos os pedidos!</>
                  ) : freeShippingRemaining <= 0 ? (
                    <>Voce ganhou <b>FRETE GRATIS</b>!</>
                  ) : (
                    <>Faltam <b>R$ {freeShippingRemaining.toFixed(2).replace('.', ',')}</b> para o frete gratis</>
                  )}
                </div>
                <div className="h-1.5 overflow-hidden rounded-[3px] bg-bubble-cream2"><div className="h-full rounded-[3px] bg-gradient-to-r from-bubble-ink to-bubble-candy transition-[width] duration-[400ms]" style={{ width: `${progress}%` }} /></div>
              </div>
              {lines.map(({ item, product }) => (
                <div className="flex gap-3.5 border-b border-bubble-line py-4" key={`${item.pid}-${item.color || 'legacy'}-${item.size}-${item.bundle || 'single'}`}>
                  <div className="flex h-[74px] w-[62px] shrink-0 items-center justify-center overflow-hidden bg-bubble-cream2 [&_svg]:w-3/5">
                    {product.image ? (
                      <img className="size-full object-cover" src={product.image} alt="" />
                    ) : (
                      <ProductIcon icon={product.icon} />
                    )}
                  </div>
                  <div className="flex flex-1 flex-col gap-[3px]">
                    {item.bundle ? <div className="text-[.64rem] font-bold uppercase tracking-[.06em] text-bubble-success">Conjunto · 5% OFF</div> : null}
                    <div className="text-[.85rem] font-medium">{product.name}</div>
                    <div className="text-[.7rem] text-bubble-ink/50">{item.color ? `Cor ${item.color} · ` : ''}Tam. {item.size} · R$ {product.price.toFixed(2).replace('.', ',')} un.</div>
                    <div className="mt-1.5 flex items-center gap-2.5 [&_button]:size-[22px] [&_button]:border [&_button]:border-bubble-line [&_button]:bg-transparent [&_button]:text-[.8rem]">
                      <button onClick={() => onQty(item.pid, item.size, item.color, item.bundle, -1)}>−</button><span>{item.qty}</span><button onClick={() => onQty(item.pid, item.size, item.color, item.bundle, 1)}>+</button>
                    </div>
                    <button className="mt-[5px] self-start border-0 bg-transparent text-[.68rem] text-bubble-brown underline" onClick={() => onQty(item.pid, item.size, item.color, item.bundle, -item.qty)}>Remover</button>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
        {lines.length ? (
          <div className="border-t border-bubble-ink px-[26px] py-5">
            <div className="mb-3 flex items-center justify-between text-[1.05rem] font-semibold"><span>Subtotal</span><span>R$ {subtotal.toFixed(2).replace('.', ',')}</span></div>
            <button className="inline-flex w-full items-center justify-center gap-2 border border-transparent bg-bubble-ink px-[30px] py-[15px] font-sans text-[.78rem] font-semibold uppercase tracking-[.14em] text-bubble-white transition-all hover:border-bubble-ink hover:bg-bubble-white hover:text-bubble-ink" onClick={goToCart}>
              Ir para o carrinho
            </button>
          </div>
        ) : null}
      </div>
    </>
  );
}
