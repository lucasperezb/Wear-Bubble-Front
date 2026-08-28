"use client";

import { useEffect, useState } from "react";
import {
  DollarSign,
  MousePointerClick,
  ReceiptText,
  TrendingUp,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { apiFetch, money, type Order, type Product } from "../../../lib/api";
import { adminNote } from "../shared/styles";
import type { AdminCustomers, AdminEvent } from "../shared/types";
import { dayKey, lastNDays } from "../shared/utils";

const chartTooltipStyle = {
  background: "#FFFCF4",
  border: "1px solid #CFC6B3",
  borderRadius: 0,
  boxShadow: "0 12px 30px rgba(23,19,14,.12)",
  fontSize: 12,
};

export function Dashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customerCount, setCustomerCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      apiFetch<Order[]>("/orders"),
      apiFetch<AdminEvent[]>("/events"),
      apiFetch<Product[]>("/products/admin"),
      apiFetch<AdminCustomers>("/admin/customers"),
    ])
      .then(([ordersRes, eventsRes, productsRes, customersRes]) => {
        if (cancelled) return;
        setOrders(ordersRes);
        setEvents(eventsRes);
        setProducts(productsRes);
        setCustomerCount(
          customersRes.users.filter((user) => user.role !== "manager").length,
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const paidOrders = orders.filter((order) => order.status === "paid");
  const revenue = paidOrders.reduce(
    (sum, order) => sum + (Number(order.total) || 0),
    0,
  );
  const ticket = paidOrders.length ? revenue / paidOrders.length : 0;
  const clicks = events.filter((event) =>
    ["click", "add", "view"].includes(String(event.type)),
  ).length;
  const buys = paidOrders.length;
  const conversion = clicks ? (buys / clicks) * 100 : 0;
  const customers = customerCount;

  const chartData = lastNDays(14).map((day) => ({
    day: formatDay(day),
    vendas: paidOrders
      .filter((order) => dayKey(order.date) === day)
      .reduce((sum, order) => sum + Number(order.total || 0), 0),
    interacoes: events.filter(
      (event) => event.type !== "buy" && dayKey(Number(event.ts || 0)) === day,
    ).length,
  }));

  const productData = products
    .map((product) => ({
      name: product.name,
      shortName:
        product.name.length > 22
          ? `${product.name.slice(0, 21)}…`
          : product.name,
      receita: paidOrders.reduce(
        (sum, order) =>
          sum +
          order.items
            .filter((item) => item.pid === product.id)
            .reduce(
              (lineSum, item) =>
                lineSum + Number(item.price || 0) * Number(item.qty || 0),
              0,
            ),
        0,
      ),
      interacoes: events.filter(
        (event) => event.pid === product.id && event.type !== "buy",
      ).length,
    }))
    .sort((a, b) => b.receita - a.receita)
    .slice(0, 5);

  if (loading) return <p className={adminNote}>Carregando dashboard...</p>;

  return (
    <>
      <section className="mb-5 grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 xl:grid-cols-5">
        <Kpi
          icon={DollarSign}
          label="Receita total"
          value={money.format(revenue)}
          sub={`${paidOrders.length} pagamentos confirmados`}
        />
        <Kpi
          icon={ReceiptText}
          label="Ticket médio"
          value={money.format(ticket)}
          sub="por pedido pago"
        />
        <Kpi
          icon={MousePointerClick}
          label="Interações"
          value={String(clicks)}
          sub="cliques e visitas"
        />
        <Kpi
          icon={TrendingUp}
          label="Conversão"
          value={`${conversion.toFixed(1)}%`}
          sub="compras / interações"
        />
        <Kpi
          icon={UserRound}
          label="Clientes"
          value={String(customers)}
          sub="contas ativas"
        />
      </section>

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.65fr)_minmax(360px,1fr)]">
        <ChartCard
          title="Desempenho dos últimos 14 dias"
          description="Receita diária e volume de interações na loja."
        >
          <div className="h-[310px] w-full sm:h-[360px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={chartData}
                margin={{ top: 16, right: 8, left: -12, bottom: 0 }}
              >
                <defs>
                  <linearGradient
                    id="salesGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="0%" stopColor="#17130E" stopOpacity={0.22} />
                    <stop
                      offset="100%"
                      stopColor="#17130E"
                      stopOpacity={0.01}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  stroke="#E8E0CF"
                  strokeDasharray="3 3"
                  vertical={false}
                />
                <XAxis
                  dataKey="day"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#746C60", fontSize: 10 }}
                  minTickGap={16}
                />
                <YAxis
                  yAxisId="sales"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#746C60", fontSize: 10 }}
                  width={52}
                  tickFormatter={(value) =>
                    Number(value) >= 1000
                      ? `${Math.round(Number(value) / 1000)}k`
                      : String(value)
                  }
                />
                <YAxis yAxisId="events" orientation="right" hide />
                <Tooltip
                  contentStyle={chartTooltipStyle}
                  cursor={{ fill: "rgba(217,207,180,.18)" }}
                />
                <Bar
                  yAxisId="events"
                  dataKey="interações"
                  name="Interações"
                  fill="#D9CFB4"
                  maxBarSize={22}
                  radius={[3, 3, 0, 0]}
                />
                <Area
                  yAxisId="sales"
                  type="monotone"
                  dataKey="vendas"
                  name="Vendas (R$)"
                  stroke="#17130E"
                  strokeWidth={2.5}
                  fill="url(#salesGradient)"
                  activeDot={{ r: 4, fill: "#C53955", strokeWidth: 0 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 flex flex-wrap gap-5 text-[.68rem] text-bubble-ink/55">
            <Legend color="bg-bubble-ink" label="Vendas (R$)" />
            <Legend color="bg-bubble-candy" label="Interações" />
          </div>
        </ChartCard>

        <ChartCard
          title="Produtos com maior receita"
          description="Participação dos cinco produtos mais vendidos."
        >
          {productData.length ? (
            <>
              <div className="h-[260px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={productData}
                    layout="vertical"
                    margin={{ top: 5, right: 8, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid
                      stroke="#E8E0CF"
                      strokeDasharray="3 3"
                      horizontal={false}
                    />
                    <XAxis type="number" hide />
                    <YAxis
                      type="category"
                      dataKey="shortName"
                      width={128}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#514A41", fontSize: 10 }}
                    />
                    <Tooltip
                      contentStyle={chartTooltipStyle}
                      cursor={{ fill: "rgba(217,207,180,.18)" }}
                    />
                    <Bar
                      dataKey="receita"
                      name="Receita (R$)"
                      fill="#17130E"
                      radius={[0, 4, 4, 0]}
                      maxBarSize={18}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-5 border-t border-bubble-line pt-4">
                <h4 className="mb-3 font-sans text-[.63rem] font-bold uppercase tracking-[.14em] text-bubble-ink/45">
                  Resumo por produto
                </h4>
                <div className="space-y-2.5">
                  {productData.map((item, index) => (
                    <div
                      key={item.name}
                      className="grid grid-cols-[24px_minmax(0,1fr)_auto] items-center gap-2 text-[.7rem]"
                    >
                      <span className="font-display text-bubble-candy">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <span className="truncate">{item.name}</span>
                      <span className="whitespace-nowrap font-semibold tabular-nums">
                        {money.format(item.receita)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <EmptyChart />
          )}
        </ChartCard>
      </section>

      <p className={adminNote}>
        <b>Privacidade:</b> os eventos do painel usam dados anonimizados; dados
        pessoais ficam separados para entrega e atendimento.
      </p>
    </>
  );
}

function Kpi({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <article className="min-w-0 border border-bubble-line bg-bubble-white p-4 sm:p-5">
      <div className="mb-5 flex items-center justify-between gap-3">
        <span className="font-sans text-[.6rem] font-bold uppercase tracking-[.15em] text-bubble-ink/45">
          {label}
        </span>
        <span className="flex size-8 shrink-0 items-center justify-center bg-bubble-cream2 text-bubble-ink/55">
          <Icon size={16} strokeWidth={1.8} />
        </span>
      </div>
      <div className="whitespace-nowrap font-display text-[clamp(1.45rem,2vw,2.05rem)] leading-none tracking-[-.02em] text-bubble-ink tabular-nums">
        {value}
      </div>
      <div className="mt-2 text-[.66rem] font-semibold text-bubble-success">
        {sub}
      </div>
    </article>
  );
}

function ChartCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <article className="min-w-0 border border-bubble-line bg-bubble-white p-4 sm:p-6">
      <div className="mb-3">
        <h3 className="font-sans text-[.7rem] font-bold uppercase tracking-[.14em] text-bubble-ink/70">
          {title}
        </h3>
        <p className="mt-1 text-[.7rem] leading-relaxed text-bubble-ink/45">
          {description}
        </p>
      </div>
      {children}
    </article>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`size-2.5 ${color}`} />
      {label}
    </span>
  );
}

function EmptyChart() {
  return (
    <div className="flex h-[300px] items-center justify-center border border-dashed border-bubble-line bg-bubble-cream/40 px-6 text-center text-[.76rem] text-bubble-ink/45">
      Os dados dos produtos aparecerão aqui após as primeiras vendas.
    </div>
  );
}

function formatDay(day: string) {
  const [, month, date] = day.split("-");
  return `${date}/${month}`;
}
