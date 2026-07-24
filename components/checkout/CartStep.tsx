import type { Product } from '../../lib/api';
import { money } from '../../lib/api';
import type { AppliedCoupon, CartItem } from '../../lib/cart';
import { formatCoupon } from '../../lib/input-formatters';
import { ProductIcon } from '../shared/ProductIcon';

type CartStepProps = {
  lines: Array<{ item: CartItem; product: Product }>;
  couponCode: string;
  coupon: AppliedCoupon;
  message: string;
  onCouponCode: (value: string) => void;
  onApplyCoupon: () => void;
  onRemoveCoupon: () => void;
  onQty: (item: CartItem, delta: number) => void;
};

export function CartStep({ lines, couponCode, coupon, message, onCouponCode, onApplyCoupon, onRemoveCoupon, onQty }: CartStepProps) {
  return (
    <section>
      <h1 className="mb-6 text-[clamp(2rem,5vw,3.5rem)]">Seu carrinho</h1>
      <div className="border border-bubble-line bg-bubble-white px-6">
        {lines.map(({ item, product }) => (
          <div className="grid grid-cols-[96px_minmax(0,1fr)_auto] gap-5 border-b border-bubble-line py-5 last:border-b-0 max-[620px]:grid-cols-[72px_1fr]" key={`${item.pid}-${item.size}-${item.bundle || 'single'}`}>
            <div className="flex h-[120px] w-24 shrink-0 items-center justify-center bg-bubble-cream2 max-[620px]:h-[92px] max-[620px]:w-[72px] [&_svg]:w-3/5"><ProductIcon icon={product.icon} /></div>
            <div className="flex min-w-0 flex-col">
              {item.bundle ? <span className="mb-1 font-sans text-[.64rem] font-bold uppercase tracking-[.08em] text-bubble-success">Conjunto · 5% OFF</span> : null}
              <strong className="font-serif text-base">{product.name}</strong>
              <span className="mt-1 text-[.75rem] text-bubble-ink/55">Tamanho: {item.size}</span>
              <span className="mt-1 text-[.72rem] text-bubble-ink/55">Unitario: {money.format(product.price)}</span>
              <div className="mt-auto flex items-center gap-3 pt-3">
                <button className="size-8 rounded-full border border-bubble-ink bg-transparent" onClick={() => onQty(item, -1)}>−</button>
                <span className="min-w-4 text-center">{item.qty}</span>
                <button className="size-8 rounded-full border border-bubble-ink bg-transparent" onClick={() => onQty(item, 1)}>+</button>
                <button className="ml-2 border-0 bg-transparent font-sans text-[.68rem] font-semibold uppercase text-bubble-danger underline" onClick={() => onQty(item, -item.qty)}>Remover</button>
              </div>
            </div>
            <strong className="text-right max-[620px]:col-span-2">{money.format(product.price * item.qty)}</strong>
          </div>
        ))}
      </div>

      <div className="mt-6 max-w-[420px]">
        <h2 className="mb-3 text-lg">Cupom de desconto</h2>
        {coupon ? (
          <div className="border border-bubble-success/30 bg-bubble-success/10 p-4 text-[.8rem] font-semibold text-bubble-success">
            Cupom {coupon.code} aplicado (-{coupon.pct}%) · <button className="border-0 bg-transparent text-inherit underline" onClick={onRemoveCoupon}>remover</button>
          </div>
        ) : (
          <div className="flex border border-bubble-line bg-bubble-white p-1">
            <input className="min-w-0 flex-1 border-0 bg-transparent px-3 py-2 text-[.82rem] uppercase outline-none" value={couponCode} onChange={(event) => onCouponCode(formatCoupon(event.target.value))} autoCapitalize="characters" maxLength={30} placeholder="Digite o cupom" />
            <button className="bg-bubble-ink px-5 font-sans text-[.7rem] font-semibold uppercase text-bubble-white" onClick={onApplyCoupon}>Adicionar</button>
          </div>
        )}
        {message ? <p className="mt-2 text-[.72rem] text-bubble-brown">{message}</p> : null}
      </div>
    </section>
  );
}
