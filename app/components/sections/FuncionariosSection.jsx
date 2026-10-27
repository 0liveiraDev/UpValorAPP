'use client';

import React, { useState, useMemo } from 'react';
import {
  Briefcase,
  Wallet,
  Clock,
  Plus,
  Edit2,
  Trash2,
  ChevronDown,
  Search,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import StatusBadge from '@/app/components/ui/StatusBadge.jsx';
import { formatMoney, formatDate } from '@/lib/dashboard/format.js';

function getInitials(name = '') {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'FN';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

const AVATAR_TONES = [
  'bg-warn/15 text-warn border-warn/25',
  'bg-accent/15 text-accent-fg border-accent/25',
  'bg-pos/15 text-pos border-pos/25',
  'bg-traffic/15 text-traffic border-traffic/25',
];

export default function FuncionariosSection({
  employees = [],
  empPayments = [],
  expandedEmployees = {},
  onToggleExpand,
  onOpenModal,
  onDeleteEmployee,
  onMarkEmpPaymentPaid,
  onDeleteEmpPayment,
}) {
  const [search, setSearch] = useState('');

  const totalBaseSalary = useMemo(
    () =>
      employees.reduce((sum, e) => sum + (parseFloat(e.salary) || 0), 0),
    [employees]
  );

  const totalPendingPayroll = useMemo(
    () =>
      empPayments
        .filter((p) => p.status === 'Pendente')
        .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0),
    [empPayments]
  );

  const filteredEmployees = useMemo(() => {
    if (!search.trim()) return employees;
    const q = search.trim().toLowerCase();
    return employees.filter(
      (e) =>
        String(e.name || '').toLowerCase().includes(q) ||
        String(e.role || '').toLowerCase().includes(q)
    );
  }, [employees, search]);

  return (
    <div className="space-y-6">
      {/* Cabeçalho estilo Storyboard */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-[28px] font-semibold text-fg tracking-tight">
            Funcionários
          </h1>
          <p className="text-sm text-muted mt-0.5">
            Controle de equipe, cargos e folha de pagamentos
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
              placeholder="Buscar funcionário..."
              aria-label="Buscar funcionário"
              className="h-10 pl-9 pr-4 rounded-full bg-surface border border-line text-sm text-fg placeholder:text-subtle focus:outline-none focus:ring-2 focus:ring-accent/60 w-48 sm:w-60"
            />
          </div>

          <button
            type="button"
            onClick={() =>
              onOpenModal({
                isOpen: true,
                type: 'employee',
                data: null,
                parentId: null,
                parentName: '',
              })
            }
            className="h-10 inline-flex items-center gap-1.5 bg-accent hover:bg-accent/90 text-white px-4 rounded-full text-sm font-medium shadow-md shadow-accent/20 transition-all active:scale-[0.98] cursor-pointer"
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
            <span>Novo Funcionário</span>
          </button>
        </div>
      </div>

      {/* 3 Cards de Resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="uv-card p-4 sm:p-5 flex flex-col justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-full bg-accent/12 border border-accent/25 text-accent-fg inline-flex items-center justify-center">
              <Briefcase className="w-4 h-4" aria-hidden="true" />
            </span>
            <span className="text-xs font-medium text-muted">
              Total da Equipe
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-fg uv-num">
              {employees.length}
            </div>
            <div className="text-[11px] text-subtle mt-0.5">
              Colaboradores cadastrados
            </div>
          </div>
        </div>

        <div className="uv-card p-4 sm:p-5 flex flex-col justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-full bg-pos/12 border border-pos/25 text-pos inline-flex items-center justify-center">
              <Wallet className="w-4 h-4" aria-hidden="true" />
            </span>
            <span className="text-xs font-medium text-muted">
              Salário Base Mensal
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-fg uv-num">
              {formatMoney(totalBaseSalary)}
            </div>
            <div className="text-[11px] text-subtle mt-0.5">
              Soma contratual da equipe
            </div>
          </div>
        </div>

        <div className="uv-card p-4 sm:p-5 flex flex-col justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-full bg-warn/12 border border-warn/25 text-warn inline-flex items-center justify-center">
              <Clock className="w-4 h-4" aria-hidden="true" />
            </span>
            <span className="text-xs font-medium text-muted">
              Total Pendente
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-warn uv-num">
              {formatMoney(totalPendingPayroll)}
            </div>
            <div className="text-[11px] text-subtle mt-0.5">
              Pagamentos em aberto
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Funcionários com Accordion Fluido */}
      <div className="uv-card p-4 sm:p-5">
        <div className="flex items-center justify-between pb-4 border-b border-line mb-3">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-full bg-surface-2 border border-line inline-flex items-center justify-center text-warn">
              <Briefcase className="w-4 h-4" aria-hidden="true" />
            </span>
            <h2 className="text-base font-semibold text-fg">
              Equipe Cadastrada
            </h2>
          </div>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-surface-2 text-muted border border-line uv-num">
            {filteredEmployees.length}{' '}
            {filteredEmployees.length === 1 ? 'membro' : 'membros'}
          </span>
        </div>

        {filteredEmployees.length === 0 ? (
          <div className="rounded-xl p-10 text-center text-subtle text-sm">
            Nenhum funcionário cadastrado. Clique em &quot;Novo
            Funcionário&quot; para começar.
          </div>
        ) : (
          <div className="space-y-2.5">
            {filteredEmployees.map((emp, idx) => {
              const empPays = empPayments.filter(
                (p) => p.employee_id === emp.id
              );
              const isExpanded = Boolean(expandedEmployees[emp.id]);
              const pendingSum = empPays
                .filter((p) => p.status === 'Pendente')
                .reduce((a, b) => a + parseFloat(b.amount), 0);
              const avatarTone = AVATAR_TONES[idx % AVATAR_TONES.length];

              return (
                <div
                  key={emp.id}
                  className="rounded-2xl border border-line bg-surface-2/40 hover:bg-surface-2/70 transition-colors overflow-hidden"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3.5 sm:p-4">
                    <div
                      className="flex items-start sm:items-center gap-3 min-w-0 flex-1 cursor-pointer select-none"
                      onClick={() => onToggleExpand(emp.id)}
                    >
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleExpand(emp.id);
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
                        {getInitials(emp.name)}
                      </span>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-fg font-semibold text-sm sm:text-base break-words">
                            {emp.name}
                          </p>
                          {emp.role && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-surface text-muted border border-line">
                              {emp.role}
                            </span>
                          )}
                        </div>
                        <p className="text-subtle text-xs mt-1 uv-num leading-relaxed">
                          {empPays.length} pagamento(s) · A pagar:{' '}
                          <span className="text-warn font-semibold">
                            {formatMoney(pendingSum)}
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-2 pt-2.5 sm:pt-0 border-t border-line/60 sm:border-t-0 shrink-0">
                      <button
                        type="button"
                        onClick={() =>
                          onOpenModal({
                            isOpen: true,
                            type: 'empPayment',
                            data: null,
                            parentId: emp.id,
                            parentName: emp.name,
                          })
                        }
                        className="flex items-center gap-1.5 text-xs font-medium text-warn border border-warn/25 bg-warn/8 px-3 py-1.5 rounded-lg hover:bg-warn/15 transition-colors cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" aria-hidden="true" /> Novo
                        Pagamento
                      </button>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() =>
                            onOpenModal({
                              isOpen: true,
                              type: 'employee',
                              data: emp,
                              parentId: null,
                              parentName: '',
                            })
                          }
                          aria-label="Editar funcionário"
                          className="text-muted hover:text-accent-fg p-1.5 rounded-lg hover:bg-surface transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteEmployee(emp.id, emp.name)}
                          aria-label="Excluir funcionário"
                          className="text-muted hover:text-neg p-1.5 rounded-lg hover:bg-surface transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  <AnimatePresence initial={false}>
                    {isExpanded && (
                      <motion.div
                        key={`emp-pays-${emp.id}`}
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
                          {empPays.length === 0 ? (
                            <p className="text-subtle text-sm italic text-center py-3">
                              Nenhum pagamento registrado.
                            </p>
                          ) : (
                            empPays.map((p) => (
                              <div
                                key={p.id}
                                className="bg-surface rounded-xl border border-line p-3"
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="min-w-0 flex-1">
                                    <p className="text-fg text-sm font-medium break-words">
                                      {p.description}
                                    </p>
                                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                      <StatusBadge status={p.status} />
                                      <span className="text-subtle text-xs uv-num">
                                        {formatDate(p.due_date)}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="flex flex-col items-end gap-2 shrink-0">
                                    <span
                                      className="uv-num text-sm font-semibold"
                                      style={{
                                        color:
                                          p.status === 'Pago'
                                            ? 'var(--uv-pos)'
                                            : 'var(--uv-fg)',
                                      }}
                                    >
                                      {formatMoney(p.amount)}
                                    </span>
                                    <div className="flex items-center gap-1">
                                      {p.status !== 'Pago' && (
                                        <button
                                          type="button"
                                          onClick={() =>
                                            onMarkEmpPaymentPaid(p)
                                          }
                                          className="text-xs text-warn border border-warn/25 px-2.5 py-1 rounded-lg hover:bg-warn/10 cursor-pointer"
                                        >
                                          Pagar
                                        </button>
                                      )}
                                      <button
                                        type="button"
                                        onClick={() =>
                                          onOpenModal({
                                            isOpen: true,
                                            type: 'empPayment',
                                            data: p,
                                            parentId: emp.id,
                                            parentName: emp.name,
                                          })
                                        }
                                        aria-label="Editar pagamento"
                                        className="text-muted hover:text-accent-fg p-1 cursor-pointer"
                                      >
                                        <Edit2 className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => onDeleteEmpPayment(p)}
                                        aria-label="Excluir pagamento"
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
