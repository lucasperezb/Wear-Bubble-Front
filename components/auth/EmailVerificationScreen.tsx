"use client";

import { ArrowLeft, KeyRound, Mail, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { apiFetch, type User } from "../../lib/api";
import { formatEmail } from "../../lib/input-formatters";

export function EmailVerificationScreen() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(
    "Enviamos um código de 6 dígitos para o seu e-mail.",
  );
  const [messageKind, setMessageKind] = useState<"success" | "error">(
    "success",
  );

  useEffect(() => {
    const value = new URLSearchParams(window.location.search).get("email");
    if (value) setEmail(formatEmail(value));
  }, []);

  async function verify(event: FormEvent) {
    event.preventDefault();
    if (!email) return show("Informe seu e-mail.", "error");
    if (!/^\d{6}$/.test(code))
      return show("Informe os 6 dígitos do código.", "error");
    setBusy(true);
    try {
      await apiFetch<User>("/auth/code/verify", {
        method: "POST",
        body: JSON.stringify({ email, code }),
      });
      window.location.assign("/");
    } catch (error) {
      show(
        error instanceof Error
          ? error.message
          : "Não foi possível verificar o e-mail.",
        "error",
      );
      setBusy(false);
    }
  }

  async function resend() {
    if (!email) return show("Informe seu e-mail.", "error");
    setBusy(true);
    try {
      await apiFetch("/auth/code/request", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      show(
        "Código enviado. Confira também as pastas de spam e promoções.",
        "success",
      );
    } catch (error) {
      show(
        error instanceof Error
          ? error.message
          : "Não foi possível reenviar o código.",
        "error",
      );
    } finally {
      setBusy(false);
    }
  }

  function show(value: string, kind: "success" | "error") {
    setMessage(value);
    setMessageKind(kind);
  }

  return (
    <main className="grid min-h-screen grid-cols-[minmax(320px,.9fr)_minmax(0,1.1fr)] bg-bubble-cream max-[860px]:grid-cols-1">
      <section className="flex min-h-screen flex-col bg-bubble-ink p-10 text-bubble-cream max-[860px]:min-h-0 max-[860px]:pb-16">
        <Link href="/" className="flex w-fit cursor-pointer flex-col leading-[.82]">
          <span className="ml-px font-serif text-[.78rem] italic">wear</span>
          <span className="font-display text-[1.55rem] uppercase">BUBBLE</span>
        </Link>
        <div className="my-auto max-w-[520px] py-16">
          <span className="font-sans text-[.7rem] font-semibold uppercase tracking-[.3em] text-bubble-candy">
            Proteção da sua conta
          </span>
          <h1 className="mt-4 text-[clamp(2.6rem,6vw,5.5rem)] leading-[.98] text-bubble-cream">
            Confirme
            <br />
            seu e-mail.
          </h1>
          <p className="mt-6 max-w-[430px] font-serif text-[.95rem] italic leading-[1.7] text-bubble-cream/70">
            Essa verificação garante que somente você possa acessar seus pedidos
            e informações pessoais.
          </p>
        </div>
        <span className="inline-flex items-center gap-2 font-sans text-[.62rem] uppercase tracking-[.12em] text-bubble-cream/40">
          <ShieldCheck className="size-4" /> Código de uso único
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
            Última etapa
          </span>
          <h2 className="mt-2 text-[2.2rem]">Verificar conta</h2>
          <p className="mb-8 mt-3 text-[.82rem] leading-[1.6] text-bubble-ink/55">
            Digite abaixo o código recebido. Ele expira em 10 minutos.
          </p>

          <form onSubmit={verify}>
            <VerificationField icon={<Mail />} label="E-mail">
              <input
                value={email}
                onChange={(event) => setEmail(formatEmail(event.target.value))}
                type="email"
                inputMode="email"
                autoCapitalize="none"
                spellCheck={false}
                autoComplete="email"
                placeholder="você@email.com"
                required
              />
            </VerificationField>
            <VerificationField icon={<KeyRound />} label="Código de 6 dígitos">
              <input
                value={code}
                onChange={(event) =>
                  setCode(event.target.value.replace(/\D/g, "").slice(0, 6))
                }
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                pattern="\d{6}"
                placeholder="000000"
                required
              />
            </VerificationField>

            {message ? (
              <div
                className={`mb-4 border p-3 text-[.75rem] ${
                  messageKind === "success"
                    ? "border-bubble-success/25 bg-bubble-success/10 text-bubble-success"
                    : "border-bubble-danger/25 bg-bubble-danger/10 text-bubble-danger"
                }`}
              >
                {message}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={busy}
              className="w-full bg-bubble-ink px-6 py-4 font-sans text-[.76rem] font-semibold uppercase tracking-[.14em] text-bubble-white disabled:opacity-45"
            >
              {busy ? "Verificando..." : "Confirmar meu e-mail"}
            </button>
            <button
              type="button"
              disabled={busy}
              className="mx-auto mt-4 block border-0 bg-transparent text-[.72rem] text-bubble-ink/60 underline disabled:opacity-45"
              onClick={() => void resend()}
            >
              Reenviar código
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}

function VerificationField({
  icon,
  label,
  children,
}: {
  icon: ReactNode;
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="mb-4 block">
      <span className="mb-1.5 block font-sans text-[.66rem] font-semibold uppercase tracking-[.1em] text-bubble-ink/60">
        {label}
      </span>
      <span className="flex items-center gap-3 border border-bubble-line bg-bubble-white px-4 focus-within:border-bubble-ink [&>svg]:size-[18px] [&>svg]:shrink-0 [&>svg]:text-bubble-ink/45 [&_input]:w-full [&_input]:border-0 [&_input]:bg-transparent [&_input]:py-3.5 [&_input]:text-[.88rem] [&_input]:outline-none">
        {icon}
        {children}
      </span>
    </label>
  );
}
