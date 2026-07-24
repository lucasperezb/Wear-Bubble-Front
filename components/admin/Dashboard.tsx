import { money } from '../../lib/api';
import { adminNote, chartCard } from './admin.styles';
import type { AdminDump } from './admin.types';
import { dayKey, lastNDays } from './admin.utils';

export function Dashboard({ dump }: { dump: AdminDump }) {
  const revenue = dump.orders.reduce((sum, order) => sum + (Number(order.total) || 0), 0);
  const ticket = dump.orders.length ? revenue / dump.orders.length : 0;
  const clicks = dump.events.filter((event) => ['click', 'add', 'view'].includes(String(event.type))).length;
  const buys = dump.events.filter((event) => event.type === 'buy').length + dump.orders.length;
  const conversion = clicks ? (buys / clicks) * 100 : 0;
  const days = lastNDays(14);
  const salesByDay = days.map((day) => dump.orders.filter((order) => dayKey(order.date) === day).reduce((sum, order) => sum + order.total, 0));
  const clicksByDay = days.map((day) => dump.events.filter((event) => event.type !== 'buy' && dayKey(Number(event.ts || 0)) === day).length);
  const topProducts = dump.products
    .map((product) => ({
      name: product.name,
      value: dump.orders.reduce((sum, order) => sum + order.items.filter((item) => item.pid === product.id).reduce((lineSum, item) => lineSum + item.price * item.qty, 0), 0),
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);
  const maxTop = Math.max(...topProducts.map((item) => item.value), 1);

  return (
    <>
      <div className="mb-[30px] grid grid-cols-5 gap-0.5 border border-bubble-line bg-bubble-line max-[980px]:grid-cols-2">
        <Kpi label="Receita total" value={money.format(revenue)} sub={`${dump.orders.length} pedidos`} />
        <Kpi label="Ticket medio" value={money.format(ticket)} sub="por pedido" />
        <Kpi label="Cliques/visitas" value={String(clicks)} sub="interacoes rastreadas" />
        <Kpi label="Conversao" value={`${conversion.toFixed(1)}%`} sub="compras / interacoes" />
        <Kpi label="Clientes" value={String(dump.users.filter((user) => user.role !== 'manager').length)} sub="contas ativas" />
      </div>
      <div className="mb-[30px] grid grid-cols-[1.3fr_1fr] gap-6 max-[980px]:grid-cols-1">
        <div className={chartCard}>
          <h4>Vendas (R$) x Interacoes - ultimos 14 dias</h4>
          <DualChart sales={salesByDay} clicks={clicksByDay} />
          <div className="mt-3 flex gap-[18px] text-[.68rem] text-bubble-ink/60">
            <div className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-bubble-ink" />Vendas (R$)</div>
            <div className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-bubble-candy" />Interacoes (qtd)</div>
          </div>
        </div>
        <div className={chartCard}>
          <h4>Top 5 produtos por receita</h4>
          <div className="flex flex-col gap-2.5">
            {topProducts.map((item, index) => (
              <div className="flex items-center gap-3 text-[.78rem]" key={item.name}>
                <span className="w-6 font-display text-[1.1rem] text-bubble-candy">{String(index + 1).padStart(2, '0')}</span>
                <div className="flex-1">
                  <div className="mb-1 text-[.74rem]">{item.name}</div>
                  <div className="h-2 overflow-hidden rounded bg-bubble-cream2"><div className="h-full rounded bg-bubble-ink" style={{ width: `${(item.value / maxTop) * 100}%` }} /></div>
                </div>
                <span className="w-[90px] text-right text-[.74rem] font-semibold text-bubble-ink">{money.format(item.value)}</span>
              </div>
            ))}
          </div>
          <h4 className="mt-[26px]">Interacoes por produto</h4>
          <MiniBars items={dump.products.map((product) => ({ name: product.name, value: dump.events.filter((event) => event.pid === product.id && event.type !== 'buy').length }))} />
        </div>
      </div>
      <p className={adminNote}><b>Privacidade:</b> os eventos do painel usam dados anonimizados; dados pessoais ficam separados para entrega e atendimento.</p>
    </>
  );
}

function Kpi({ label, value, sub }: { label: string; value: string; sub: string }) {
  return <div className="bg-bubble-white p-[22px]"><div className="text-[.64rem] font-bold uppercase tracking-[.16em] text-bubble-ink/50">{label}</div><div className="mt-1.5 font-display text-[2.1rem] text-bubble-ink">{value}</div><div className="text-[.66rem] font-semibold text-bubble-success">{sub}</div></div>;
}

function DualChart({ sales, clicks }: { sales: number[]; clicks: number[] }) {
  const max = Math.max(...sales, ...clicks, 1);
  const salesPoints = sales.map((value, index) => `${20 + index * 29},${130 - (value / max) * 100}`).join(' ');
  const clickPoints = clicks.map((value, index) => `${20 + index * 29},${130 - (value / max) * 100}`).join(' ');
  return (
    <svg viewBox="0 0 410 150" role="img" aria-label="Grafico de vendas e interacoes">
      <polyline points={salesPoints} fill="none" stroke="#17130E" strokeWidth="4" />
      <polyline points={clickPoints} fill="none" stroke="#D9CFB4" strokeWidth="4" />
      <line x1="16" y1="132" x2="400" y2="132" stroke="rgba(23,19,14,.3)" />
    </svg>
  );
}

function MiniBars({ items }: { items: Array<{ name: string; value: number }> }) {
  const max = Math.max(...items.map((item) => item.value), 1);
  return (
    <svg viewBox="0 0 360 150" role="img" aria-label="Interacoes por produto">
      {items.slice(0, 8).map((item, index) => (
        <g key={item.name} transform={`translate(0 ${index * 18})`}>
          <text x="0" y="12" fontSize="9" fill="rgba(23,19,14,.65)">{item.name.slice(0, 22)}</text>
          <rect x="150" y="3" width={(item.value / max) * 190} height="10" fill="#17130E" />
        </g>
      ))}
    </svg>
  );
}
