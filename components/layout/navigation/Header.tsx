import { ShoppingBag, UserRound } from 'lucide-react';

type HeaderProps = {
  cartCount: number;
  onCart: () => void;
  onAccount: () => void;
};

export function Header({ cartCount, onCart, onAccount }: HeaderProps) {
  return (
    <>
      <div className="bg-bubble-ink px-4 py-[9px] text-center font-sans text-[.72rem] font-medium uppercase tracking-[.14em] text-bubble-cream [&_b]:font-bold">
        FRETE GRÁTIS DE LANÇAMENTO em todos os pedidos · <b>5% OFF</b> no Pix
      </div>
      <header className="sticky top-0 z-[200] border-b border-bubble-ink bg-bubble-cream/95 backdrop-blur-[10px]">
        <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-5 px-8 py-[15px]">
          <a href="#top" className="flex cursor-pointer items-center gap-[11px]" aria-label="bubble">
            <span className="flex flex-col leading-[.82]">
              <span className="ml-px font-serif text-[.74rem] italic tracking-[.02em] text-bubble-ink">wear</span>
              <span className="font-display text-[1.35rem] uppercase leading-none text-bubble-ink">BUBBLE</span>
            </span>
          </a>
          <nav className="flex gap-7 font-sans text-[.8rem] font-medium uppercase tracking-[.08em] max-[980px]:hidden [&_a]:relative [&_a]:cursor-pointer [&_a]:pb-1 [&_a]:after:absolute [&_a]:after:bottom-0 [&_a]:after:left-0 [&_a]:after:h-px [&_a]:after:w-0 [&_a]:after:bg-bubble-ink [&_a]:after:transition-[width] [&_a]:after:duration-200 hover:[&_a]:after:w-full">
            <a href="#colecao">Coleção</a><a href="#conjunto">Monte seu Conjunto</a><a href="#quemsomos">Quem somos</a><a href="#contato">Contato</a>
          </nav>
          <div className="flex items-center gap-3.5">
            <button className="relative flex size-[38px] cursor-pointer items-center justify-center border-0 bg-transparent text-bubble-ink [&_svg]:size-5" title="Minha conta" onClick={onAccount}>
              <UserRound />
            </button>
            <button className="relative flex size-[38px] cursor-pointer items-center justify-center border-0 bg-transparent text-bubble-ink [&_svg]:size-5" title="Sacola" onClick={onCart}>
              <ShoppingBag />
              <span className={`${cartCount ? 'flex' : 'hidden'} absolute right-0 top-0 size-4 items-center justify-center rounded-full bg-bubble-ink text-[.62rem] font-bold text-bubble-white`}>{cartCount}</span>
            </button>
          </div>
        </div>
      </header>
    </>
  );
}
