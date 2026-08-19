"use client";

import { useEffect } from "react";
import { useBodyScrollLock } from "../../../lib/use-body-scroll-lock";

type SizeGuideDialogProps = {
  open: boolean;
  onClose: () => void;
};

export function SizeGuideDialog({ open, onClose }: SizeGuideDialogProps) {
  useBodyScrollLock(open);

  useEffect(() => {
    if (!open) return;

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose, open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[950] flex items-center justify-center bg-bubble-ink/75 p-5 max-[620px]:p-0"
      role="dialog"
      aria-modal="true"
      aria-labelledby="size-guide-title"
      onClick={(event) => {
        event.stopPropagation();
        onClose();
      }}
    >
      <div
        className="max-h-[92vh] w-[980px] max-w-full overflow-hidden border border-bubble-ink bg-bubble-white shadow-bubble max-[620px]:max-h-[100dvh] max-[620px]:border-0"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-bubble-ink px-5 py-4 max-[620px]:px-4 max-[620px]:py-3">
          <h3 id="size-guide-title" className="text-xl max-[620px]:text-lg">
            Guia de medidas
          </h3>
          <button
            type="button"
            className="flex size-10 shrink-0 items-center justify-center border border-bubble-ink bg-transparent text-2xl leading-none text-bubble-ink"
            onClick={onClose}
            aria-label="Fechar guia de medidas"
          >
            ×
          </button>
        </div>
        <div className="max-h-[calc(92vh-73px)] overflow-auto bg-bubble-cream p-3 max-[620px]:max-h-[calc(100dvh-65px)] max-[620px]:p-2">
          <img
            className="mx-auto h-auto max-w-full"
            src="/tabela-de-medidas.png"
            alt="Tabela de medidas feminina Wear Bubble: tamanhos 36 a 44"
          />
        </div>
      </div>
    </div>
  );
}
