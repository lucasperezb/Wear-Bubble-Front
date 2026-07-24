export function ContactSection() {
  return (
    <section className="bg-bubble-ink py-[85px] text-bubble-cream" id="contato">
      <div className="mx-auto max-w-[1200px] px-8">
        <div className="mx-auto mb-10 max-w-[640px] text-center">
          <span className="font-sans text-[.72rem] font-semibold uppercase tracking-[.32em] text-bubble-cream">fale com a gente</span>
          <h2 className="mt-3 text-bubble-white">Contato</h2>
          <p className="mt-3.5 italic leading-[1.7] text-bubble-cream/80">Duvida sobre tamanho, pedido ou troca? Estamos por aqui — respondemos rapido.</p>
        </div>
        <div className="grid grid-cols-3 gap-4 max-[860px]:grid-cols-1">
          {[
            ['Instagram', '@wearbubble_', 'Seguir', 'https://instagram.com/wearbubble_'],
            ['WhatsApp Business', '+55 11 93624-0362', 'Chamar no WhatsApp', 'https://wa.me/5511936240362'],
            ['E-mail', 'contato@wearbubble.com.br', 'Enviar e-mail', 'mailto:contato@wearbubble.com.br'],
          ].map(([label, value, cta, href]) => (
            <a className="flex flex-col items-center gap-2 border border-bubble-cream/30 bg-bubble-cream/[.04] px-[22px] py-[30px] text-center text-bubble-cream transition-colors hover:border-bubble-cream hover:bg-bubble-cream hover:text-bubble-ink" href={href} target={href.startsWith('http') ? '_blank' : undefined} rel={href.startsWith('http') ? 'noopener' : undefined} key={label}>
              <span className="font-sans text-[.68rem] font-semibold uppercase tracking-[.24em] opacity-75">{label}</span>
              <span className="text-[.95rem] font-semibold">{value}</span>
              <span className="mt-1.5 border-b border-current pb-0.5 font-sans text-[.64rem] font-semibold uppercase tracking-[.2em]">{cta}</span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

export function BrandSections() {
  return (
    <>
      <section className="bg-bubble-ink py-[85px] text-bubble-cream" id="marca">
        <div className="mx-auto grid max-w-[1200px] grid-cols-2 items-center gap-[60px] px-8 max-[980px]:grid-cols-1">
          <div>
            <span className="font-sans text-[.72rem] font-semibold uppercase tracking-[.32em] text-bubble-candy">A Marca</span>
            <h2 className="text-[2.4rem] text-bubble-cream">Feita para quem<br />nao para.</h2>
            <p className="mt-4 max-w-[420px] leading-[1.7] text-bubble-cream/75">Cada peca bubble nasce da mesma pergunta: como equilibrar sofisticacao e energia esportiva? A resposta esta no corte, no tecido e no detalhe.</p>
          </div>
          <ul className="m-0 flex list-none flex-col gap-[18px] p-0">
            {[
              ['01', 'Tecido de compressao com secagem rapida e protecao UV50+'],
              ['02', 'Modelagem desenhada para o corpo da mulher brasileira'],
              ['03', 'Costura flatlock reforcada nas zonas de maior atrito'],
              ['04', 'Paleta autoral, exclusiva bubble'],
            ].map(([number, text]) => (
              <li className="flex items-baseline gap-4" key={number}><span className="font-display text-[1.4rem] text-bubble-candy">{number}</span><span className="text-[.9rem] text-bubble-cream/85">{text}</span></li>
            ))}
          </ul>
        </div>
      </section>
      <section id="quemsomos" className="border-b border-bubble-ink bg-bubble-cream px-6 py-[110px] text-center">
        <div className="mx-auto max-w-[760px]">
          <h2 className="text-[clamp(3rem,9vw,6rem)] tracking-[.02em]">bubble</h2>
          <p className="m-0 mt-[18px] font-sans text-[clamp(1.5rem,3.5vw,2.25rem)] font-semibold lowercase">quem somos?</p>
          <div className="mt-9 text-[1.06rem] font-medium leading-[1.85]">
            <p>Somos a Bubble, uma marca nascida com o proposito de mostrar que nao e necessario escolher entre conforto, qualidade e estilo.</p>
            <p>Cada detalhe dessa jornada foi pensado com carinho para entregar o melhor produto e experiencia para voces, mulheres.</p>
          </div>
          <p className="m-0 mt-[52px] font-serif text-[clamp(1.35rem,3vw,1.9rem)] font-semibold italic">estoure seus limites, vista bubble.</p>
        </div>
      </section>
    </>
  );
}

export function Footer() {
  return (
    <footer id="rodape" className="bg-bubble-ink pb-[30px] pt-[70px] text-bubble-cream">
      <div className="mx-auto max-w-[1200px] px-8">
        <div className="grid grid-cols-[1.4fr_1fr_1fr_1fr] gap-10 border-b border-bubble-cream/10 pb-[50px] max-[980px]:grid-cols-2">
          <div>
            <span className="block font-serif text-[.82rem] font-semibold italic text-bubble-cream">wear</span>
            <span className="block font-display text-2xl uppercase tracking-[.02em] text-bubble-cream">BUBBLE</span>
            <p className="mt-3.5 max-w-[260px] text-[.82rem] leading-[1.6] text-bubble-cream/60">Moda fitness feminina com identidade. Da academia a rua.</p>
          </div>
          <div><h4 className="mb-4 font-sans text-[.72rem] font-semibold uppercase tracking-[.18em] text-bubble-candy">Loja</h4><ul className="m-0 flex list-none flex-col gap-2.5 p-0 text-[.85rem] text-bubble-cream/70 [&_a:hover]:text-bubble-candy"><li><a href="#colecao">Colecao</a></li><li><a href="#conjunto">Monte seu Conjunto</a></li><li><a href="#contato">Contato</a></li></ul></div>
          <div><h4 className="mb-4 font-sans text-[.72rem] font-semibold uppercase tracking-[.18em] text-bubble-candy">Suporte</h4><ul className="m-0 flex list-none flex-col gap-2.5 p-0 text-[.85rem] text-bubble-cream/70"><li>Trocas em ate 30 dias</li><li>Guia de medidas</li><li>Rastreio de pedido</li></ul></div>
          <div><h4 className="mb-4 font-sans text-[.72rem] font-semibold uppercase tracking-[.18em] text-bubble-candy">Privacidade</h4><ul className="m-0 flex list-none flex-col gap-2.5 p-0 text-[.85rem] text-bubble-cream/70"><li>Politica de Privacidade (LGPD)</li><li>Dados pseudoanonimizados</li></ul></div>
        </div>
        <div className="flex flex-wrap justify-between gap-2.5 pt-6 text-[.7rem] text-bubble-cream/45"><span>© 2026 Bubble Fitness Wear · CNPJ em breve</span><span>Pagamentos via PagBank · Pix e Cartao · Ambiente seguro</span></div>
      </div>
    </footer>
  );
}
