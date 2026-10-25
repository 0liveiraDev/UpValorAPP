'use client';

import React, { useState, useRef } from 'react';
import StatusBadge from '@/app/components/ui/StatusBadge.jsx';
import { formatMoney, formatDate } from '@/lib/dashboard/format.js';

export default function DueListPanel({
  title,
  icon: Icon,
  iconClass = '',
  periodLabel = '',
  items = [],
  amountClass = '',
  actionLabel = '',
  actionClass = '',
  canAct = false,
  onAction,
  emptyText = 'Nenhum item.',
  initialLimit = 6,
}) {
  const [expanded, setExpanded] = useState(false);
  const [busyIds, setBusyIds] = useState(() => new Set());
  const inFlightRef = useRef(new Set());

  const safeItems = Array.isArray(items) ? items : [];
  const displayedItems = expanded
    ? safeItems
    : safeItems.slice(0, initialLimit);

  const handleAction = async (id) => {
    if (inFlightRef.current.has(id)) return;
    inFlightRef.current.add(id);
    setBusyIds((prev) => new Set(prev).add(id));

    try {
      if (onAction) {
        await onAction(id);
      }
    } finally {
      inFlightRef.current.delete(id);
      setBusyIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  return (
    <div className="uv-card p-4 sm:p-5 flex flex-col justify-between">
      <div>
        {/* Cabeçalho */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-line mb-3">
          <div className="flex items-center gap-2 min-w-0">
            {Icon && (
              <Icon
                className={`w-5 h-5 shrink-0 ${iconClass}`}
                aria-hidden="true"
              />
            )}
            <h2 className="text-base font-semibold text-fg truncate">
              {title}
            </h2>
            {periodLabel && (
              <span className="text-subtle text-xs sm:text-sm font-normal truncate">
                {periodLabel}
              </span>
            )}
          </div>
          <span className="text-xs text-muted font-medium shrink-0">
            {safeItems.length === 1
              ? '1 item'
              : `${safeItems.length} itens`}
          </span>
        </div>

        {/* Lista ou Estado Vazio */}
        {safeItems.length === 0 ? (
          <p className="text-muted text-sm py-8 text-center">{emptyText}</p>
        ) : (
          <ul className="divide-y divide-line">
            {displayedItems.map((item) => {
              const isBusy = busyIds.has(item.id);
              return (
                <li
                  key={item.id}
                  className="py-3 sm:py-3.5 first:pt-0 last:pb-0"
                >
                  <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 sm:gap-4">
                    {/* Esquerda: Informações */}
                    <div className="min-w-0 space-y-1">
                      <div
                        className="truncate font-medium text-fg text-sm sm:text-base"
                        title={item.name}
                      >
                        {item.name}
                      </div>
                      {item.detail && (
                        <div
                          className="truncate text-sm text-muted"
                          title={item.detail}
                        >
                          {item.detail}
                        </div>
                      )}
                      <div className="flex flex-wrap items-center gap-2 pt-0.5">
                        <StatusBadge status={item.status} />
                        <span className="text-subtle text-[13px]">
                          Vence {formatDate(item.dueDate)}
                        </span>
                        {item.installment && (
                          <span className="inline-flex items-center text-xs px-2 py-0.5 rounded bg-surface-2 text-muted border border-line">
                            Parcela {item.installment}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Direita: Valor e Ação */}
                    <div className="flex flex-col items-end justify-center gap-1.5 shrink-0">
                      <span
                        className={`uv-num font-semibold text-sm sm:text-base ${amountClass}`}
                      >
                        {formatMoney(item.amount)}
                      </span>
                      {canAct && (
                        <button
                          type="button"
                          disabled={isBusy}
                          aria-busy={isBusy}
                          onClick={() => handleAction(item.id)}
                          className={`w-[88px] h-8 text-xs font-medium rounded-lg inline-flex items-center justify-center transition-colors duration-150 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${actionClass}`}
                        >
                          {isBusy ? 'Aguarde…' : actionLabel}
                        </button>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Botão Mostrar todos / Mostrar menos */}
      {safeItems.length > initialLimit && (
        <div className="pt-4 border-t border-line mt-4 text-center">
          <button
            type="button"
            aria-expanded={expanded}
            onClick={() => setExpanded((prev) => !prev)}
            className="text-xs font-semibold text-accent-fg hover:underline transition-colors duration-150 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 cursor-pointer"
          >
            {expanded
              ? 'Mostrar menos'
              : `Mostrar todos (${safeItems.length})`}
          </button>
        </div>
      )}
    </div>
  );
}
