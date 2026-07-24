'use client';

import { Check, Copy, CreditCard, QrCode } from 'lucide-react';
import Script from 'next/script';
import { useState } from 'react';
import { money } from '../../lib/api';
import { formatPersonName } from '../../lib/input-formatters';
import type { PaymentMethod } from '../../lib/cart';
import type { CardPaymentForm, PixPayment } from './checkout.types';

type PaymentStepProps = {
  method: PaymentMethod;
  message: string;
  total: number;
  card: CardPaymentForm;
  pix: PixPayment | null;
  onMethod: (method: PaymentMethod) => void;
  onCard: (patch: Partial<CardPaymentForm>) => void;
  onBack: () => void;
};

const inputClass = 'w-full border border-bubble-line bg-bubble-cream px-3.5 py-3 text-[.88rem] outline-none focus:border-bubble-ink focus:bg-bubble-white';
const labelClass = 'mb-1.5 block font-sans text-[.68rem] font-semibold uppercase tracking-[.08em] text-bubble-ink/60';

export function PaymentStep({ method, message, total, card, pix, onMethod, onCard, onBack }: PaymentStepProps) {
  const [copied, setCopied] = useState(false);

  async function copyPix() {
    if (!pix?.pix.text) return;
    await navigator.clipboard.writeText(pix.pix.text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <section>
      <Script src="https://assets.pagseguro.com.br/checkout-sdk-js/rc/dist/browser/pagseguro.min.js" strategy="afterInteractive" />
      <h1 className="mb-6 text-[clamp(2rem,5vw,3.5rem)]">Pagamento</h1>
      <div className="border border-bubble-line bg-bubble-white p-6">
        <h2 className="mb-5 text-xl">Como voce quer pagar?</h2>
        <div className="grid grid-cols-2 gap-4 max-[620px]:grid-cols-1">
          <button type="button" className={`flex min-h-[130px] flex-col items-center justify-center gap-3 border p-5 text-center transition-colors ${method === 'Pix' ? 'border-bubble-ink bg-bubble-ink text-bubble-white' : 'border-bubble-line bg-bubble-cream'}`} onClick={() => onMethod('Pix')}>
            <QrCode className="size-7" />
            <strong className="font-sans text-[.76rem] uppercase tracking-[.1em]">Pix</strong>
            <span className="text-[.72rem] opacity-75">5% de desconto</span>
          </button>
          <button type="button" className={`flex min-h-[130px] flex-col items-center justify-center gap-3 border p-5 text-center transition-colors ${method === 'Cartao de credito' ? 'border-bubble-ink bg-bubble-ink text-bubble-white' : 'border-bubble-line bg-bubble-cream'}`} onClick={() => onMethod('Cartao de credito')}>
            <CreditCard className="size-7" />
            <strong className="font-sans text-[.76rem] uppercase tracking-[.1em]">Cartao de credito</strong>
          </button>
        </div>

        {method === 'Cartao de credito' ? (
          <div className="mt-6 border-t border-bubble-line pt-6">
            <h3 className="mb-4 text-lg">Dados do cartao</h3>
            {pix ? <div className="mb-4 border border-bubble-line bg-bubble-cream p-3 text-[.74rem] leading-[1.5] text-bubble-ink/65">Ao trocar para cartao, o desconto exclusivo do Pix sera removido e o resumo voltara ao valor normal.</div> : null}
            <div className="grid grid-cols-2 gap-4 max-[620px]:grid-cols-1">
              <label className="col-span-2 max-[620px]:col-span-1"><span className={labelClass}>Nome impresso no cartao</span><input className={inputClass} value={card.holder} onChange={(event) => onCard({ holder: formatPersonName(event.target.value, 120).toUpperCase() })} autoComplete="cc-name" maxLength={120} /></label>
              <label className="col-span-2 max-[620px]:col-span-1"><span className={labelClass}>Numero do cartao</span><input className={inputClass} value={card.number} onChange={(event) => onCard({ number: formatCardNumber(event.target.value) })} inputMode="numeric" autoComplete="cc-number" maxLength={23} placeholder="0000 0000 0000 0000" /></label>
              <label><span className={labelClass}>Validade</span><input className={inputClass} value={card.expiry} onChange={(event) => onCard({ expiry: formatExpiry(event.target.value) })} inputMode="numeric" autoComplete="cc-exp" maxLength={5} placeholder="MM/AA" /></label>
              <label><span className={labelClass}>CVV</span><input className={inputClass} value={card.securityCode} onChange={(event) => onCard({ securityCode: event.target.value.replace(/\D/g, '').slice(0, 4) })} type="password" inputMode="numeric" autoComplete="cc-csc" maxLength={4} placeholder="123" /></label>
              <label className="col-span-2 max-[620px]:col-span-1">
                <span className={labelClass}>Parcelas</span>
                <select className={inputClass} value={card.installments} onChange={(event) => onCard({ installments: Number(event.target.value) })}>
                  {[1, 2, 3].map((installment) => <option key={installment} value={installment}>{installment}x de {money.format(total / installment)} sem juros</option>)}
                </select>
              </label>
            </div>
          </div>
        ) : null}

        {method === 'Pix' && pix ? (
          <div className="mt-6 border-t border-bubble-line pt-6 text-center">
            <span className="font-sans text-[.68rem] font-semibold uppercase tracking-[.1em] text-bubble-success">Pix gerado · aguardando pagamento</span>
            <h3 className="mt-2 text-xl">Escaneie ou copie o codigo</h3>
            {pix.pix.image ? <img className="mx-auto mt-5 size-[220px] border border-bubble-line bg-white p-3" src={pix.pix.image} alt="QR Code Pix do pedido" /> : null}
            <div className="mt-5 flex border border-bubble-line bg-bubble-cream p-1">
              <input className="min-w-0 flex-1 border-0 bg-transparent px-3 text-[.72rem] outline-none" value={pix.pix.text} readOnly aria-label="Codigo Pix copia e cola" />
              <button type="button" className="inline-flex shrink-0 items-center gap-2 bg-bubble-ink px-4 py-3 font-sans text-[.68rem] font-semibold uppercase text-bubble-white" onClick={copyPix}>{copied ? <Check className="size-4" /> : <Copy className="size-4" />}{copied ? 'Copiado' : 'Copiar'}</button>
            </div>
            <p className="mt-3 text-[.72rem] text-bubble-ink/55">A confirmacao acontece automaticamente depois do pagamento.</p>
          </div>
        ) : method === 'Cartao de credito' ? (
          <div className="mt-5 border border-bubble-candy bg-bubble-candy/15 p-4 text-[.74rem] leading-[1.6] text-bubble-ink/65">
            O PagBank criptografa o cartao no navegador. Numero e CVV nao sao armazenados pela Bubble.
          </div>
        ) : null}

        {message ? <p className="mt-4 text-[.75rem] text-bubble-danger">{message}</p> : null}
        <div className="mt-6">
          <button type="button" className="border border-bubble-ink px-6 py-3 font-sans text-[.72rem] font-semibold uppercase tracking-[.1em]" onClick={onBack}>Voltar</button>
        </div>
      </div>
    </section>
  );
}

function formatCardNumber(value: string) {
  return value.replace(/\D/g, '').slice(0, 19).replace(/(\d{4})(?=\d)/g, '$1 ');
}

function formatExpiry(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 4);
  return digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
}
