'use client';

import React from 'react';
import { AlertTriangle } from 'lucide-react';

export default function LoadErrorBanner({ onRetry }) {
  return (
    <div
      role="alert"
      className="rounded-xl border border-neg/30 bg-neg/10 p-4 text-fg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
    >
      <div className="flex items-center gap-3">
        <AlertTriangle
          className="w-5 h-5 text-neg shrink-0"
          aria-hidden="true"
        />
        <p className="text-sm font-medium">
          Não foi possível carregar todos os dados. Os valores podem estar
          incompletos.
        </p>
      </div>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="shrink-0 px-3 py-1.5 text-xs font-semibold rounded-lg border border-neg/30 bg-neg/20 text-neg hover:bg-neg/30 transition-colors duration-150 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neg/60 cursor-pointer"
        >
          Tentar novamente
        </button>
      )}
    </div>
  );
}
