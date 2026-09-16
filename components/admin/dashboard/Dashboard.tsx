"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
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
  Cell,
  ComposedChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { apiFetch, money, type Order, type Product } from "../../../lib/api";
import { adminNote } from "../shared/styles";
import type { AdminCustomers, AdminEvent, AdminUser } from "../shared/types";
import {
  currentMonthKey,
  dayKey,
  daysOfMonth,
  lastNDays,
  lastNMonths,
  monthKey,
  monthLabel,
  monthLabelLong,
} from "../shared/utils";

const chartTooltipStyle = {
  background: "#FFFCF4",
  border: "1px solid #CFC6B3",
  borderRadius: 0,
  boxShadow: "0 12px 30px rgba(23,19,14,.12)",
  fontSize: 12,
};

/** "all" = tudo desde o início; qualquer outro valor é um mês "YYYY-MM". */
type Period = "all" | string;

export function Dashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>("all");

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
        setUsers(customersRes.users.filter((user) => user.role !== "manager"));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const paidOrders = useMemo(
    () => orders.filter((order) => order.status === "paid"),
    [orders],
  );

  // Meses com movimento (pedidos pagos ou eventos) + o mês corrente, do mais novo ao mais antigo.
  const monthOptions = useMemo(() => {
    const keys = new Set<string>([currentMonthKey()]);
    for (const order of paidOrders) {
      const key = monthKey(order.date);
      if (key) keys.add(key);
    }
    for (const event of events) {
      const key = monthKey(Number(event.ts || 0));
      if (key) keys.add(key);
    }
    return Array.from(keys).sort().reverse();
  }, [paidOrders, events]);

  const activeMonth = period === "all" ? "" : period;
  const inPeriod = (ts: number) => !activeMonth || monthKey(ts) === activeMonth;

  const periodOrders = paidOrders.filter((order) => inPeriod(order.date));
  const periodEvents = events.filter((event) =>
    inPeriod(Number(event.ts || 0)),
  );

  const totalRevenue = paidOrders.reduce(
    (sum, order) => sum + (Number(order.total) || 0),
    0,
  );
  const revenue = periodOrders.reduce(
    (sum, order) => sum + (Number(order.total) || 0),
    0,
  );
  const ticket = periodOrders.length ? revenue / periodOrders.length : 0;
  const clicks = periodEvents.filter(
    (event) => String(event.type) !== "buy",
  ).length;
  const buys = periodOrders.length;
  const conversion = clicks ? Math.min(100, (buys / clicks) * 100) : 0;
  const customers = activeMonth
    ? users.filter((user) => monthKey(user.createdAt) === activeMonth).length
    : users.length;

  const chartDays = activeMonth ? daysOfMonth(activeMonth) : lastNDays(14);
  const chartData = chartDays.map((day) => ({
    day: formatDay(day),
    vendas: paidOrders
      .filter((order) => dayKey(order.date) === day)
      .reduce((sum, order) => sum + Number(order.total || 0), 0),
    interacoes: events.filter(
      (event) => event.type !== "buy" && dayKey(Number(event.ts || 0)) === day,
    ).length,
  }));

  // Divisão mensal da receita: sempre os últimos 12 meses, independente do filtro.
  const monthlyData = lastNMonths(12).map((key) => ({
    key,
    month: monthLabel(key),
    receita: paidOrders
      .filter((order) => monthKey(order.date) === key)
      .reduce((sum, order) => sum + Number(order.total || 0), 0),
    pedidos: paidOrders.filter((order) => monthKey(order.date) === key)
      .length,
  }));

  const productData = products
    .map((product) => ({
      name: product.name,
      shortName:
        product.name.length > 22
          ? `${product.name.slice(0, 21)}…`
          : product.name,
      receita: periodOrders.reduce(
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
      interacoes: periodEvents.filter(
        (event) => event.pid === product.id && event.type !== "buy",
      ).length,
    }))
    .sort((a, b) => b.receita - a.receita)
    .slice(0, 5);

  if (loading) return <p className={adminNote}>Carregando dashboard...</p>;

  const periodTitle = activeMonth ? monthLabelLong(activeMonth) : "Total";

  return (
    <>
      <section className="mb-4 flex flex-wrap items-center justify-between gap-3 border border-bubble-line bg-bubble-white px-4 py-3 sm:px-5">
        <div className="flex items-center gap-3">
          <span className="flex size-8 shrink-0 items-center justify-center bg-bubble-cream2 text-bubble-ink/55">
            <CalendarDays size={16} strokeWidth={1.8} />
          </span>
          <div>
            <span className="block font-sans text-[.6rem] font-bold uppercase tracking-[.15em] text-bubble-ink/45">
              Período
            </span>
            <span className="block text-[.8rem] capitalize text-bubble-ink/75">
              {periodTitle}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div
            className="flex border border-bubble-ink"
            role="group"
            aria-label="Modo do período"
          >
            <PeriodButton
              active={!activeMonth}
              onClick={() => setPeriod("all")}
            >
              Total
            </PeriodButton>
            <PeriodButton
              active={Boolean(activeMonth)}
              onClick={() => setPeriod(monthOptions[0] || currentMonthKey())}
            >
              Mensal
            </PeriodButton>
          </div>
          <select
            id="dashboard-period-month"
            value={activeMonth || monthOptions[0]}
            onChange={(event) => setPeriod(event.target.value)}
            disabled={!activeMonth}
            aria-label="Mês"
            className="border border-bubble-line bg-bubble-cream px-3 py-[9px] font-sans text-[.68rem] font-semibold uppercase tracking-[.1em] text-bubble-ink focus:bg-bubble-white focus:outline focus:outline-2 focus:outline-bubble-ink disabled:opacity-40"
          >
            {monthOptions.map((key) => (
              <option key={key} value={key}>
                {monthLabelLong(key)}
              </option>
            ))}
          </select>
        </div>
      </section>

      <section className="mb-5 grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 xl:grid-cols-5">
        <Kpi
          icon={DollarSign}
          label={activeMonth ? `Receita · ${monthLabel(activeMonth)}` : "Receita total"}
          value={money.format(revenue)}
          sub={
            activeMonth
              ? `${periodOrders.length} pagamentos · ${money.format(totalRevenue)} no total`
              : `${periodOrders.length} pagamentos confirmados`
          }
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
          sub="visitas, cliques e adições"
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
          sub={activeMonth ? "novas contas no mês" : "contas ativas"}
        />
      </section>

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.65fr)_minmax(360px,1fr)]">
        <ChartCard
          title={
            activeMonth
              ? `Desempenho em ${monthLabelLong(activeMonth)}`
              : "Desempenho dos últimos 14 dias"
          }
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
                  dataKey="interacoes"
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
          description={
            activeMonth
              ? `Cinco produtos mais vendidos em ${monthLabelLong(activeMonth)}.`
              : "Participação dos cinco produtos mais vendidos."
          }
        >
          {productData.some((item) => item.receita > 0) ? (
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
            <EmptyChart
              text={
                activeMonth
                  ? `Nenhuma venda paga em ${monthLabelLong(activeMonth)}.`
                  : "Os dados dos produtos aparecerão aqui após as primeiras vendas."
              }
            />
          )}
        </ChartCard>
      </section>

      <section className="mt-5">
        <ChartCard
          title="Receita por mês"
          description="Últimos 12 meses. Clique em um mês para filtrar o painel."
        >
          <div className="h-[220px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={monthlyData}
                margin={{ top: 16, right: 8, left: -12, bottom: 0 }}
              >
                <CartesianGrid
                  stroke="#E8E0CF"
                  strokeDasharray="3 3"
                  vertical={false}
                />
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#746C60", fontSize: 10 }}
                />
                <YAxis
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
                <Tooltip
                  contentStyle={chartTooltipStyle}
                  cursor={{ fill: "rgba(217,207,180,.18)" }}
                  formatter={(value, name) => [
                    name === "Receita (R$)"
                      ? money.format(Number(value))
                      : String(value),
                    name,
                  ]}
                />
                <Bar
                  dataKey="receita"
                  name="Receita (R$)"
                  maxBarSize={38}
                  radius={[3, 3, 0, 0]}
                  cursor="pointer"
                  onClick={(_, index) => {
                    const key = monthlyData[index]?.key;
                    if (!key) return;
                    setPeriod(key === activeMonth ? "all" : key);
                  }}
                >
                  {monthlyData.map((item) => (
                    <Cell
                      key={item.key}
                      fill={
                        !activeMonth || item.key === activeMonth
                          ? "#17130E"
                          : "#D9CFB4"
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1.5 sm:grid-cols-3 lg:grid-cols-4">
            {monthlyData
              .filter((item) => item.pedidos > 0)
              .reverse()
              .map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() =>
                    setPeriod(item.key === activeMonth ? "all" : item.key)
                  }
                  className={`flex items-center justify-between gap-3 border-b px-1 py-1.5 text-left text-[.7rem] transition-colors ${
                    item.key === activeMonth
                      ? "border-bubble-ink font-semibold"
                      : "border-bubble-line/50 hover:border-bubble-ink"
                  }`}
                >
                  <span className="capitalize">{monthLabelLong(item.key)}</span>
                  <span className="whitespace-nowrap tabular-nums">
                    {money.format(item.receita)}
                  </span>
                </button>
              ))}
          </div>
        </ChartCard>
      </section>

      <p className={adminNote}>
        <b>Privacidade:</b> os eventos do painel usam dados anonimizados; dados
        pessoais ficam separados para entrega e atendimento.
      </p>
    </>
  );
}

function PeriodButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`px-4 py-[9px] font-sans text-[.68rem] font-semibold uppercase tracking-[.1em] transition-colors ${
        active
          ? "bg-bubble-ink text-bubble-white"
          : "bg-transparent text-bubble-ink hover:bg-bubble-cream2"
      }`}
    >
      {children}
    </button>
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

function EmptyChart({ text }: { text: string }) {
  return (
    <div className="flex h-[300px] items-center justify-center border border-dashed border-bubble-line bg-bubble-cream/40 px-6 text-center text-[.76rem] text-bubble-ink/45">
      {text}
    </div>
  );
}

function formatDay(day: string) {
  const [, month, date] = day.split("-");
  return `${date}/${month}`;
}
