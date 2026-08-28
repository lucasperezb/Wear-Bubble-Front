"use client";

import { X } from "lucide-react";
import { createPortal } from "react-dom";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";

type DialogTone = "default" | "danger";

type DialogOptions = {
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: DialogTone;
};

type PromptOptions = DialogOptions & {
  inputLabel: string;
  initialValue?: string;
  placeholder?: string;
  required?: boolean;
  inputMode?: "text" | "decimal";
};

type DialogState = DialogOptions & {
  mode: "alert" | "confirm" | "prompt";
  inputLabel?: string;
  initialValue?: string;
  placeholder?: string;
  required?: boolean;
  inputMode?: "text" | "decimal";
};

type DialogResult = boolean | string | null;

export function useActionDialog() {
  const [state, setState] = useState<DialogState | null>(null);
  const resolver = useRef<((value: DialogResult) => void) | null>(null);

  const open = useCallback((next: DialogState) => {
    resolver.current?.(null);
    setState(next);
    return new Promise<DialogResult>((resolve) => {
      resolver.current = resolve;
    });
  }, []);

  const close = useCallback((result: DialogResult) => {
    setState(null);
    const resolve = resolver.current;
    resolver.current = null;
    resolve?.(result);
  }, []);

  const confirm = useCallback(
    async (options: DialogOptions) =>
      Boolean(await open({ ...options, mode: "confirm" })),
    [open],
  );

  const prompt = useCallback(
    async (options: PromptOptions) => {
      const result = await open({ ...options, mode: "prompt" });
      return typeof result === "string" ? result : null;
    },
    [open],
  );

  const alert = useCallback(
    async (options: DialogOptions) => {
      await open({ ...options, mode: "alert" });
    },
    [open],
  );

  return {
    confirm,
    prompt,
    alert,
    dialog: state ? <ActionDialog state={state} onClose={close} /> : null,
  };
}

function ActionDialog({
  state,
  onClose,
}: {
  state: DialogState;
  onClose: (result: DialogResult) => void;
}) {
  const [value, setValue] = useState(state.initialValue || "");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose(null);
    };
    window.addEventListener("keydown", onKeyDown);
    if (state.mode === "prompt") inputRef.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose, state.mode]);

  function submit(event: FormEvent) {
    event.preventDefault();
    if (state.mode === "prompt") {
      if (state.required && !value.trim()) return;
      onClose(value);
      return;
    }
    onClose(true);
  }

  const danger = state.tone === "danger";
  return createPortal(
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-bubble-ink/70 p-4 backdrop-blur-[2px]"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose(null);
      }}
    >
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby="action-dialog-title"
        onSubmit={submit}
        className="w-full max-w-[520px] border border-bubble-ink bg-bubble-white shadow-2xl"
      >
        <header className="flex items-start justify-between gap-5 border-b border-bubble-line px-6 py-5">
          <div>
            <span className="font-sans text-[.58rem] font-bold uppercase tracking-[.14em] text-bubble-brown">
              Confirmação
            </span>
            <h2 id="action-dialog-title" className="mt-1 text-2xl">
              {state.title}
            </h2>
          </div>
          <button
            type="button"
            aria-label="Fechar"
            onClick={() => onClose(null)}
            className="flex size-9 shrink-0 items-center justify-center border border-bubble-line hover:border-bubble-ink"
          >
            <X className="size-4" />
          </button>
        </header>
        <div className="px-6 py-5">
          <p className="text-sm leading-6 text-bubble-ink/65">
            {state.description}
          </p>
          {state.mode === "prompt" ? (
            <label className="mt-5 block">
              <span className="mb-1.5 block font-sans text-[.62rem] font-bold uppercase tracking-[.1em] text-bubble-ink/55">
                {state.inputLabel}
              </span>
              <input
                ref={inputRef}
                value={value}
                inputMode={state.inputMode}
                placeholder={state.placeholder}
                onChange={(event) => setValue(event.target.value)}
                className="w-full border border-bubble-line bg-bubble-cream px-4 py-3 text-sm outline-none focus:border-bubble-ink"
              />
            </label>
          ) : null}
        </div>
        <footer className="flex flex-wrap justify-end gap-2 border-t border-bubble-line bg-bubble-cream/50 px-6 py-4">
          {state.mode !== "alert" ? (
            <button
              type="button"
              onClick={() => onClose(null)}
              className="border border-bubble-ink px-5 py-3 font-sans text-[.62rem] font-bold uppercase tracking-[.1em]"
            >
              {state.cancelLabel || "Cancelar"}
            </button>
          ) : null}
          <button
            type="submit"
            disabled={
              state.mode === "prompt" && state.required && !value.trim()
            }
            className={`px-5 py-3 font-sans text-[.62rem] font-bold uppercase tracking-[.1em] text-white disabled:opacity-40 ${danger ? "bg-bubble-danger" : "bg-bubble-ink"}`}
          >
            {state.confirmLabel ||
              (state.mode === "alert" ? "Entendi" : "Confirmar")}
          </button>
        </footer>
      </form>
    </div>,
    document.body,
  );
}
