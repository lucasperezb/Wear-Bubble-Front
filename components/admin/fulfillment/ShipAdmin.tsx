"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  ArrowLeft,
  ChevronRight,
  Copy,
  Mail,
  Phone,
  Search,
  X,
} from "lucide-react";
import {
  Order,
  OrderShipment,
  ReturnRequest,
  apiFetch,
  money,
} from "../../../lib/api";
import { shippingStages } from "../shared/constants";
import { adminNote, adminTable, saveButton } from "../shared/styles";
import type { Notify, OnSaved } from "../shared/types";
import { OrderAddressEditor } from "../shared/OrderAddressEditor";
import { DeleteOrderButton } from "../shared/DeleteOrderButton";
import { usePagination } from "../shared/usePagination";
import { PaginationControls } from "../shared/PaginationControls";
import { useActionDialog } from "../../shared/overlays/ActionDialog";

type StatusFilter = "all" | Order["status"];

const dateTime = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
});

const returnKindLabels = {
  exchange: "Troca por crédito",
  return: "Devolução",
  defect: "Defeito ou avaria",
};
const returnReasonLabels: Record<string, string> = {
  size_small: "Tamanho pequeno",
  size_large: "Tamanho grande",
  fit: "Não vestiu como esperado",
  expectation: "Cor ou modelo diferente do esperado",
  wrong_product: "Produto recebido incorretamente",
  defect: "Produto com defeito ou avaria",
  withdrawal: "Arrependimento da compra",
  other: "Outro motivo",
};
const returnStatusLabels: Record<ReturnRequest["status"], string> = {
  requested: "Solicitação recebida",
  approved: "Solicitação aprovada",
  awaiting_posting: "Aguardando postagem",
  returning: "Produto retornando",
  received: "Produto recebido",
  inspecting: "Em inspeção",
  completed: "Concluída",
  rejected: "Rejeitada",
  canceled: "Cancelada",
};

const RETURN_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

type ReturnDeadline = {
  key: "within" | "outside" | "unknown";
  label: string;
  title: string;
  className: string;
};

function getReturnDeadline(
  request: ReturnRequest,
  deliveredAt?: number,
): ReturnDeadline {
  if (!deliveredAt) {
    return {
      key: "unknown",
      label: "Prazo não verificável",
      title: "Este pedido não possui uma data de entrega registrada.",
      className: "border-bubble-line bg-bubble-cream text-bubble-ink/60",
    };
  }

  const elapsed = request.requestedAt - deliveredAt;
  const withinDeadline = elapsed >= 0 && elapsed <= RETURN_WINDOW_MS;
  return withinDeadline
    ? {
        key: "within",
        label: "Dentro do prazo de 7 dias",
        title: "A devolução foi solicitada em até 7 dias após a entrega.",
        className: "border-green-700/30 bg-green-700/10 text-green-800",
      }
    : {
        key: "outside",
        label: "Fora do prazo de 7 dias",
        title: "A devolução foi solicitada mais de 7 dias após a entrega.",
        className:
          "border-bubble-danger/30 bg-bubble-danger/[.08] text-bubble-danger",
      };
}

