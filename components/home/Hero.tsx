export function Hero() {
  return (
    <>
      <section className="relative overflow-hidden border-b border-bubble-ink px-6 pb-[90px] pt-[110px] text-center" id="top">
        <svg className="pointer-events-none absolute left-1/2 top-1/2 h-auto w-[min(560px,85vw)] -translate-x-1/2 -translate-y-[54%] opacity-10" viewBox="0 0 200 200" aria-hidden="true">
          <circle cx="100" cy="96" r="62" fill="none" stroke="#17130E" strokeWidth="9" />
          <path d="M66 64 Q96 40 130 58" fill="none" stroke="#17130E" strokeWidth="6" strokeLinecap="round" />
          <circle cx="156" cy="152" r="12" fill="#17130E" />
        </svg>
        <div className="relative mx-auto flex max-w-[900px] flex-col items-center">
          <span className="font-sans text-[.72rem] font-semibold uppercase tracking-[.32em] text-bubble-brown">moda fitness feminina · coleção 01 · estoque limitado</span>
          <h1 className="mt-[22px] text-[clamp(2.75rem,8.5vw,6.5rem)] leading-[.98]">Estoure<br />seus limites.</h1>
          <p className="m-0 mt-4 font-serif text-[clamp(1.25rem,3vw,1.9rem)] font-semibold italic">vista bubble.</p>
          <p className="mt-6 max-w-[520px] text-[1.02rem] italic leading-[1.75] text-bubble-ink/75">Peças que unem qualidade, conforto e design autêntico — porque toda mulher merece se sentir confortável e confiante em qualquer momento do seu dia.</p>
          <div className="mt-[34px] flex flex-wrap justify-center gap-3.5">
            <a href="#colecao" className="inline-flex cursor-pointer items-center justify-center gap-2 border border-transparent bg-bubble-ink px-[30px] py-[15px] font-sans text-[.78rem] font-semibold uppercase tracking-[.14em] text-bubble-white transition-all hover:border-bubble-ink hover:bg-bubble-white hover:text-bubble-ink">Comprar a Coleção</a>
            <a href="#conjunto" className="inline-flex cursor-pointer items-center justify-center gap-2 border border-bubble-ink bg-transparent px-[30px] py-[15px] font-sans text-[.78rem] font-semibold uppercase tracking-[.14em] text-bubble-ink transition-all hover:bg-bubble-ink hover:text-bubble-white">Montar Conjunto · 5% OFF</a>
          </div>
          <div className="mt-[50px] flex flex-wrap justify-center gap-11">
            {[
              ['4.9★', 'Avaliação média'],
              ['72h', 'Envio expresso'],
              ['30d', 'Troca garantida'],
            ].map(([value, label]) => (
              <div key={label}>
                <div className="font-display text-2xl text-bubble-ink">{value}</div>
                <div className="mt-1 text-[.64rem] uppercase tracking-[.24em] text-bubble-ink/55">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
      <div className="overflow-hidden whitespace-nowrap bg-bubble-ink py-[13px] text-bubble-cream">
        <div className="inline-block animate-marquee font-sans text-[.72rem] uppercase tracking-[.24em] [&_span]:mx-7 [&_span]:text-bubble-cream/85">
          <span>COLEÇÃO 01 NO AR</span> FRETE GRÁTIS DE LANÇAMENTO <span>5% OFF NO PIX</span> CONJUNTO COM 5% OFF <span>TROCA EM 30 DIAS</span> COLEÇÃO 01 NO AR <span>FRETE GRÁTIS EM TODOS OS PEDIDOS</span> 5% OFF NO PIX <span>CONJUNTO COM 5% OFF</span> TROCA EM 30 DIAS
        </div>
      </div>
    </>
  );
}
