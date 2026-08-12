"use client";

import { useState } from "react";
import { Coupon, Order, apiFetch, money } from "../../../lib/api";
import {
  adminNote,
  adminTable,
  field,
  primaryButton,
  smallButton,
  stockBadge,
} from "../shared/styles";
import type { Notify, OnSaved } from "../shared/types";

export function CouponsAdmin({
  coupons,
  orders,
  onSaved,
  notify,
}: {
  coupons: Coupon[];
  orders: Order[];
  onSaved: OnSaved;
  notify: Notify;
}) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState({
    code: "",
    pct: 10,
    expiresAt: "",
    maxUses: "",
    maxUsesPerCustomer: "",
    minSubtotal: "",
    assignedTo: "",
  });

  async function createCoupon() {
    if (!isValidCouponPercentage(draft.pct)) {
      notify("Informe um desconto entre 1% e 99%.");
      return;
    }
    try {
      await apiFetch("/coupons", {
        method: "POST",
        body: JSON.stringify({
          code: draft.code,
          pct: Number(draft.pct),
          expiresAt: draft.expiresAt
            ? new Date(`${draft.expiresAt}T23:59:59`).getTime()
            : null,
          maxUses: draft.maxUses ? Number(draft.maxUses) : null,
          maxUsesPerCustomer: draft.maxUsesPerCustomer
            ? Number(draft.maxUsesPerCustomer)
            : null,
          minSubtotal: draft.minSubtotal ? Number(draft.minSubtotal) : 0,
          assignedTo: draft.assignedTo,
        }),
      });
      setAdding(false);
      setDraft({
        code: "",
        pct: 10,
        expiresAt: "",
        maxUses: "",
        maxUsesPerCustomer: "",
        minSubtotal: "",
        assignedTo: "",
      });
      await onSaved();
      notify("Cupom criado.");
    } catch (error) {
      notify(
        error instanceof Error
          ? error.message
          : "Não foi possível criar cupom.",
      );
    }
  }

  return (
    <>
      <div className="mb-3.5 flex justify-end">
        <button
          className={`${primaryButton} px-4 py-[9px] text-[.68rem]`}
          onClick={() => setAdding((current) => !current)}
        >
          Criar cupom
        </button>
      </div>
      {adding ? (
        <div className="mb-5 border border-bubble-line bg-bubble-white p-5">
          <h4 className="mb-4 font-sans text-[.78rem] font-bold uppercase tracking-[.1em] text-bubble-ink">
            Novo cupom
          </h4>
          <div className="grid grid-cols-2 gap-3">
            <div className={field}>
              <label>Código</label>
              <input
                value={draft.code}
                onChange={(event) =>
                  setDraft({ ...draft, code: event.target.value.toUpperCase() })
                }
                placeholder="EX: JULIA10"
              />
            </div>
            <div className={field}>
              <label>Desconto (%)</label>
              <input
                type="number"
                min="1"
                max="99"
                value={draft.pct}
                onChange={(event) =>
                  setDraft({ ...draft, pct: Number(event.target.value) })
                }
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 max-[760px]:grid-cols-1">
            <div className={field}>
              <label>Validade</label>
              <input
                type="date"
                value={draft.expiresAt}
                onChange={(event) =>
                  setDraft({ ...draft, expiresAt: event.target.value })
                }
              />
            </div>
            <div className={field}>
              <label>Limite geral do cupom</label>
              <input
                type="number"
                min="1"
                value={draft.maxUses}
                onChange={(event) =>
                  setDraft({ ...draft, maxUses: event.target.value })
                }
                placeholder="Ilimitado"
              />
            </div>
            <div className={field}>
              <label>Limite por cliente</label>
              <input
                type="number"
                min="1"
                value={draft.maxUsesPerCustomer}
                onChange={(event) =>
                  setDraft({ ...draft, maxUsesPerCustomer: event.target.value })
                }
                placeholder="Ilimitado"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className={field}>
              <label>Compra mínima (R$)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={draft.minSubtotal}
                onChange={(event) =>
                  setDraft({ ...draft, minSubtotal: event.target.value })
                }
                placeholder="0"
              />
            </div>
            <div className={field}>
              <label>Atribuído a</label>
              <input
                value={draft.assignedTo}
                onChange={(event) =>
                  setDraft({ ...draft, assignedTo: event.target.value })
                }
                placeholder="Ex: Julia"
              />
            </div>
          </div>
          <button className={primaryButton} onClick={createCoupon}>
            Criar cupom
          </button>
        </div>
      ) : null}
      <div className="overflow-x-auto">
        <table className={adminTable}>
          <thead>
            <tr>
              <th>Código</th>
              <th className="w-[88px]">%</th>
              <th>Atribuído a</th>
              <th>Validade</th>
              <th>Limite geral</th>
              <th>Por cliente</th>
              <th className="w-[88px]">Pedidos</th>
              <th className="w-[88px]">Receita gerada</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {coupons.length === 0 ? (
              <tr>
                <td
                  colSpan={10}
                  className="p-[26px] text-center text-bubble-ink/50"
                >
                  Nenhum cupom ainda.
                </td>
              </tr>
            ) : null}
            {coupons.map((coupon) => (
              <CouponRow
                key={coupon.code}
                coupon={coupon}
                orders={orders}
                onSaved={onSaved}
                notify={notify}
              />
            ))}
          </tbody>
        </table>
      </div>
      <p className={adminNote}>
        O limite geral controla quantas vezes o código pode ser usado no total.
        O limite por cliente controla quantos pedidos cada conta ou e-mail pode
        fazer com o mesmo cupom. Deixe vazio para uso ilimitado.
      </p>
    </>
  );
}

