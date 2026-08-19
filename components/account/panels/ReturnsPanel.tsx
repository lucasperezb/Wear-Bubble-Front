"use client";

import { Check, ClipboardCopy, PackageOpen, WalletCards } from "lucide-react";
import { useMemo, useState } from "react";
import {
  apiFetch,
  money,
  type Order,
  type ReturnRequest,
  type StoreCredit,
} from "../../../lib/api";

const kinds = [
  ["exchange", "Trocar e receber crédito"],
  ["return", "Devolver e receber estorno"],
  ["defect", "Informar defeito ou avaria"],
] as const;

const reasons = [
  ["size_small", "Tamanho pequeno"],
  ["size_large", "Tamanho grande"],
  ["fit", "Não vestiu como esperado"],
  ["expectation", "Cor ou modelo diferente do esperado"],
  ["wrong_product", "Produto recebido incorretamente"],
  ["defect", "Produto com defeito ou avaria"],
  ["withdrawal", "Arrependimento da compra"],
  ["other", "Outro"],
] as const;

const statusTone: Record<ReturnRequest["status"], string> = {
  requested: "bg-amber-100 text-amber-800",
  approved: "bg-blue-100 text-blue-800",
  awaiting_posting: "bg-blue-100 text-blue-800",
  returning: "bg-blue-100 text-blue-800",
  received: "bg-violet-100 text-violet-800",
  inspecting: "bg-violet-100 text-violet-800",
  completed: "bg-bubble-success/10 text-bubble-success",
  rejected: "bg-bubble-danger/10 text-bubble-danger",
  canceled: "bg-bubble-ink/10 text-bubble-ink/55",
};

