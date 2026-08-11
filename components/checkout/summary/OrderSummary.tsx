import type { ReactNode } from "react";
import { money } from "../../../lib/api";
import type { AppliedCoupon } from "../../../lib/cart";

type OrderSummaryProps = {
  subtotal: number;
  bundleDiscount: number;
  couponDiscount: number;
  pixDiscount: number;
  total: number;
  freeShipping: boolean;
  shippingPrice: number | null;
  coupon: AppliedCoupon;
  action?: ReactNode;
};

export function OrderSummary({
  subtotal,
  bundleDiscount,
  couponDiscount,
  pixDiscount,
  total,
  freeShipping,
  shippingPrice,
  coupon,
  action,
}: OrderSummaryProps) {
  return (
    <aside className="sticky top-6 border border-bubble-line bg-bubble-white p-6 max-[900px]:static">
      <h2 className="mb-5 text-xl">Resumo do pedido</h2>
      <SummaryRow label="Produtos" value={money.format(subtotal)} />
      {bundleDiscount > 0 ? (
        <SummaryRow
          label="Desconto no conjunto"
          value={`-${money.format(bundleDiscount)}`}
          discount
        />
      ) : null}
      {couponDiscount > 0 ? (
        <SummaryRow
          label={coupon?.type === 'store_credit' ? `Crédito ${coupon.code}` : `Cupom ${coupon?.code}`}
          value={`-${money.format(couponDiscount)}`}
          discount
        />
      ) : null}
      {pixDiscount > 0 ? (
        <SummaryRow
          label="Desconto no Pix"
          value={`-${money.format(pixDiscount)}`}
          discount
        />
      ) : null}
      <SummaryRow
        label="Frete"
        value={
          freeShipping
            ? "Grátis"
            : shippingPrice !== null
              ? money.format(shippingPrice)
              : "Calculado na entrega"
        }
        discount={freeShipping}
      />
      <div className="mt-4 flex items-center justify-between border-t border-bubble-ink pt-4 text-[1.2rem] font-bold">
        <span>Total</span>
        <span>{money.format(total)}</span>
      </div>
      {action ? <div className="mt-6">{action}</div> : null}
      <div className="mt-5 flex items-center justify-center gap-2 border-t border-bubble-line pt-4 font-sans text-[.62rem] font-semibold uppercase tracking-[.08em] text-bubble-ink/50">
        <span aria-hidden="true">◇</span> Ambiente seguro
      </div>
    </aside>
  );
}

function SummaryRow({
  label,
  value,
  discount = false,
}: {
  label: string;
  value: string;
  discount?: boolean;
}) {
  return (
    <div
      className={`mb-3 flex items-center justify-between border-b border-bubble-line pb-3 text-[.82rem] ${discount ? "text-bubble-success" : ""}`}
    >
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
