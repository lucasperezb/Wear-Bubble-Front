'use client';

import { useEffect, useState } from 'react';
import { apiFetch, money, type Order, type ReturnRequest } from '../../../lib/api';
import type { Notify } from '../shared/types';

const kindLabels = { exchange: 'Troca por crédito', return: 'Devolução', defect: 'Defeito ou avaria' };

export function ReturnsAdmin({ orders, notify }: { orders: Order[]; notify: Notify }) {
  const [requests, setRequests] = useState<ReturnRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');
  useEffect(() => { void load(); }, []);

  async function load() {
    setLoading(true);
    try { setRequests(await apiFetch<ReturnRequest[]>('/returns')); }
    catch (error) { notify(error instanceof Error ? error.message : 'Não foi possível carregar as solicitações.'); }
    finally { setLoading(false); }
  }

  async function update(request: ReturnRequest, body: Record<string, unknown>) {
    setBusy(request.id);
    try {
      await apiFetch(`/returns/${request.id}`, { method: 'PATCH', body: JSON.stringify(body) });
      await load();
    } catch (error) { notify(error instanceof Error ? error.message : 'Não foi possível atualizar.'); }
    finally { setBusy(''); }
  }

  async function posting(request: ReturnRequest) {
    const postingCode = window.prompt('Código de postagem reversa:');
    if (!postingCode) return;
    const postingExpiresAt = window.prompt('Validade no formato AAAA-MM-DD:');
    await update(request, { status: 'awaiting_posting', postingCode, ...(postingExpiresAt ? { postingExpiresAt } : {}), publicNote: 'Leve o pacote a uma agência dos Correios e apresente o código de postagem.' });
  }

  async function resolve(request: ReturnRequest, resolution: 'credit' | 'refund') {
    const estimated = request.items.reduce((sum, item) => sum + item.unitRefundValue * item.quantity, 0);
    const input = window.prompt('Valor aprovado:', estimated.toFixed(2).replace('.', ','));
    if (!input) return;
    const amount = Number(input.replace(',', '.'));
    if (!Number.isFinite(amount) || amount <= 0) return notify('Informe um valor válido.');
    if (!window.confirm(`${resolution === 'credit' ? 'Gerar crédito' : 'Solicitar estorno'} de ${money.format(amount)}?`)) return;
    setBusy(request.id);
    try {
      await apiFetch(`/returns/${request.id}/resolve`, { method: 'POST', body: JSON.stringify({ resolution, amount }) });
      await load();
      notify(resolution === 'credit' ? 'Crédito Wear Bubble gerado.' : 'Estorno solicitado ao Asaas.');
    } catch (error) { notify(error instanceof Error ? error.message : 'Não foi possível concluir.'); }
    finally { setBusy(''); }
  }

  if (loading) return <p>Carregando trocas e devoluções...</p>;
  return (
    <section>
      <div className="mb-6"><p className="adminEyebrow">Pós-venda</p><h2 className="adminSectionTitle">Trocas e devoluções</h2><p className="mt-1 text-sm text-bubble-ink/60">Aprove solicitações, registre a logística reversa, inspecione peças e conclua o atendimento.</p></div>
      <div className="space-y-4">
        {requests.map((request) => {
          const order = orders.find((item) => item.id === request.orderId);
          return (
            <article className="border border-bubble-line bg-bubble-white" key={request.id}>
              <header className="flex flex-wrap items-start justify-between gap-4 border-b border-bubble-line p-5">
                <div><span className="text-[.62rem] uppercase tracking-[.12em] text-bubble-ink/45">{request.protocol}</span><h3 className="text-xl">Pedido #{order?.number || request.orderId}</h3><p className="mt-1 text-sm">{kindLabels[request.kind]} · {request.reason}</p></div>
                <span className="border border-bubble-line px-3 py-1.5 text-xs font-semibold uppercase">{request.events.at(-1)?.label || request.status}</span>
              </header>
              <div className="grid gap-5 p-5 lg:grid-cols-2">
                <div>
                  <h4 className="text-sm font-semibold">Relato do cliente</h4><p className="mt-2 min-h-10 text-sm text-bubble-ink/65">{request.details || 'Nenhum detalhe adicional.'}</p>
                  <div className="mt-4 space-y-2">{request.items.map((item) => {
                    const original = order?.items.find((line) => line.id === item.orderItemId);
                    return <div className="border border-bubble-line bg-bubble-cream p-3 text-sm" key={item.id}>
                      <strong>{item.quantity}x {original?.name || `Item ${item.orderItemId}`}</strong>{original ? <span> · {original.color} · {original.size}</span> : null}
                      <div className="mt-2 flex flex-wrap gap-2">{(['resellable', 'damaged'] as const).map((condition) => <button type="button" key={condition} disabled={!['received', 'inspecting'].includes(request.status)} onClick={() => void update(request, { itemId: item.id, condition })} className={`border px-2 py-1 text-[.62rem] uppercase disabled:opacity-35 ${item.condition === condition ? 'border-bubble-ink bg-bubble-ink text-white' : 'border-bubble-line'}`}>{condition === 'resellable' ? 'Revendável' : 'Avariado'}</button>)}</div>
                    </div>;
                  })}</div>
                </div>
                <div>
                  <h4 className="text-sm font-semibold">Operação</h4>{request.publicNote ? <p className="mt-2 text-sm text-bubble-ink/65">{request.publicNote}</p> : null}
                  {request.postingCode ? <p className="mt-3 text-sm"><strong>Postagem:</strong> {request.postingCode}</p> : null}{request.returnTracking ? <p className="mt-1 text-sm"><strong>Rastreio:</strong> {request.returnTracking}</p> : null}
                  <div className="mt-5 flex flex-wrap gap-2 [&_button]:border [&_button]:border-bubble-ink [&_button]:px-3 [&_button]:py-2 [&_button]:text-[.62rem] [&_button]:font-semibold [&_button]:uppercase disabled:[&_button]:opacity-40">
                    {request.status === 'requested' ? <button disabled={busy === request.id} onClick={() => void update(request, { status: 'approved', publicNote: 'Solicitação aprovada. Prepararemos o código de postagem.' })}>Aprovar</button> : null}
                    {['requested', 'approved'].includes(request.status) ? <button disabled={busy === request.id} className="text-bubble-danger" onClick={() => void update(request, { status: 'rejected', publicNote: window.prompt('Motivo da rejeição:') || 'Solicitação não aprovada após análise.' })}>Rejeitar</button> : null}
                    {request.status === 'approved' ? <button onClick={() => void posting(request)}>Informar postagem</button> : null}
                    {request.status === 'awaiting_posting' ? <button onClick={() => void update(request, { status: 'returning', publicNote: 'A postagem foi identificada e o produto está retornando.' })}>Marcar postado</button> : null}
                    {request.status === 'returning' ? <button onClick={() => void update(request, { status: 'received', publicNote: 'Recebemos o pacote e iniciaremos a inspeção.' })}>Registrar recebimento</button> : null}
                    {request.status === 'received' ? <button onClick={() => void update(request, { status: 'inspecting', publicNote: 'As peças estão em inspeção.' })}>Iniciar inspeção</button> : null}
                    {request.status === 'inspecting' ? <><button onClick={() => void resolve(request, 'credit')}>Gerar crédito</button>{request.kind !== 'exchange' ? <button onClick={() => void resolve(request, 'refund')}>Estornar Asaas</button> : null}</> : null}
                  </div>
                </div>
              </div>
            </article>
          );
        })}
        {!requests.length ? <div className="border border-dashed border-bubble-line bg-white p-12 text-center text-sm text-bubble-ink/50">Nenhuma solicitação recebida.</div> : null}
      </div>
    </section>
  );
}
