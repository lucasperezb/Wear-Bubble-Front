import Link from 'next/link';
import type { Order } from '../../../lib/api';
import { money } from '../../../lib/api';

export function ConfirmationStep({ order, orderNumber, email }: { order: Order | null; orderNumber?: string; email?: string }) {
  const loginHref = `/login?modo=código${email ? `&email=${encodeURIComponent(email)}` : ''}`;
  return (
    <section className="border border-bubble-line bg-bubble-white p-8 text-center">
      <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-bubble-success text-3xl text-bubble-white">✓</div>
      <h1 className="mt-5 text-[clamp(2rem,5vw,3.5rem)]">Pedido recebido</h1>
      {order ? (
        <>
          <p className="mt-3 text-bubble-ink/65">Pedido <b>#{order.number}</b> · {money.format(order.total)}</p>
          <p className="mt-2 text-[.78rem] text-bubble-ink/55">{order.status === 'paid' ? 'Pagamento confirmado.' : 'Aguardando a confirmação do pagamento.'}</p>
        </>
      ) : (
        <>
          <p className="mt-3 text-bubble-ink/65">{orderNumber ? <>Pedido <b>#{orderNumber}</b>.</> : 'Seu pedido foi criado.'} Será atualizado assim que o pagamento for confirmado.</p>
          <p className="mt-2 text-[.78rem] text-bubble-ink/55">Para acompanhar a compra, entre usando o código enviado ao seu e-mail.</p>
        </>
      )}
      <div className="mt-7 flex flex-wrap justify-center gap-3">
        <Link href="/" className="cursor-pointer bg-bubble-ink px-6 py-3 font-sans text-[.72rem] font-semibold uppercase tracking-[.1em] text-bubble-white">Voltar para a loja</Link>
        <Link href={order ? '/?conta=1' : loginHref} className="cursor-pointer border border-bubble-ink px-6 py-3 font-sans text-[.72rem] font-semibold uppercase tracking-[.1em]">Ver meus pedidos</Link>
      </div>
    </section>
  );
}
