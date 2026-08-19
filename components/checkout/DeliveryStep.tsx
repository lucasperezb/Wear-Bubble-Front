"use client";

import { useRef, useState } from "react";
import type { AccountAddress, User } from "../../lib/api";
import {
  formatAddressText,
  formatHouseNumber,
  formatPersonName,
  formatState,
} from "../../lib/input-formatters";
import type { DeliveryProfile, ShippingOption } from "./checkout.types";

type DeliveryStepProps = {
  user: User | null;
  addresses: AccountAddress[];
  selectedAddressId: string | null;
  showAddressForm: boolean;
  shippingOptions: ShippingOption[];
  selectedShippingToken: string | null;
  shippingLoading: boolean;
  freeShipping: boolean;
  profile: DeliveryProfile;
  message: string;
  onProfile: (patch: Partial<DeliveryProfile>) => void;
  onSelectAddress: (address: AccountAddress) => void;
  onAddAddress: () => void;
  onSelectShipping: (option: ShippingOption) => void;
  onBack: () => void;
};

const inputClass =
  "w-full border border-bubble-line bg-bubble-cream px-3.5 py-3 text-[.88rem] outline-none focus:border-bubble-ink focus:bg-bubble-white";
const labelClass =
  "mb-1.5 block font-sans text-[.68rem] font-semibold uppercase tracking-[.08em] text-bubble-ink/60";

