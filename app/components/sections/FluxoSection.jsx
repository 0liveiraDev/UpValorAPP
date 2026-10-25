'use client';

import React, { useState, useMemo } from 'react';
import {
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  Plus,
  Edit2,
  Trash2,
  Search,
} from 'lucide-react';
import { formatMoney, formatDate } from '@/lib/dashboard/format.js';

export default function FluxoSection({
  transactions = [],
  onOpenModal,
  onDeleteTransaction,
}) {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('Todas');

  const { entradas, saidas, saldo } = useMemo(() => {
    const ent = transactions
      .filter((t) => t.type === 'entrada')
      .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
    const sai = transactions
      .filter((t) => t.type === 'saida')
      .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
    return { entradas: ent, saidas: sai, saldo: ent - sai };
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      if (typeFilter === 'Entradas' && t.type !== 'entrada') return false;
      if (typeFilter === 'Saídas' && t.type !== 'saida') return false;
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        return String(t.description || '').toLowerCase().includes(q);
      }
      return true;
    });
  }, [transactions, typeFilter, search]);

  return (
    <div className="space-y-6">
      {/* Cabeçalho estilo Storyboard (Frame 0181 "Analytic") */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-[28px] font-semibold text-fg tracking-tight">
            Fluxo de Caixa
          </h1>
          <p className="text-sm text-muted mt-0.5">
            Movimentações financeiras consolidadas de entradas e saídas
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
              placeholder="Buscar lançamento..."
              aria-label="Buscar lançamento"
              className="h-10 pl-9 pr-4 rounded-full bg-surface border border-line text-sm text-fg placeholder:text-subtle focus:outline-none focus:ring-2 focus:ring-accent/60 w-48 sm:w-60"
            />
          </div>

          <button
            type="button"
            onClick={() =>
              onOpenModal({
                isOpen: true,
                type: 'transaction',
                data: null,
                parentId: null,
                parentName: '',
              })
            }
            className="h-10 inline-flex items-center gap-1.5 bg-accent hover:bg-accent/90 text-white px-4 rounded-full text-sm font-medium shadow-md shadow-accent/20 transition-all active:scale-[0.98] cursor-pointer"
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
            <span>Nova Transação</span>
          </button>
        </div>
      </div>

      {/* 3 Cards de Resumo (com Hero Card Azul do Frame 0181) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl p-5 bg-gradient-to-br from-accent to-blue-700 text-white shadow-lg shadow-accent/20 flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="w-9 h-9 rounded-full bg-white/15 inline-flex items-center justify-center">
              <Wallet className="w-4 h-4 text-white" aria-hidden="true" />
            </span>
            <span className="text-[11px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-white/15">
              Consolidado
            </span>
          </div>
          <div className="mt-4">
            <div className="text-2xl sm:text-3xl font-bold uv-num">
              {formatMoney(saldo)}
            </div>
            <div className="text-xs text-white/80 mt-0.5">Saldo em Caixa</div>
          </div>
        </div>

        <div className="uv-card p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="w-9 h-9 rounded-full bg-pos/12 border border-pos/25 text-pos inline-flex items-center justify-center">
              <ArrowDownLeft className="w-4 h-4" aria-hidden="true" />
            </span>
            <span className="text-[11px] font-semibold text-pos">Entradas</span>
          </div>
          <div className="mt-4">
            <div className="text-2xl sm:text-3xl font-bold text-pos uv-num">
              {formatMoney(entradas)}
            </div>
            <div className="text-xs text-muted mt-0.5">Total Recebido</div>
          </div>
        </div>

        <div className="uv-card p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="w-9 h-9 rounded-full bg-neg/12 border border-neg/25 text-neg inline-flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
            </span>
            <span className="text-[11px] font-semibold text-neg">Saídas</span>
          </div>
          <div className="mt-4">
            <div className="text-2xl sm:text-3xl font-bold text-neg uv-num">
              {formatMoney(saidas)}
            </div>
            <div className="text-xs text-muted mt-0.5">Total Pago</div>
          </div>
        </div>
      </div>

      {/* Lista de Movimentações com Filtros e Scroll */}
      <div className="uv-card p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-line mb-3">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-full bg-surface-2 border border-line inline-flex items-center justify-center text-accent-fg">
              <Wallet className="w-4 h-4" aria-hidden="true" />
            </span>
            <h2 className="text-base font-semibold text-fg">
              Histórico de Transações
            </h2>
          </div>

          <div className="flex items-center gap-1.5">
            {['Todas', 'Entradas', 'Saídas'].map((f) => {
              const active = typeFilter === f;
              return (
                <button
                  key={f}
                  type="button"
                  onClick={() => setTypeFilter(f)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors cursor-pointer ${
                    active
                      ? 'bg-fg text-bg border-fg'
                      : 'bg-surface-2 text-muted border-line hover:text-fg'
                  }`}
                >
                  {f}
                </button>
              );
            })}
          </div>
        </div>

        {filteredTransactions.length === 0 ? (
          <div className="rounded-xl p-10 text-center text-subtle text-sm">
            Nenhuma transação registrada.
          </div>
        ) : (
          <div
            className="max-h-[480px] overflow-y-auto custom-scrollbar pr-1.5 -mr-1 space-y-2"
            role="region"
            aria-label="Histórico de Transações"
            tabIndex={0}
          >
            {filteredTransactions.map((t) => {
              const isEntrada = t.type === 'entrada';
              const Icon = isEntrada ? ArrowDownLeft : ArrowUpRight;
              return (
                <div
                  key={t.id}
                  className="bg-surface-2/40 hover:bg-surface-2/70 transition-colors rounded-xl border border-line px-4 py-3 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <span
                      className={`w-9 h-9 rounded-full border inline-flex items-center justify-center shrink-0 ${
                        isEntrada
                          ? 'bg-pos/12 text-pos border-pos/25'
                          : 'bg-neg/12 text-neg border-neg/25'
                      }`}
                    >
                      <Icon className="w-4 h-4" aria-hidden="true" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-fg font-medium text-sm sm:text-base truncate">
                        {t.description}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold ${
                            isEntrada
                              ? 'bg-pos/15 text-pos'
                              : 'bg-neg/15 text-neg'
                          }`}
                        >
                          {t.type}
                        </span>
                        <span className="text-subtle text-xs uv-num">
                          {formatDate(t.date)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span
                      className="uv-num font-bold text-sm sm:text-base"
                      style={{
                        color: isEntrada ? 'var(--uv-pos)' : 'var(--uv-neg)',
                      }}
                    >
                      {isEntrada ? '+' : '-'} {formatMoney(t.amount)}
                    </span>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() =>
                          onOpenModal({
                            isOpen: true,
                            type: 'transaction',
                            data: t,
                            parentId: null,
                            parentName: '',
                          })
                        }
                        aria-label="Editar transação"
                        className="text-muted hover:text-accent-fg p-1.5 rounded-lg hover:bg-surface cursor-pointer"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteTransaction(t)}
                        aria-label="Excluir transação"
                        className="text-muted hover:text-neg p-1.5 rounded-lg hover:bg-surface cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
