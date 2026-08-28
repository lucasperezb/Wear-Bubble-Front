"use client";

import { ArrowLeft, RotateCcw } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  apiFetch,
  type Order,
  type ReturnRequest,
  type StoreCredit,
  type User,
} from "../../lib/api";
import { ReturnsPanel } from "./panels/ReturnsPanel";

export function OrderReturnsPage({ orderId }: { orderId: string }) {
  const [order, setOrder] = useState<Order | null>(null);
  const [requests, setRequests] = useState<ReturnRequest[]>([]);
  const [credits, setCredits] = useState<StoreCredit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    void load(true);
  }, [orderId]);

  async function load(initial = false) {
    if (initial) setLoading(true);
    setError("");
    try {
      const user = await apiFetch<User | null>("/auth/session");
      if (!user) {
        window.location.replace("/login");
        return;
      }
      const [orders, allRequests, allCredits] = await Promise.all([
        apiFetch<Order[]>("/orders/mine"),
        apiFetch<ReturnRequest[]>("/returns/mine"),
        apiFetch<StoreCredit[]>("/returns/credits/mine"),
      ]);
      const selected = orders.find((item) => item.id === orderId);
      if (!selected) {
        setError("Pedido não encontrado ou não pertence à sua conta.");
        return;
      }
      const orderRequests = allRequests.filter(
        (request) => request.orderId === orderId,
      );
      const requestIds = new Set(orderRequests.map((request) => request.id));
      setOrder(selected);
      setRequests(orderRequests);
      setCredits(
        allCredits.filter((credit) => requestIds.has(credit.returnRequestId)),
      );
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Não foi possível carregar as trocas e devoluções.",
      );
    } finally {
      if (initial) setLoading(false);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-bubble-cream">
        <span className="font-sans text-[.7rem] font-semibold uppercase tracking-[.16em] text-bubble-ink/55">
          Carregando pedido...
        </span>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-bubble-cream text-bubble-ink">
      <header className="border-b border-bubble-ink">
        <div className="mx-auto flex max-w-[1000px] items-center justify-between px-6 py-5">
          <Link href="/" className="flex flex-col leading-[.82]">
            <span className="ml-px font-serif text-[.74rem] italic">wear</span>
            <span className="font-display text-[1.35rem] uppercase">
              BUBBLE
            </span>
          </Link>
          <Link
            href={`/conta?tab=orders&order=${orderId}`}
            className="inline-flex items-center gap-2 font-sans text-[.64rem] font-semibold uppercase tracking-[.1em] text-bubble-ink/60 hover:text-bubble-ink"
          >
            <ArrowLeft className="size-4" /> Voltar ao pedido
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-[1000px] px-6 py-12">
        <div className="mb-8">
          <span className="inline-flex items-center gap-2 font-sans text-[.62rem] font-semibold uppercase tracking-[.18em] text-bubble-brown">
            <RotateCcw className="size-4" /> Atendimento pós-compra
          </span>
          <h1 className="mt-3 text-[clamp(2.4rem,6vw,4.2rem)] leading-none">
            Troca ou devolução
          </h1>
          <p className="mt-4 max-w-[620px] text-[.82rem] leading-6 text-bubble-ink/60">
            Faça uma nova solicitação e acompanhe cada atualização do processo.
          </p>
        </div>

        {error ? (
          <div className="border border-bubble-danger/30 bg-bubble-danger/[.06] p-6">
            <p className="text-sm text-bubble-danger">{error}</p>
            <button
              type="button"
              onClick={() => void load(true)}
              className="mt-4 font-sans text-[.62rem] font-bold uppercase tracking-[.1em] underline"
            >
              Tentar novamente
            </button>
          </div>
        ) : order ? (
          <ReturnsPanel
            order={order}
            requests={requests}
            credits={credits}
            onChanged={() => load(false)}
          />
        ) : null}
      </section>
    </main>
  );
}
