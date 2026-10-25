'use client';

import React from 'react';
import { ArrowDownLeft, ArrowUpRight, History } from 'lucide-react';
import { formatMoney, formatDate } from '@/lib/dashboard/format.js';

export default function RecentTransactions({ transactions = [] }) {
  const list = Array.isArray(transactions) ? transactions : [];

  return (
    <div className="uv-card p-4 sm:p-5">
      <div className="flex items-center justify-between pb-4 border-b border-line mb-2">
        <div className="flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-full bg-surface-2 border border-line inline-flex items-center justify-center shrink-0">
            <History className="w-4 h-4 text-accent-fg" aria-hidden="true" />
          </span>
          <h2 className="text-base font-semibold text-fg">
            Últimas Transações
          </h2>
        </div>
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-surface-2 text-muted border border-line uv-num">
          {list.length === 1 ? '1 registro' : `${list.length} registros`}
        </span>
      </div>

      {list.length === 0 ? (
        <p className="text-muted text-sm py-8 text-center">
          Nenhuma transação registrada.
        </p>
      ) : (
        <div
          className="max-h-[360px] overflow-y-auto custom-scrollbar pr-1.5 -mr-1"
          role="region"
          aria-label="Últimas Transações"
          tabIndex={0}
        >
          <ul className="divide-y divide-line">
            {list.map((tx, idx) => {
              const isIncome =
                tx.type === 'Entrada' ||
                tx.type === 'Receita' ||
                tx.type === 'entrada' ||
                (!tx.type && Number(tx.amount) > 0);
              const label = isIncome ? 'Entrada' : 'Saída';
              const sign = isIncome ? '+' : '-';
              const colorClass = isIncome ? 'text-pos' : 'text-neg';
              const Icon = isIncome ? ArrowDownLeft : ArrowUpRight;
              const txDate = tx.date || tx.created_at || tx.dueDate;

              return (
                <li
                  key={tx.id || `${txDate}-${idx}`}
                  className="py-3 first:pt-1 last:pb-1 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 border ${
                        isIncome
                          ? 'bg-pos/12 text-pos border-pos/25'
                          : 'bg-neg/12 text-neg border-neg/25'
                      }`}
                    >
                      <Icon className="w-4 h-4" aria-hidden="true" />
                    </div>
                    <div className="min-w-0">
                      <div
                        className="truncate font-medium text-fg text-sm sm:text-base"
                        title={tx.description || label}
                      >
                        {tx.description || label}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-subtle uv-num">
                        <span>{formatDate(txDate)}</span>
                        <span>•</span>
                        <span className={`font-medium ${colorClass}`}>
                          {label}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div
                      className={`uv-num font-semibold text-sm sm:text-base ${colorClass}`}
                    >
                      {sign} {formatMoney(Math.abs(Number(tx.amount) || 0))}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