export function ReturnsPanel({
  orders,
  requests,
  credits,
  onChanged,
}: {
  orders: Order[];
  requests: ReturnRequest[];
  credits: StoreCredit[];
  onChanged: () => Promise<void>;
}) {
  const eligibleOrders = orders.filter(
    (order) => order.status === "paid" && order.shipStage === 5,
  );
  const [creating, setCreating] = useState(false);
  const [orderId, setOrderId] = useState(eligibleOrders[0]?.id || "");
  const [kind, setKind] = useState<ReturnRequest["kind"]>("exchange");
  const [reason, setReason] = useState("size_small");
  const [details, setDetails] = useState("");
  const [selected, setSelected] = useState<Record<number, number>>({});
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const order = eligibleOrders.find((item) => item.id === orderId);
  const orderMap = useMemo(
    () => new Map(orders.map((item) => [item.id, item])),
    [orders],
  );

  async function submit() {
    const items = Object.entries(selected)
      .filter(([, quantity]) => quantity > 0)
      .map(([orderItemId, quantity]) => ({
        orderItemId: Number(orderItemId),
        quantity,
      }));
    if (!orderId || !items.length) {
      setMessage("Selecione ao menos uma peça.");
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      await apiFetch("/returns", {
        method: "POST",
        body: JSON.stringify({ orderId, kind, reason, details, items }),
      });
      setCreating(false);
      setSelected({});
      setDetails("");
      await onChanged();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Não foi possível enviar.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function cancel(request: ReturnRequest) {
    if (!window.confirm(`Cancelar a solicitação ${request.protocol}?`)) return;
    await apiFetch(`/returns/${request.id}/cancel`, { method: "POST" });
    await onChanged();
  }

  async function copy(value: string) {
    await navigator.clipboard.writeText(value);
  }

  return (
    <div className="space-y-6">
      <section className="border border-bubble-ink bg-bubble-white p-7 max-[620px]:p-5">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-bubble-line pb-5">
          <div>
            <h2 className="text-2xl">Trocas e devoluções</h2>
            <p className="mt-1 text-[.72rem] text-bubble-ink/55">
              Solicite e acompanhe todo o processo em um só lugar.
            </p>
          </div>
          <button
            type="button"
            disabled={!eligibleOrders.length}
            onClick={() => setCreating((value) => !value)}
            className="bg-bubble-ink px-5 py-3 font-sans text-[.66rem] font-semibold uppercase tracking-[.1em] text-bubble-white disabled:opacity-40"
          >
            {creating ? "Fechar" : "Nova solicitação"}
          </button>
        </div>

        {creating ? (
          <div className="mt-6 space-y-5 border border-bubble-line bg-bubble-cream p-5">
            <label className="block">
              <span className="mb-1.5 block text-[.68rem] font-semibold">Pedido entregue</span>
              <select
                className="w-full border border-bubble-line bg-white px-3 py-3"
                value={orderId}
                onChange={(event) => {
                  setOrderId(event.target.value);
                  setSelected({});
                }}
              >
                {eligibleOrders.map((item) => (
                  <option value={item.id} key={item.id}>
                    #{item.number} · {money.format(item.total)}
                  </option>
                ))}
              </select>
            </label>

            <div>
              <span className="mb-2 block text-[.68rem] font-semibold">O que deseja fazer?</span>
              <div className="grid gap-2 sm:grid-cols-3">
                {kinds.map(([value, label]) => (
                  <button
                    type="button"
                    key={value}
                    onClick={() => setKind(value)}
                    className={`border p-3 text-left text-[.72rem] ${kind === value ? "border-bubble-ink bg-bubble-ink text-white" : "border-bubble-line bg-white"}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span className="mb-2 block text-[.68rem] font-semibold">Peças</span>
              <div className="space-y-2">
                {order?.items.map((item) =>
                  item.id ? (
                    <label
                      className="flex items-center justify-between gap-4 border border-bubble-line bg-white p-3 text-[.72rem]"
                      key={item.id}
                    >
                      <span>
                        {item.name} · {item.color} · Tam. {item.size}
                      </span>
                      <select
                        className="border border-bubble-line bg-bubble-cream px-2 py-1.5"
                        value={selected[item.id] || 0}
                        onChange={(event) =>
                          setSelected({
                            ...selected,
                            [item.id!]: Number(event.target.value),
                          })
                        }
                      >
                        <option value={0}>Não devolver</option>
                        {Array.from({ length: item.qty }, (_, index) => index + 1).map(
                          (quantity) => (
                            <option value={quantity} key={quantity}>
                              {quantity} unidade{quantity > 1 ? "s" : ""}
                            </option>
                          ),
                        )}
                      </select>
                    </label>
                  ) : null,
                )}
              </div>
            </div>

            <label className="block">
              <span className="mb-1.5 block text-[.68rem] font-semibold">Motivo</span>
              <select
                className="w-full border border-bubble-line bg-white px-3 py-3"
                value={reason}
                onChange={(event) => setReason(event.target.value)}
              >
                {reasons.map(([value, label]) => (
                  <option value={value} key={value}>{label}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[.68rem] font-semibold">
                Conte mais detalhes <span className="font-normal text-bubble-ink/45">(opcional)</span>
              </span>
              <textarea
                className="min-h-28 w-full border border-bubble-line bg-white px-3 py-3"
                maxLength={1000}
                value={details}
                onChange={(event) => setDetails(event.target.value)}
              />
            </label>
            {message ? <p className="text-[.72rem] text-bubble-danger">{message}</p> : null}
            <button
              type="button"
              disabled={busy}
              onClick={() => void submit()}
              className="bg-bubble-ink px-6 py-3.5 font-sans text-[.68rem] font-semibold uppercase tracking-[.1em] text-white disabled:opacity-40"
            >
              {busy ? "Enviando..." : "Enviar solicitação"}
            </button>
          </div>
        ) : null}
      </section>

      {credits.length ? (
        <section className="border border-bubble-success/30 bg-bubble-success/[.06] p-5">
          <div className="mb-3 flex items-center gap-2 font-semibold"><WalletCards className="size-5" /> Créditos Wear Bubble</div>
          {credits.map((credit) => (
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-bubble-success/20 py-3" key={credit.id}>
              <div>
                <strong>{credit.code}</strong>
                <span className="ml-3 text-sm">Saldo {money.format(credit.balance)}</span>
                <p className="mt-1 text-xs text-bubble-ink/50">Válido até {new Date(credit.expiresAt).toLocaleDateString("pt-BR")}</p>
              </div>
              <button type="button" onClick={() => void copy(credit.code)} className="inline-flex items-center gap-1 text-xs underline"><ClipboardCopy className="size-4" /> Copiar</button>
            </div>
          ))}
        </section>
      ) : null}

      <div className="space-y-4">
        {requests.map((request) => {
          const relatedOrder = orderMap.get(request.orderId);
          return (
            <article className="border border-bubble-line bg-bubble-white p-5" key={request.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <span className="text-[.62rem] uppercase tracking-[.1em] text-bubble-ink/45">Protocolo</span>
                  <h3 className="text-lg">{request.protocol}</h3>
                  <p className="text-xs text-bubble-ink/50">Pedido #{relatedOrder?.number || request.orderId}</p>
                </div>
                <span className={`px-3 py-1.5 text-[.62rem] font-semibold uppercase ${statusTone[request.status]}`}>
                  {request.events.at(-1)?.label || request.status}
                </span>
              </div>

              {request.postingCode ? (
                <div className="mt-4 border border-blue-200 bg-blue-50 p-4 text-sm">
                  <strong>Código de postagem: {request.postingCode}</strong>
                  <button type="button" className="ml-3 underline" onClick={() => void copy(request.postingCode!)}>copiar</button>
                  {request.postingExpiresAt ? <p className="mt-1 text-xs">Válido até {new Date(request.postingExpiresAt).toLocaleDateString("pt-BR")}</p> : null}
                </div>
              ) : null}
              {request.returnTracking ? (
                <p className="mt-3 text-sm"><strong>Rastreio do retorno:</strong> {request.returnTracking}</p>
              ) : null}

              <ol className="mt-5 space-y-3 border-l border-bubble-line pl-5">
                {request.events.map((event) => (
                  <li className="relative" key={event.id}>
                    <span className="absolute -left-[23px] top-1.5 size-1.5 rounded-full bg-bubble-ink" />
                    <strong className="block text-sm">{event.label}</strong>
                    <span className="text-[.68rem] text-bubble-ink/50">{new Date(event.occurredAt).toLocaleString("pt-BR")}</span>
                    {event.message ? <p className="mt-1 text-[.72rem] text-bubble-ink/65">{event.message}</p> : null}
                  </li>
                ))}
              </ol>

              {request.resolutionAmount > 0 ? (
                <div className="mt-4 flex items-center gap-2 border-t border-bubble-line pt-4 text-sm"><Check className="size-4 text-bubble-success" /> {request.resolution === "credit" ? "Crédito" : "Estorno"}: <strong>{money.format(request.resolutionAmount)}</strong></div>
              ) : null}
              {request.publicNote ? <p className="mt-4 text-sm">{request.publicNote}</p> : null}
              {["requested", "approved"].includes(request.status) ? (
                <button type="button" onClick={() => void cancel(request)} className="mt-4 text-xs text-bubble-danger underline">Cancelar solicitação</button>
              ) : null}
            </article>
          );
        })}
        {!requests.length ? (
          <div className="border border-dashed border-bubble-line bg-bubble-white px-6 py-14 text-center">
            <PackageOpen className="mx-auto size-8 text-bubble-ink/25" />
            <p className="mt-3 text-sm text-bubble-ink/55">Nenhuma solicitação de troca ou devolução.</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
