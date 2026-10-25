'use client';

import React from 'react';
import { formatMoney } from '@/lib/dashboard/format.js';

export default function FinanceKpis({ kpis }) {
  const {
    saldo = 0,
    gestaoRecebido = 0,
    trafegoRecebido = 0,
    totalAReceber = 0,
    gestaoAReceber = 0,
    trafegoAReceber = 0,
    folhaMes = 0,
  } = kpis || {};

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4">
      {/* Saldo Atual */}
      <div className="uv-card bg-gradient-to-br from-accent/20 via-accent/5 to-transparent p-5 sm:p-6 md:col-span-2 lg:col-span-6 flex flex-col justify-between">
        <div>
          <h2 className="text-sm font-medium text-muted">Saldo Atual</h2>
          <div className="text-4xl lg:text-[44px] font-semibold tracking-tight text-fg uv-num mt-2">
            {formatMoney(saldo)}
          </div>
        </div>

        <div className="border-t border-line/60 pt-3 mt-4">
          <div className="text-xs font-medium text-muted mb-2">
            Recebido no período
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center justify-between rounded-lg bg-surface/40 px-3 py-1.5 border border-line/40">
              <span className="text-muted">Gestão</span>
              <span className="font-semibold text-pos uv-num">
                {formatMoney(gestaoRecebido)}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-surface/40 px-3 py-1.5 border border-line/40">
              <span className="text-muted">Tráfego</span>
              <span className="font-semibold text-traffic uv-num">
                {formatMoney(trafegoRecebido)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Total a Receber */}
      <div className="uv-card p-5 sm:p-6 lg:col-span-3 flex flex-col justify-between">
        <div>
          <h2 className="text-sm font-medium text-muted">Total a Receber</h2>
          <div className="text-2xl lg:text-[28px] font-semibold text-fg uv-num mt-2">
            {formatMoney(totalAReceber)}
          </div>
        </div>

        <div className="border-t border-line/60 pt-3 mt-4 space-y-1.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-muted">Gestão</span>
            <span className="font-medium text-fg uv-num">
              {formatMoney(gestaoAReceber)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted">Tráfego</span>
            <span className="font-medium text-fg uv-num">
              {formatMoney(trafegoAReceber)}
            </span>
          </div>
        </div>
      </div>

      {/* Folha do Mês */}
      <div className="uv-card p-5 sm:p-6 lg:col-span-3 flex flex-col justify-between">
        <div>
          <h2 className="text-sm font-medium text-muted">Folha do Mês</h2>
          <div className="text-2xl lg:text-[28px] font-semibold text-fg uv-num mt-2">
            {formatMoney(folhaMes)}
          </div>
        </div>
        <div className="pt-3 mt-4 text-xs text-subtle">
          Total de pagamentos de funcionários
        </div>
      </div>
    </div>
  );
}
