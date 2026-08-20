"use client";

import { useEffect, useMemo, useState } from "react";
import { apiFetch, money, type Order } from "../../../lib/api";
import { shippingStages } from "../shared/constants";
import type { Notify, OnSaved } from "../shared/types";
import { OrderAddressEditor } from "../shared/OrderAddressEditor";
import { DeleteOrderButton } from "../shared/DeleteOrderButton";

type StatusFilter = "all" | Order["status"];

const statusLabels: Record<Order["status"], string> = {
  pending: "Aguardando pagamento",
  paid: "Pagamento confirmado",
  canceled: "Cancelado",
};

const statusClasses: Record<Order["status"], string> = {
  pending: "border-amber-300 bg-amber-50 text-amber-800",
  paid: "border-green-300 bg-green-50 text-green-800",
  canceled: "border-red-300 bg-red-50 text-red-800",
};

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
});

function formatDocument(value?: string) {
  const digits = value?.replace(/\D/g, "") ?? "";
  if (digits.length !== 11) return value || "Não informado";
  return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}

function formatAddress(order: Order) {
  const delivery = order.delivery;
  if (!delivery) return "Endereço não informado";

  const main = [delivery.street, delivery.number].filter(Boolean).join(", ");
  const location = [delivery.neighborhood, delivery.city, delivery.state]
    .filter(Boolean)
    .join(" - ");
  const extra = [delivery.reference, delivery.cep && `CEP ${delivery.cep}`]
    .filter(Boolean)
    .join(" - ");
  return [main, location, extra].filter(Boolean).join(" | ");
}

