"use client";

import { useEffect, useState } from "react";
import { apiFetch, type Order } from "../../../lib/api";
import type { Notify, OnSaved } from "./types";

type AddressDraft = NonNullable<Order["delivery"]>;

const emptyAddress: AddressDraft = {
  name: "",
  email: "",
  taxId: "",
  phone: "",
  cep: "",
  street: "",
  neighborhood: "",
  number: "",
  reference: "",
  city: "",
  state: "",
};

export function OrderAddressEditor({
  order,
  onSaved,
  notify,
}: {
  order: Order;
  onSaved: OnSaved;
  notify: Notify;
}) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState<AddressDraft>({
    ...emptyAddress,
    ...order.delivery,
  });

  useEffect(() => {
    setDraft({ ...emptyAddress, ...order.delivery });
  }, [order.delivery]);

  function update(field: keyof AddressDraft, value: string) {
    setDraft((current) => ({ ...current, [field]: value }));
  }

  async function save() {
    const required = [
      draft.cep,
      draft.street,
      draft.neighborhood,
      draft.number,
      draft.city,
      draft.state,
    ];
    if (required.some((value) => !value.trim())) {
      notify("Preencha todos os campos obrigatórios do endereço.");
      return;
    }
    if (!/^\d{5}-?\d{3}$/.test(draft.cep)) {
      notify("Informe um CEP válido.");
      return;
    }
    if (!/^[A-Za-z]{2}$/.test(draft.state)) {
      notify("Informe uma UF válida com duas letras.");
      return;
    }

    setSaving(true);
    try {
      await apiFetch(`/orders/${order.id}/address`, {
        method: "PATCH",
        body: JSON.stringify({
          cep: draft.cep,
          street: draft.street,
          neighborhood: draft.neighborhood,
          number: draft.number,
          reference: draft.reference,
          city: draft.city,
          state: draft.state.toUpperCase(),
        }),
      });
      await onSaved();
      setEditing(false);
      notify(`Endereço do pedido #${order.number} atualizado.`);
    } catch (error) {
      notify(
        error instanceof Error
          ? error.message
          : "Não foi possível atualizar o endereço.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (!editing) {
    return (
      <button
        type="button"
        className="mt-3 border border-bubble-ink px-3 py-2 font-sans text-[.6rem] font-bold uppercase tracking-[.1em]"
        onClick={() => setEditing(true)}
      >
        Editar endereço
      </button>
    );
  }

  return (
    <div className="mt-4 border border-bubble-line bg-bubble-cream/50 p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <AddressField
          label="CEP"
          value={draft.cep}
          onChange={(value) => update("cep", formatCep(value))}
        />
        <AddressField
          label="Número"
          value={draft.number}
          onChange={(value) => update("number", value.slice(0, 30))}
        />
        <AddressField
          label="Rua"
          value={draft.street}
          onChange={(value) => update("street", value.slice(0, 255))}
          wide
        />
        <AddressField
          label="Bairro"
          value={draft.neighborhood}
          onChange={(value) => update("neighborhood", value.slice(0, 120))}
        />
        <AddressField
          label="Cidade"
          value={draft.city}
          onChange={(value) => update("city", value.slice(0, 120))}
        />
        <AddressField
          label="UF"
          value={draft.state}
          onChange={(value) =>
            update(
              "state",
              value
                .replace(/[^A-Za-z]/g, "")
                .slice(0, 2)
                .toUpperCase(),
            )
          }
        />
        <AddressField
          label="Complemento / referência"
          value={draft.reference}
          onChange={(value) => update("reference", value.slice(0, 255))}
          wide
          required={false}
        />
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={saving}
          className="bg-bubble-ink px-4 py-2 font-sans text-[.62rem] font-bold uppercase tracking-[.1em] text-white disabled:opacity-50"
          onClick={save}
        >
          {saving ? "Salvando..." : "Salvar endereço"}
        </button>
        <button
          type="button"
          disabled={saving}
          className="border border-bubble-line px-4 py-2 font-sans text-[.62rem] font-bold uppercase tracking-[.1em]"
          onClick={() => {
            setDraft({ ...emptyAddress, ...order.delivery });
            setEditing(false);
          }}
        >
          Cancelar
        </button>
      </div>
      <p className="mt-3 text-[.68rem] text-bubble-ink/55">
        A alteração vale somente para este pedido.
      </p>
    </div>
  );
}

function AddressField({
  label,
  value,
  onChange,
  wide = false,
  required = true,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  wide?: boolean;
  required?: boolean;
}) {
  return (
    <label
      className={`font-sans text-[.58rem] font-bold uppercase tracking-[.1em] text-bubble-ink/55 ${wide ? "sm:col-span-2" : ""}`}
    >
      {label}
      {required ? " *" : ""}
      <input
        className="mt-1.5 w-full border border-bubble-line bg-bubble-white px-3 py-2.5 font-serif text-sm normal-case tracking-normal text-bubble-ink"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function formatCep(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  return digits.length > 5
    ? `${digits.slice(0, 5)}-${digits.slice(5)}`
    : digits;
}
