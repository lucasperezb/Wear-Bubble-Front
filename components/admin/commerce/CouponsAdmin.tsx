"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Coupon, Order, apiFetch, money } from "../../../lib/api";
import { useBodyScrollLock } from "../../../lib/use-body-scroll-lock";
import {
  adminNote,
  adminTable,
  field,
  outlineButton,
  primaryButton,
  smallButton,
  stockBadge,
} from "../shared/styles";
import type { Notify, OnSaved } from "../shared/types";
import { useActionDialog } from "../../shared/overlays/ActionDialog";
import { usePagination } from "../shared/usePagination";
import { PaginationControls } from "../shared/PaginationControls";

type CouponMode = "percentage" | "minimumCharge";

type CouponLimitsDraft = {
  expiresAt: string;
  maxUses: string;
  maxUsesPerCustomer: string;
  minSubtotal: string;
  assignedTo: string;
};

export function CouponsAdmin({
  onSaved,
  notify,
}: {
  onSaved: OnSaved;
  notify: Notify;
}) {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Coupon | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      apiFetch<Coupon[]>("/coupons"),
      apiFetch<Order[]>("/orders"),
    ])
      .then(([couponsRes, ordersRes]) => {
        if (cancelled) return;
        setCoupons(couponsRes);
        setOrders(ordersRes);
      })
      .catch((error) => {
        notify(
          error instanceof Error
            ? error.message
            : "Não foi possível carregar os cupons.",
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
    const [couponsRes, ordersRes] = await Promise.all([
      apiFetch<Coupon[]>("/coupons"),
      apiFetch<Order[]>("/orders"),
    ]);
    setCoupons(couponsRes);
    setOrders(ordersRes);
    await onSaved();
  }

  const {
    pageItems: paginatedCoupons,
    pageSize,
    setPageSize,
    page,
    setPage,
    totalPages,
    pageStart,
  } = usePagination(coupons, []);

  if (loading) return <p className={adminNote}>Carregando cupons...</p>;

  return (
    <>
      <div className="mb-3.5 flex justify-end">
        <button
          className={`${primaryButton} px-4 py-[9px] text-[.68rem]`}
          onClick={() => setCreating(true)}
        >
          Criar cupom
        </button>
      </div>
      {creating ? (
        <CreateCouponModal
          onClose={() => setCreating(false)}
          onSaved={handleSaved}
          notify={notify}
        />
      ) : null}
      {editing ? (
        <EditCouponModal
          coupon={editing}
          onClose={() => setEditing(null)}
          onSaved={handleSaved}
          notify={notify}
        />
      ) : null}
      <div className="overflow-x-auto">
        <table className={adminTable}>
          <thead>
            <tr>
              <th>Código</th>
              <th>Tipo</th>
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
            {paginatedCoupons.map((coupon) => (
              <CouponRow
                key={coupon.code}
                coupon={coupon}
                orders={orders}
                onSaved={handleSaved}
                notify={notify}
                onEdit={() => setEditing(coupon)}
              />
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
          count={coupons.length}
          ariaLabel="Paginação dos cupons"
        />
      </div>
      <p className={adminNote}>
        O limite geral controla quantas vezes o código pode ser usado no total.
        O limite por cliente controla quantos pedidos cada conta ou e-mail pode
        fazer com o mesmo cupom. Deixe vazio para uso ilimitado.
      </p>
    </>
  );
}

function CouponModeAndPctFields({
  mode,
  pct,
  freeShipping,
  onModeChange,
  onPctChange,
  onFreeShippingChange,
}: {
  mode: CouponMode;
  pct: number;
  freeShipping: boolean;
  onModeChange: (mode: CouponMode) => void;
  onPctChange: (pct: number) => void;
  onFreeShippingChange: (freeShipping: boolean) => void;
}) {
  return (
    <>
      <div className="mb-[15px] flex flex-col gap-2.5">
        <label className="flex cursor-pointer items-start gap-2.5 border border-bubble-line p-3 text-[.72rem] normal-case leading-[1.5] tracking-normal text-bubble-ink/70 has-[:checked]:border-bubble-ink has-[:checked]:bg-bubble-cream has-[:checked]:text-bubble-ink">
          <input
            className="mt-0.5 size-4 shrink-0"
            type="radio"
            name="couponMode"
            checked={mode === "percentage"}
            onChange={() => onModeChange("percentage")}
          />
          <span>
            <strong className="block text-[.7rem] font-bold uppercase tracking-[.06em] text-bubble-ink">
              Desconto percentual
            </strong>
            Aplica um percentual de desconto sobre os produtos. Pode ser
            combinado com frete grátis abaixo.
          </span>
        </label>
        <label className="flex cursor-pointer items-start gap-2.5 border border-bubble-line p-3 text-[.72rem] normal-case leading-[1.5] tracking-normal text-bubble-ink/70 has-[:checked]:border-bubble-ink has-[:checked]:bg-bubble-cream has-[:checked]:text-bubble-ink">
          <input
            className="mt-0.5 size-4 shrink-0"
            type="radio"
            name="couponMode"
            checked={mode === "minimumCharge"}
            onChange={() => onModeChange("minimumCharge")}
          />
          <span>
            <strong className="block text-[.7rem] font-bold uppercase tracking-[.06em] text-bubble-ink">
              Cupom especial
            </strong>
            Total final fixo de R$ 5,00 (frete já incluso), sem aplicar
            percentual de desconto.
          </span>
        </label>
      </div>

      {mode === "percentage" ? (
        <div className={field}>
          <label>Desconto (%)</label>
          <input
            type="number"
            min="0"
            max="99"
            value={pct}
            onChange={(event) => onPctChange(Number(event.target.value))}
          />
        </div>
      ) : null}

      {mode === "percentage" ? (
        <label className="mb-[15px] flex cursor-pointer items-start gap-2.5 border border-bubble-line p-3 text-[.72rem] normal-case leading-[1.5] tracking-normal text-bubble-ink/70 has-[:checked]:border-bubble-ink has-[:checked]:bg-bubble-cream has-[:checked]:text-bubble-ink">
          <input
            className="mt-0.5 size-4 shrink-0"
            type="checkbox"
            checked={freeShipping}
            onChange={(event) => onFreeShippingChange(event.target.checked)}
          />
          <span>
            <strong className="block text-[.7rem] font-bold uppercase tracking-[.06em] text-bubble-ink">
              Frete grátis
            </strong>
            Zera o frete. Deixe o desconto em 0% para um cupom só de frete
            grátis, ou combine com um percentual acima.
          </span>
        </label>
      ) : null}
    </>
  );
}

function CouponLimitFields({
  draft,
  onChange,
}: {
  draft: CouponLimitsDraft;
  onChange: (patch: Partial<CouponLimitsDraft>) => void;
}) {
  return (
    <>
      <div className="grid grid-cols-3 gap-3 max-[760px]:grid-cols-1">
        <div className={field}>
          <label>Validade</label>
          <input
            type="date"
            value={draft.expiresAt}
            onChange={(event) => onChange({ expiresAt: event.target.value })}
          />
        </div>
        <div className={field}>
          <label>Limite geral do cupom</label>
          <input
            type="number"
            min="1"
            value={draft.maxUses}
            onChange={(event) => onChange({ maxUses: event.target.value })}
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
              onChange({ maxUsesPerCustomer: event.target.value })
            }
            placeholder="Ilimitado"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 max-[760px]:grid-cols-1">
        <div className={field}>
          <label>Compra mínima (R$)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={draft.minSubtotal}
            onChange={(event) => onChange({ minSubtotal: event.target.value })}
            placeholder="0"
          />
        </div>
        <div className={field}>
          <label>Atribuído a</label>
          <input
            value={draft.assignedTo}
            onChange={(event) => onChange({ assignedTo: event.target.value })}
            placeholder="Ex: Julia"
          />
        </div>
      </div>
    </>
  );
}

function ModalShell({
  title,
  onClose,
  footer,
  children,
}: {
  title: string;
  onClose: () => void;
  footer: ReactNode;
  children: ReactNode;
}) {
  useBodyScrollLock(true);
  return createPortal(
    <div
      className="fixed inset-0 z-[900] flex items-center justify-center bg-bubble-ink/70 p-5 max-[760px]:p-0"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="flex max-h-[94vh] w-[560px] max-w-[96vw] flex-col overflow-hidden bg-bubble-white shadow-bubble max-[760px]:h-[100dvh] max-[760px]:max-h-none max-[760px]:max-w-none">
        <div className="flex shrink-0 items-center justify-between border-b border-bubble-ink px-6 py-4">
          <h3 className="text-xl">{title}</h3>
          <button
            type="button"
            className="flex size-10 items-center justify-center border border-bubble-ink text-2xl"
            onClick={onClose}
            aria-label="Fechar modal"
          >
            ×
          </button>
        </div>
        <div className="overflow-y-auto p-6 max-[760px]:p-4">{children}</div>
        <div className="flex shrink-0 justify-end gap-2.5 border-t border-bubble-line bg-bubble-white px-6 py-4">
          {footer}
        </div>
      </div>
    </div>,
    document.body,
  );
}

function CreateCouponModal({
  onClose,
  onSaved,
  notify,
}: {
  onClose: () => void;
  onSaved: OnSaved;
  notify: Notify;
}) {
  const [saving, setSaving] = useState(false);
  const [code, setCode] = useState("");
  const [mode, setMode] = useState<CouponMode>("percentage");
  const [pct, setPct] = useState(10);
  const [freeShipping, setFreeShipping] = useState(false);
  const [limits, setLimits] = useState<CouponLimitsDraft>({
    expiresAt: "",
    maxUses: "",
    maxUsesPerCustomer: "",
    minSubtotal: "",
    assignedTo: "",
  });

  async function createCoupon() {
    if (
      mode === "percentage" &&
      pct > 0 &&
      !isValidCouponPercentage(pct)
    ) {
      notify("Informe um desconto entre 1% e 99%.");
      return;
    }
    if (mode === "percentage" && pct <= 0 && !freeShipping) {
      notify("Informe um desconto ou marque frete grátis.");
      return;
    }
    setSaving(true);
    try {
      await apiFetch("/coupons", {
        method: "POST",
        body: JSON.stringify({
          code,
          pct: mode === "percentage" ? Number(pct) : 0,
          minimumCharge: mode === "minimumCharge",
          freeShipping: mode === "percentage" && freeShipping,
          expiresAt: limits.expiresAt
            ? new Date(`${limits.expiresAt}T23:59:59`).getTime()
            : null,
          maxUses: limits.maxUses ? Number(limits.maxUses) : null,
          maxUsesPerCustomer: limits.maxUsesPerCustomer
            ? Number(limits.maxUsesPerCustomer)
            : null,
          minSubtotal: limits.minSubtotal ? Number(limits.minSubtotal) : 0,
          assignedTo: limits.assignedTo,
        }),
      });
      onClose();
      await onSaved();
      notify("Cupom criado.");
    } catch (error) {
      notify(
        error instanceof Error
          ? error.message
          : "Não foi possível criar cupom.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <ModalShell
      title="Novo cupom"
      onClose={onClose}
      footer={
        <>
          <button className={outlineButton} onClick={onClose} disabled={saving}>
            Cancelar
          </button>
          <button
            className={primaryButton}
            onClick={createCoupon}
            disabled={saving}
          >
            {saving ? "Criando..." : "Criar cupom"}
          </button>
        </>
      }
    >
      <div className={field}>
        <label>Código</label>
        <input
          value={code}
          onChange={(event) => setCode(event.target.value.toUpperCase())}
          placeholder="EX: JULIA10"
        />
      </div>
      <CouponModeAndPctFields
        mode={mode}
        pct={pct}
        freeShipping={freeShipping}
        onModeChange={setMode}
        onPctChange={setPct}
        onFreeShippingChange={setFreeShipping}
      />
      <CouponLimitFields
        draft={limits}
        onChange={(patch) => setLimits((current) => ({ ...current, ...patch }))}
      />
    </ModalShell>
  );
}

function EditCouponModal({
  coupon,
  onClose,
  onSaved,
  notify,
}: {
  coupon: Coupon;
  onClose: () => void;
  onSaved: OnSaved;
  notify: Notify;
}) {
  const [saving, setSaving] = useState(false);
  const [mode, setMode] = useState<CouponMode>(
    coupon.minimumCharge ? "minimumCharge" : "percentage",
  );
  const [pct, setPct] = useState(coupon.pct || 0);
  const [freeShipping, setFreeShipping] = useState(
    coupon.freeShipping === true,
  );
  const [limits, setLimits] = useState<CouponLimitsDraft>({
    expiresAt: coupon.expiresAt
      ? new Date(coupon.expiresAt).toISOString().slice(0, 10)
      : "",
    maxUses: coupon.maxUses ? String(coupon.maxUses) : "",
    maxUsesPerCustomer: coupon.maxUsesPerCustomer
      ? String(coupon.maxUsesPerCustomer)
      : "",
    minSubtotal: coupon.minSubtotal ? String(coupon.minSubtotal) : "",
    assignedTo: coupon.assignedTo || "",
  });

  async function saveCoupon() {
    if (
      mode === "percentage" &&
      pct > 0 &&
      !isValidCouponPercentage(pct)
    ) {
      notify("Informe um desconto entre 1% e 99%.");
      return;
    }
    if (mode === "percentage" && pct <= 0 && !freeShipping) {
      notify("Informe um desconto ou marque frete grátis.");
      return;
    }
    setSaving(true);
    try {
      await apiFetch(`/coupons/${coupon.code}`, {
        method: "PATCH",
        body: JSON.stringify({
          pct: mode === "percentage" ? Number(pct) : 0,
          minimumCharge: mode === "minimumCharge",
          freeShipping: mode === "percentage" && freeShipping,
          expiresAt: limits.expiresAt
            ? new Date(`${limits.expiresAt}T23:59:59`).getTime()
            : null,
          maxUses: limits.maxUses ? Number(limits.maxUses) : null,
          maxUsesPerCustomer: limits.maxUsesPerCustomer
            ? Number(limits.maxUsesPerCustomer)
            : null,
          minSubtotal: limits.minSubtotal ? Number(limits.minSubtotal) : 0,
          assignedTo: limits.assignedTo,
        }),
      });
      onClose();
      await onSaved();
      notify(`Cupom ${coupon.code} atualizado.`);
    } catch (error) {
      notify(
        error instanceof Error
          ? error.message
          : "Não foi possível salvar cupom.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <ModalShell
      title={`Editar cupom ${coupon.code}`}
      onClose={onClose}
      footer={
        <>
          <button className={outlineButton} onClick={onClose} disabled={saving}>
            Cancelar
          </button>
          <button
            className={primaryButton}
            onClick={saveCoupon}
            disabled={saving}
          >
            {saving ? "Salvando..." : "Salvar alterações"}
          </button>
        </>
      }
    >
      <CouponModeAndPctFields
        mode={mode}
        pct={pct}
        freeShipping={freeShipping}
        onModeChange={setMode}
        onPctChange={setPct}
        onFreeShippingChange={setFreeShipping}
      />
      <CouponLimitFields
        draft={limits}
        onChange={(patch) => setLimits((current) => ({ ...current, ...patch }))}
      />
    </ModalShell>
  );
}

function couponTypeLabel(coupon: Coupon) {
  if (coupon.minimumCharge) return "Cupom especial (R$ 5,00)";
  const parts: string[] = [];
  if (coupon.pct > 0) parts.push(`${coupon.pct}% de desconto`);
  if (coupon.freeShipping) parts.push("frete grátis");
  return parts.length ? parts.join(" + ") : "Sem benefício";
}

function CouponRow({
  coupon,
  orders,
  onSaved,
  notify,
  onEdit,
}: {
  coupon: Coupon;
  orders: Order[];
  onSaved: OnSaved;
  notify: Notify;
  onEdit: () => void;
}) {
  const [deleting, setDeleting] = useState(false);
  const actionDialog = useActionDialog();
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
    const confirmed = await actionDialog.confirm({
      title: `Excluir cupom ${coupon.code}`,
      description: `O cupom será excluído definitivamente.${usageWarning}`,
      confirmLabel: "Excluir cupom",
      tone: "danger",
    });
    if (!confirmed) return;

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
    <>
      {actionDialog.dialog}
      <tr>
        <td className="font-bold tracking-px">{coupon.code}</td>
        <td>{couponTypeLabel(coupon)}</td>
        <td>{coupon.assignedTo || "—"}</td>
        <td>
          {coupon.expiresAt
            ? new Date(coupon.expiresAt).toLocaleDateString("pt-BR")
            : "—"}
        </td>
        <td className="min-w-[120px]">
          <div className="text-[.65rem] text-bubble-ink/55">
            {usedOrders.length} utilizados
          </div>
          {coupon.maxUses ? `Limite: ${coupon.maxUses}` : "Ilimitado"}
        </td>
        <td>
          {coupon.maxUsesPerCustomer
            ? `${coupon.maxUsesPerCustomer} por cliente`
            : "Ilimitado"}
        </td>
        <td className="w-[88px]">{usedOrders.length}</td>
        <td className="w-[88px] font-semibold text-bubble-ink">
          {money.format(revenue)}
        </td>
        <td>
          <span className={stockBadge(statusKind)}>{statusLabel}</span>
        </td>
        <td className="whitespace-nowrap">
          <button disabled={deleting} className={smallButton} onClick={onEdit}>
            Editar
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
    </>
  );
}

function isValidCouponPercentage(value: number) {
  return Number.isFinite(value) && value >= 1 && value <= 99;
}
