import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

export function PasswordResetShell({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <main className="grid min-h-screen grid-cols-[minmax(320px,.9fr)_minmax(0,1.1fr)] bg-bubble-cream max-[860px]:grid-cols-1">
      <section className="flex min-h-screen flex-col bg-bubble-ink p-10 text-bubble-cream max-[860px]:min-h-0 max-[860px]:pb-16">
        <Link
          href="/"
          className="flex w-fit cursor-pointer flex-col leading-[.82]"
        >
          <span className="ml-px font-serif text-[.78rem] italic">wear</span>
          <span className="font-display text-[1.55rem] uppercase">BUBBLE</span>
        </Link>
        <div className="my-auto max-w-[520px] py-16">
          <span className="font-sans text-[.7rem] font-semibold uppercase tracking-[.3em] text-bubble-candy">
            Acesso à sua conta
          </span>
          <h1 className="mt-4 text-[clamp(2.6rem,6vw,5.5rem)] leading-[.98] text-bubble-cream">
            Sua conta.
            <br />
            Sua senha.
            <br />
            Protegidas.
          </h1>
          <p className="mt-6 max-w-[430px] font-serif text-[.95rem] italic leading-[1.7] text-bubble-cream/70">
            O link de redefinição é temporário e só pode ser usado uma vez.
          </p>
        </div>
        <span className="font-sans text-[.62rem] uppercase tracking-[.12em] text-bubble-cream/40">
          Link temporário · Uso único · LGPD
        </span>
      </section>

      <section className="flex min-h-screen items-center justify-center px-8 py-16">
        <div className="w-full max-w-[460px]">
          <Link
            href="/login"
            className="mb-10 inline-flex items-center gap-2 font-sans text-[.68rem] font-semibold uppercase tracking-[.1em] text-bubble-ink/60 hover:text-bubble-ink"
          >
            <ArrowLeft className="size-4" /> Voltar para o login
          </Link>
          <span className="block font-sans text-[.68rem] font-semibold uppercase tracking-[.28em] text-bubble-brown">
            {eyebrow}
          </span>
          <h2 className="mt-2 text-[2.2rem]">{title}</h2>
          <p className="mb-8 mt-3 text-[.82rem] leading-[1.6] text-bubble-ink/55">
            {description}
          </p>
          {children}
        </div>
      </section>
    </main>
  );
}

export const passwordResetInput =
  "w-full border border-bubble-line bg-bubble-white px-4 py-3.5 text-[.88rem] outline-none focus:border-bubble-ink";

export const passwordResetButton =
  "w-full bg-bubble-ink px-6 py-4 font-sans text-[.76rem] font-semibold uppercase tracking-[.14em] text-bubble-white transition-colors hover:bg-bubble-brown disabled:cursor-not-allowed disabled:opacity-45";
