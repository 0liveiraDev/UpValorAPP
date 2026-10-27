'use client';

import React, { useState, useRef } from 'react';
import StatusBadge from '@/app/components/ui/StatusBadge.jsx';
import { formatMoney, formatDate } from '@/lib/dashboard/format.js';

function getInitials(name = '') {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'UV';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

const AVATAR_TONES = [
  'bg-accent/15 text-accent-fg border-accent/25',
  'bg-pos/15 text-pos border-pos/25',
  'bg-traffic/15 text-traffic border-traffic/25',
  'bg-warn/15 text-warn border-warn/25',
];

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
}) {
  const [busyIds, setBusyIds] = useState(() => new Set());
  const inFlightRef = useRef(new Set());

  const safeItems = Array.isArray(items) ? items : [];

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
    <div className="uv-card p-4 sm:p-5 flex flex-col">
      {/* Cabeçalho */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-line mb-2">
        <div className="flex items-center gap-2.5 min-w-0">
          {Icon && (
            <span className="w-8 h-8 rounded-full bg-surface-2 border border-line inline-flex items-center justify-center shrink-0">
              <Icon
                className={`w-4 h-4 shrink-0 ${iconClass}`}
                aria-hidden="true"
              />
            </span>
          )}
          <h2 className="text-base font-semibold text-fg truncate">{title}</h2>
          {periodLabel && (
            <span className="text-subtle text-xs sm:text-sm font-normal truncate">
              {periodLabel}
            </span>
          )}
        </div>
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-surface-2 text-muted border border-line shrink-0 uv-num">
          {safeItems.length === 1 ? '1 item' : `${safeItems.length} itens`}
        </span>
      </div>

      {/* Lista com Scroll interno */}
      {safeItems.length === 0 ? (
        <p className="text-muted text-sm py-10 text-center">{emptyText}</p>
      ) : (
        <div
          className="max-h-[400px] overflow-y-auto custom-scrollbar pr-1.5 -mr-1"
          role="region"
          aria-label={title}
          tabIndex={0}
        >
          <ul className="divide-y divide-line">
            {safeItems.map((item, idx) => {
              const isBusy = busyIds.has(item.id);
              const avatarTone = AVATAR_TONES[idx % AVATAR_TONES.length];
              return (
                <li
                  key={item.id}
                  className="py-3 sm:py-3.5 first:pt-1 last:pb-1"
                >
                  <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2.5 sm:gap-4">
                    {/* Esquerda: Avatar + Informações */}
                    <div className="flex items-start gap-2.5 sm:gap-3 min-w-0">
                      <div
                        className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full border text-xs font-semibold inline-flex items-center justify-center shrink-0 mt-0.5 ${avatarTone}`}
                        aria-hidden="true"
                      >
                        {getInitials(item.name)}
                      </div>
                      <div className="min-w-0 flex-1 space-y-1">
                        <div
                          className="line-clamp-2 sm:truncate font-medium text-fg text-sm sm:text-base break-words"
                          title={item.name}
                        >
                          {item.name}
                        </div>
                        {item.detail && (
                          <div
                            className="truncate text-xs sm:text-sm text-muted"
                            title={item.detail}
                          >
                            {item.detail}
                          </div>
                        )}
                        <div className="flex flex-wrap items-center gap-2 pt-0.5">
                          <StatusBadge status={item.status} />
                          <span className="text-subtle text-[13px] uv-num">
                            Vence {formatDate(item.dueDate)}
                          </span>
                          {item.installment && (
                            <span className="inline-flex items-center text-xs px-2 py-0.5 rounded-md bg-surface-2 text-muted border border-line uv-num">
                              Parcela {item.installment}
                            </span>
                          )}
                        </div>
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
        </div>
      )}
    </div>
  );
}
