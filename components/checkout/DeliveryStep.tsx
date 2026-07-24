'use client';

import { useRef, useState } from 'react';
import type { User } from '../../lib/api';
import {
  formatAddressText,
  formatEmail,
  formatCpf,
  formatHouseNumber,
  formatPersonName,
  formatPhone,
  formatState,
} from '../../lib/input-formatters';
import type { DeliveryProfile } from './checkout.types';

type DeliveryStepProps = {
  user: User | null;
  profile: DeliveryProfile;
  message: string;
  onProfile: (patch: Partial<DeliveryProfile>) => void;
  onBack: () => void;
};

const inputClass = 'w-full border border-bubble-line bg-bubble-cream px-3.5 py-3 text-[.88rem] outline-none focus:border-bubble-ink focus:bg-bubble-white';
const labelClass = 'mb-1.5 block font-sans text-[.68rem] font-semibold uppercase tracking-[.08em] text-bubble-ink/60';

export function DeliveryStep({ user, profile, message, onProfile, onBack }: DeliveryStepProps) {
  const [cepStatus, setCepStatus] = useState('');
  const lastCep = useRef('');

  async function lookupCep(value: string) {
    const cep = value.replace(/\D/g, '');
    if (cep.length !== 8 || cep === lastCep.current) return;
    lastCep.current = cep;
    setCepStatus('Consultando CEP...');
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      if (!response.ok) throw new Error();
      const address = await response.json() as {
        erro?: boolean;
        cep?: string;
        logradouro?: string;
        bairro?: string;
        localidade?: string;
        uf?: string;
      };
      if (address.erro) {
        lastCep.current = '';
        setCepStatus('CEP nao encontrado. Confira os numeros ou preencha o endereco manualmente.');
        return;
      }
      onProfile({
        cep: address.cep || formatCep(cep),
        street: address.logradouro || profile.street,
        neighborhood: address.bairro || profile.neighborhood,
        city: address.localidade || profile.city,
        state: address.uf || profile.state,
      });
      setCepStatus('Endereco preenchido pelo CEP. Confira o numero e o complemento.');
    } catch {
      lastCep.current = '';
      setCepStatus('Nao foi possivel consultar o CEP. Voce pode preencher o endereco manualmente.');
    }
  }

  function changeCep(value: string) {
    const digits = value.replace(/\D/g, '').slice(0, 8);
    const formatted = formatCep(digits);
    onProfile({ cep: formatted });
    setCepStatus('');
    if (digits.length === 8) void lookupCep(digits);
  }

  return (
    <section>
      <h1 className="mb-6 text-[clamp(2rem,5vw,3.5rem)]">Entrega</h1>
      <div className="border border-bubble-line bg-bubble-white p-6">
        <h2 className="mb-5 text-xl">Endereco de entrega</h2>
        {!user ? (
          <div className="mb-5 border border-bubble-candy bg-bubble-candy/15 p-4 text-[.76rem] leading-[1.6] text-bubble-ink/70">
            Voce pode comprar sem criar uma senha. Depois, use um codigo enviado para este e-mail para acompanhar o pedido.
          </div>
        ) : null}
        <div className="grid grid-cols-2 gap-4 max-[620px]:grid-cols-1">
          <label><span className={labelClass}>Nome completo</span><input className={inputClass} value={profile.name} onChange={(event) => onProfile({ name: formatPersonName(event.target.value) })} autoComplete="name" maxLength={150} /></label>
          <label><span className={labelClass}>E-mail</span><input className={inputClass} value={profile.email} onChange={(event) => onProfile({ email: formatEmail(event.target.value) })} type="email" inputMode="email" autoCapitalize="none" spellCheck={false} autoComplete="email" readOnly={Boolean(user)} maxLength={255} placeholder="voce@email.com" /></label>
          <label><span className={labelClass}>CPF</span><input className={inputClass} value={profile.taxId} onChange={(event) => onProfile({ taxId: formatCpf(event.target.value) })} inputMode="numeric" autoComplete="off" maxLength={14} placeholder="000.000.000-00" /></label>
          <label><span className={labelClass}>Telefone</span><input className={inputClass} value={profile.phone} onChange={(event) => onProfile({ phone: formatPhone(event.target.value) })} type="tel" inputMode="tel" autoComplete="tel" maxLength={15} placeholder="(11) 99999-9999" /></label>
          <label>
            <span className={labelClass}>CEP</span>
            <input className={inputClass} value={profile.cep} onChange={(event) => changeCep(event.target.value)} onBlur={(event) => void lookupCep(event.target.value)} inputMode="numeric" autoComplete="postal-code" placeholder="00000-000" />
            {cepStatus ? <span className={`mt-1.5 block text-[.68rem] leading-[1.4] ${cepStatus.startsWith('Nao') || cepStatus.startsWith('CEP nao') ? 'text-bubble-danger' : 'text-bubble-success'}`}>{cepStatus}</span> : null}
          </label>
          <label><span className={labelClass}>Bairro</span><input className={inputClass} value={profile.neighborhood} onChange={(event) => onProfile({ neighborhood: formatAddressText(event.target.value, 120) })} autoComplete="address-level3" maxLength={120} /></label>
          <label className="col-span-2 max-[620px]:col-span-1"><span className={labelClass}>Rua</span><input className={inputClass} value={profile.street} onChange={(event) => onProfile({ street: formatAddressText(event.target.value, 255) })} autoComplete="address-line1" maxLength={255} /></label>
          <label><span className={labelClass}>Numero</span><input className={inputClass} value={profile.number} onChange={(event) => onProfile({ number: formatHouseNumber(event.target.value) })} autoComplete="address-line2" maxLength={30} placeholder="123, 12A ou S/N" /></label>
          <label><span className={labelClass}>Complemento / referencia</span><input className={inputClass} value={profile.reference} onChange={(event) => onProfile({ reference: formatAddressText(event.target.value, 255) })} maxLength={255} /></label>
          <label><span className={labelClass}>Cidade</span><input className={inputClass} value={profile.city} onChange={(event) => onProfile({ city: formatPersonName(event.target.value, 120) })} autoComplete="address-level2" maxLength={120} /></label>
          <label><span className={labelClass}>Estado</span><input className={inputClass} value={profile.state} onChange={(event) => onProfile({ state: formatState(event.target.value) })} autoComplete="address-level1" autoCapitalize="characters" maxLength={2} placeholder="UF" /></label>
        </div>
        {message ? <p className="mt-4 text-[.75rem] text-bubble-danger">{message}</p> : null}
        <div className="mt-6">
          <button className="border border-bubble-ink px-6 py-3 font-sans text-[.72rem] font-semibold uppercase tracking-[.1em]" onClick={onBack}>Voltar</button>
        </div>
      </div>
    </section>
  );
}

function formatCep(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  return digits.length > 5 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits;
}
