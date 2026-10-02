"use client";

import { useEffect, useState } from "react";
import { apiFetch, money, type Order } from "../../../lib/api";
import {
  adminNote,
  adminTable,
  smallButton,
  stockBadge,
} from "../shared/styles";
import type { AdminCustomers, Notify } from "../shared/types";
import { useActionDialog } from "../../shared/overlays/ActionDialog";
import { addressLine, maskId } from "../shared/utils";
import { usePagination } from "../shared/usePagination";
import { PaginationControls } from "../shared/PaginationControls";

const emptyCustomers: AdminCustomers = { users: [], profiles: [] };

export function CustomersAdmin({ notify }: { notify: Notify }) {
  const [customers, setCustomers] = useState<AdminCustomers>(emptyCustomers);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingUid, setDeletingUid] = useState<string | null>(null);
  const actionDialog = useActionDialog();

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      apiFetch<AdminCustomers>("/admin/customers"),
      apiFetch<Order[]>("/orders"),
    ])
      .then(([customersRes, ordersRes]) => {
        if (cancelled) return;
        setCustomers(customersRes);
        setOrders(ordersRes);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const vault = customers.profiles;
  const rows = customers.users.map((user) => {
    const uid = user.uid;
    const profile = vault.find((item) => item.uid === uid) || null;
    const customerOrders = orders.filter((order) => order.customerId === uid);
    return {
      uid,
      user,
      profile,
      orders: customerOrders,
      spent: customerOrders
        .filter((order) => order.status === "paid")
        .reduce((sum, order) => sum + order.total, 0),
    };
  });

  const {
    pageItems: paginatedRows,
    pageSize,
    setPageSize,
    page,
    setPage,
    totalPages,
    pageStart,
  } = usePagination(rows, []);

  async function removeCustomer(row: (typeof rows)[number]) {
    const name = row.profile?.name || maskId(row.uid);
    const orderWarning =
      row.orders.length > 0
        ? ` ${row.orders.length === 1 ? "O pedido deste cliente continuará" : `Os ${row.orders.length} pedidos deste cliente continuarão`} no histórico de vendas, sem vínculo com a conta.`
        : "";
    const confirmed = await actionDialog.confirm({
      title: `Excluir cliente ${name}`,
      description: `A conta, os dados pessoais e os endereços serão apagados definitivamente.${orderWarning}`,
      confirmLabel: "Excluir cliente",
      tone: "danger",
    });
    if (!confirmed) return;

    setDeletingUid(row.uid);
    try {
      await apiFetch(`/admin/customers/${row.uid}`, { method: "DELETE" });
      setCustomers((current) => ({
        users: current.users.filter((user) => user.uid !== row.uid),
        profiles: current.profiles.filter(
          (profile) => profile.uid !== row.uid,
        ),
      }));
      notify(`Cliente ${name} excluído.`);
    } catch (error) {
      notify(
        error instanceof Error
          ? error.message
          : "Não foi possível excluir cliente.",
      );
    } finally {
      setDeletingUid(null);
    }
  }

  if (loading) return <p className={adminNote}>Carregando clientes...</p>;

  return (
    <>
      {actionDialog.dialog}
      <div className="mb-[18px] border border-bubble-candy bg-bubble-candy/15 px-[13px] py-[11px] text-[.68rem] leading-[1.6] text-bubble-ink">
        <b>Cofre de dados pessoais.</b> Estes dados são visíveis apenas para o
        gerente e devem ser usados para entrega e atendimento.
      </div>
      <div className="overflow-x-auto">
      <table className={adminTable}>
        <thead>
          <tr>
            <th className="min-w-[190px]">Cliente</th>
            <th className="min-w-[190px]">Contato</th>
            <th className="min-w-[190px]">Endereço de envio</th>
            <th>Novidades</th>
            <th>Pedidos</th>
            <th>Total gasto</th>
            <th>Cadastro</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={8}
                className="p-[26px] text-center text-bubble-ink/50"
              >
                Nenhum cliente cadastrado ainda.
              </td>
            </tr>
          ) : null}
          {paginatedRows.map((row) => (
            <tr key={row.uid}>
              <td className="min-w-[190px]">
                <div className="font-semibold">
                  {row.profile?.name || "(cofre não encontrado)"}{" "}
                  {row.user.role === "manager" ? (
                    <span className="ml-[7px] inline-block rounded-[10px] bg-bubble-ink px-[7px] py-0.5 align-middle font-sans text-[.58rem] uppercase tracking-[.08em] text-bubble-candy">
                      Gerente
                    </span>
                  ) : null}
                </div>
                <div className="font-mono text-[.64rem] text-bubble-ink/45">
                  {maskId(row.uid)}
                </div>
              </td>
              <td className="min-w-[190px] text-[.78rem]">
                {row.profile?.email || "-"}
              </td>
              <td className="min-w-[190px] text-[.74rem] leading-[1.5]">
                {addressLine(row.profile || {})}
              </td>
              <td>
                {row.user.marketingOptIn ? (
                  <span className={stockBadge("ok")}>Sim</span>
                ) : (
                  <span className="inline-block bg-bubble-ink/[.08] px-2 py-[3px] font-sans text-[.62rem] font-bold uppercase tracking-[.08em] text-bubble-ink/55">
                    Não
                  </span>
                )}
              </td>
              <td>{row.orders.length}</td>
              <td className="font-semibold">{money.format(row.spent)}</td>
              <td className="text-[.72rem]">
                {row.user.createdAt
                  ? new Date(Number(row.user.createdAt)).toLocaleDateString(
                      "pt-BR",
                    )
                  : "-"}
              </td>
              <td>
                {row.user.role === "manager" ? (
                  <span className="text-[.7rem] text-bubble-ink/40">—</span>
                ) : (
                  <button
                    type="button"
                    disabled={deletingUid !== null}
                    className={`${smallButton} border-bubble-danger text-bubble-danger hover:bg-bubble-danger hover:text-white disabled:cursor-wait disabled:opacity-50`}
                    onClick={() => removeCustomer(row)}
                  >
                    {deletingUid === row.uid ? "Excluindo..." : "Excluir"}
                  </button>
                )}
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
          count={rows.length}
          ariaLabel="Paginação dos clientes"
        />
      </div>
      <p className={adminNote}>
        O cadastro cria o cliente automaticamente. O endereço aparece quando a
        cliente preenche Minha Conta {">"} Dados.
      </p>
    </>
  );
}