export function DeliveryStep({
  user,
  addresses,
  selectedAddressId,
  showAddressForm,
  shippingOptions,
  selectedShippingToken,
  shippingLoading,
  freeShipping,
  profile,
  message,
  onProfile,
  onSelectAddress,
  onAddAddress,
  onSelectShipping,
  onBack,
}: DeliveryStepProps) {
  const [cepStatus, setCepStatus] = useState("");
  const lastCep = useRef("");

  async function lookupCep(value: string) {
    const cep = value.replace(/\D/g, "");
    if (cep.length !== 8 || cep === lastCep.current) return;
    lastCep.current = cep;
    setCepStatus("Consultando CEP...");
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      if (!response.ok) throw new Error();
      const address = (await response.json()) as {
        erro?: boolean;
        cep?: string;
        logradouro?: string;
        bairro?: string;
        localidade?: string;
        uf?: string;
      };
      if (address.erro) {
        lastCep.current = "";
        setCepStatus(
          "CEP não encontrado. Confira os números ou preencha o endereço manualmente.",
        );
        return;
      }
      onProfile({
        cep: address.cep || formatCep(cep),
        street: address.logradouro || profile.street,
        neighborhood: address.bairro || profile.neighborhood,
        city: address.localidade || profile.city,
        state: address.uf || profile.state,
      });
      setCepStatus(
        "Endereço preenchido pelo CEP. Confira o número e o complemento.",
      );
    } catch {
      lastCep.current = "";
      setCepStatus(
        "Não foi possível consultar o CEP. Você pode preencher o endereço manualmente.",
      );
    }
  }

  function changeCep(value: string) {
    const digits = value.replace(/\D/g, "").slice(0, 8);
    const formatted = formatCep(digits);
    onProfile({ cep: formatted });
    setCepStatus("");
    if (digits.length === 8) void lookupCep(digits);
  }

  return (
    <section>
      <h1 className="mb-6 text-[clamp(2rem,5vw,3.5rem)]">Entrega</h1>
      <div className="border border-bubble-line bg-bubble-white p-6">
        {user && addresses.length > 0 && !showAddressForm ? (
          <>
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl">Escolha o endereço de entrega</h2>
                <p className="mt-1 text-[.74rem] text-bubble-ink/55">
                  O endereço selecionado será usado neste pedido.
                </p>
              </div>
              <button
                type="button"
                className="border border-bubble-ink px-4 py-2.5 font-sans text-[.66rem] font-semibold uppercase tracking-[.08em]"
                onClick={onAddAddress}
              >
                Cadastrar outro endereço
              </button>
            </div>
            <div className="grid gap-3">
              {addresses.map((address) => {
                const selected = address.id === selectedAddressId;
                return (
                  <button
                    type="button"
                    key={address.id}
                    aria-pressed={selected}
                    className={`flex items-start gap-3 border p-4 text-left transition-colors ${
                      selected
                        ? "border-bubble-ink bg-bubble-ink text-bubble-white"
                        : "border-bubble-line bg-bubble-cream"
                    }`}
                    onClick={() => onSelectAddress(address)}
                  >
                    <span
                      className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border ${
                        selected
                          ? "border-bubble-candy"
                          : "border-bubble-ink/35"
                      }`}
                    >
                      {selected ? (
                        <span className="size-2.5 rounded-full bg-bubble-candy" />
                      ) : null}
                    </span>
                    <span>
                      <strong className="font-sans text-[.72rem] uppercase tracking-[.08em]">
                        {address.label || "Endereço"}
                        {address.isDefault ? " · Principal" : ""}
                      </strong>
                      <span className="mt-1 block text-[.78rem] leading-[1.55] opacity-75">
                        {address.street}, {address.number}
                        {address.reference ? ` · ${address.reference}` : ""}
                        <br />
                        {address.neighborhood
                          ? `${address.neighborhood} · `
                          : ""}
                        {address.city}/{address.state} · CEP {address.cep}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </>
        ) : (
          <>
            <h2 className="mb-1 text-xl">
              {user ? "Cadastrar endereço de entrega" : "Endereço de entrega"}
            </h2>
            <p className="mb-5 text-[.74rem] text-bubble-ink/55">
              Comece pelo CEP para preenchermos o endereço automaticamente.
              {user ? " O novo endereço ficará salvo na sua conta." : ""}
            </p>
            {!user ? (
              <div className="mb-5 border border-bubble-candy bg-bubble-candy/15 p-4 text-[.76rem] leading-[1.6] text-bubble-ink/70">
                Você pode comprar sem criar uma senha. Depois, use um código
                enviado para este e-mail para acompanhar o pedido.
              </div>
            ) : null}
            <div className="grid grid-cols-2 gap-4 max-[620px]:grid-cols-1">
              <label className="col-span-2 max-[620px]:col-span-1">
                <span className={labelClass}>CEP</span>
                <input
                  className={inputClass}
                  value={profile.cep}
                  onChange={(event) => changeCep(event.target.value)}
                  onBlur={(event) => void lookupCep(event.target.value)}
                  inputMode="numeric"
                  autoComplete="postal-code"
                  placeholder="00000-000"
                />
                {cepStatus ? (
                  <span
                    className={`mt-1.5 block text-[.68rem] leading-[1.4] ${cepStatus.startsWith("Não") || cepStatus.startsWith("CEP não") ? "text-bubble-danger" : "text-bubble-success"}`}
                  >
                    {cepStatus}
                  </span>
                ) : null}
              </label>
              <label>
                <span className={labelClass}>Bairro</span>
                <input
                  className={inputClass}
                  value={profile.neighborhood}
                  onChange={(event) =>
                    onProfile({
                      neighborhood: formatAddressText(event.target.value, 120),
                    })
                  }
                  autoComplete="address-level3"
                  maxLength={120}
                />
              </label>
              <label className="col-span-2 max-[620px]:col-span-1">
                <span className={labelClass}>Rua</span>
                <input
                  className={inputClass}
                  value={profile.street}
                  onChange={(event) =>
                    onProfile({
                      street: formatAddressText(event.target.value, 255),
                    })
                  }
                  autoComplete="address-line1"
                  maxLength={255}
                />
              </label>
              <label>
                <span className={labelClass}>Número</span>
                <input
                  className={inputClass}
                  value={profile.number}
                  onChange={(event) =>
                    onProfile({ number: formatHouseNumber(event.target.value) })
                  }
                  autoComplete="address-line2"
                  maxLength={30}
                  placeholder="123, 12A ou S/N"
                />
              </label>
              <label>
                <span className={labelClass}>Complemento / referência</span>
                <input
                  className={inputClass}
                  value={profile.reference}
                  onChange={(event) =>
                    onProfile({
                      reference: formatAddressText(event.target.value, 255),
                    })
                  }
                  maxLength={255}
                />
              </label>
              <label>
                <span className={labelClass}>Cidade</span>
                <input
                  className={inputClass}
                  value={profile.city}
                  onChange={(event) =>
                    onProfile({
                      city: formatPersonName(event.target.value, 120),
                    })
                  }
                  autoComplete="address-level2"
                  maxLength={120}
                />
              </label>
              <label>
                <span className={labelClass}>Estado</span>
                <input
                  className={inputClass}
                  value={profile.state}
                  onChange={(event) =>
                    onProfile({ state: formatState(event.target.value) })
                  }
                  autoComplete="address-level1"
                  autoCapitalize="characters"
                  maxLength={2}
                  placeholder="UF"
                />
              </label>
            </div>
          </>
        )}
        {shippingLoading ? (
          <div className="mt-6 border border-bubble-line bg-bubble-cream p-5 text-center text-[.78rem] text-bubble-ink/60">
            Consultando transportadoras...
          </div>
        ) : null}
        {shippingOptions.length > 0 ? (
          <div className="mt-6 border-t border-bubble-line pt-6">
            <h2 className="mb-1 text-xl">Opções de entrega</h2>
            <p className="mb-4 text-[.74rem] text-bubble-ink/55">
              Selecione o prazo e o valor que preferir.
            </p>
            <div className="grid gap-3">
              {shippingOptions.map((option) => {
                const selected = option.quoteToken === selectedShippingToken;
                return (
                  <button
                    type="button"
                    key={option.quoteToken}
                    aria-pressed={selected}
                    onClick={() => onSelectShipping(option)}
                    className={`grid grid-cols-[1fr_auto] items-center gap-4 border p-4 text-left ${
                      selected
                        ? "border-bubble-ink bg-bubble-ink text-bubble-white"
                        : "border-bubble-line bg-bubble-cream"
                    }`}
                  >
                    <span>
                      <strong className="font-sans text-[.76rem] uppercase tracking-[.08em]">
                        {option.company} · {option.name}
                      </strong>
                      <span className="mt-1 block text-[.72rem] opacity-70">
                        Entrega estimada em até {option.deliveryTime} dias úteis
                      </span>
                    </span>
                    <strong className="text-base">
                      {freeShipping
                        ? "Grátis"
                        : new Intl.NumberFormat("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          }).format(option.price)}
                    </strong>
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}
        {message ? (
          <p className="mt-4 text-[.75rem] text-bubble-danger">{message}</p>
        ) : null}
        <div className="mt-6">
          <button
            className="border border-bubble-ink px-6 py-3 font-sans text-[.72rem] font-semibold uppercase tracking-[.1em]"
            onClick={onBack}
          >
            Voltar
          </button>
        </div>
      </div>
    </section>
  );
}

function formatCep(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  return digits.length > 5
    ? `${digits.slice(0, 5)}-${digits.slice(5)}`
    : digits;
}
