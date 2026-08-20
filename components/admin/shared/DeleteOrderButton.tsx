"use client";

import { useState, type MouseEvent } from "react";
import { Trash2 } from "lucide-react";
import { apiFetch, type Order } from "../../../lib/api";
import type { Notify, OnSaved } from "./types";

export function DeleteOrderButton({
  order,
  onSaved,
  notify,
  compact = false,
}: {
  order: Order;
  onSaved: OnSaved;
  notify: Notify;
  compact?: boolean;
}) {
  const [deleting, setDeleting] = useState(false);

  async function remove(event: MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();
    if (
      !window.confirm(
        `Excluir permanentemente o pedido #${order.number}? Ele sairá dos indicadores e os efeitos em estoque, cupom e crédito serão revertidos. A exclusão não cancela nem estorna cobranças externas.`,
      )
    )
      return;

    setDeleting(true);
    try {
      await apiFetch(`/orders/${order.id}`, { method: "DELETE" });
      await onSaved();
      notify(`Pedido #${order.number} excluído.`);
    } catch (error) {
      notify(
        error instanceof Error
          ? error.message
          : "Não foi possível excluir o pedido.",
      );
    } finally {
      setDeleting(false);
    }
  }

  return (
    <button
      type="button"
      disabled={deleting}
      onClick={(event) => void remove(event)}
      className={
        compact
          ? "inline-flex items-center gap-1 font-sans text-[.6rem] font-bold uppercase tracking-[.08em] text-red-700 transition-colors hover:text-red-900 disabled:cursor-wait disabled:opacity-50"
          : "inline-flex w-full items-center justify-center gap-2 border border-red-700 px-3 py-2 font-sans text-[.58rem] font-bold uppercase tracking-[.1em] text-red-700 transition-colors hover:bg-red-700 hover:text-white disabled:cursor-wait disabled:opacity-50"
      }
      aria-label={`Excluir pedido ${order.number}`}
    >
      <Trash2 size={compact ? 13 : 15} />
      {deleting ? "Excluindo..." : "Excluir pedido"}
    </button>
  );
}
