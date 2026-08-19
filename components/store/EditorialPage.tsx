import { Footer } from "../home";
import { Header } from "../layout";

export function EditorialPage({
  eyebrow,
  title,
  lead,
  items,
}: {
  eyebrow: string;
  title: string;
  lead: string;
  items: Array<{ number: string; title: string; text: string }>;
}) {
  return (
    <main>
      <Header cartCount={0} />
      <section className="border-b border-bubble-ink px-6 py-24 sm:py-32">
        <div className="mx-auto max-w-[1100px]">
          <span className="font-sans text-[.68rem] font-semibold uppercase tracking-[.3em] text-bubble-brown">{eyebrow}</span>
          <h1 className="mt-6 max-w-[950px] text-[clamp(3rem,8vw,7rem)] leading-[.92]">{title}</h1>
          <p className="ml-auto mt-10 max-w-[620px] text-[clamp(1.1rem,2vw,1.45rem)] italic leading-relaxed text-bubble-ink/70">{lead}</p>
        </div>
      </section>
      <section className="bg-bubble-ink px-6 py-20 text-bubble-cream sm:py-28">
        <div className="mx-auto grid max-w-[1100px] gap-px bg-bubble-cream/20 md:grid-cols-3">
          {items.map((item) => (
            <article key={item.number} className="min-h-[280px] bg-bubble-ink p-7 sm:p-9">
              <span className="flex size-9 items-center justify-center rounded-full border border-bubble-candy/50 font-sans text-[.62rem] text-bubble-candy">{item.number}</span>
              <h2 className="mt-10 text-xl text-bubble-cream">{item.title}</h2>
              <p className="mt-4 text-[.9rem] leading-relaxed text-bubble-cream/65">{item.text}</p>
            </article>
          ))}
        </div>
      </section>
      <Footer />
    </main>
  );
}
