"use client";

import {
  ArrowLeft,
  KeyRound,
  LockKeyhole,
  Mail,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { apiFetch, type User, type VerificationRequired } from "../../lib/api";
import { formatEmail, formatPersonName } from "../../lib/input-formatters";

type AuthMode = "login" | "register";

export function AuthScreen({ mode }: { mode: AuthMode }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    marketing: false,
  });
  const [loginMethod, setLoginMethod] = useState<"password" | "code">(
    "password",
  );
  const [code, setCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [messageKind, setMessageKind] = useState<"error" | "success">("error");
  const isRegister = mode === "register";
  const alternateHref = isRegister ? "/login" : "/cadastro";

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const email = params.get("email");
    if (email)
      setForm((current) => ({ ...current, email: formatEmail(email) }));
    if (!isRegister && params.get("modo") === "codigo") setLoginMethod("code");
  }, [isRegister]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    if (!form.email.trim()) {
      showMessage("Informe seu e-mail.", "error");
      return;
    }
    if (!isRegister && loginMethod === "code") {
      await submitCodeLogin();
      return;
    }
    if (!form.password) {
      showMessage("Informe sua senha.", "error");
      return;
    }
    if (form.password.length < 6) {
      showMessage("A senha precisa ter pelo menos 6 caracteres.", "error");
      return;
    }
    if (isRegister && !form.name.trim()) {
      showMessage("Informe seu nome.", "error");
      return;
    }

    setBusy(true);
    setMessage("");
    try {
      const result = await apiFetch<User | VerificationRequired>(
        isRegister ? "/auth/register" : "/auth/login",
        {
          method: "POST",
          body: JSON.stringify(
            isRegister ? form : { email: form.email, password: form.password },
          ),
        },
      );
      if ("verificationRequired" in result) {
        window.location.assign(
          `/verificar-email?email=${encodeURIComponent(result.email)}`,
        );
        return;
      }
      window.location.assign("/");
    } catch (error) {
      showMessage(
        error instanceof Error ? error.message : "Nao foi possivel autenticar.",
        "error",
      );
      setBusy(false);
    }
  }

  async function submitCodeLogin() {
    setBusy(true);
    setMessage("");
    try {
      if (!codeSent) {
        await apiFetch("/auth/code/request", {
          method: "POST",
          body: JSON.stringify({ email: form.email }),
        });
        setCodeSent(true);
        showMessage(
          "Enviamos um codigo de 6 digitos. Ele expira em 10 minutos.",
          "success",
        );
        setBusy(false);
        return;
      }
      if (!/^\d{6}$/.test(code)) {
        showMessage("Informe os 6 digitos do codigo.", "error");
        setBusy(false);
        return;
      }
      await apiFetch<User>("/auth/code/verify", {
        method: "POST",
        body: JSON.stringify({ email: form.email, code }),
      });
      window.location.assign("/");
    } catch (error) {
      showMessage(
        error instanceof Error
          ? error.message
          : "Nao foi possivel validar o codigo.",
        "error",
      );
      setBusy(false);
    }
  }

  function showMessage(value: string, kind: "error" | "success") {
    setMessage(value);
    setMessageKind(kind);
  }

  function changeLoginMethod(method: "password" | "code") {
    setLoginMethod(method);
    setCodeSent(false);
    setCode("");
    setMessage("");
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
            Sua conta Bubble
          </span>
          <h1 className="mt-4 text-[clamp(2.6rem,6vw,5.5rem)] leading-[.98] text-bubble-cream">
            {isRegister ? (
              <>
                Vista.
                <br />
                Treine.
                <br />
                Supere.
              </>
            ) : (
              <>
                Bom ter
                <br />
                voce de
                <br />
                volta.
              </>
            )}
          </h1>
          <p className="mt-6 max-w-[430px] font-serif text-[.95rem] italic leading-[1.7] text-bubble-cream/70">
            {isRegister
              ? "Crie sua conta para finalizar compras, acompanhar pedidos e guardar seus dados de entrega com seguranca."
              : "Entre para continuar sua compra, acompanhar entregas e acessar seu historico de pedidos."}
          </p>
        </div>
        <span className="font-sans text-[.62rem] uppercase tracking-[.12em] text-bubble-cream/40">
          Dados protegidos · Cookie HttpOnly · LGPD
        </span>
      </section>

      <section className="flex min-h-screen items-center justify-center px-8 py-16">
        <div className="w-full max-w-[460px]">
          <Link
            href="/"
            className="mb-10 inline-flex items-center gap-2 font-sans text-[.68rem] font-semibold uppercase tracking-[.1em] text-bubble-ink/60 hover:text-bubble-ink"
          >
            <ArrowLeft className="size-4" /> Voltar para a loja
          </Link>
          <span className="block font-sans text-[.68rem] font-semibold uppercase tracking-[.28em] text-bubble-brown">
            {isRegister ? "Comece por aqui" : "Acesse sua conta"}
          </span>
          <h2 className="mt-2 text-[2.2rem]">
            {isRegister ? "Criar conta" : "Entrar"}
          </h2>
          <p className="mb-8 mt-3 text-[.82rem] leading-[1.6] text-bubble-ink/55">
            {isRegister
              ? "Preencha seus dados para criar sua conta."
              : loginMethod === "code"
                ? "Receba um codigo de uso unico no e-mail informado durante a compra."
                : "Use o e-mail e a senha cadastrados."}
          </p>

          {!isRegister ? (
            <div className="mb-6 grid grid-cols-2 border border-bubble-ink p-1">
              <button
                type="button"
                className={`px-3 py-2.5 font-sans text-[.66rem] font-semibold uppercase tracking-[.08em] ${loginMethod === "password" ? "bg-bubble-ink text-bubble-white" : "bg-transparent text-bubble-ink"}`}
                onClick={() => changeLoginMethod("password")}
              >
                Com senha
              </button>
              <button
                type="button"
                className={`px-3 py-2.5 font-sans text-[.66rem] font-semibold uppercase tracking-[.08em] ${loginMethod === "code" ? "bg-bubble-ink text-bubble-white" : "bg-transparent text-bubble-ink"}`}
                onClick={() => changeLoginMethod("code")}
              >
                Codigo por e-mail
              </button>
            </div>
          ) : null}

          <form onSubmit={submit}>
            {isRegister ? (
              <AuthField icon={<UserRound />} label="Nome completo">
                <input
                  value={form.name}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      name: formatPersonName(event.target.value),
                    })
                  }
                  autoComplete="name"
                  maxLength={150}
                  placeholder="Seu nome"
                />
              </AuthField>
            ) : null}
            <AuthField icon={<Mail />} label="E-mail">
              <input
                value={form.email}
                onChange={(event) => {
                  setForm({ ...form, email: formatEmail(event.target.value) });
                  if (codeSent) {
                    setCodeSent(false);
                    setCode("");
                  }
                }}
                type="email"
                inputMode="email"
                autoCapitalize="none"
                spellCheck={false}
                autoComplete="email"
                maxLength={255}
                placeholder="voce@email.com"
                readOnly={codeSent}
              />
            </AuthField>
            {isRegister || loginMethod === "password" ? (
              <AuthField icon={<LockKeyhole />} label="Senha">
                <input
                  value={form.password}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      password: event.target.value.slice(0, 72),
                    })
                  }
                  type="password"
                  autoComplete={
                    isRegister ? "new-password" : "current-password"
                  }
                  minLength={6}
                  maxLength={72}
                  placeholder="Minimo 6 caracteres"
                />
              </AuthField>
            ) : null}
            {!isRegister && loginMethod === "code" && codeSent ? (
              <AuthField icon={<KeyRound />} label="Codigo de 6 digitos">
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
                />
              </AuthField>
            ) : null}

            {isRegister ? (
              <label className="mb-5 flex cursor-pointer items-start gap-2.5 text-[.72rem] leading-[1.5] text-bubble-ink/60">
                <input
                  className="mt-0.5 accent-bubble-ink"
                  type="checkbox"
                  checked={form.marketing}
                  onChange={(event) =>
                    setForm({ ...form, marketing: event.target.checked })
                  }
                />
                Quero receber novidades e lancamentos da Bubble por e-mail.
              </label>
            ) : null}

            {message ? (
              <div
                className={`mb-4 border p-3 text-[.75rem] ${messageKind === "success" ? "border-bubble-success/25 bg-bubble-success/10 text-bubble-success" : "border-bubble-danger/25 bg-bubble-danger/10 text-bubble-danger"}`}
              >
                {message}
              </div>
            ) : null}

            <button
              className="w-full bg-bubble-ink px-6 py-4 font-sans text-[.76rem] font-semibold uppercase tracking-[.14em] text-bubble-white transition-colors hover:bg-bubble-brown disabled:cursor-not-allowed disabled:opacity-45"
              type="submit"
              disabled={busy}
            >
              {busy
                ? "Aguarde..."
                : isRegister
                  ? "Criar minha conta"
                  : loginMethod === "code"
                    ? codeSent
                      ? "Validar codigo e entrar"
                      : "Enviar codigo por e-mail"
                    : "Entrar na minha conta"}
            </button>
            {!isRegister && loginMethod === "code" && codeSent ? (
              <button
                type="button"
                className="mx-auto mt-4 block text-[.72rem] text-bubble-ink/60 underline"
                onClick={() => {
                  setCodeSent(false);
                  setCode("");
                  setMessage("");
                }}
              >
                Enviar um novo codigo
              </button>
            ) : null}
          </form>

          <p className="mt-6 text-center text-[.8rem] text-bubble-ink/60">
            {isRegister
              ? "Ja possui uma conta?"
              : "Ainda nao possui uma conta?"}{" "}
            <Link
              href={alternateHref}
              className="font-semibold text-bubble-ink underline"
            >
              {isRegister ? "Entrar" : "Criar conta"}
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}

function AuthField({
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