export function ShipAdmin({
  onSaved,
  notify,
}: {
  onSaved: OnSaved;
  notify: Notify;
}) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [returns, setReturns] = useState<ReturnRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [returnKindFilter, setReturnKindFilter] = useState<
    "all" | ReturnRequest["kind"]
  >("all");
  const [returnStatusFilter, setReturnStatusFilter] = useState<
    "all" | ReturnRequest["status"]
  >("all");
  const [stageFilter, setStageFilter] = useState("all");
  const [serviceFilter, setServiceFilter] = useState("all");
  const [periodFilter, setPeriodFilter] = useState("all");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      apiFetch<Order[]>("/orders"),
      apiFetch<ReturnRequest[]>("/returns"),
    ])
      .then(([ordersRes, returnsRes]) => {
        if (cancelled) return;
        setOrders(ordersRes);
        setReturns(returnsRes);
      })
      .catch((error) => {
        notify(
          error instanceof Error
            ? error.message
            : "Não foi possível carregar os pedidos.",
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSaved() {
    const [ordersRes, returnsRes] = await Promise.all([
      apiFetch<Order[]>("/orders"),
      apiFetch<ReturnRequest[]>("/returns"),
    ]);
    setOrders(ordersRes);
    setReturns(returnsRes);
    await onSaved();
  }

  const selected = orders.find((order) => order.id === selectedId);
  const returnsByOrder = useMemo(() => {
    const map = new Map<string, ReturnRequest[]>();
    for (const request of returns) {
      const list = map.get(request.orderId) || [];
      list.push(request);
      map.set(request.orderId, list);
    }
    return map;
  }, [returns]);
  const counts = useMemo(
    () => ({
      all: orders.length,
      pending: orders.filter((order) => order.status === "pending").length,
      paid: orders.filter((order) => order.status === "paid").length,
      canceled: orders.filter((order) => order.status === "canceled").length,
    }),
    [orders],
  );
  const returnCounts = useMemo(
    () => ({
      exchange: returns.filter((request) => request.kind === "exchange")
        .length,
      return: returns.filter((request) => request.kind === "return").length,
    }),
    [returns],
  );
  const filteredOrders = useMemo(() => {
    const search = normalizeSearch(query);
    const periodDays = periodFilter === "all" ? 0 : Number(periodFilter);
    const periodStart = periodDays
      ? Date.now() - periodDays * 24 * 60 * 60 * 1000
      : 0;
    return [...orders]
      .filter((order) => {
        if (search) {
          const searchable = normalizeSearch(
            [
              order.number,
              order.delivery?.name,
              order.delivery?.email,
              order.delivery?.taxId,
              order.delivery?.city,
              order.tracking,
              order.shipping?.name,
            ].join(" "),
          );
          if (!searchable.includes(search)) return false;
        }
        if (status !== "all" && order.status !== status) return false;
        if (stageFilter !== "all" && order.shipStage !== Number(stageFilter))
          return false;
        const service = normalizeSearch(order.shipping?.name || "");
        if (serviceFilter !== "all" && !service.includes(serviceFilter))
          return false;
        if (periodStart && order.date < periodStart) return false;
        if (returnKindFilter !== "all" || returnStatusFilter !== "all") {
          const orderReturns = returnsByOrder.get(order.id) || [];
          const matches = orderReturns.some(
            (request) =>
              (returnKindFilter === "all" ||
                request.kind === returnKindFilter) &&
              (returnStatusFilter === "all" ||
                request.status === returnStatusFilter),
          );
          if (!matches) return false;
        }
        return true;
      })
      .sort((first, second) => second.date - first.date);
  }, [
    orders,
    periodFilter,
    query,
    returnKindFilter,
    returnStatusFilter,
    returnsByOrder,
    serviceFilter,
    stageFilter,
    status,
  ]);
  const {
    pageItems: paginatedOrders,
    pageSize,
    setPageSize,
    page,
    setPage,
    totalPages,
    pageStart,
  } = usePagination(filteredOrders, [
    periodFilter,
    query,
    returnKindFilter,
    returnStatusFilter,
    serviceFilter,
    stageFilter,
    status,
  ]);
  const hasFilters =
    Boolean(query) ||
    status !== "all" ||
    returnKindFilter !== "all" ||
    returnStatusFilter !== "all" ||
    stageFilter !== "all" ||
    serviceFilter !== "all" ||
    periodFilter !== "all";

  if (loading) return <p className={adminNote}>Carregando pedidos...</p>;

  if (selected) {
    return (
      <ShipmentDetail
        order={selected}
        returns={returnsByOrder.get(selected.id) || []}
        onBack={() => setSelectedId(null)}
        onSaved={handleSaved}
        notify={notify}
      />
    );
  }

  return (
    <>
      <div className="mb-[18px] border border-bubble-candy bg-bubble-candy/15 px-[13px] py-[11px] text-[.68rem] leading-[1.6] text-bubble-ink">
        <b>Gestão de pedidos.</b> Clique em um pedido para consultar todas as
        informações, executar as ações de envio e acompanhar trocas ou
        devoluções.
      </div>

      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
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
        {(
          [
            ["exchange", "Trocas"],
            ["return", "Devoluções"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() =>
              setReturnKindFilter((current) =>
                current === value ? "all" : value,
              )
            }
            className={`border p-4 text-left transition ${
              returnKindFilter === value
                ? "border-bubble-ink bg-bubble-ink text-bubble-cream"
                : "border-bubble-line bg-bubble-white hover:border-bubble-ink"
            }`}
          >
            <span className="block font-sans text-[.62rem] font-bold uppercase tracking-[.12em]">
              {label}
            </span>
            <strong className="mt-2 block text-2xl">
              {returnCounts[value]}
            </strong>
          </button>
        ))}
      </div>

      <div className="mb-4 border border-bubble-line bg-bubble-white p-4">
        <div className="grid gap-3 lg:grid-cols-[minmax(220px,1.3fr)_repeat(4,minmax(150px,.65fr))_auto]">
          <label className="relative block">
            <span className="sr-only">Buscar envios</span>
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-bubble-ink/40" />
            <input
              className="h-11 w-full border border-bubble-line bg-bubble-cream pl-10 pr-3 text-sm outline-none focus:border-bubble-ink"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Pedido, cliente, CPF ou rastreio"
            />
          </label>
          <FilterSelect
            label="Etapa"
            value={stageFilter}
            onChange={setStageFilter}
          >
            <option value="all">Todas as etapas</option>
            {shippingStages.map((stage, index) => (
              <option value={index} key={stage}>
                {stage}
              </option>
            ))}
          </FilterSelect>
          <FilterSelect
            label="Serviço"
            value={serviceFilter}
            onChange={setServiceFilter}
          >
            <option value="all">PAC e SEDEX</option>
            <option value="pac">PAC</option>
            <option value="sedex">SEDEX</option>
          </FilterSelect>
          <FilterSelect
            label="Período"
            value={periodFilter}
            onChange={setPeriodFilter}
          >
            <option value="all">Todo o período</option>
            <option value="1">Últimas 24 horas</option>
            <option value="7">Últimos 7 dias</option>
            <option value="30">Últimos 30 dias</option>
          </FilterSelect>
          <FilterSelect
            label="Status da troca/devolução"
            value={returnStatusFilter}
            onChange={(value) =>
              setReturnStatusFilter(value as "all" | ReturnRequest["status"])
            }
          >
            <option value="all">Troca/devolução: todos os status</option>
            {Object.entries(returnStatusLabels).map(([value, label]) => (
              <option value={value} key={value}>
                {label}
              </option>
            ))}
          </FilterSelect>
          <button
            type="button"
            disabled={!hasFilters}
            onClick={() => {
              setQuery("");
              setStatus("all");
              setReturnKindFilter("all");
              setReturnStatusFilter("all");
              setStageFilter("all");
              setServiceFilter("all");
              setPeriodFilter("all");
            }}
            className="inline-flex h-11 items-center justify-center gap-2 border border-bubble-line px-4 font-sans text-[.62rem] font-bold uppercase tracking-[.08em] disabled:cursor-not-allowed disabled:opacity-35"
          >
            <X className="size-4" /> Limpar
          </button>
        </div>
        <p className="mt-3 text-[.68rem] text-bubble-ink/50">
          {filteredOrders.length} de {orders.length} envio(s) encontrado(s)
        </p>
      </div>
      <div className="overflow-x-auto">
        <table
          className={`${adminTable} [&_tbody_tr]:cursor-pointer [&_tbody_tr]:transition-colors [&_tbody_tr:hover]:bg-bubble-cream`}
        >
          <thead>
            <tr>
              <th>Pedido</th>
              <th>Cliente</th>
              <th>Itens</th>
              <th>Total</th>
              <th>Rastreio</th>
              <th>Estágio</th>
              <th>Troca/devolução</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="p-[26px] text-center text-bubble-ink/50"
                >
                  {orders.length
                    ? "Nenhum envio corresponde aos filtros selecionados."
                    : "Nenhum pedido ainda."}
                </td>
              </tr>
            ) : null}
            {paginatedOrders.map((order) => (
                <tr key={order.id} onClick={() => setSelectedId(order.id)}>
                  <td className="whitespace-nowrap">
                    <strong>#{order.number}</strong>
                    <br />
                    <span className="text-[.68rem] text-bubble-ink/50">
                      {dateTime.format(order.date)}
                    </span>
                  </td>
                  <td>
                    <div className="font-semibold">
                      {order.delivery?.name || "Cliente não informado"}
                    </div>
                    <div className="text-[.68rem] text-bubble-ink/50">
                      {order.delivery?.email || order.customerId || "Anônimo"}
                    </div>
                  </td>
                  <td>
                    {order.items.reduce((sum, item) => sum + item.qty, 0)}{" "}
                    peça(s)
                  </td>
                  <td className="whitespace-nowrap font-semibold">
                    {money.format(order.total)}
                  </td>
                  <td className="max-w-[180px] truncate">
                    {order.tracking || "Não informado"}
                  </td>
                  <td>
                    <StageBadge order={order} />
                  </td>
                  <td>
                    <ReturnBadge requests={returnsByOrder.get(order.id)} />
                  </td>
                  <td className="whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <button
                        className="inline-flex items-center gap-1 font-sans text-[.62rem] font-bold uppercase tracking-[.08em]"
                        onClick={(event) => {
                          event.stopPropagation();
                          setSelectedId(order.id);
                        }}
                      >
                        Abrir <ChevronRight size={14} />
                      </button>
                      <DeleteOrderButton
                        order={order}
                        onSaved={handleSaved}
                        notify={notify}
                        compact
                      />
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
      <div className="mt-3">
        <PaginationControls
          page={page}
          pageSize={pageSize}
          onPageSizeChange={setPageSize}
          onPageChange={setPage}
          totalPages={totalPages}
          pageStart={pageStart}
          count={filteredOrders.length}
          ariaLabel="Paginação dos pedidos"
        />
      </div>
      <p className={adminNote}>
        Linha do tempo: Confirmado {">"} Pagamento {">"} Separação {">"} Enviado{" "}
        {">"} Em trânsito {">"} Entregue.
      </p>
    </>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="sr-only">{label}</span>
      <select
        aria-label={label}
        className="h-11 w-full border border-bubble-line bg-bubble-cream px-3 text-sm outline-none focus:border-bubble-ink"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {children}
      </select>
    </label>
  );
}

function normalizeSearch(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .trim();
}

function ShipmentDetail({
  order,
  returns,
  onBack,
  onSaved,
  notify,
}: {
  order: Order;
  returns: ReturnRequest[];
  onBack: () => void;
  onSaved: OnSaved;
  notify: Notify;
}) {
  const [invoiceKey, setInvoiceKey] = useState("");
  const [shipments, setShipments] = useState<OrderShipment[]>([]);
  const [labelBusy, setLabelBusy] = useState(false);
  const [canceling, setCanceling] = useState(false);
  const [returnBusy, setReturnBusy] = useState("");
  const [stageBusy, setStageBusy] = useState(false);
  const actionDialog = useActionDialog();
  const canceled = order.status === "canceled";

  async function updateReturn(
    request: ReturnRequest,
    body: Record<string, unknown>,
  ) {
    setReturnBusy(request.id);
    try {
      await apiFetch(`/returns/${request.id}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      });
      await onSaved();
    } catch (error) {
      notify(
        error instanceof Error ? error.message : "Não foi possível atualizar.",
      );
    } finally {
      setReturnBusy("");
    }
  }

  async function issueReverseShipment(request: ReturnRequest) {
    const confirmed = await actionDialog.confirm({
      title: "Emitir postagem reversa",
      description:
        "A postagem será comprada pelos Correios e o valor será debitado da Melhor Carteira. Depois da emissão, o código e o PDF serão enviados ao cliente.",
      confirmLabel: "Comprar e emitir",
    });
    if (!confirmed) return;
    setReturnBusy(request.id);
    try {
      const updated = await apiFetch<ReturnRequest>(
        `/returns/${request.id}/reverse-shipment`,
        { method: "POST" },
      );
      await onSaved();
      notify(
        updated.reverseStatus === "sandbox_simulated"
          ? "Postagem simulada. O código de Sandbox não é válido nos Correios; o e-mail de teste foi disparado."
          : "Postagem emitida e enviada por e-mail ao cliente.",
      );
    } catch (error) {
      notify(
        error instanceof Error
          ? error.message
          : "Não foi possível emitir a postagem reversa.",
      );
      await onSaved();
    } finally {
      setReturnBusy("");
    }
  }

  async function resolveReturn(
    request: ReturnRequest,
    resolution: "credit" | "refund",
  ) {
    const estimated = request.items.reduce(
      (sum, item) => sum + item.unitRefundValue * item.quantity,
      0,
    );
    const credit = resolution === "credit";
    const input = await actionDialog.prompt({
      title: credit ? "Liberar saldo" : "Solicitar estorno",
      description: credit
        ? "Confirme o valor que será adicionado diretamente ao saldo da conta do cliente."
        : "Confirme o valor que será enviado ao fluxo de estorno do Asaas.",
      inputLabel: "Valor aprovado",
      initialValue: estimated.toFixed(2).replace(".", ","),
      inputMode: "decimal",
      required: true,
      confirmLabel: credit ? "Liberar saldo" : "Solicitar estorno",
      tone: credit ? "default" : "danger",
    });
    if (!input) return;
    const amount = Number(input.replace(",", "."));
    if (!Number.isFinite(amount) || amount <= 0)
      return notify("Informe um valor válido.");
    setReturnBusy(request.id);
    try {
      await apiFetch(`/returns/${request.id}/resolve`, {
        method: "POST",
        body: JSON.stringify({ resolution, amount }),
      });
      await onSaved();
      notify(
        resolution === "credit"
          ? "Saldo Wear Bubble liberado na conta do cliente."
          : "Estorno solicitado ao Asaas.",
      );
    } catch (error) {
      notify(
        error instanceof Error ? error.message : "Não foi possível concluir.",
      );
    } finally {
      setReturnBusy("");
    }
  }

  async function rejectReturn(request: ReturnRequest) {
    const reason = await actionDialog.prompt({
      title: "Rejeitar solicitação",
      description: `Informe ao cliente por que a solicitação ${request.protocol} não foi aprovada.`,
      inputLabel: "Motivo da rejeição",
      placeholder: "Descreva o motivo",
      required: true,
      confirmLabel: "Rejeitar solicitação",
      tone: "danger",
    });
    if (!reason?.trim()) return;
    await updateReturn(request, {
      status: "rejected",
      publicNote: reason.trim(),
    });
  }

  useEffect(() => {
    void loadShipments();
  }, [order.id]);

  async function cancelOrder() {
    const confirmed = await actionDialog.confirm({
      title: `Cancelar pedido #${order.number}`,
      description: `O pedido será cancelado e ${money.format(order.total)} será enviado ao fluxo de estorno do Asaas. Esta ação não pode ser desfeita.`,
      confirmLabel: "Cancelar e estornar",
      tone: "danger",
    });
    if (!confirmed) return;

    setCanceling(true);
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
      setCanceling(false);
    }
  }

  async function loadShipments() {
    try {
      setShipments(
        await apiFetch<OrderShipment[]>(
          `/integrations/melhor-envio/orders/${order.id}/shipments`,
        ),
      );
    } catch {
      setShipments([]);
    }
  }

  async function generateLabel() {
    const normalizedInvoice = invoiceKey.replace(/\D/g, "");
    if (normalizedInvoice && normalizedInvoice.length !== 44) {
      notify("A chave da NF-e deve conter 44 dígitos.");
      return;
    }
    setLabelBusy(true);
    try {
      const rows = await apiFetch<OrderShipment[]>(
        `/integrations/melhor-envio/orders/${order.id}/shipments`,
        {
          method: "POST",
          body: JSON.stringify({
            ...(normalizedInvoice ? { invoiceKey: normalizedInvoice } : {}),
          }),
        },
      );
      setShipments(rows);
      await onSaved();
      notify(
        rows.some((row) => row.printUrl)
          ? "Etiqueta dos Correios gerada."
          : "Etiqueta enviada para processamento no Melhor Envio.",
      );
    } catch (error) {
      notify(
        error instanceof Error
          ? error.message
          : "Não foi possível gerar a etiqueta.",
      );
    } finally {
      setLabelBusy(false);
    }
  }

  async function updateShipStage(nextStage: number) {
    if (nextStage === order.shipStage) return;
    const confirmed = await actionDialog.confirm({
      title: "Atualizar etapa manualmente",
      description:
        "Use somente quando a integração não avançou o pedido automaticamente (ex.: falha de webhook, envio feito fora do fluxo padrão). O cliente pode receber um e-mail de atualização de envio.",
      confirmLabel: "Atualizar etapa",
      tone: "danger",
    });
    if (!confirmed) return;
    setStageBusy(true);
    try {
      await apiFetch(`/orders/${order.id}/ship-stage`, {
        method: "PATCH",
        body: JSON.stringify({ shipStage: nextStage }),
      });
      await onSaved();
      notify("Etapa do pedido atualizada manualmente.");
    } catch (error) {
      notify(
        error instanceof Error
          ? error.message
          : "Não foi possível atualizar a etapa.",
      );
    } finally {
      setStageBusy(false);
    }
  }

  async function copyTracking() {
    if (!order.tracking) return;
    await navigator.clipboard.writeText(order.tracking);
    notify("Código de rastreio copiado.");
  }

  const productsTotal = order.items.reduce(
    (sum, item) => sum + item.price * item.qty,
    0,
  );

  return (
    <section className="space-y-5">
      {actionDialog.dialog}
      <button
        className="inline-flex items-center gap-2 border border-bubble-ink bg-bubble-white px-4 py-3 font-sans text-[.64rem] font-bold uppercase tracking-[.1em] hover:bg-bubble-ink hover:text-white"
        onClick={onBack}
      >
        <ArrowLeft size={16} /> Voltar aos pedidos
      </button>

      <header className="flex flex-col gap-4 border border-bubble-line bg-bubble-white p-5 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <h2 className="text-2xl">Pedido #{order.number}</h2>
            <OrderStatus status={order.status} />
          </div>
          <p className="text-sm text-bubble-ink/50">
            Realizado em {dateTime.format(order.date)} ·{" "}
            {order.items.reduce((sum, item) => sum + item.qty, 0)} peça(s)
          </p>
        </div>
        <div className="space-y-3 md:text-right">
          <div className="font-sans text-[.58rem] font-bold uppercase tracking-[.12em] text-bubble-ink/45">
            Total do pedido
          </div>
          <strong className="text-2xl">{money.format(order.total)}</strong>
          {order.status === "paid" &&
          order.gateway === "asaas" &&
          order.asaasPaymentId ? (
            <button
              type="button"
              disabled={canceling}
              onClick={() => void cancelOrder()}
              className="block w-full border border-red-700 px-3 py-2 font-sans text-[.58rem] font-bold uppercase tracking-[.1em] text-red-700 transition-colors hover:bg-red-700 hover:text-white disabled:cursor-wait disabled:opacity-50 md:w-auto"
            >
              {canceling ? "Cancelando..." : "Cancelar e estornar"}
            </button>
          ) : null}
          <DeleteOrderButton order={order} onSaved={onSaved} notify={notify} />
        </div>
      </header>

      <ShippingTimeline stage={order.shipStage} canceled={canceled} />

      {canceled ? (
        <div className="border border-red-300 bg-red-50 p-4 text-sm text-red-800">
          <b>Pedido cancelado.</b> As ações de envio estão bloqueadas.
        </div>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(360px,.75fr)]">
        <div className="space-y-5">
          <DetailCard title="Itens do pedido">
            <div className="divide-y divide-bubble-line border-y border-bubble-line">
              {order.items.map((item, index) => (
                <div
                  className="grid grid-cols-[minmax(0,1fr)_auto] gap-4 py-4"
                  key={`${item.pid}-${item.color}-${item.size}-${index}`}
                >
                  <div>
                    <div className="font-semibold">
                      {item.qty}x {item.name}
                    </div>
                    <div className="mt-1 text-xs text-bubble-ink/50">
                      {item.color ? `Cor: ${item.color} · ` : ""}Tamanho:{" "}
                      {item.size} · Código do produto: {item.pid}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">
                      {money.format(item.price * item.qty)}
                    </div>
                    {item.qty > 1 ? (
                      <div className="text-xs text-bubble-ink/45">
                        {money.format(item.price)} cada
                      </div>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
            <div className="ml-auto mt-4 max-w-[300px] space-y-2 text-sm">
              <SummaryLine
                label="Produtos"
                value={money.format(productsTotal)}
              />
              <SummaryLine
                label="Frete"
                value={
                  order.shipping?.price
                    ? money.format(order.shipping.price)
                    : "Grátis"
                }
              />
              {order.coupon ? (
                <SummaryLine
                  label={`Cupom ${order.coupon}`}
                  value={
                    order.couponPct
                      ? `${order.couponPct}% aplicado`
                      : "Aplicado"
                  }
                />
              ) : null}
              <SummaryLine
                label="Total"
                value={money.format(order.total)}
                strong
              />
            </div>
          </DetailCard>

          <DetailCard title="Cliente e endereço de entrega">
            <dl className="grid gap-4 text-sm sm:grid-cols-2">
              <Info label="Nome" value={order.delivery?.name} />
              <Info label="CPF" value={formatDocument(order.delivery?.taxId)} />
              <Info label="E-mail" value={order.delivery?.email} />
              <Info label="Telefone" value={order.delivery?.phone} />
            </dl>
            <div className="mt-5 border-t border-bubble-line pt-4 text-sm leading-6">
              <div className="font-sans text-[.58rem] font-bold uppercase tracking-[.12em] text-bubble-ink/45">
                Destino
              </div>
              <p className="mt-2">{formatAddress(order)}</p>
              <OrderAddressEditor
                order={order}
                onSaved={onSaved}
                notify={notify}
              />
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {order.delivery?.email ? (
                <a
                  className="inline-flex items-center gap-2 border border-bubble-line px-3 py-2 text-xs hover:border-bubble-ink"
                  href={`mailto:${order.delivery.email}`}
                >
                  <Mail size={14} /> Enviar e-mail
                </a>
              ) : null}
              {order.delivery?.phone ? (
                <a
                  className="inline-flex items-center gap-2 border border-bubble-line px-3 py-2 text-xs hover:border-bubble-ink"
                  href={`https://wa.me/${whatsappNumber(order.delivery.phone)}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <Phone size={14} /> WhatsApp
                </a>
              ) : null}
            </div>
          </DetailCard>

          {returns.map((request) => {
            const deadline = getReturnDeadline(request, order.deliveredAt);
            const busy = returnBusy === request.id;
            return (
              <DetailCard
                key={request.id}
                title={`Troca/devolução · ${request.protocol}`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm">
                    {returnKindLabels[request.kind]} ·{" "}
                    {returnReasonLabels[request.reason] || request.reason}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span
                      className={`border px-3 py-1.5 text-xs font-semibold uppercase ${deadline.className}`}
                      title={deadline.title}
                    >
                      {deadline.label}
                    </span>
                    <span className="border border-bubble-line px-3 py-1.5 text-xs font-semibold uppercase">
                      {request.events.at(-1)?.label ||
                        returnStatusLabels[request.status]}
                    </span>
                  </div>
                </div>

                <div className="mt-4">
                  <h4 className="text-sm font-semibold">Relato do cliente</h4>
                  <p className="mt-2 min-h-10 text-sm text-bubble-ink/65">
                    {request.details || "Nenhum detalhe adicional."}
                  </p>
                  <div className="mt-3 space-y-2">
                    {request.items.map((item) => {
                      const original = order.items.find(
                        (line) => line.id === item.orderItemId,
                      );
                      return (
                        <div
                          className="border border-bubble-line bg-bubble-cream p-3 text-sm"
                          key={item.id}
                        >
                          <strong>
                            {item.quantity}x{" "}
                            {original?.name || `Item ${item.orderItemId}`}
                          </strong>
                          {original ? (
                            <span>
                              {" "}
                              · {original.color} · {original.size}
                            </span>
                          ) : null}
                          <div className="mt-2 flex flex-wrap gap-2">
                            {(["resellable", "damaged"] as const).map(
                              (condition) => (
                                <button
                                  type="button"
                                  key={condition}
                                  disabled={
                                    !["received", "inspecting"].includes(
                                      request.status,
                                    )
                                  }
                                  onClick={() =>
                                    void updateReturn(request, {
                                      itemId: item.id,
                                      condition,
                                    })
                                  }
                                  className={`border px-2 py-1 text-[.62rem] uppercase disabled:opacity-35 ${item.condition === condition ? "border-bubble-ink bg-bubble-ink text-white" : "border-bubble-line"}`}
                                >
                                  {condition === "resellable"
                                    ? "Revendável"
                                    : "Avariado"}
                                </button>
                              ),
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-5 border-t border-bubble-line pt-4">
                  {request.publicNote ? (
                    <p className="text-sm text-bubble-ink/65">
                      {request.publicNote}
                    </p>
                  ) : null}
                  {request.postingCode ? (
                    <p className="mt-3 text-sm">
                      <strong>Postagem:</strong> {request.postingCode}
                    </p>
                  ) : null}
                  {request.returnTracking ? (
                    <p className="mt-1 text-sm">
                      <strong>Rastreio:</strong> {request.returnTracking}
                    </p>
                  ) : null}
                  {request.reverseStatus === "sandbox_simulated" ? (
                    <p className="mt-3 border border-bubble-danger/40 bg-bubble-danger/[.06] p-3 text-xs text-bubble-danger">
                      Teste Sandbox: este código é simulado e não funciona nos
                      Correios.
                    </p>
                  ) : null}
                  {request.reversePrintUrl ? (
                    <a
                      className="mt-3 inline-flex text-sm font-semibold underline"
                      href={request.reversePrintUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Abrir documento de postagem
                    </a>
                  ) : null}
                  {request.reverseLastError ? (
                    <p className="mt-3 border border-bubble-danger/30 bg-bubble-danger/[.06] p-3 text-xs text-bubble-danger">
                      <strong>Falha na emissão:</strong>{" "}
                      {request.reverseLastError}
                    </p>
                  ) : null}
                  <div className="mt-4 flex flex-wrap gap-2 [&_button]:border [&_button]:border-bubble-ink [&_button]:px-3 [&_button]:py-2 [&_button]:text-[.62rem] [&_button]:font-semibold [&_button]:uppercase disabled:[&_button]:opacity-40">
                    {request.status === "requested" ? (
                      <button
                        disabled={busy}
                        onClick={() =>
                          void updateReturn(request, {
                            status: "approved",
                            publicNote:
                              "Solicitação aprovada. Prepararemos o código de postagem.",
                          })
                        }
                      >
                        Aprovar
                      </button>
                    ) : null}
                    {["requested", "approved"].includes(request.status) ? (
                      <button
                        disabled={busy}
                        className="text-bubble-danger"
                        onClick={() => void rejectReturn(request)}
                      >
                        Rejeitar
                      </button>
                    ) : null}
                    {request.status === "approved" ? (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => void issueReverseShipment(request)}
                      >
                        {request.reverseProviderOrderId
                          ? "Tentar emitir novamente"
                          : "Emitir postagem reversa"}
                      </button>
                    ) : null}
                    {request.status === "awaiting_posting" &&
                    request.reverseStatus === "sandbox_simulated" ? (
                      <button
                        type="button"
                        onClick={() =>
                          void updateReturn(request, {
                            status: "returning",
                            publicNote:
                              "Postagem simulada no Sandbox. O produto está retornando.",
                          })
                        }
                      >
                        Simular postagem
                      </button>
                    ) : null}
                    {request.status === "awaiting_posting" &&
                    request.reverseStatus !== "sandbox_simulated" ? (
                      <p className="basis-full text-xs leading-5 text-bubble-ink/55">
                        Aguardando o Melhor Envio confirmar automaticamente a
                        postagem pelos Correios.
                      </p>
                    ) : null}
                    {request.status === "returning" ? (
                      <button
                        onClick={() =>
                          void updateReturn(request, {
                            status: "received",
                            publicNote:
                              "Recebemos o pacote e iniciaremos a inspeção.",
                          })
                        }
                      >
                        Registrar recebimento
                      </button>
                    ) : null}
                    {request.status === "received" ? (
                      <button
                        onClick={() =>
                          void updateReturn(request, {
                            status: "inspecting",
                            publicNote: "As peças estão em inspeção.",
                          })
                        }
                      >
                        Iniciar inspeção
                      </button>
                    ) : null}
                    {request.status === "inspecting" ? (
                      <>
                        <button
                          onClick={() => void resolveReturn(request, "credit")}
                        >
                          Liberar saldo
                        </button>
                        {request.kind !== "exchange" ? (
                          <button
                            onClick={() =>
                              void resolveReturn(request, "refund")
                            }
                          >
                            Estornar Asaas
                          </button>
                        ) : null}
                      </>
                    ) : null}
                  </div>
                </div>
              </DetailCard>
            );
          })}
        </div>

        <div className="space-y-5">
          <DetailCard title="Etiqueta PAC/SEDEX">
            <div className="space-y-3 text-sm">
              <Info
                label="Serviço selecionado"
                value={
                  order.shipping
                    ? `${order.shipping.name} · ${order.shipping.company}`
                    : "Não informado"
                }
              />
              <Info
                label="Custo estimado da loja"
                value={money.format(order.shipping?.carrierPrice || 0)}
              />
            </div>
            {!shipments.length ? (
              <>
                <label className="mt-4 block font-sans text-[.6rem] font-bold uppercase tracking-[.1em] text-bubble-ink/55">
                  Chave da NF-e
                  <input
                    className="mt-2 w-full border border-bubble-line bg-bubble-cream px-3 py-3 font-serif text-sm normal-case tracking-normal"
                    value={invoiceKey}
                    maxLength={54}
                    onChange={(event) => setInvoiceKey(event.target.value)}
                    placeholder="44 dígitos; opcional somente no sandbox"
                  />
                </label>
                <button
                  className={`${saveButton} mt-4 w-full py-3 disabled:cursor-not-allowed disabled:opacity-45`}
                  disabled={canceled || order.status !== "paid" || labelBusy}
                  onClick={() => void generateLabel()}
                >
                  {labelBusy ? "Processando..." : "Gerar etiqueta dos Correios"}
                </button>
              </>
            ) : (
              <div className="mt-4 space-y-3">
                {shipments.map((shipment) => (
                  <div
                    className="border border-bubble-line bg-bubble-cream p-3"
                    key={shipment.id}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <strong>{shipment.serviceName}</strong>
                        <div className="mt-1 text-xs text-bubble-ink/55">
                          Volume {shipment.packageIndex + 1} · {shipment.status}
                        </div>
                      </div>
                      <span className="font-semibold">
                        {money.format(shipment.carrierPrice)}
                      </span>
                    </div>
                    {shipment.tracking ? (
                      <div className="mt-2 text-xs">
                        Rastreio: {shipment.tracking}
                      </div>
                    ) : null}
                    {shipment.lastError ? (
                      <div className="mt-2 text-xs text-bubble-danger">
                        {shipment.lastError}
                      </div>
                    ) : null}
                    <div className="mt-3 flex flex-wrap gap-2">
                      {shipment.printUrl ? (
                        <a
                          className="border border-bubble-ink px-3 py-2 text-xs font-bold uppercase"
                          href={shipment.printUrl}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Imprimir etiqueta
                        </a>
                      ) : null}
                      {shipment.trackingUrl ? (
                        <a
                          className="border border-bubble-line px-3 py-2 text-xs font-bold uppercase"
                          href={shipment.trackingUrl}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Acompanhar
                        </a>
                      ) : null}
                      {!shipment.printUrl ? (
                        <button
                          className="border border-bubble-line px-3 py-2 text-xs font-bold uppercase disabled:opacity-45"
                          disabled={labelBusy}
                          onClick={() => void generateLabel()}
                        >
                          Tentar novamente
                        </button>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            )}
            <p className={adminNote}>
              A compra da etiqueta debita o saldo da Melhor Carteira. Em
              produção, informe a NF-e antes de gerar.
            </p>
          </DetailCard>

          <DetailCard title="Atualização automática">
            <dl className="space-y-3 text-sm">
              <Info
                label="Etapa atual"
                value={shippingStages[order.shipStage] || "Não informado"}
              />
              <div>
                <dt className="font-sans text-[.58rem] font-bold uppercase tracking-[.1em] text-bubble-ink/45">
                  Código de rastreio
                </dt>
                <dd className="mt-1 flex items-center gap-2 break-all">
                  <span>{order.tracking || "Aguardando os Correios"}</span>
                  {order.tracking ? (
                    <button
                      className="border border-bubble-line p-2"
                      onClick={() => void copyTracking()}
                      title="Copiar rastreio"
                    >
                      <Copy size={16} />
                    </button>
                  ) : null}
                </dd>
              </div>
            </dl>
            <p className={adminNote}>
              Pagamento, geração da etiqueta, postagem, rastreio e entrega são
              atualizados normalmente pelas integrações.
            </p>
            <label className="mt-4 block font-sans text-[.6rem] font-bold uppercase tracking-[.1em] text-bubble-ink/55">
              Ajuste manual da etapa
              <select
                className="mt-2 h-11 w-full border border-bubble-line bg-bubble-cream px-3 text-sm normal-case tracking-normal outline-none focus:border-bubble-ink disabled:cursor-not-allowed disabled:opacity-45"
                value={order.shipStage}
                disabled={canceled || order.status !== "paid" || stageBusy}
                onChange={(event) => void updateShipStage(Number(event.target.value))}
              >
                {shippingStages.map((stage, index) => (
                  <option value={index} key={stage}>
                    {stage}
                  </option>
                ))}
              </select>
            </label>
            <p className={adminNote}>
              Use apenas se um webhook falhou ou o envio foi feito fora da
              Melhor Envio — esta ação fica registrada e pode notificar o
              cliente por e-mail.
            </p>
          </DetailCard>

          <DetailCard title="Pagamento e entrega">
            <dl className="space-y-3 text-sm">
              <Info label="Pagamento" value={order.method} />
              <Info label="Status" value={statusLabel(order.status)} />
              <Info label="Gateway" value={order.gateway || "Não informado"} />
              <Info
                label="ID da cobrança"
                value={order.asaasPaymentId || "Não informado"}
              />
              <Info
                label="Pago em"
                value={
                  order.paidAt
                    ? dateTime.format(order.paidAt)
                    : "Não confirmado"
                }
              />
              <Info
                label="Transportadora"
                value={
                  order.shipping
                    ? `${order.shipping.company} · ${order.shipping.name}`
                    : "Não informada"
                }
              />
              <Info
                label="Prazo estimado"
                value={
                  order.shipping?.deliveryTime
                    ? `${order.shipping.deliveryTime} dias úteis`
                    : "Não informado"
                }
              />
            </dl>
          </DetailCard>
        </div>
      </div>
    </section>
  );
}

function ShippingTimeline({
  stage,
  canceled,
}: {
  stage: number;
  canceled: boolean;
}) {
  return (
    <div className="grid grid-cols-2 border border-bubble-line bg-bubble-white sm:grid-cols-3 xl:grid-cols-6">
      {shippingStages.map((label, index) => (
        <div
          className={`border-b border-r border-bubble-line p-3 last:border-r-0 xl:border-b-0 ${!canceled && index <= stage ? "bg-bubble-ink text-bubble-white" : "text-bubble-ink/40"}`}
          key={label}
        >
          <div className="font-display text-xl">
            {String(index).padStart(2, "0")}
          </div>
          <div className="mt-1 font-sans text-[.58rem] font-bold uppercase tracking-[.08em]">
            {label}
          </div>
        </div>
      ))}
    </div>
  );
}

function StageBadge({ order }: { order: Order }) {
  if (order.status === "canceled")
    return (
      <span className="bg-red-100 px-2 py-1 font-sans text-[.58rem] font-bold uppercase text-red-700">
        Cancelado
      </span>
    );
  return (
    <span className="bg-bubble-candy/20 px-2 py-1 font-sans text-[.58rem] font-bold uppercase text-bubble-brown">
      {shippingStages[order.shipStage] || "Não informado"}
    </span>
  );
}

function ReturnBadge({ requests }: { requests?: ReturnRequest[] }) {
  if (!requests || !requests.length) {
    return <span className="text-[.68rem] text-bubble-ink/35">—</span>;
  }
  const latest = [...requests].sort(
    (first, second) => second.requestedAt - first.requestedAt,
  )[0];
  const tone =
    latest.status === "rejected" || latest.status === "canceled"
      ? "bg-bubble-ink/[.08] text-bubble-ink/55"
      : latest.status === "completed"
        ? "bg-green-100 text-green-800"
        : "bg-amber-100 text-amber-800";
  return (
    <span
      className={`inline-block whitespace-nowrap px-2 py-1 font-sans text-[.58rem] font-bold uppercase ${tone}`}
    >
      {returnKindLabels[latest.kind]} · {returnStatusLabels[latest.status]}
    </span>
  );
}

function OrderStatus({ status }: { status: Order["status"] }) {
  const classes =
    status === "paid"
      ? "border-green-300 bg-green-50 text-green-800"
      : status === "canceled"
        ? "border-red-300 bg-red-50 text-red-800"
        : "border-amber-300 bg-amber-50 text-amber-800";
  return (
    <span
      className={`border px-2 py-1 font-sans text-[.58rem] font-bold uppercase tracking-[.08em] ${classes}`}
    >
      {statusLabel(status)}
    </span>
  );
}

function DetailCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <article className="border border-bubble-line bg-bubble-white p-5">
      <h3 className="mb-4 font-sans text-[.68rem] font-bold uppercase tracking-[.14em] text-bubble-ink/65">
        {title}
      </h3>
      {children}
    </article>
  );
}

function Info({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <dt className="font-sans text-[.56rem] font-bold uppercase tracking-[.1em] text-bubble-ink/40">
        {label}
      </dt>
      <dd className="mt-1 break-words">{value || "Não informado"}</dd>
    </div>
  );
}

function SummaryLine({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between gap-4 ${strong ? "border-t border-bubble-ink pt-2 text-base font-bold" : ""}`}
    >
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}

function statusLabel(status: Order["status"]) {
  return status === "paid"
    ? "Pagamento confirmado"
    : status === "canceled"
      ? "Cancelado"
      : "Aguardando pagamento";
}

function formatDocument(value?: string) {
  const digits = value?.replace(/\D/g, "") || "";
  return digits.length === 11
    ? digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")
    : value || "Não informado";
}

function whatsappNumber(value: string) {
  const digits = value.replace(/\D/g, "");
  return digits.startsWith("55") ? digits : `55${digits}`;
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
    .join(" · ");
  return [main, location, extra].filter(Boolean).join(" | ");
}
