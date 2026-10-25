'use client';

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { PERIOD_FILTERS } from '@/lib/dashboard/period.js';

export default function PeriodControls({
  filter,
  label,
  isCurrent,
  onFilterChange,
  onShift,
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
      {/* Segmented Filter */}
      <div
        role="group"
        aria-label="Período"
        className="inline-flex items-center p-1 rounded-xl bg-surface border border-line"
      >
        {PERIOD_FILTERS.map((item) => {
          const active = filter === item;
          return (
            <button
              key={item}
              type="button"
              aria-pressed={active}
              onClick={() => onFilterChange?.(item)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors duration-150 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 cursor-pointer ${
                active
                  ? 'bg-accent text-white shadow-xs'
                  : 'text-muted hover:text-fg hover:bg-surface-2'
              }`}
            >
              {item}
            </button>
          );
        })}
      </div>

      {/* Navigator ‹ label › with badge */}
      <div className="inline-flex items-center gap-1.5 p-1 rounded-xl bg-surface border border-line">
        <button
          type="button"
          aria-label="Período anterior"
          title="Período anterior"
          onClick={() => onShift?.(-1)}
          className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-muted hover:text-fg hover:bg-surface-2 transition-colors duration-150 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" aria-hidden="true" />
        </button>

        <div className="min-w-[11rem] text-center flex items-center justify-center gap-1.5 px-2">
          <span
            aria-live="polite"
            className="text-xs sm:text-sm font-medium text-fg truncate"
          >
            {label}
          </span>
          {!isCurrent && (
            <span className="inline-flex items-center text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-warn/15 text-warn border border-warn/25">
              Previsão
            </span>
          )}
        </div>

        <button
          type="button"
          aria-label="Próximo período"
          title="Próximo período"
          onClick={() => onShift?.(1)}
          className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-muted hover:text-fg hover:bg-surface-2 transition-colors duration-150 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 cursor-pointer"
        >
          <ChevronRight className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
