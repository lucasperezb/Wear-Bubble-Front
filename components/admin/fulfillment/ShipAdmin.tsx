"use client";

import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ChevronRight,
  Copy,
  Mail,
  PackageCheck,
  Phone,
} from "lucide-react";
import { Order, apiFetch, money } from "../../../lib/api";
import { shippingStages } from "../shared/constants";
import { adminNote, adminTable, saveButton } from "../shared/styles";
import type { Notify, OnSaved } from "../shared/types";
import { OrderAddressEditor } from "../shared/OrderAddressEditor";

const dateTime = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
});

export function ShipAdmin({
  orders,
  onSaved,
  notify,
}: {
  orders: Order[];
  onSaved: OnSaved;
  notify: Notify;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = orders.find((order) => order.id === selectedId);

  async function save(order: Order, shipStage: number, tracking: string) {
    try {
      await apiFetch(`/orders/${order.id}/ship`, {
        method: "PATCH",
        body: JSON.stringify({ shipStage, tracking: tracking.trim() }),
      });
      await onSaved();
      notify(
        `Envio do #${order.number} atualizado. O cliente receberá a nova etapa por e-mail.`,
      );
    } catch (error) {
      notify(
        error instanceof Error
          ? error.message
          : "Não foi possível atualizar envio.",
      );
      throw error;
    }
  }

  if (selected) {
    return (
      <ShipmentDetail
        order={selected}
        onBack={() => setSelectedId(null)}
        onSave={save}
        onSaved={onSaved}
        notify={notify}
      />
    );
  }

  return (
    <>
      <div className="mb-[18px] border border-bubble-candy bg-bubble-candy/15 px-[13px] py-[11px] text-[.68rem] leading-[1.6] text-bubble-ink">
        <b>Controle de entrega.</b> Clique em um pedido para consultar todas as
        informações e executar as ações de envio.
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
              <th></th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="p-[26px] text-center text-bubble-ink/50"
                >
                  Nenhum pedido ainda.
                </td>
              </tr>
            ) : null}
            {[...orders]
              .sort((first, second) => second.date - first.date)
              .map((order) => (
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
                    <button
                      className="inline-flex items-center gap-1 font-sans text-[.62rem] font-bold uppercase tracking-[.08em]"
                      onClick={(event) => {
                        event.stopPropagation();
                        setSelectedId(order.id);
                      }}
                    >
                      Abrir <ChevronRight size={14} />
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
      <p className={adminNote}>
        Linha do tempo: Confirmado {">"} Pagamento {">"} Separação {">"} Enviado{" "}
        {">"} Em trânsito {">"} Entregue.
      </p>
    </>
  );
}

function ShipmentDetail({
  order,
  onBack,
  onSave,
  onSaved,
  notify,
}: {
  order: Order;
  onBack: () => void;
  onSave: (order: Order, shipStage: number, tracking: string) => Promise<void>;
  onSaved: OnSaved;
  notify: Notify;
}) {
  const [shipStage, setShipStage] = useState(order.shipStage || 0);
  const [tracking, setTracking] = useState(order.tracking || "");
  const [saving, setSaving] = useState(false);
  const canceled = order.status === "canceled";

  useEffect(() => {
    setShipStage(order.shipStage || 0);
    setTracking(order.tracking || "");
  }, [order.shipStage, order.tracking]);

  async function submit(stage = shipStage) {
    if (canceled) return;
    setSaving(true);
    try {
      await onSave(order, stage, tracking);
      setShipStage(stage);
    } catch {
      // A mensagem de erro já é exibida pelo fluxo de salvamento.
    } finally {
      setSaving(false);
    }
  }

  async function copyTracking() {
    if (!tracking) return;
    await navigator.clipboard.writeText(tracking);
    notify("Código de rastreio copiado.");
  }

  const nextStage = Math.min(5, shipStage + 1);
  const productsTotal = order.items.reduce(
    (sum, item) => sum + item.price * item.qty,
    0,
  );

  return (
    <section className="space-y-5">
      <button
        className="inline-flex items-center gap-2 font-sans text-[.66rem] font-bold uppercase tracking-[.1em] text-bubble-ink/65 hover:text-bubble-ink"
        onClick={onBack}
      >
        <ArrowLeft size={16} /> Voltar aos envios
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
        <div className="md:text-right">
          <div className="font-sans text-[.58rem] font-bold uppercase tracking-[.12em] text-bubble-ink/45">
            Total do pedido
          </div>
          <strong className="text-2xl">{money.format(order.total)}</strong>
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
        </div>

        <div className="space-y-5">
          <DetailCard title="Ações do envio">
            <label className="block font-sans text-[.6rem] font-bold uppercase tracking-[.1em] text-bubble-ink/55">
              Etapa atual
              <select
                className="mt-2 w-full border border-bubble-line bg-bubble-cream px-3 py-3 font-serif text-sm normal-case tracking-normal"
                value={shipStage}
                disabled={canceled || saving}
                onChange={(event) => setShipStage(Number(event.target.value))}
              >
                {shippingStages.map((stage, index) => (
                  <option key={stage} value={index}>
                    {index} · {stage}
                  </option>
                ))}
              </select>
            </label>
            <label className="mt-4 block font-sans text-[.6rem] font-bold uppercase tracking-[.1em] text-bubble-ink/55">
              Código ou link de rastreio
              <div className="mt-2 flex">
                <input
                  className="min-w-0 flex-1 border border-bubble-line bg-bubble-cream px-3 py-3 font-serif text-sm normal-case tracking-normal"
                  value={tracking}
                  disabled={canceled || saving}
                  onChange={(event) => setTracking(event.target.value)}
                  placeholder="Informe quando o pedido for enviado"
                />
                <button
                  className="border border-l-0 border-bubble-line px-3 disabled:opacity-40"
                  disabled={!tracking}
                  onClick={() => void copyTracking()}
                  title="Copiar rastreio"
                >
                  <Copy size={16} />
                </button>
              </div>
            </label>
            <button
              className={`${saveButton} mt-5 w-full py-3 disabled:cursor-not-allowed disabled:opacity-45`}
              disabled={canceled || saving}
              onClick={() => void submit()}
            >
              {saving ? "Salvando..." : "Salvar alterações"}
            </button>
            {!canceled && shipStage < 5 ? (
              <button
                className="mt-2 inline-flex w-full items-center justify-center gap-2 border border-bubble-ink px-4 py-3 font-sans text-[.64rem] font-bold uppercase tracking-[.1em] transition-colors hover:bg-bubble-ink hover:text-bubble-white disabled:opacity-45"
                disabled={saving}
                onClick={() => void submit(nextStage)}
              >
                <PackageCheck size={16} /> Avançar para{" "}
                {shippingStages[nextStage]}
              </button>
            ) : null}
            <p className={adminNote}>
              Ao salvar uma nova etapa, o cliente recebe automaticamente o
              e-mail detalhado de acompanhamento.
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
