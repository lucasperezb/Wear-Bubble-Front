import { Check, CreditCard, ShoppingBag, Truck } from 'lucide-react';
import type { CheckoutStep } from './shared/types';

const steps: Array<{ id: CheckoutStep; label: string; icon: typeof ShoppingBag }> = [
  { id: 'cart', label: 'Carrinho', icon: ShoppingBag },
  { id: 'delivery', label: 'Entrega', icon: Truck },
  { id: 'payment', label: 'Pagamento', icon: CreditCard },
  { id: 'confirmation', label: 'Confirmação', icon: Check },
];

export function CheckoutStepper({ current }: { current: CheckoutStep }) {
  const currentIndex = steps.findIndex((step) => step.id === current);

  return (
    <nav aria-label="Etapas da compra" className="mx-auto grid w-full max-w-[560px] grid-cols-4">
      {steps.map((step, index) => {
        const Icon = step.icon;
        const active = index === currentIndex;
        const complete = index < currentIndex;
        return (
          <div className={`relative flex flex-col items-center border-b-2 pb-3 text-center ${active ? 'border-bubble-ink text-bubble-ink' : complete ? 'border-bubble-success text-bubble-success' : 'border-bubble-line text-bubble-ink/35'}`} key={step.id}>
            <Icon className="mb-1 size-5" />
            <span className="font-sans text-[.68rem] font-semibold uppercase tracking-[.08em]">{step.label}</span>
          </div>
        );
      })}
    </nav>
  );
}