export function OrdersAdmin({
  orders,
  onSaved,
  notify,
}: {
  orders: Order[];
  onSaved: OnSaved;
  notify: Notify;
}) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [paymentMethod, setPaymentMethod] = useState("all");
  const [shippingStage, setShippingStage] = useState("all");
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [cancelingId, setCancelingId] = useState<string | null>(null);

  const counts = useMemo(
    () => ({
      all: orders.length,
      pending: orders.filter((order) => order.status === "pending").length,
      paid: orders.filter((order) => order.status === "paid").length,
      canceled: orders.filter((order) => order.status === "canceled").length,
    }),
    [orders],
  );

  const paymentMethods = useMemo(
    () =>
      Array.from(
        new Set(orders.map((order) => order.method).filter(Boolean)),
      ).sort((a, b) => a.localeCompare(b, "pt-BR")),
    [orders],
  );

  const filteredOrders = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("pt-BR");

    return [...orders]
      .sort((a, b) => b.date - a.date)
      .filter((order) => status === "all" || order.status === status)
      .filter(
        (order) => paymentMethod === "all" || order.method === paymentMethod,
      )
      .filter(
        (order) =>
          shippingStage === "all" || order.shipStage === Number(shippingStage),
      )
      .filter((order) => {
        if (!normalizedQuery) return true;
        const buyer = order.delivery;
        return [
          order.number,
          order.customerId,
          buyer?.name,
          buyer?.email,
          buyer?.taxId,
          buyer?.phone,
          order.tracking,
        ]
          .filter(Boolean)
          .join(" ")
          .toLocaleLowerCase("pt-BR")
          .includes(normalizedQuery);
      });
  }, [orders, paymentMethod, query, shippingStage, status]);

  useEffect(() => {
    setPage(1);
  }, [query, status, paymentMethod, shippingStage, pageSize]);

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageStart = (currentPage - 1) * pageSize;
  const paginatedOrders = filteredOrders.slice(pageStart, pageStart + pageSize);
  const hasActiveFilters =
    Boolean(query.trim()) ||
    status !== "all" ||
    paymentMethod !== "all" ||
    shippingStage !== "all";

  function clearFilters() {
    setQuery("");
    setStatus("all");
    setPaymentMethod("all");
    setShippingStage("all");
  }

  async function cancelOrder(order: Order) {
    if (
      !window.confirm(
        `Cancelar o pedido #${order.number} e estornar ${money.format(order.total)} pelo Asaas? Esta ação não pode ser desfeita.`,
      )
    )
      return;

    setCancelingId(order.id);
    try {
      await apiFetch(`/payment/orders/${order.id}/cancel`, { method: "POST" });
      await onSaved();
      notify(`Pedido #${order.number} cancelado e valor estornado.`);
    } catch (error) {
      notify(
        error instanceof Error
          ? error.message
          : "Não foi possível cancelar o pedido.",
      );
    } finally {
      setCancelingId(null);
    }
  }

  return (
    <section className="space-y-5">
      <div>
        <p className="adminEyebrow">Gestão de vendas</p>
        <h2 className="adminSectionTitle">Pedidos</h2>
        <p className="mt-1 text-sm text-bubble-ink/60">
          Consulte o pagamento, a entrega e os dados do comprador de cada
          pedido.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {(
          [
            ["all", "Todos"],
            ["pending", "Aguardando pagamento"],
            ["paid", "Pagos"],
            ["canceled", "Cancelados"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setStatus(value)}
            className={`border p-4 text-left transition ${
              status === value
                ? "border-bubble-ink bg-bubble-ink text-bubble-cream"
                : "border-bubble-line bg-bubble-white hover:border-bubble-ink"
            }`}
          >
            <span className="block font-sans text-[.62rem] font-bold uppercase tracking-[.12em]">
              {label}
            </span>
            <strong className="mt-2 block text-2xl">{counts[value]}</strong>
          </button>
        ))}
      </div>

      <div className="grid gap-3 border border-bubble-line bg-bubble-white p-4 md:grid-cols-2 xl:grid-cols-[minmax(280px,1fr)_repeat(3,minmax(170px,auto))]">
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar por pedido, nome, e-mail, CPF, telefone ou rastreio"
          className="min-h-11 border border-bubble-line bg-transparent px-3 text-sm outline-none focus:border-bubble-ink"
        />
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value as StatusFilter)}
          className="min-h-11 border border-bubble-line bg-bubble-white px-3 text-sm outline-none focus:border-bubble-ink"
          aria-label="Filtrar pedidos por status"
        >
          <option value="all">Todos os status</option>
          <option value="pending">Aguardando pagamento</option>
          <option value="paid">Pagamento confirmado</option>
          <option value="canceled">Cancelado</option>
        </select>
        <select
          value={paymentMethod}
          onChange={(event) => setPaymentMethod(event.target.value)}
          className="min-h-11 border border-bubble-line bg-bubble-white px-3 text-sm outline-none focus:border-bubble-ink"
          aria-label="Filtrar pedidos por forma de pagamento"
        >
          <option value="all">Todos os pagamentos</option>
          {paymentMethods.map((method) => (
            <option key={method} value={method}>
              {method}
            </option>
          ))}
        </select>
        <select
          value={shippingStage}
          onChange={(event) => setShippingStage(event.target.value)}
          className="min-h-11 border border-bubble-line bg-bubble-white px-3 text-sm outline-none focus:border-bubble-ink"
          aria-label="Filtrar pedidos por etapa de entrega"
        >
          <option value="all">Todas as etapas de entrega</option>
          {shippingStages.map((stage, index) => (
            <option key={stage} value={index}>
              {stage}
            </option>
          ))}
        </select>
        <div className="flex items-center justify-between gap-3 md:col-span-2 xl:col-span-4">
          <p className="text-xs text-bubble-ink/55">
            {filteredOrders.length}{" "}
            {filteredOrders.length === 1
              ? "pedido encontrado"
              : "pedidos encontrados"}
          </p>
          {hasActiveFilters ? (
            <button
              type="button"
              onClick={clearFilters}
              className="font-sans text-[.62rem] font-bold uppercase tracking-[.1em] underline underline-offset-4"
            >
              Limpar filtros
            </button>
          ) : null}
        </div>
      </div>

      {filteredOrders.length === 0 ? (
        <div className="border border-dashed border-bubble-line p-10 text-center text-sm text-bubble-ink/60">
          Nenhum pedido encontrado com os filtros selecionados.
        </div>
      ) : (
        <div className="space-y-4">
          {paginatedOrders.map((order) => (
            <article
              key={order.id}
              className="border border-bubble-line bg-bubble-white"
            >
              <header className="flex flex-col gap-3 border-b border-bubble-line p-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-bold">
                      Pedido #{order.number}
                    </h3>
                    <span
                      className={`border px-2 py-1 font-sans text-[.58rem] font-bold uppercase tracking-wider ${statusClasses[order.status]}`}
                    >
                      {statusLabels[order.status]}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-bubble-ink/50">
                    {dateFormatter.format(order.date)}
                  </p>
                </div>
                <div className="md:text-right">
                  <p className="font-sans text-[.58rem] uppercase tracking-wider text-bubble-ink/50">
                    Total
                  </p>
                  <strong className="text-xl">
                    {money.format(order.total)}
                  </strong>
                  {order.status === "paid" &&
                  order.gateway === "asaas" &&
                  order.asaasPaymentId ? (
                    <button
                      type="button"
                      disabled={cancelingId === order.id}
                      onClick={() => cancelOrder(order)}
                      className="mt-2 block w-full border border-red-700 px-3 py-2 font-sans text-[.58rem] font-bold uppercase tracking-[.1em] text-red-700 transition-colors hover:bg-red-700 hover:text-white disabled:cursor-wait disabled:opacity-50"
                    >
                      {cancelingId === order.id
                        ? "Cancelando..."
                        : "Cancelar e estornar"}
                    </button>
                  ) : null}
                  <div className="mt-2">
                    <DeleteOrderButton
                      order={order}
                      onSaved={onSaved}
                      notify={notify}
                    />
                  </div>
                </div>
              </header>

              <div className="grid lg:grid-cols-[1fr_1.25fr]">
                <div className="space-y-5 border-b border-bubble-line p-4 lg:border-b-0 lg:border-r">
                  <section>
                    <h4 className="font-sans text-[.62rem] font-bold uppercase tracking-[.14em]">
                      Comprador
                    </h4>
                    <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                      <Info label="Nome" value={order.delivery?.name} />
                      <Info
                        label="CPF"
                        value={formatDocument(order.delivery?.taxId)}
                      />
                      <Info
                        label="E-mail"
                        value={order.delivery?.email}
                        breakAll
                      />
                      <Info label="Telefone" value={order.delivery?.phone} />
                    </dl>
                  </section>

                  <section>
                    <h4 className="font-sans text-[.62rem] font-bold uppercase tracking-[.14em]">
                      Entrega
                    </h4>
                    <p className="mt-3 text-sm leading-6">
                      {formatAddress(order)}
                    </p>
                    <OrderAddressEditor
                      order={order}
                      onSaved={onSaved}
                      notify={notify}
                    />
                    <div className="mt-3 space-y-1 text-xs text-bubble-ink/60">
                      <p>
                        Status:{" "}
                        <strong className="text-bubble-ink">
                          {shippingStages[order.shipStage] ?? "Não informado"}
                        </strong>
                      </p>
                      {order.shipping?.name ? (
                        <p>
                          Frete:{" "}
                          {order.shipping.company
                            ? `${order.shipping.company} - `
                            : ""}
                          {order.shipping.name}
                        </p>
                      ) : null}
                      {order.tracking ? (
                        <p>Rastreio: {order.tracking}</p>
                      ) : null}
                    </div>
                  </section>
                </div>

                <div className="p-4">
                  <h4 className="font-sans text-[.62rem] font-bold uppercase tracking-[.14em]">
                    Itens do pedido
                  </h4>
                  <div className="mt-3 divide-y divide-bubble-line border-y border-bubble-line">
                    {order.items.map((item, index) => (
                      <div
                        key={`${order.id}-${item.pid}-${item.color}-${item.size}-${index}`}
                        className="flex items-start justify-between gap-4 py-3 text-sm"
                      >
                        <div>
                          <p className="font-semibold">
                            {item.qty}x {item.name}
                          </p>
                          <p className="mt-1 text-xs text-bubble-ink/50">
                            {[
                              item.color && `Cor: ${item.color}`,
                              item.size && `Tamanho: ${item.size}`,
                            ]
                              .filter(Boolean)
                              .join(" - ") || "Sem variação"}
                          </p>
                        </div>
                        <span className="shrink-0">
                          {money.format(item.price * item.qty)}
                        </span>
                      </div>
                    ))}
                  </div>

                  <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                    <Info label="Pagamento" value={order.method} />
                    <Info
                      label="Cupom"
                      value={
                        order.coupon
                          ? `${order.coupon}${order.couponPct ? ` (${order.couponPct}%)` : ""}`
                          : "Sem cupom"
                      }
                    />
                    {order.paidAt ? (
                      <Info
                        label="Pago em"
                        value={dateFormatter.format(order.paidAt)}
                      />
                    ) : null}
                    {order.customerId ? (
                      <Info
                        label="ID do cliente"
                        value={order.customerId}
                        breakAll
                      />
                    ) : null}
                  </dl>
                </div>
              </div>
            </article>
          ))}

          <nav
            className="flex flex-col gap-3 border border-bubble-line bg-bubble-white p-4 sm:flex-row sm:items-center sm:justify-between"
            aria-label="Paginação dos pedidos"
          >
            <div className="flex items-center gap-2 text-xs text-bubble-ink/60">
              <span>Exibir</span>
              <select
                value={pageSize}
                onChange={(event) => setPageSize(Number(event.target.value))}
                className="min-h-9 border border-bubble-line bg-bubble-white px-2 outline-none focus:border-bubble-ink"
                aria-label="Quantidade de pedidos por página"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
              </select>
              <span>por página</span>
            </div>

            <p className="text-center text-xs text-bubble-ink/60">
              Mostrando {pageStart + 1}-
              {Math.min(pageStart + pageSize, filteredOrders.length)} de{" "}
              {filteredOrders.length}
            </p>

            <div className="flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={currentPage === 1}
                className="min-h-9 border border-bubble-line px-3 font-sans text-[.6rem] font-bold uppercase tracking-[.08em] disabled:cursor-not-allowed disabled:opacity-35"
              >
                Anterior
              </button>
              <span className="min-w-20 text-center text-xs">
                Página {currentPage} de {totalPages}
              </span>
              <button
                type="button"
                onClick={() =>
                  setPage((current) => Math.min(totalPages, current + 1))
                }
                disabled={currentPage === totalPages}
                className="min-h-9 border border-bubble-line px-3 font-sans text-[.6rem] font-bold uppercase tracking-[.08em] disabled:cursor-not-allowed disabled:opacity-35"
              >
                Próxima
              </button>
            </div>
          </nav>
        </div>
      )}
    </section>
  );
}

function Info({
  label,
  value,
  breakAll = false,
}: {
  label: string;
  value?: string | number | null;
  breakAll?: boolean;
}) {
  return (
    <div>
      <dt className="text-xs text-bubble-ink/50">{label}</dt>
      <dd className={breakAll ? "break-all" : undefined}>
        {value || "Não informado"}
      </dd>
    </div>
  );
}
