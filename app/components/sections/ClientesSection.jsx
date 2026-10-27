'use client';

import React, { useState, useMemo } from 'react';
import {
  Users,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Plus,
  Edit2,
  Trash2,
  ChevronDown,
  RefreshCw,
  XCircle,
  Search,
  MessageCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import StatusBadge from '@/app/components/ui/StatusBadge.jsx';
import { formatMoney, formatDate } from '@/lib/dashboard/format.js';
import { formatWhatsappDisplay } from '@/lib/whatsapp/billing.js';

function getInitials(name = '') {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'CL';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

const AVATAR_TONES = [
  'bg-accent/15 text-accent-fg border-accent/25',
  'bg-pos/15 text-pos border-pos/25',
  'bg-traffic/15 text-traffic border-traffic/25',
  'bg-warn/15 text-warn border-warn/25',
];

export default function ClientesSection({
  clients = [],
  receivables = [],
  expandedClients = {},
  onToggleExpand,
  onOpenModal,
  onOpenBillingModal,
  onRenewContract,
  onCancelContract,
  onDeleteClient,
  onMarkReceivablePaid,
  onDeleteReceivable,
}) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('Todos');

  const activeList = useMemo(
    () => clients.filter((c) => c.contract_status !== 'Cancelado'),
    [clients]
  );

  const expiredContracts = useMemo(
    () => activeList.filter((c) => c.contract_status === 'Vencido'),
    [activeList]
  );

  const activeContractsCount = useMemo(
    () => activeList.filter((c) => (c.contract_status || 'Ativo') === 'Ativo').length,
    [activeList]
  );

  const totalPendingPortfolio = useMemo(() => {
    const activeIds = new Set(activeList.map((c) => c.id));
    return receivables
      .filter((r) => activeIds.has(r.client_id) && r.status !== 'Pago')
      .reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0);
  }, [activeList, receivables]);

  const filteredClients = useMemo(() => {
    return activeList.filter((c) => {
      const status = c.contract_status || 'Ativo';
      if (statusFilter !== 'Todos' && status !== statusFilter) return false;
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        return String(c.name || '').toLowerCase().includes(q);
      }
      return true;
    });
  }, [activeList, statusFilter, search]);

  return (
    <div className="space-y-6">
      {/* Cabeçalho estilo Storyboard (Frame 0106 "Customers") */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-[28px] font-semibold text-fg tracking-tight">
            Clientes
          </h1>
          <p className="text-sm text-muted mt-0.5">
            Gerencie contratos, recorrências e cobranças da carteira
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative">
            <Search
              className="w-4 h-4 text-subtle absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar cliente..."
              aria-label="Buscar cliente"
              className="h-10 pl-9 pr-4 rounded-full bg-surface border border-line text-sm text-fg placeholder:text-subtle focus:outline-none focus:ring-2 focus:ring-accent/60 w-48 sm:w-60"
            />
          </div>

          <button
            type="button"
            onClick={() =>
              onOpenModal({
                isOpen: true,
                type: 'client',
                data: null,
                parentId: null,
                parentName: '',
              })
            }
            className="h-10 inline-flex items-center gap-1.5 bg-accent hover:bg-accent/90 text-white px-4 rounded-full text-sm font-medium shadow-md shadow-accent/20 transition-all active:scale-[0.98] cursor-pointer"
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
            <span>Novo Cliente</span>
          </button>
        </div>
      </div>

      {/* 4 Cards de Resumo (Frame 0106) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="uv-card p-4 sm:p-5 flex flex-col justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-full bg-accent/12 border border-accent/25 text-accent-fg inline-flex items-center justify-center">
              <Users className="w-4 h-4" aria-hidden="true" />
            </span>
            <span className="text-xs font-medium text-muted">
              Total de Clientes
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-fg uv-num">
              {activeList.length}
            </div>
            <div className="text-[11px] text-subtle mt-0.5">
              Em todas as recorrências
            </div>
          </div>
        </div>

        <div className="uv-card p-4 sm:p-5 flex flex-col justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-full bg-pos/12 border border-pos/25 text-pos inline-flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
            </span>
            <span className="text-xs font-medium text-muted">
              Contratos Ativos
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-fg uv-num">
              {activeContractsCount}
            </div>
            <div className="text-[11px] text-subtle mt-0.5">
              Em vigência regular
            </div>
          </div>
        </div>

        <div className="uv-card p-4 sm:p-5 flex flex-col justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-full bg-traffic/12 border border-traffic/25 text-traffic inline-flex items-center justify-center">
              <TrendingUp className="w-4 h-4" aria-hidden="true" />
            </span>
            <span className="text-xs font-medium text-muted">
              Saldo a Receber
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-fg uv-num">
              {formatMoney(totalPendingPortfolio)}
            </div>
            <div className="text-[11px] text-subtle mt-0.5">
              Cobranças em aberto da carteira
            </div>
          </div>
        </div>

        <div className="uv-card p-4 sm:p-5 flex flex-col justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-full bg-neg/12 border border-neg/25 text-neg inline-flex items-center justify-center">
              <AlertCircle className="w-4 h-4" aria-hidden="true" />
            </span>
            <span className="text-xs font-medium text-muted">
              Contratos Vencidos
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-fg uv-num">
              {expiredContracts.length}
            </div>
            <div className="text-[11px] text-subtle mt-0.5">
              Aguardando renovação
            </div>
          </div>
        </div>
      </div>

      {/* Alerta de Contratos Vencidos */}
      {expiredContracts.length > 0 && (
        <div className="bg-neg/6 border border-neg/25 rounded-2xl p-4 space-y-3">
          <h3 className="text-neg font-semibold text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4" aria-hidden="true" /> Contratos
            Vencidos ({expiredContracts.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {expiredContracts.map((c) => (
              <div
                key={c.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-surface rounded-xl p-3 border border-line"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-fg font-medium text-sm break-words sm:truncate">
                    {c.name}
                  </p>
                  <p className="text-subtle text-xs mt-0.5 uv-num">
                    {c.contract_months} mês(es) · {c.payment_frequency} ·{' '}
                    {formatMoney(c.monthly_fee)}/recorrência
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => onOpenBillingModal?.(c)}
                    className="flex items-center gap-1 text-xs font-semibold text-pos border border-pos/30 bg-pos/10 px-3 py-1.5 rounded-lg hover:bg-pos/20 transition-colors cursor-pointer"
                  >
                    <MessageCircle className="w-3 h-3" aria-hidden="true" />{' '}
                    Cobrar
                  </button>
                  <button
                    type="button"
                    onClick={() => onRenewContract(c)}
                    className="flex items-center gap-1 text-xs text-pos border border-pos/25 px-3 py-1.5 rounded-lg hover:bg-pos/10 transition-colors cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" aria-hidden="true" /> Renovar
                  </button>
                  <button
                    type="button"
                    onClick={() => onCancelContract(c)}
                    className="flex items-center gap-1 text-xs text-neg border border-neg/25 px-3 py-1.5 rounded-lg hover:bg-neg/10 transition-colors cursor-pointer"
                  >
                    <XCircle className="w-3 h-3" aria-hidden="true" /> Cancelar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Card Principal: Lista de Clientes com Filtros e Accordion Fluido */}
      <div className="uv-card p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-line mb-3">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-full bg-surface-2 border border-line inline-flex items-center justify-center text-accent-fg">
              <Users className="w-4 h-4" aria-hidden="true" />
            </span>
            <h2 className="text-base font-semibold text-fg">
              Todos os Clientes
            </h2>
          </div>

          {/* Pílulas de filtro inspiradas no Frame 0106 */}
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { key: 'Todos', label: 'Todos', count: activeList.length },
              { key: 'Ativo', label: 'Ativos', count: activeContractsCount },
              {
                key: 'Vencido',
                label: 'Vencidos',
                count: expiredContracts.length,
              },
            ].map((pill) => {
              const active = statusFilter === pill.key;
              return (
                <button
                  key={pill.key}
                  type="button"
                  onClick={() => setStatusFilter(pill.key)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-colors cursor-pointer ${
                    active
                      ? 'bg-fg text-bg border-fg'
                      : 'bg-surface-2 text-muted border-line hover:text-fg'
                  }`}
                >
                  <span>{pill.label}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] uv-num ${
                      active ? 'bg-bg/20 text-bg' : 'bg-surface text-subtle'
                    }`}
                  >
                    {pill.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {filteredClients.length === 0 ? (
          <div className="rounded-xl p-10 text-center text-subtle text-sm">
            Nenhum cliente encontrado. Clique em &quot;Novo Cliente&quot; para
            começar.
          </div>
        ) : (
          <div
            role="region"
            aria-label="Lista de Clientes"
            tabIndex={0}
            className={`space-y-2.5 ${
              filteredClients.length > 1
                ? 'max-h-[620px] overflow-y-auto custom-scrollbar pr-1.5 -mr-1'
                : ''
            }`}
          >
            {filteredClients.map((client, idx) => {
              const clientRecs = receivables.filter(
                (r) => r.client_id === client.id
              );
              const isExpanded = Boolean(expandedClients[client.id]);
              const pendingSum = clientRecs
                .filter((r) => r.status !== 'Pago' && r.category !== 'trafego')
                .reduce((a, b) => a + parseFloat(b.amount), 0);
              const trafegoSum = clientRecs
                .filter((r) => r.status !== 'Pago' && r.category === 'trafego')
                .reduce((a, b) => a + parseFloat(b.amount), 0);
              const isActive = (client.contract_status || 'Ativo') === 'Ativo';
              const avatarTone = AVATAR_TONES[idx % AVATAR_TONES.length];
              const whatsappDisplay = client.whatsapp
                ? formatWhatsappDisplay(client.whatsapp)
                : '';

              return (
                <div
                  key={client.id}
                  className="rounded-2xl border border-line bg-surface-2/40 hover:bg-surface-2/70 transition-colors overflow-hidden"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3.5 sm:p-4">
                    <div
                      className="flex items-start sm:items-center gap-3 min-w-0 flex-1 cursor-pointer select-none"
                      onClick={() => onToggleExpand(client.id)}
                    >
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleExpand(client.id);
                        }}
                        aria-expanded={isExpanded}
                        aria-label={
                          isExpanded ? 'Recolher detalhes' : 'Expandir detalhes'
                        }
                        className="w-8 h-8 rounded-full bg-surface border border-line inline-flex items-center justify-center text-muted hover:text-fg transition-colors shrink-0 cursor-pointer"
                      >
                        <motion.span
                          animate={{ rotate: isExpanded ? 180 : 0 }}
                          transition={{
                            duration: 0.22,
                            ease: [0.22, 1, 0.36, 1],
                          }}
                          className="inline-flex"
                        >
                          <ChevronDown className="w-4 h-4" aria-hidden="true" />
                        </motion.span>
                      </button>

                      <span
                        className={`w-9 h-9 rounded-full border text-xs font-semibold inline-flex items-center justify-center shrink-0 ${avatarTone}`}
                        aria-hidden="true"
                      >
                        {getInitials(client.name)}
                      </span>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-fg font-semibold text-sm sm:text-base break-words">
                            {client.name}
                          </p>
                          <span
                            className={`inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-0.5 rounded-full border ${
                              isActive
                                ? 'bg-pos/12 text-pos border-pos/25'
                                : 'bg-neg/12 text-neg border-neg/25'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                isActive ? 'bg-pos' : 'bg-neg'
                              }`}
                            />
                            {client.contract_status || 'Ativo'}
                          </span>
                        </div>
                        <p className="text-subtle text-xs mt-1 uv-num leading-relaxed">
                          {client.payment_frequency || 'Mensal'} ·{' '}
                          {client.contract_months || 1} mês(es) · Gestão:{' '}
                          <span className="text-pos font-semibold">
                            {formatMoney(pendingSum)}
                          </span>
                          {trafegoSum > 0 && (
                            <>
                              {' '}
                              · Tráfego:{' '}
                              <span className="text-traffic font-semibold">
                                {formatMoney(trafegoSum)}
                              </span>
                            </>
                          )}
                          {Boolean(whatsappDisplay) && (
                            <>
                              {' '}
                              · WhatsApp:{' '}
                              <span className="text-fg font-medium">
                                {whatsappDisplay}
                              </span>
                            </>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between sm:justify-end gap-1.5 pt-2.5 sm:pt-0 border-t border-line/60 sm:border-t-0 shrink-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => onOpenBillingModal?.(client)}
                          className="flex items-center gap-1.5 text-xs font-semibold text-pos border border-pos/30 bg-pos/10 px-3 py-1.5 rounded-lg hover:bg-pos/20 transition-colors cursor-pointer"
                        >
                          <MessageCircle
                            className="w-3.5 h-3.5"
                            aria-hidden="true"
                          />{' '}
                          Cobrar
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            onOpenModal({
                              isOpen: true,
                              type: 'receivable',
                              data: null,
                              parentId: client.id,
                              parentName: client.name,
                            })
                          }
                          className="flex items-center gap-1 text-xs font-medium text-accent-fg border border-accent/25 bg-accent/8 px-2.5 py-1.5 rounded-lg hover:bg-accent/15 transition-colors cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" aria-hidden="true" />{' '}
                          Cobrança
                        </button>
                      </div>
                      <div className="flex items-center gap-1">
                        {client.contract_status === 'Vencido' && (
                          <button
                            type="button"
                            onClick={() => onRenewContract(client)}
                            aria-label="Renovar contrato"
                            title="Renovar contrato"
                            className="text-muted hover:text-pos p-1.5 rounded-lg hover:bg-surface transition-colors cursor-pointer"
                          >
                            <RefreshCw className="w-4 h-4" aria-hidden="true" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() =>
                            onOpenModal({
                              isOpen: true,
                              type: 'client',
                              data: client,
                              parentId: null,
                              parentName: '',
                            })
                          }
                          aria-label="Editar cliente"
                          title="Editar cliente"
                          className="text-muted hover:text-accent-fg p-1.5 rounded-lg hover:bg-surface transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-4 h-4" aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onCancelContract(client)}
                          aria-label="Cancelar contrato"
                          title="Cancelar contrato"
                          className="text-muted hover:text-neg p-1.5 rounded-lg hover:bg-surface transition-colors cursor-pointer"
                        >
                          <XCircle className="w-4 h-4" aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteClient(client.id, client.name)}
                          aria-label="Excluir cliente"
                          title="Excluir cliente"
                          className="text-muted hover:text-neg p-1.5 rounded-lg hover:bg-surface transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Accordion com Animação Fluida (encolher/expandir perto do cliente) */}
                  <AnimatePresence initial={false}>
                    {isExpanded && (
                      <motion.div
                        key={`client-recs-${client.id}`}
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{
                          duration: 0.25,
                          ease: [0.22, 1, 0.36, 1],
                        }}
                        className="overflow-hidden"
                      >
                        <div className="border-t border-line bg-surface/60 p-3 space-y-2 max-h-72 overflow-y-auto custom-scrollbar">
                          {clientRecs.length === 0 ? (
                            <p className="text-subtle text-sm italic text-center py-3">
                              Nenhuma cobrança registrada.
                            </p>
                          ) : (
                            clientRecs.map((r) => (
                              <div
                                key={r.id}
                                className="bg-surface rounded-xl border border-line p-3"
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <p className="text-fg text-sm font-medium break-words">
                                        {r.description}
                                      </p>
                                      {r.category === 'trafego' && (
                                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-traffic/20 text-traffic">
                                          Tráfego
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                      <StatusBadge status={r.status} />
                                      <span className="text-subtle text-xs uv-num">
                                        {formatDate(r.due_date)}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="flex flex-col items-end gap-2 shrink-0">
                                    <span
                                      className="uv-num text-sm font-semibold"
                                      style={{
                                        color:
                                          r.status === 'Pago'
                                            ? 'var(--uv-pos)'
                                            : 'var(--uv-fg)',
                                      }}
                                    >
                                      {formatMoney(r.amount)}
                                    </span>
                                    <div className="flex items-center gap-1">
                                      {r.status !== 'Pago' && (
                                        <button
                                          type="button"
                                          onClick={() =>
                                            onMarkReceivablePaid(r)
                                          }
                                          className="text-xs text-accent-fg border border-accent/25 px-2.5 py-1 rounded-lg hover:bg-accent/10 cursor-pointer"
                                        >
                                          Receber
                                        </button>
                                      )}
                                      <button
                                        type="button"
                                        onClick={() =>
                                          onOpenModal({
                                            isOpen: true,
                                            type: 'receivable',
                                            data: r,
                                            parentId: client.id,
                                            parentName: client.name,
                                          })
                                        }
                                        aria-label="Editar cobrança"
                                        className="text-muted hover:text-accent-fg p-1 cursor-pointer"
                                      >
                                        <Edit2 className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => onDeleteReceivable(r)}
                                        aria-label="Excluir cobrança"
                                        className="text-muted hover:text-neg p-1 cursor-pointer"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
