"use client";

import { useEffect, useState, type FormEvent } from "react";
import {
  PasswordResetShell,
  passwordResetButton,
  passwordResetInput,
} from "../../components/auth";
import { apiFetch } from "../../lib/api";
import { formatEmail } from "../../lib/input-formatters";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const value = new URLSearchParams(window.location.search).get("email");
    if (value) setEmail(formatEmail(value));
  }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!email.trim() || busy) return;
    setBusy(true);
    setMessage("");
    try {
      await apiFetch("/auth/password-reset", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      setSent(true);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Não foi possível enviar o e-mail agora.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <PasswordResetShell
      eyebrow="Recuperação de acesso"
      title="Esqueceu sua senha?"
      description="Informe o e-mail cadastrado. Enviaremos um botão para você criar uma nova senha."
    >
      {sent ? (
        <div className="border border-bubble-success/25 bg-bubble-success/10 p-5 text-[.82rem] leading-[1.65] text-bubble-success">
          Se houver uma conta com este e-mail, você receberá o link de
          redefinição. Confira também as pastas de spam e promoções.
        </div>
      ) : (
        <form onSubmit={submit}>
          <label className="mb-1.5 block font-sans text-[.66rem] font-semibold uppercase tracking-[.1em] text-bubble-ink/60">
            E-mail
          </label>
          <input
            className={`${passwordResetInput} mb-5`}
            value={email}
            onChange={(event) => setEmail(formatEmail(event.target.value))}
            type="email"
            inputMode="email"
            autoCapitalize="none"
            autoComplete="email"
            spellCheck={false}
            required
            maxLength={255}
            placeholder="você@email.com"
          />
          {message ? (
            <div className="mb-4 border border-bubble-danger/25 bg-bubble-danger/10 p-3 text-[.75rem] text-bubble-danger">
              {message}
            </div>
          ) : null}
          <button className={passwordResetButton} disabled={busy} type="submit">
            {busy ? "Enviando..." : "Enviar link de redefinição"}
          </button>
        </form>
      )}
    </PasswordResetShell>
  );
}
