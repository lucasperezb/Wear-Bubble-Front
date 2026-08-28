"use client";

import {
  ArrowLeft,
  Check,
  ChevronDown,
  ChevronRight,
  Copy,
  CreditCard,
  ExternalLink,
  MapPin,
  RotateCcw,
  ShoppingBag,
  Truck,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";
import { money, type Order, type ReturnRequest } from "../../../lib/api";

const shippingSteps = [
  "Pedido recebido",
  "Pagamento confirmado",
  "Em separação",
  "Enviado",
  "Em trânsito",
  "Entregue",
];

type OrdersPanelProps = {
  orders: Order[];
  requests: ReturnRequest[];
};

export function OrdersPanel({ orders, requests }: OrdersPanelProps) {
  const safeOrders = useMemo(
    () =>
      [...(Array.isArray(orders) ? orders : [])].sort(
        (left, right) => right.date - left.date,
      ),
    [orders],
  );
  const [selectedId, setSelectedId] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return new URLSearchParams(window.location.search).get("order");
  });
  const selected = safeOrders.find((order) => order.id === selectedId);

  if (selected) {
    const orderRequests = requests.filter(
      (request) => request.orderId === selected.id,
    );
    return (
      <div>
        <button
          type="button"
          onClick={() => {
            setSelectedId(null);
            window.history.replaceState(null, "", "/conta?tab=orders");
          }}
          className="mb-4 inline-flex items-center gap-2 font-sans text-[.62rem] font-bold uppercase tracking-[.1em] text-bubble-ink/55 hover:text-bubble-ink"
        >
          <ArrowLeft className="size-4" /> Voltar aos pedidos
        </button>
        <OrderDetailsPanel
          orders={[selected]}
          requests={orderRequests}
          detailMode
        />
      </div>
    );
  }

  return (
    <div>
      <div className="border border-bubble-ink bg-bubble-white p-7 max-[620px]:p-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="font-sans text-[.6rem] font-semibold uppercase tracking-[.18em] text-bubble-brown">
              Histórico de compras
            </span>
            <h2 className="mt-1 text-3xl">Meus pedidos</h2>
            <p className="mt-2 text-[.76rem] leading-6 text-bubble-ink/55">
              Selecione um pedido para acompanhar todos os detalhes.
            </p>
          </div>
          {safeOrders.length ? (
            <div className="border-l border-bubble-line pl-5 text-right">
              <strong className="block font-display text-4xl leading-none">
                {safeOrders.length}
              </strong>
              <span className="font-sans text-[.58rem] font-semibold uppercase tracking-[.12em] text-bubble-ink/45">
                {safeOrders.length === 1
                  ? "pedido realizado"
                  : "pedidos realizados"}
              </span>
            </div>
          ) : null}
        </div>
      </div>

      {safeOrders.length ? (
        <div className="mt-5 space-y-3">
          {safeOrders.map((order) => {
            const firstItem = order.items[0];
            const presentation = orderPresentation(order);
            const returnPresentation = returnOrderPresentation(
              requests.filter((request) => request.orderId === order.id),
            );
            const quantity = order.items.reduce(
              (total, item) => total + item.qty,
              0,
            );
            return (
              <button
                key={order.id}
                type="button"
                onClick={() => {
                  setSelectedId(order.id);
                  window.history.replaceState(
                    null,
                    "",
                    `/conta?tab=orders&order=${order.id}`,
                  );
                }}
                className="group grid w-full grid-cols-[104px_minmax(0,1fr)_auto] items-center gap-5 border border-bubble-line bg-bubble-white p-3 text-left transition-colors hover:border-bubble-ink max-[620px]:grid-cols-[82px_minmax(0,1fr)] max-[620px]:gap-4"
              >
                <ProductImage
                  image={firstItem?.image}
                  name={firstItem?.name || `Pedido ${order.number}`}
                  className="aspect-[4/5] w-full"
                >
                  {order.items.length > 1 ? (
                    <span className="absolute bottom-1.5 right-1.5 bg-bubble-ink px-2 py-1 font-sans text-[.52rem] font-bold text-bubble-white">
                      +{order.items.length - 1}
                    </span>
                  ) : null}
                </ProductImage>
                <div className="min-w-0 py-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 font-sans text-[.55rem] font-bold uppercase tracking-[.08em] ${presentation.badgeClass}`}
                    >
                      <span className="size-1.5 rounded-full bg-current" />
                      {presentation.label}
                    </span>
                    {returnPresentation ? (
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 font-sans text-[.55rem] font-bold uppercase tracking-[.08em] ${returnPresentation.badgeClass}`}
                      >
                        <RotateCcw className="size-3" />
                        {returnPresentation.label}
                      </span>
                    ) : null}
                    <span className="font-sans text-[.56rem] uppercase tracking-[.08em] text-bubble-ink/40">
                      {formatOrderDate(order.date)}
                    </span>
                  </div>
                  <h3 className="mt-2 text-xl leading-none">
                    Pedido #{order.number}
                  </h3>
                  <p className="mt-2 truncate text-[.7rem] text-bubble-ink/55">
                    {quantity} {quantity === 1 ? "item" : "itens"} ·{" "}
                    {order.items.map((item) => item.name).join(", ")}
                  </p>
                  <strong className="mt-2 block text-[.82rem]">
                    {money.format(order.total)}
                  </strong>
                </div>
                <span className="flex items-center gap-2 pr-3 font-sans text-[.58rem] font-bold uppercase tracking-[.1em] max-[620px]:col-span-2 max-[620px]:w-full max-[620px]:justify-end max-[620px]:border-t max-[620px]:border-bubble-line max-[620px]:py-2 max-[620px]:pr-1">
                  Ver pedido
                  <ChevronRight className="size-4 transition-transform group-hover:translate-x-1" />
                </span>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="mt-5 flex flex-col items-center border border-bubble-ink bg-bubble-white px-5 py-16 text-center">
          <span className="flex size-14 items-center justify-center rounded-full bg-bubble-ink/[.06]">
            <ShoppingBag className="size-6 text-bubble-ink/35" />
          </span>
          <h3 className="mt-5 text-2xl">
            Sua história com a Bubble começa aqui
          </h3>
          <p className="mt-2 max-w-[390px] text-[.76rem] leading-6 text-bubble-ink/50">
            Quando você fizer uma compra, pagamento, envio e rastreio aparecerão
            nesta página.
          </p>
          <Link
            href="/produtos"
            className="mt-6 bg-bubble-ink px-6 py-3.5 font-sans text-[.68rem] font-semibold uppercase tracking-[.12em] text-bubble-white"
          >
            Conhecer a coleção
          </Link>
        </div>
      )}
    </div>
  );
}

function OrderDetailsPanel({
  orders,
  requests,
  detailMode = false,
}: {
  orders: Order[];
  requests: ReturnRequest[];
  detailMode?: boolean;
}) {
  const safeOrders = useMemo(
    () =>
      [...(Array.isArray(orders) ? orders : [])].sort(
        (left, right) => right.date - left.date,
      ),
    [orders],
  );
  const [expandedOrder, setExpandedOrder] = useState<string | null>(
    safeOrders[0]?.id || null,
  );
  const [copiedOrder, setCopiedOrder] = useState<string | null>(null);

  async function copyTracking(order: Order) {
    if (!order.tracking) return;
    await navigator.clipboard.writeText(order.tracking);
    setCopiedOrder(order.id);
    window.setTimeout(() => setCopiedOrder(null), 1800);
  }

  return (
    <div>
      {!detailMode ? (
        <div className="border border-bubble-ink bg-bubble-white p-7 max-[620px]:p-5">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <span className="font-sans text-[.6rem] font-semibold uppercase tracking-[.18em] text-bubble-brown">
                Histórico de compras
              </span>
              <h2 className="mt-1 text-3xl">Meus pedidos</h2>
              <p className="mt-2 text-[.76rem] leading-6 text-bubble-ink/55">
                Acompanhe o pagamento, a preparação e a entrega em um só lugar.
              </p>
            </div>
            {safeOrders.length ? (
              <div className="border-l border-bubble-line pl-5 text-right">
                <strong className="block font-display text-4xl leading-none">
                  {safeOrders.length}
                </strong>
                <span className="font-sans text-[.58rem] font-semibold uppercase tracking-[.12em] text-bubble-ink/45">
                  {safeOrders.length === 1
                    ? "pedido realizado"
                    : "pedidos realizados"}
                </span>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {safeOrders.length ? (
        <div className="mt-5 space-y-5">
          {safeOrders.map((order) => {
            const expanded = detailMode || expandedOrder === order.id;
            const presentation = orderPresentation(order);
            const orderRequests = requests.filter(
              (request) => request.orderId === order.id,
            );
            const returnPresentation = returnOrderPresentation(orderRequests);
            return (
              <article
                key={order.id}
                className="overflow-hidden border border-bubble-ink bg-bubble-white"
              >
                <div className="grid grid-cols-[1fr_auto] gap-5 p-6 max-[620px]:grid-cols-1 max-[620px]:p-5">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 font-sans text-[.6rem] font-bold uppercase tracking-[.09em] ${presentation.badgeClass}`}
                      >
                        <span className="size-1.5 rounded-full bg-current" />
                        {presentation.label}
                      </span>
                      {returnPresentation ? (
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 font-sans text-[.6rem] font-bold uppercase tracking-[.09em] ${returnPresentation.badgeClass}`}
                        >
                          <RotateCcw className="size-3.5" />
                          {returnPresentation.label}
                        </span>
                      ) : null}
                      <span className="font-sans text-[.6rem] uppercase tracking-[.1em] text-bubble-ink/40">
                        {formatOrderDate(order.date)}
                      </span>
                    </div>
                    <h3 className="mt-3 text-[1.65rem] leading-none">
                      Pedido #{order.number}
                    </h3>
                    <p className="mt-2 max-w-[620px] text-[.76rem] leading-6 text-bubble-ink/60">
                      {presentation.description}
                    </p>
                  </div>

                  <div className="flex min-w-[150px] flex-col items-end justify-between gap-4 max-[620px]:min-w-0 max-[620px]:items-start">
                    <div className="text-right max-[620px]:text-left">
                      <span className="block font-sans text-[.56rem] font-semibold uppercase tracking-[.1em] text-bubble-ink/40">
                        Total do pedido
                      </span>
                      <strong className="mt-0.5 block text-xl">
                        {money.format(order.total)}
                      </strong>
                    </div>
                    {!detailMode ? (
                      <button
                        type="button"
                        aria-expanded={expanded}
                        onClick={() =>
                          setExpandedOrder(expanded ? null : order.id)
                        }
                        className="inline-flex items-center gap-2 border-b border-bubble-ink pb-1 font-sans text-[.62rem] font-bold uppercase tracking-[.1em]"
                      >
                        {expanded ? "Ocultar detalhes" : "Ver detalhes"}
                        <ChevronDown
                          className={`size-4 transition-transform ${expanded ? "rotate-180" : ""}`}
                        />
                      </button>
                    ) : null}
                  </div>
                </div>

                <OrderProgress order={order} />

                {expanded ? (
                  <div className="border-t border-bubble-line bg-bubble-cream/45 p-6 max-[620px]:p-5">
                    {orderRequests.length ? (
                      <ReturnTrackingSummary
                        order={order}
                        requests={orderRequests}
                      />
                    ) : null}
                    {order.tracking ? (
                      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border border-bubble-ink bg-bubble-ink p-4 text-bubble-white">
                        <div className="flex min-w-0 items-center gap-3">
                          <Truck className="size-5 shrink-0 text-bubble-candy" />
                          <div className="min-w-0">
                            <span className="block font-sans text-[.56rem] font-semibold uppercase tracking-[.12em] text-bubble-white/55">
                              Código de rastreio
                            </span>
                            <strong className="block truncate font-sans text-sm tracking-[.08em]">
                              {order.tracking}
                            </strong>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => void copyTracking(order)}
                            className="inline-flex items-center gap-2 border border-bubble-white/30 px-3 py-2 font-sans text-[.58rem] font-bold uppercase tracking-[.08em] hover:bg-bubble-white hover:text-bubble-ink"
                          >
                            <Copy className="size-3.5" />
                            {copiedOrder === order.id ? "Copiado" : "Copiar"}
                          </button>
                          <a
                            href={`https://www.melhorrastreio.com.br/rastreio/${encodeURIComponent(order.tracking)}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 bg-bubble-candy px-3 py-2 font-sans text-[.58rem] font-bold uppercase tracking-[.08em] text-bubble-ink"
                          >
                            Rastrear <ExternalLink className="size-3.5" />
                          </a>
                        </div>
                      </div>
                    ) : null}

                    <div className="grid grid-cols-[minmax(0,1.3fr)_minmax(220px,.7fr)] gap-6 max-[760px]:grid-cols-1">
                      <div>
                        <h4 className="font-sans text-[.64rem] font-bold uppercase tracking-[.13em] text-bubble-ink/65">
                          Itens do pedido
                        </h4>
                        <div className="mt-3 divide-y divide-bubble-line border-y border-bubble-line">
                          {order.items.map((item, index) => (
                            <div
                              key={`${item.id || item.pid}-${item.color || "legacy"}-${item.size}-${index}`}
                              className="flex items-start justify-between gap-5 py-3.5"
                            >
                              <div className="flex min-w-0 gap-3">
                                <ProductImage
                                  image={item.image}
                                  name={item.name}
                                  className="h-20 w-16 shrink-0"
                                />
                                <div className="min-w-0">
                                  <strong className="block text-[.82rem] leading-5">
                                    {item.name}
                                  </strong>
                                  <span className="block text-[.68rem] text-bubble-ink/50">
                                    {item.color ? `Cor ${item.color} · ` : ""}
                                    Tamanho {item.size}
                                  </span>
                                </div>
                              </div>
                              <span className="shrink-0 text-[.76rem] font-semibold">
                                {money.format(item.price * item.qty)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-4">
                        <InfoCard
                          icon={<CreditCard />}
                          label="Pagamento"
                          value={paymentMethodLabel(order.method)}
                          detail={paymentDetail(order)}
                        />
                        <InfoCard
                          icon={<Truck />}
                          label="Entrega"
                          value={order.shipping?.name || "Correios"}
                          detail={
                            order.shipping?.deliveryTime
                              ? `Prazo contratado: até ${order.shipping.deliveryTime} dias úteis após a postagem.`
                              : "O prazo começa a contar após a postagem."
                          }
                        />
                        {order.delivery ? (
                          <InfoCard
                            icon={<MapPin />}
                            label="Endereço de entrega"
                            value={`${order.delivery.street}, ${order.delivery.number}`}
                            detail={`${order.delivery.neighborhood} · ${order.delivery.city}/${order.delivery.state} · CEP ${order.delivery.cep}`}
                          />
                        ) : null}
                      </div>
                    </div>

                    {order.status === "paid" || orderRequests.length ? (
                      <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-bubble-line pt-5">
                        <p className="text-[.7rem] text-bubble-ink/50">
                          {orderRequests.length
                            ? "Acompanhe ou gerencie sua solicitação de pós-venda."
                            : "Precisa trocar, devolver ou informar um problema com o produto?"}
                        </p>
                        <Link
                          href={`/conta/pedidos/${order.id}/troca`}
                          className="inline-flex items-center gap-2 font-sans text-[.62rem] font-bold uppercase tracking-[.1em] underline underline-offset-4"
                        >
                          <RotateCcw className="size-4" />
                          {orderRequests.length
                            ? "Ver troca ou devolução"
                            : "Troca ou devolução"}
                        </Link>
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      ) : (
        <div className="mt-5 flex flex-col items-center border border-bubble-ink bg-bubble-white px-5 py-16 text-center">
          <span className="flex size-14 items-center justify-center rounded-full bg-bubble-ink/[.06]">
            <ShoppingBag className="size-6 text-bubble-ink/35" />
          </span>
          <h3 className="mt-5 text-2xl">
            Sua história com a Bubble começa aqui
          </h3>
          <p className="mt-2 max-w-[390px] text-[.76rem] leading-6 text-bubble-ink/50">
            Quando você fizer uma compra, pagamento, envio e rastreio aparecerão
            nesta página.
          </p>
          <Link
            href="/produtos"
            className="mt-6 bg-bubble-ink px-6 py-3.5 font-sans text-[.68rem] font-semibold uppercase tracking-[.12em] text-bubble-white"
          >
            Conhecer a coleção
          </Link>
        </div>
      )}
    </div>
  );
}

function ReturnTrackingSummary({
  order,
  requests,
}: {
  order: Order;
  requests: ReturnRequest[];
}) {
  return (
    <section className="mb-6 border border-bubble-brown/45 bg-bubble-white">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-bubble-line p-4">
        <div className="flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-full bg-bubble-brown/10 text-bubble-brown">
            <RotateCcw className="size-4" />
          </span>
          <div>
            <span className="block font-sans text-[.55rem] font-bold uppercase tracking-[.12em] text-bubble-brown">
              Pós-venda em andamento
            </span>
            <h4 className="text-[.9rem]">
              {requests.length === 1
                ? "Troca ou devolução"
                : `${requests.length} solicitações`}
            </h4>
          </div>
        </div>
        <Link
          href={`/conta/pedidos/${order.id}/troca`}
          className="inline-flex items-center gap-2 font-sans text-[.58rem] font-bold uppercase tracking-[.1em] underline underline-offset-4"
        >
          Acompanhamento completo <ChevronRight className="size-3.5" />
        </Link>
      </header>

      <div className="divide-y divide-bubble-line">
        {requests.map((request) => {
          const latest = request.events.at(-1);
          const visibleEvents = request.events.slice(-3);
          return (
            <article
              key={request.id}
              className="grid gap-5 p-4 md:grid-cols-[minmax(180px,.7fr)_minmax(0,1.3fr)]"
            >
              <div>
                <span className="font-sans text-[.54rem] font-semibold uppercase tracking-[.1em] text-bubble-ink/40">
                  Protocolo
                </span>
                <strong className="block text-[.8rem]">
                  {request.protocol}
                </strong>
                <span
                  className={`mt-2 inline-flex px-2.5 py-1 font-sans text-[.55rem] font-bold uppercase tracking-[.07em] ${returnStatusTone(request.status)}`}
                >
                  {latest?.label || returnStatusLabel(request.status)}
                </span>
                <p className="mt-2 text-[.66rem] text-bubble-ink/50">
                  Solicitado em {formatDateTime(request.requestedAt)}
                </p>
                {request.postingCode ? (
                  <div className="mt-3 text-[.7rem]">
                    <p>
                      <strong>Código de postagem:</strong> {request.postingCode}
                    </p>
                    <p className="mt-1 text-bubble-ink/55">
                      Apresente o código nos Correios; etiqueta física não é
                      obrigatória.
                    </p>
                    {request.reverseStatus === "sandbox_simulated" ? (
                      <p className="mt-1 font-semibold text-bubble-danger">
                        Código de teste Sandbox, sem validade nos Correios.
                      </p>
                    ) : null}
                  </div>
                ) : null}
                {request.returnTracking ? (
                  <p className="mt-1 text-[.7rem]">
                    <strong>Rastreio do retorno:</strong>{" "}
                    {request.returnTracking}
                  </p>
                ) : null}
              </div>

              <ol className="space-y-3 border-l border-bubble-line pl-5">
                {visibleEvents.map((event, index) => (
                  <li
                    key={event.id}
                    className={
                      index === visibleEvents.length - 1
                        ? "text-bubble-ink"
                        : "text-bubble-ink/50"
                    }
                  >
                    <span className="relative block text-[.72rem] font-semibold before:absolute before:-left-[23px] before:top-1.5 before:size-1.5 before:rounded-full before:bg-current">
                      {event.label}
                    </span>
                    <span className="block text-[.62rem]">
                      {formatDateTime(event.occurredAt)}
                    </span>
                    {event.message ? (
                      <p className="mt-1 text-[.66rem] leading-5">
                        {event.message}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ol>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function ProductImage({
  image,
  name,
  className,
  children,
}: {
  image?: string | null;
  name: string;
  className: string;
  children?: ReactNode;
}) {
  return (
    <span
      className={`relative flex overflow-hidden bg-bubble-ink/[.06] ${className}`}
    >
      {image ? (
        <img src={image} alt={name} className="size-full object-cover" />
      ) : (
        <span className="flex size-full items-center justify-center">
          <ShoppingBag className="size-5 text-bubble-ink/25" />
        </span>
      )}
      {children}
    </span>
  );
}

function returnStatusLabel(status: ReturnRequest["status"]) {
  const labels: Record<ReturnRequest["status"], string> = {
    requested: "Solicitação recebida",
    approved: "Solicitação aprovada",
    awaiting_posting: "Código de postagem disponível",
    returning: "Produto em retorno",
    received: "Produto recebido",
    inspecting: "Produto em inspeção",
    completed: "Processo concluído",
    rejected: "Solicitação não aprovada",
    canceled: "Solicitação cancelada",
  };
  return labels[status];
}

function returnOrderPresentation(requests: ReturnRequest[]) {
  if (!requests.length) return null;
  const activeStatuses: ReturnRequest["status"][] = [
    "requested",
    "approved",
    "awaiting_posting",
    "returning",
    "received",
    "inspecting",
  ];
  const sorted = [...requests].sort(
    (left, right) => right.requestedAt - left.requestedAt,
  );
  const request =
    sorted.find((item) => activeStatuses.includes(item.status)) || sorted[0];
  const operation = request.kind === "exchange" ? "Troca" : "Devolução";
  const statusLabels: Record<ReturnRequest["status"], string> = {
    requested: "solicitada",
    approved: "aprovada",
    awaiting_posting: "aguardando postagem",
    returning: "produto retornando",
    received: "produto recebido",
    inspecting: "em análise",
    completed: "concluída",
    rejected: "não aprovada",
    canceled: "cancelada",
  };
  return {
    label: `${operation} ${statusLabels[request.status]}`,
    badgeClass: returnStatusTone(request.status),
  };
}

function returnStatusTone(status: ReturnRequest["status"]) {
  if (status === "completed") return "bg-bubble-success/10 text-bubble-success";
  if (status === "rejected") return "bg-bubble-danger/10 text-bubble-danger";
  if (status === "canceled") return "bg-bubble-ink/10 text-bubble-ink/55";
  if (["received", "inspecting"].includes(status))
    return "bg-violet-100 text-violet-800";
  if (["approved", "awaiting_posting", "returning"].includes(status))
    return "bg-blue-100 text-blue-800";
  return "bg-amber-100 text-amber-800";
}

function formatDateTime(timestamp: number) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(timestamp));
}

function OrderProgress({ order }: { order: Order }) {
  const terminal = ["canceled", "expired", "stock_conflict"].includes(
    order.status,
  );
  const currentStage = terminal
    ? 0
    : Math.max(0, Math.min(5, order.shipStage || 0));

  return (
    <div className="border-t border-bubble-line px-6 py-5 max-[620px]:px-5">
      {terminal ? (
        <p className="font-sans text-[.62rem] font-semibold uppercase tracking-[.09em] text-bubble-danger">
          O fluxo deste pedido foi encerrado. Abra os detalhes para consultar
          pagamento e itens.
        </p>
      ) : (
        <ol className="grid grid-cols-6 max-[720px]:grid-cols-1 max-[720px]:gap-0">
          {shippingSteps.map((step, index) => {
            const complete = index < currentStage;
            const current = index === currentStage;
            return (
              <li
                key={step}
                className="relative flex flex-col items-center text-center max-[720px]:min-h-12 max-[720px]:flex-row max-[720px]:gap-3 max-[720px]:text-left"
              >
                {index > 0 ? (
                  <span
                    className={`absolute right-1/2 top-[11px] h-px w-full max-[720px]:bottom-1/2 max-[720px]:left-[11px] max-[720px]:right-auto max-[720px]:top-auto max-[720px]:h-full max-[720px]:w-px ${index <= currentStage ? "bg-bubble-ink" : "bg-bubble-line"}`}
                  />
                ) : null}
                <span
                  className={`relative z-[1] flex size-[23px] shrink-0 items-center justify-center rounded-full border ${complete ? "border-bubble-ink bg-bubble-ink text-bubble-white" : current ? "border-bubble-ink bg-bubble-candy text-bubble-ink" : "border-bubble-line bg-bubble-white text-transparent"}`}
                >
                  {complete ? (
                    <Check className="size-3.5" />
                  ) : (
                    <span className="size-1.5 rounded-full bg-current" />
                  )}
                </span>
                <span
                  className={`relative z-[1] mt-2 bg-bubble-white px-1 font-sans text-[.52rem] font-semibold uppercase leading-4 tracking-[.07em] max-[720px]:mt-0 max-[720px]:px-0 ${index <= currentStage ? "text-bubble-ink" : "text-bubble-ink/35"}`}
                >
                  {step}
                </span>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}

function InfoCard({
  icon,
  label,
  value,
  detail,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="flex gap-3 border border-bubble-line bg-bubble-white p-4">
      <span className="mt-0.5 text-bubble-brown [&_svg]:size-4">{icon}</span>
      <div>
        <span className="block font-sans text-[.54rem] font-semibold uppercase tracking-[.12em] text-bubble-ink/40">
          {label}
        </span>
        <strong className="mt-0.5 block text-[.76rem]">{value}</strong>
        <span className="mt-1 block text-[.66rem] leading-5 text-bubble-ink/50">
          {detail}
        </span>
      </div>
    </div>
  );
}

function orderPresentation(order: Order) {
  if (order.status === "canceled") {
    return {
      label: "Pedido cancelado",
      description: "Este pedido foi cancelado e não seguirá para envio.",
      badgeClass: "bg-bubble-danger/10 text-bubble-danger",
    };
  }
  if (order.status === "expired") {
    return {
      label: "Pagamento expirado",
      description: "O prazo para pagamento terminou e o pedido foi encerrado.",
      badgeClass: "bg-bubble-danger/10 text-bubble-danger",
    };
  }
  if (order.status === "stock_conflict") {
    return {
      label: "Estorno em processamento",
      description:
        "Houve uma indisponibilidade de estoque e o pagamento seguirá o fluxo de estorno.",
      badgeClass: "bg-bubble-danger/10 text-bubble-danger",
    };
  }
  if (order.status === "pending") {
    return {
      label: "Aguardando pagamento",
      description:
        "Assim que o pagamento for confirmado, iniciaremos a separação.",
      badgeClass: "bg-[#fff1c7] text-[#7a5500]",
    };
  }
  if (order.shipStage >= 5) {
    return {
      label: "Pedido entregue",
      description:
        "A entrega foi confirmada. Esperamos que você ame suas novas peças.",
      badgeClass: "bg-bubble-success/10 text-bubble-success",
    };
  }
  if (order.shipStage >= 3) {
    return {
      label: "Pedido enviado",
      description: order.tracking
        ? "Seu pedido está com os Correios e já pode ser acompanhado pelo rastreio."
        : "Seu pedido foi postado e está seguindo para o endereço de entrega.",
      badgeClass: "bg-bubble-success/10 text-bubble-success",
    };
  }
  if (order.shipStage >= 2) {
    return {
      label: "Em separação",
      description:
        "A etiqueta foi gerada e seu pedido está sendo preparado para postagem.",
      badgeClass: "bg-bubble-ink/10 text-bubble-ink",
    };
  }
  return {
    label: "Pagamento confirmado",
    description: "Pagamento aprovado. Seu pedido entrará na fila de separação.",
    badgeClass: "bg-bubble-success/10 text-bubble-success",
  };
}

function paymentMethodLabel(method: string) {
  const normalized = method.toLowerCase();
  if (normalized.includes("pix")) return "Pix";
  if (normalized.includes("card") || normalized.includes("cart"))
    return "Cartão de crédito";
  return method || "Pagamento online";
}

function paymentDetail(order: Order) {
  if (order.status === "pending") return "Aguardando confirmação do pagamento.";
  if (order.paymentStatus === "refunded") return "Pagamento estornado.";
  if (order.paymentStatus === "refund_pending")
    return "Estorno em processamento.";
  if (order.storeCreditAmount) {
    return order.gateway === "store_credit"
      ? `Compra paga integralmente com ${money.format(order.storeCreditAmount)} do saldo Wear Bubble.`
      : `${money.format(order.storeCreditAmount)} do saldo Wear Bubble utilizado; restante confirmado com segurança.`;
  }
  return "Pagamento confirmado com segurança.";
}

function formatOrderDate(timestamp: number) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
    .format(new Date(timestamp))
    .replace(" de ", " ")
    .replace(" de ", " ");
}
