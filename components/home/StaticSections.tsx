"use client";

import { useState } from "react";

export function ContactSection() {
  return (
    <section className="bg-bubble-ink py-[85px] text-bubble-cream" id="contato">
      <div className="mx-auto max-w-[1200px] px-8">
        <div className="mx-auto mb-10 max-w-[640px] text-center">
          <span className="font-sans text-[.72rem] font-semibold uppercase tracking-[.32em] text-bubble-cream">
            fale com a gente
          </span>
          <h2 className="mt-3 text-bubble-white">Contato</h2>
          <p className="mt-3.5 italic leading-[1.7] text-bubble-cream/80">
            Dúvida sobre tamanho, pedido ou troca? Estamos por aqui e respondemos rápido.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-4 max-[860px]:grid-cols-1">
          {[
            ["Instagram", "@wearbubble_", "Seguir", "https://instagram.com/wearbubble_"],
            ["WhatsApp Business", "+55 11 93624-0362", "Chamar no WhatsApp", "https://wa.me/5511936240362"],
            ["E-mail", "contato@wearbubble.com.br", "Enviar e-mail", "mailto:contato@wearbubble.com.br"],
          ].map(([label, value, cta, href]) => (
            <a
              className="flex cursor-pointer flex-col items-center gap-2 border border-bubble-cream/30 bg-bubble-cream/[.04] px-[22px] py-[30px] text-center text-bubble-cream transition-colors hover:border-bubble-cream hover:bg-bubble-cream hover:text-bubble-ink"
              href={href}
              target={href.startsWith("http") ? "_blank" : undefined}
              rel={href.startsWith("http") ? "noopener" : undefined}
              key={label}
            >
              <span className="font-sans text-[.68rem] font-semibold uppercase tracking-[.24em] opacity-75">
                {label}
              </span>
              <span className="text-[.95rem] font-semibold">{value}</span>
              <span className="mt-1.5 border-b border-current pb-0.5 font-sans text-[.64rem] font-semibold uppercase tracking-[.2em]">
                {cta}
              </span>
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
            <span className="font-sans text-[.72rem] font-semibold uppercase tracking-[.32em] text-bubble-candy">
              A Marca
            </span>
            <h2 className="text-[2.4rem] text-bubble-cream">
              Feita para quem
              <br />
              não para.
            </h2>
            <p className="mt-4 max-w-[420px] leading-[1.7] text-bubble-cream/75">
              Cada peça bubble nasce da mesma pergunta: como equilibrar sofisticação e energia esportiva? A resposta está no corte, no tecido e no detalhe.
            </p>
          </div>
          <ul className="m-0 flex list-none flex-col gap-[18px] p-0">
            {[
              ["01", "Tecido de compressão com secagem rápida e proteção UV50+"],
              ["02", "Modelagem desenhada para o corpo da mulher brasileira"],
              ["03", "Costura flatlock reforçada nas zonas de maior atrito"],
              ["04", "Paleta autoral, exclusiva bubble"],
            ].map(([number, text]) => (
              <li className="flex items-baseline gap-4" key={number}>
                <span className="font-display text-[1.4rem] text-bubble-candy">
                  {number}
                </span>
                <span className="text-[.9rem] text-bubble-cream/85">{text}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>
      <section id="quemsomos" className="border-b border-bubble-ink bg-bubble-cream px-6 py-[110px] text-center">
        <div className="mx-auto max-w-[760px]">
          <h2 className="text-[clamp(3rem,9vw,6rem)] tracking-[.02em]">bubble</h2>
          <p className="m-0 mt-[18px] font-sans text-[clamp(1.5rem,3.5vw,2.25rem)] font-semibold lowercase">
            quem somos?
          </p>
          <div className="mt-9 text-[1.06rem] font-medium leading-[1.85]">
            <p>
              Somos a Bubble, uma marca nascida com o propósito de mostrar que não é necessário escolher entre conforto, qualidade e estilo.
            </p>
            <p>
              Cada detalhe dessa jornada foi pensado com carinho para entregar o melhor produto e experiência para vocês, mulheres.
            </p>
          </div>
          <p className="m-0 mt-[52px] font-serif text-[clamp(1.35rem,3vw,1.9rem)] font-semibold italic">
            estoure seus limites, vista bubble.
          </p>
        </div>
      </section>
    </>
  );
}

export function Footer() {
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);

  return (
    <>
      <footer id="rodape" className="bg-bubble-ink pb-[30px] pt-[70px] text-bubble-cream">
        <div className="mx-auto max-w-[1200px] px-8">
          <div className="grid grid-cols-[1.4fr_1fr_1fr_1fr] gap-10 border-b border-bubble-cream/10 pb-[50px] max-[980px]:grid-cols-2 max-[620px]:grid-cols-1">
            <div>
              <span className="block font-serif text-[.82rem] font-semibold italic text-bubble-cream">wear</span>
              <span className="block font-display text-2xl uppercase tracking-[.02em] text-bubble-cream">BUBBLE</span>
              <p className="mt-3.5 max-w-[260px] text-[.82rem] leading-[1.6] text-bubble-cream/60">
                Moda fitness feminina com identidade. Da academia à rua.
              </p>
            </div>
            <div>
              <h4 className="mb-4 font-sans text-[.72rem] font-semibold uppercase tracking-[.18em] text-bubble-candy">Loja</h4>
              <ul className="m-0 flex list-none flex-col gap-2.5 p-0 text-[.85rem] text-bubble-cream/70 [&_a]:cursor-pointer [&_a:hover]:text-bubble-candy">
                <li><a href="/colecoes/core">Coleção Core</a></li>
                <li><a href="/#conjunto">Monte seu Conjunto</a></li>
                <li><a href="/contato">Contato</a></li>
              </ul>
            </div>
            <div>
              <h4 className="mb-4 font-sans text-[.72rem] font-semibold uppercase tracking-[.18em] text-bubble-candy">Suporte</h4>
              <ul className="m-0 flex list-none flex-col gap-2.5 p-0 text-[.85rem] text-bubble-cream/70 [&_a]:cursor-pointer [&_a:hover]:text-bubble-candy [&_button]:cursor-pointer [&_button:hover]:text-bubble-candy">
                <li><a href="/conta?tab=orders&intent=trocas">Trocas em até 30 dias</a></li>
                <li>
                  <button
                    type="button"
                    className="border-0 bg-transparent p-0 text-left text-inherit"
                    onClick={() => setSizeGuideOpen(true)}
                  >
                    Guia de medidas
                  </button>
                </li>
                <li><a href="/conta?tab=orders&intent=rastreio">Rastreio de pedido</a></li>
              </ul>
            </div>
            <div>
              <h4 className="mb-4 font-sans text-[.72rem] font-semibold uppercase tracking-[.18em] text-bubble-candy">Privacidade</h4>
              <ul className="m-0 flex list-none flex-col gap-2.5 p-0 text-[.85rem] text-bubble-cream/70 [&_a]:cursor-pointer [&_a:hover]:text-bubble-candy">
                <li><a href="/politica-de-privacidade">Política de Privacidade (LGPD)</a></li>
                <li><a href="/politica-de-privacidade#cookies">Cookies</a></li>
                <li><a href="/politica-de-privacidade#pseudoanonimizacao">Dados pseudoanonimizados</a></li>
              </ul>
            </div>
          </div>
          <div className="flex flex-wrap justify-between gap-2.5 pt-6 text-[.7rem] text-bubble-cream/45">
            <span>© 2026 Wear Bubble · CNPJ 68.177.794/0001-05</span>
            <span>Pagamentos via Asaas · Pix e Cartão · Ambiente seguro</span>
          </div>
        </div>
      </footer>

      {sizeGuideOpen ? (
        <div
          className="fixed inset-0 z-[950] flex items-center justify-center bg-bubble-ink/75 p-5 max-[620px]:p-3"
          role="dialog"
          aria-modal="true"
          aria-label="Guia de medidas"
          onClick={() => setSizeGuideOpen(false)}
        >
          <div
            className="max-h-[92vh] w-[980px] max-w-full overflow-hidden border border-bubble-ink bg-bubble-white shadow-bubble"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-bubble-ink px-5 py-4">
              <h3 className="text-xl">Guia de medidas</h3>
              <button
                type="button"
                className="flex size-10 items-center justify-center border border-bubble-ink bg-transparent text-2xl leading-none text-bubble-ink"
                onClick={() => setSizeGuideOpen(false)}
                aria-label="Fechar guia de medidas"
              >
                ×
              </button>
            </div>
            <div className="max-h-[calc(92vh-73px)] overflow-auto bg-bubble-cream p-3">
              <img
                className="mx-auto h-auto max-w-full"
                src="/tabela-de-medidas.png"
                alt="Tabela de medidas feminina Wear Bubble"
              />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
