"use client";

import { MapPin, Pencil, Plus, Save, Star, Trash2, X } from "lucide-react";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { apiFetch, type AccountAddress } from "../../lib/api";
import {
  formatAddressText,
  formatHouseNumber,
  formatPersonName,
  formatState,
} from "../../lib/input-formatters";

type AddressForm = Omit<AccountAddress, "id">;

const emptyAddress: AddressForm = {
  label: "Casa",
  cep: "",
  street: "",
  neighborhood: "",
  number: "",
  reference: "",
  city: "",
  state: "",
  isDefault: false,
};

const inputClass =
  "w-full border border-bubble-line bg-bubble-cream px-3.5 py-3 text-[.86rem] outline-none transition-colors focus:border-bubble-ink focus:bg-bubble-white";
const labelClass =
  "mb-1.5 block font-sans text-[.64rem] font-semibold uppercase tracking-[.1em] text-bubble-ink/55";

export function AddressesPanel() {
  const [addresses, setAddresses] = useState<AccountAddress[]>([]);
  const [editingId, setEditingId] = useState<string | "new" | null>(null);
  const [form, setForm] = useState<AddressForm>(emptyAddress);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [cepStatus, setCepStatus] = useState("");
  const safeAddresses = Array.isArray(addresses) ? addresses : [];

  useEffect(() => {
    void loadAddresses();
  }, []);

  async function loadAddresses() {
    try {
      const result = await apiFetch<AccountAddress[] | null>(
        "/account/addresses",
      );
      setAddresses(Array.isArray(result) ? result : []);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Nao foi possivel carregar os enderecos.",
      );
    } finally {
      setLoading(false);
    }
  }

  function startCreate() {
    setForm({ ...emptyAddress, isDefault: safeAddresses.length === 0 });
    setEditingId("new");
    setMessage("");
    setCepStatus("");
  }

  function startEdit(address: AccountAddress) {
    const { id: _id, ...values } = address;
    setForm(values);
    setEditingId(address.id);
    setMessage("");
    setCepStatus("");
  }

  async function saveAddress(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setMessage("");
    try {
      if (editingId === "new") {
        await apiFetch<AccountAddress>("/account/addresses", {
          method: "POST",
          body: JSON.stringify(form),
        });
      } else if (editingId) {
        await apiFetch<AccountAddress>(`/account/addresses/${editingId}`, {
          method: "PATCH",
          body: JSON.stringify(form),
        });
      }
      await loadAddresses();
      setEditingId(null);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Nao foi possivel salvar o endereco.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function makeDefault(id: string) {
    try {
      await apiFetch(`/account/addresses/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ isDefault: true }),
      });
      await loadAddresses();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Nao foi possivel alterar o endereco principal.",
      );
    }
  }

  async function deleteAddress(address: AccountAddress) {
    if (!window.confirm(`Excluir o endereco "${address.label}"?`)) return;
    try {
      await apiFetch(`/account/addresses/${address.id}`, { method: "DELETE" });
      await loadAddresses();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Nao foi possivel excluir o endereco.",
      );
    }
  }

  function changeCep(value: string) {
    const digits = value.replace(/\D/g, "").slice(0, 8);
    const cep =
      digits.length > 5 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits;
    setForm((current) => ({ ...current, cep }));
    setCepStatus("");
    if (digits.length === 8) window.setTimeout(() => void lookupCep(cep), 0);
  }

  async function lookupCep(value = form.cep) {
    const digits = value.replace(/\D/g, "");
    if (digits.length !== 8) return;
    setCepStatus("Consultando CEP...");
    try {
      const response = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      if (!response.ok) throw new Error();
      const result = (await response.json()) as {
        erro?: boolean;
        logradouro?: string;
        bairro?: string;
        localidade?: string;
        uf?: string;
      };
      if (result.erro) {
        setCepStatus("CEP nao encontrado.");
        return;
      }
      setForm((current) => ({
        ...current,
        street: result.logradouro || current.street,
        neighborhood: result.bairro || current.neighborhood,
        city: result.localidade || current.city,
        state: result.uf || current.state,
      }));
      setCepStatus("Endereco preenchido. Confira o numero.");
    } catch {
      setCepStatus("Nao foi possivel consultar o CEP.");
    }
  }

  if (editingId) {
    return (
      <form
        className="border border-bubble-ink bg-bubble-white p-7 max-[620px]:p-5"
        onSubmit={saveAddress}
      >
        <div className="mb-7 flex items-start justify-between gap-4 border-b border-bubble-line pb-5">
          <div>
            <span className="font-sans text-[.62rem] font-semibold uppercase tracking-[.12em] text-bubble-ink/45">
              {editingId === "new" ? "Novo endereco" : "Editar endereco"}
            </span>
            <h2 className="mt-1 text-2xl">Endereco de entrega</h2>
          </div>
          <button
            type="button"
            className="border-0 bg-transparent"
            title="Cancelar"
            onClick={() => setEditingId(null)}
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4 max-[620px]:grid-cols-1">
          <AddressField label="Identificacao">
            <input
              className={inputClass}
              value={form.label}
              onChange={(event) =>
                setForm({
                  ...form,
                  label: formatAddressText(event.target.value, 60),
                })
              }
              maxLength={60}
              placeholder="Casa, trabalho..."
              required
            />
          </AddressField>
          <AddressField label="CEP" hint={cepStatus}>
            <input
              className={inputClass}
              value={form.cep}
              onChange={(event) => changeCep(event.target.value)}
              onBlur={() => void lookupCep()}
              inputMode="numeric"
              autoComplete="postal-code"
              maxLength={9}
              placeholder="00000-000"
              required
            />
          </AddressField>
          <div className="col-span-2 max-[620px]:col-span-1">
            <AddressField label="Rua">
              <input
                className={inputClass}
                value={form.street}
                onChange={(event) =>
                  setForm({
                    ...form,
                    street: formatAddressText(event.target.value, 255),
                  })
                }
                autoComplete="address-line1"
                maxLength={255}
                required
              />
            </AddressField>
          </div>
          <AddressField label="Bairro">
            <input
              className={inputClass}
              value={form.neighborhood}
              onChange={(event) =>
                setForm({
                  ...form,
                  neighborhood: formatAddressText(event.target.value, 120),
                })
              }
              maxLength={120}
              required
            />
          </AddressField>
          <AddressField label="Numero">
            <input
              className={inputClass}
              value={form.number}
              onChange={(event) =>
                setForm({
                  ...form,
                  number: formatHouseNumber(event.target.value),
                })
              }
              maxLength={30}
              required
            />
          </AddressField>
          <AddressField label="Complemento / referencia">
            <input
              className={inputClass}
              value={form.reference}
              onChange={(event) =>
                setForm({
                  ...form,
                  reference: formatAddressText(event.target.value, 255),
                })
              }
              maxLength={255}
            />
          </AddressField>
          <AddressField label="Cidade">
            <input
              className={inputClass}
              value={form.city}
              onChange={(event) =>
                setForm({
                  ...form,
                  city: formatPersonName(event.target.value, 120),
                })
              }
              maxLength={120}
              required
            />
          </AddressField>
          <AddressField label="Estado">
            <input
              className={inputClass}
              value={form.state}
              onChange={(event) =>
                setForm({ ...form, state: formatState(event.target.value) })
              }
              maxLength={2}
              placeholder="UF"
              required
            />
          </AddressField>
        </div>

        <label className="mt-5 flex cursor-pointer items-center gap-2.5 text-[.72rem]">
          <input
            type="checkbox"
            className="accent-bubble-ink"
            checked={form.isDefault}
            onChange={(event) =>
              setForm({ ...form, isDefault: event.target.checked })
            }
          />
          Usar como endereco principal
        </label>

        {message ? (
          <p className="mt-4 text-[.72rem] text-bubble-danger">{message}</p>
        ) : null}

        <div className="mt-7 flex justify-end gap-3 border-t border-bubble-line pt-5">
          <button
            type="button"
            className="border border-bubble-ink px-5 py-3 font-sans text-[.68rem] font-semibold uppercase tracking-[.1em]"
            onClick={() => setEditingId(null)}
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={busy}
            className="inline-flex items-center gap-2 bg-bubble-ink px-6 py-3 font-sans text-[.68rem] font-semibold uppercase tracking-[.1em] text-bubble-white disabled:opacity-50"
          >
            <Save className="size-4" />
            {busy ? "Salvando..." : "Salvar endereco"}
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="border border-bubble-ink bg-bubble-white p-7 max-[620px]:p-5">
      <div className="mb-7 flex items-start justify-between gap-4 border-b border-bubble-line pb-5">
        <div>
          <h2 className="text-2xl">Meus enderecos</h2>
          <p className="mt-1 text-[.72rem] text-bubble-ink/55">
            Cadastre enderecos para agilizar suas proximas compras.
          </p>
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-2 bg-bubble-ink px-4 py-3 font-sans text-[.66rem] font-semibold uppercase tracking-[.1em] text-bubble-white"
          onClick={startCreate}
        >
          <Plus className="size-4" /> Novo
        </button>
      </div>

      {message ? (
        <p className="mb-4 text-[.72rem] text-bubble-danger">{message}</p>
      ) : null}

      {loading ? (
        <p className="py-12 text-center text-[.74rem] text-bubble-ink/50">
          Carregando enderecos...
        </p>
      ) : safeAddresses.length ? (
        <div className="grid grid-cols-2 gap-4 max-[680px]:grid-cols-1">
          {safeAddresses.map((address) => (
            <article
              key={address.id}
              className={`relative border p-5 ${
                address.isDefault
                  ? "border-bubble-ink bg-bubble-cream"
                  : "border-bubble-line"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <MapPin className="size-4" />
                  <h3 className="text-lg">{address.label}</h3>
                </div>
                {address.isDefault ? (
                  <span className="inline-flex items-center gap-1 bg-bubble-ink px-2 py-1 font-sans text-[.55rem] uppercase tracking-[.08em] text-bubble-white">
                    <Star className="size-3 fill-current" /> Principal
                  </span>
                ) : null}
              </div>
              <p className="mt-4 text-[.72rem] leading-[1.65] text-bubble-ink/65">
                {address.street}, {address.number}
                {address.reference ? ` · ${address.reference}` : ""}
                <br />
                {address.neighborhood} · {address.city}/{address.state}
                <br />
                CEP {address.cep}
              </p>
              <div className="mt-5 flex flex-wrap gap-3 border-t border-bubble-line pt-4">
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 text-[.66rem] underline"
                  onClick={() => startEdit(address)}
                >
                  <Pencil className="size-3.5" /> Editar
                </button>
                {!address.isDefault ? (
                  <button
                    type="button"
                    className="inline-flex items-center gap-1.5 text-[.66rem] underline"
                    onClick={() => void makeDefault(address.id)}
                  >
                    <Star className="size-3.5" /> Tornar principal
                  </button>
                ) : null}
                <button
                  type="button"
                  className="ml-auto inline-flex items-center gap-1.5 text-[.66rem] text-bubble-danger underline"
                  onClick={() => void deleteAddress(address)}
                >
                  <Trash2 className="size-3.5" /> Excluir
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center px-4 py-14 text-center">
          <MapPin className="size-9 text-bubble-ink/25" />
          <h3 className="mt-4 text-xl">Nenhum endereco salvo</h3>
          <p className="mt-2 max-w-[360px] text-[.74rem] leading-[1.6] text-bubble-ink/50">
            Cadastre seu primeiro endereco para preencher o checkout
            automaticamente.
          </p>
          <button
            type="button"
            className="mt-6 inline-flex items-center gap-2 bg-bubble-ink px-6 py-3.5 font-sans text-[.68rem] font-semibold uppercase tracking-[.12em] text-bubble-white"
            onClick={startCreate}
          >
            <Plus className="size-4" /> Cadastrar endereco
          </button>
        </div>
      )}
    </div>
  );
}

function AddressField({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label>
      <span className={labelClass}>{label}</span>
      {children}
      {hint ? (
        <span
          className={`mt-1.5 block text-[.64rem] ${
            hint.startsWith("Nao") || hint.includes("nao encontrado")
              ? "text-bubble-danger"
              : "text-bubble-success"
          }`}
        >
          {hint}
        </span>
      ) : null}
    </label>
  );
}
