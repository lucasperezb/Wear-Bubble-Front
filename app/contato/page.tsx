import { ContactSection, Footer } from "../../components/home/StaticSections";
import { Header } from "../../components/layout/Header";

export default function ContactPage() {
  return <main><Header cartCount={0} /><section className="border-b border-bubble-ink px-6 py-20 text-center"><span className="font-sans text-[.68rem] font-semibold uppercase tracking-[.3em] text-bubble-brown">A Bubble · Contato</span><h1 className="mt-5 text-[clamp(3rem,8vw,6rem)]">Vamos conversar</h1><p className="mx-auto mt-5 max-w-[560px] text-lg italic leading-relaxed text-bubble-ink/65">Dúvidas sobre peças, pedidos ou a marca? Escolha o melhor canal e fale com a gente.</p></section><ContactSection /><Footer /></main>;
}
