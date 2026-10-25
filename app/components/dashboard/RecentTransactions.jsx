'use client';

import React from 'react';
import { ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { formatMoney, formatDate } from '@/lib/dashboard/format.js';

export default function RecentTransactions({ transactions = [] }) {
  const list = Array.isArray(transactions) ? transactions.slice(0, 5) : [];

  return (
    <div className="uv-card p-4 sm:p-5">
      <div className="flex items-center justify-between pb-4 border-b border-line mb-3">
        <h2 className="text-base font-semibold text-fg">Últimas Transações</h2>
        <span className="text-xs text-muted font-medium">Recentes</span>
      </div>

      {list.length === 0 ? (
        <p className="text-muted text-sm py-6 text-center">
          Nenhuma transação registrada.
        </p>
      ) : (
        <ul className="divide-y divide-line">
          {list.map((tx, idx) => {
            const isIncome =
              tx.type === 'Entrada' ||
              tx.type === 'Receita' ||
              (!tx.type && Number(tx.amount) > 0);
            const label = isIncome ? 'Entrada' : 'Saída';
            const sign = isIncome ? '+' : '-';
            const colorClass = isIncome ? 'text-pos' : 'text-neg';
            const Icon = isIncome ? ArrowDownLeft : ArrowUpRight;
            const txDate = tx.date || tx.created_at || tx.dueDate;

            return (
              <li
                key={tx.id || `${txDate}-${idx}`}
                className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                      isIncome ? 'bg-pos/10 text-pos' : 'bg-neg/10 text-neg'
                    }`}
                  >
                    <Icon className="w-4 h-4" aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <div
                      className="truncate font-medium text-fg text-sm"
                      title={tx.description || label}
                    >
                      {tx.description || label}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-subtle">
                      <span>{formatDate(txDate)}</span>
                      <span>•</span>
                      <span className={colorClass}>{label}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className={`uv-num font-semibold text-sm ${colorClass}`}>
                    {sign} {formatMoney(Math.abs(Number(tx.amount) || 0))}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
