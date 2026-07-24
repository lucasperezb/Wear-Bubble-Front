'use client';

import { useState } from 'react';
import { adminNote } from './admin.styles';
import type { AdminDump } from './admin.types';

export function DatabaseAdmin({ dump }: { dump: AdminDump }) {
  const collections = [
    { name: 'users', desc: 'Contas sem dados pessoais', records: dump.users },
    { name: 'pii_vault', desc: 'Cofre de dados pessoais', records: dump.pii_vault || [] },
    { name: 'products', desc: 'Catalogo completo', records: dump.products },
    { name: 'orders', desc: 'Pedidos', records: dump.orders },
    { name: 'events', desc: 'Telemetria pseudoanonimizada', records: dump.events },
    { name: 'leads', desc: 'Novidades por e-mail', records: dump.leads },
    { name: 'coupons', desc: 'Cupons de desconto', records: dump.coupons },
    { name: 'deletion_reports', desc: 'Relatorios de exclusao LGPD', records: dump.deletion_reports || [] },
  ];
  const [open, setOpen] = useState('products');

  return (
    <>
      <div className="mb-5 border border-bubble-candy bg-bubble-candy/15 px-[13px] py-[11px] text-[.68rem] leading-[1.6] text-bubble-ink"><b>Banco de dados: PostgreSQL.</b> Os dados ficam persistidos no banco do projeto e valem para todos os dispositivos.</div>
      {collections.map((collection) => (
        <div className="mb-3.5 border border-bubble-line bg-bubble-white" key={collection.name}>
          <div className="flex cursor-pointer items-center justify-between px-[18px] py-3.5" onClick={() => setOpen(open === collection.name ? '' : collection.name)}>
            <div><span className="font-mono text-[.85rem] font-semibold">db.{collection.name}</span> <span className="text-[.68rem] text-bubble-ink/50">- {collection.records.length} registro(s)</span></div>
            <span className="text-[.7rem] text-bubble-ink/50">{collection.desc} v</span>
          </div>
          <div className={`${open === collection.name ? 'block' : 'hidden'} px-[18px] pb-4`}>
            <pre className="m-0 max-h-[280px] overflow-auto bg-bubble-ink p-3.5 text-[.68rem] leading-[1.5] text-bubble-cream2">{JSON.stringify(collection.records.slice(0, 8), null, 2)}</pre>
            {collection.records.length > 8 ? <p className={adminNote}>Mostrando 8 de {collection.records.length} registros.</p> : null}
          </div>
        </div>
      ))}
    </>
  );
}
