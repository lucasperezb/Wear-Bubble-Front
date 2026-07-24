import { Order, money } from '../../lib/api';
import { adminNote, adminTable, stockBadge } from './admin.styles';
import type { AdminDump } from './admin.types';
import { addressLine, maskId } from './admin.utils';

export function CustomersAdmin({ dump }: { dump: AdminDump }) {
  const vault = dump.pii_vault || [];
  const rows = dump.users.map((user) => {
    const uid = String(user.uid || user.id || '');
    const profile = vault.find((item) => String(item.uid || item.id) === uid) || {};
    const orders = dump.orders.filter((order) => (order as Order & { customerId?: string }).customerId === uid);
    return { uid, user, profile, orders, spent: orders.reduce((sum, order) => sum + order.total, 0) };
  });

  return (
    <>
      <div className="mb-[18px] border border-bubble-candy bg-bubble-candy/15 px-[13px] py-[11px] text-[.68rem] leading-[1.6] text-bubble-ink"><b>Cofre de dados pessoais.</b> Estes dados sao visiveis apenas para o gerente e devem ser usados para entrega e atendimento.</div>
      <table className={adminTable}>
        <thead><tr><th className="min-w-[190px]">Cliente</th><th className="min-w-[190px]">Contato</th><th className="min-w-[190px]">Endereco de envio</th><th>Novidades</th><th>Pedidos</th><th>Total gasto</th><th>Cadastro</th></tr></thead>
        <tbody>
          {rows.length === 0 ? <tr><td colSpan={7} className="p-[26px] text-center text-bubble-ink/50">Nenhum cliente cadastrado ainda.</td></tr> : null}
          {rows.map((row) => (
            <tr key={row.uid}>
              <td className="min-w-[190px]">
                <div className="font-semibold">{String(row.profile.name || '(cofre nao encontrado)')} {row.user.role === 'manager' ? <span className="ml-[7px] inline-block rounded-[10px] bg-bubble-ink px-[7px] py-0.5 align-middle font-sans text-[.58rem] uppercase tracking-[.08em] text-bubble-candy">Gerente</span> : null}</div>
                <div className="font-mono text-[.64rem] text-bubble-ink/45">{maskId(row.uid)}</div>
              </td>
              <td className="min-w-[190px] text-[.78rem]">{String(row.profile.email || '-')}</td>
              <td className="min-w-[190px] text-[.74rem] leading-[1.5]">{addressLine(row.profile)}</td>
              <td>{row.user.marketingOptIn ? <span className={stockBadge('ok')}>Sim</span> : <span className="inline-block bg-bubble-ink/[.08] px-2 py-[3px] font-sans text-[.62rem] font-bold uppercase tracking-[.08em] text-bubble-ink/55">Nao</span>}</td>
              <td>{row.orders.length}</td>
              <td className="font-semibold">{money.format(row.spent)}</td>
              <td className="text-[.72rem]">{row.user.createdAt ? new Date(Number(row.user.createdAt)).toLocaleDateString('pt-BR') : '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className={adminNote}>O cadastro cria o cliente automaticamente. O endereco aparece quando a cliente preenche Minha Conta {'>'} Dados.</p>
    </>
  );
}