function CouponRow({
  coupon,
  orders,
  onSaved,
  notify,
}: {
  coupon: Coupon;
  orders: Order[];
  onSaved: OnSaved;
  notify: Notify;
}) {
  const [deleting, setDeleting] = useState(false);
  const [draft, setDraft] = useState({
    pct: coupon.pct,
    assignedTo: coupon.assignedTo || "",
    expiresAt: coupon.expiresAt
      ? new Date(coupon.expiresAt).toISOString().slice(0, 10)
      : "",
    maxUses: coupon.maxUses ? String(coupon.maxUses) : "",
    maxUsesPerCustomer: coupon.maxUsesPerCustomer
      ? String(coupon.maxUsesPerCustomer)
      : "",
  });
  const usedOrders = orders.filter(
    (order) => order.coupon === coupon.code && order.status !== "canceled",
  );
  const revenue = usedOrders
    .filter((order) => order.status === "paid")
    .reduce((sum, order) => sum + order.total, 0);
  const statusKind =
    coupon.active === false
      ? "out"
      : coupon.expiresAt && Date.now() > coupon.expiresAt
        ? "low"
        : "ok";
  const statusLabel =
    coupon.active === false
      ? "Pausado"
      : coupon.expiresAt && Date.now() > coupon.expiresAt
        ? "Expirado"
        : "Ativo";

  async function patch(body: Record<string, unknown>, message: string) {
    try {
      await apiFetch(`/coupons/${coupon.code}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      });
      await onSaved();
      notify(message);
    } catch (error) {
      notify(
        error instanceof Error
          ? error.message
          : "Não foi possível salvar cupom.",
      );
    }
  }

  async function removeCoupon() {
    const usageWarning =
      usedOrders.length > 0
        ? ` Ele já foi usado em ${usedOrders.length} pedido${usedOrders.length === 1 ? "" : "s"}; os pedidos realizados não serão apagados.`
        : "";
    if (
      !window.confirm(
        `Excluir definitivamente o cupom ${coupon.code}?${usageWarning}`,
      )
    )
      return;

    setDeleting(true);
    try {
      const result = await apiFetch<{ removed: number }>(
        `/coupons/${encodeURIComponent(coupon.code)}`,
        { method: "DELETE" },
      );
      if (!result.removed) throw new Error("Cupom não encontrado.");
      await onSaved();
      notify(`Cupom ${coupon.code} excluído.`);
    } catch (error) {
      notify(
        error instanceof Error
          ? error.message
          : "Não foi possível excluir cupom.",
      );
      setDeleting(false);
    }
  }

  return (
    <tr>
      <td className="font-bold tracking-px">{coupon.code}</td>
      <td className="w-[88px]">
        <input
          className="max-w-[58px]"
          type="number"
          min="1"
          max="99"
          value={draft.pct}
          onChange={(event) =>
            setDraft({ ...draft, pct: Number(event.target.value) })
          }
        />
      </td>
      <td>
        <input
          className="min-w-[140px]"
          value={draft.assignedTo}
          onChange={(event) =>
            setDraft({ ...draft, assignedTo: event.target.value })
          }
        />
      </td>
      <td>
        <input
          type="date"
          value={draft.expiresAt}
          onChange={(event) =>
            setDraft({ ...draft, expiresAt: event.target.value })
          }
        />
      </td>
      <td className="min-w-[120px]">
        <div className="mb-1 text-[.65rem] text-bubble-ink/55">
          {usedOrders.length} utilizados
        </div>
        <input
          className="max-w-[82px]"
          type="number"
          min="1"
          value={draft.maxUses}
          onChange={(event) =>
            setDraft({ ...draft, maxUses: event.target.value })
          }
          placeholder="Ilimitado"
        />
      </td>
      <td className="min-w-[120px]">
        <input
          className="max-w-[82px]"
          type="number"
          min="1"
          value={draft.maxUsesPerCustomer}
          onChange={(event) =>
            setDraft({ ...draft, maxUsesPerCustomer: event.target.value })
          }
          placeholder="Ilimitado"
        />
      </td>
      <td className="w-[88px]">{usedOrders.length}</td>
      <td className="w-[88px] font-semibold text-bubble-ink">
        {money.format(revenue)}
      </td>
      <td>
        <span className={stockBadge(statusKind)}>{statusLabel}</span>
      </td>
      <td className="whitespace-nowrap">
        <button
          disabled={deleting}
          className={smallButton}
          onClick={() =>
            isValidCouponPercentage(draft.pct)
              ? patch(
                  {
                    pct: draft.pct,
                    assignedTo: draft.assignedTo,
                    expiresAt: draft.expiresAt
                      ? new Date(`${draft.expiresAt}T23:59:59`).getTime()
                      : null,
                    maxUses: draft.maxUses ? Number(draft.maxUses) : null,
                    maxUsesPerCustomer: draft.maxUsesPerCustomer
                      ? Number(draft.maxUsesPerCustomer)
                      : null,
                  },
                  `Cupom ${coupon.code} atualizado.`,
                )
              : notify("Informe um desconto entre 1% e 99%.")
          }
        >
          Salvar
        </button>
        <button
          disabled={deleting}
          className={smallButton}
          onClick={() =>
            patch(
              { active: coupon.active === false },
              coupon.active === false
                ? `Cupom ${coupon.code} ativado.`
                : `Cupom ${coupon.code} pausado.`,
            )
          }
        >
          {coupon.active === false ? "Ativar" : "Pausar"}
        </button>
        <button
          type="button"
          disabled={deleting}
          className={`${smallButton} border-bubble-danger text-bubble-danger hover:bg-bubble-danger hover:text-white disabled:cursor-wait disabled:opacity-50`}
          onClick={removeCoupon}
        >
          {deleting ? "Excluindo..." : "Excluir"}
        </button>
      </td>
    </tr>
  );
}

function isValidCouponPercentage(value: number) {
  return Number.isFinite(value) && value >= 1 && value <= 99;
}
