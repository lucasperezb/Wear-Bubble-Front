"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import {
  PasswordResetShell,
  passwordResetButton,
  passwordResetInput,
} from "../../components/auth";
import { apiFetch } from "../../lib/api";

export default function ResetPasswordPage() {
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    setToken(new URLSearchParams(window.location.search).get("token") || "");
  }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    if (!token) {
      setMessage("Este link é inválido. Solicite uma nova redefinição.");
      return;
    }
    if (password.length < 6) {
      setMessage("A nova senha precisa ter pelo menos 6 caracteres.");
      return;
    }
    if (password !== confirmation) {
      setMessage("As senhas informadas não são iguais.");
      return;
    }

    setBusy(true);
    setMessage("");
    try {
      await apiFetch("/auth/password-reset/confirm", {
        method: "POST",
        body: JSON.stringify({ token, password }),
      });
      setSuccess(true);
      setPassword("");
      setConfirmation("");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Não foi possível redefinir sua senha.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <PasswordResetShell
      eyebrow="Nova senha"
      title="Redefina sua senha"
      description="Crie uma nova senha para voltar a acessar sua conta Bubble."
    >
      {success ? (
        <div>
          <div className="mb-5 border border-bubble-success/25 bg-bubble-success/10 p-5 text-[.82rem] leading-[1.65] text-bubble-success">
            Sua senha foi redefinida com sucesso. Você já pode entrar na sua
            conta.
          </div>
          <Link
            href="/login"
            className={`${passwordResetButton} block text-center`}
          >
            Entrar com a nova senha
          </Link>
        </div>
      ) : (
        <form onSubmit={submit}>
          <label className="mb-1.5 block font-sans text-[.66rem] font-semibold uppercase tracking-[.1em] text-bubble-ink/60">
            Nova senha
          </label>
          <input
            className={`${passwordResetInput} mb-4`}
            value={password}
            onChange={(event) => setPassword(event.target.value.slice(0, 72))}
            type="password"
            autoComplete="new-password"
            minLength={6}
            maxLength={72}
            required
            placeholder="Mínimo de 6 caracteres"
          />
          <label className="mb-1.5 block font-sans text-[.66rem] font-semibold uppercase tracking-[.1em] text-bubble-ink/60">
            Confirmar nova senha
          </label>
          <input
            className={`${passwordResetInput} mb-5`}
            value={confirmation}
            onChange={(event) =>
              setConfirmation(event.target.value.slice(0, 72))
            }
            type="password"
            autoComplete="new-password"
            minLength={6}
            maxLength={72}
            required
            placeholder="Digite a senha novamente"
          />
          {message ? (
            <div className="mb-4 border border-bubble-danger/25 bg-bubble-danger/10 p-3 text-[.75rem] text-bubble-danger">
              {message}
            </div>
          ) : null}
          <button className={passwordResetButton} disabled={busy} type="submit">
            {busy ? "Salvando..." : "Salvar nova senha"}
          </button>
          {!token ? (
            <Link
              href="/esqueci-senha"
              className="mx-auto mt-4 block text-center text-[.72rem] text-bubble-ink/60 underline"
            >
              Solicitar um novo link
            </Link>
          ) : null}
        </form>
      )}
    </PasswordResetShell>
  );
}
