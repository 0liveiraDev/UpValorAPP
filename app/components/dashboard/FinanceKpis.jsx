'use client';

import React from 'react';
import { Wallet, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { formatMoney } from '@/lib/dashboard/format.js';

const MATRIX_COLS = [
  [0, 0, 0, 1],
  [0, 0, 1, 2],
  [0, 1, 2, 2],
  [1, 2, 3, 3],
  [0, 2, 3, 2],
  [2, 3, 3, 1],
];

const MATRIX_TONES = [
  'bg-transparent',
  'bg-accent/20',
  'bg-accent/55',
  'bg-pos/80',
];

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
      {/* Saldo Atual — Hero Card (Frame 0046 / Frame 0181) */}
      <div className="uv-card relative overflow-hidden bg-gradient-to-br from-accent/18 via-accent/6 to-surface p-5 sm:p-6 md:col-span-2 lg:col-span-6 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <span className="w-9 h-9 rounded-full bg-accent/15 border border-accent/30 text-accent-fg inline-flex items-center justify-center shrink-0">
                <Wallet className="w-4 h-4" aria-hidden="true" />
              </span>
              <h2 className="text-sm font-semibold text-fg">Saldo Atual</h2>
            </div>
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider bg-surface-2/90 text-muted border border-line">
              Caixa Geral
            </span>
          </div>

          <div className="flex items-end justify-between gap-4 mt-4">
            <div>
              <div className="text-3xl sm:text-4xl lg:text-[42px] font-bold tracking-tight text-fg uv-num leading-none">
                {formatMoney(saldo)}
              </div>
              <div className="text-xs font-medium text-muted mt-2.5">
                Recebido no período
              </div>
            </div>

            {/* Step-matrix visual inspirado na referência (Frame 0046) */}
            <div
              className="hidden sm:grid grid-cols-6 gap-1 shrink-0 pb-1"
              aria-hidden="true"
            >
              {MATRIX_COLS.map((col, cIdx) => (
                <div key={cIdx} className="flex flex-col gap-1">
                  {col.map((cell, rIdx) => (
                    <span
                      key={rIdx}
                      className={`w-3 h-3 rounded-[3px] ${MATRIX_TONES[cell]}`}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-line/70 pt-3.5 mt-4">
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="flex items-center gap-2.5 rounded-xl bg-surface/60 px-3 py-2 border border-line">
              <span
                className="w-1 h-7 rounded-full bg-pos shrink-0"
                aria-hidden="true"
              />
              <div className="min-w-0 flex-1">
                <div className="text-muted text-[11px]">Gestão</div>
                <div className="font-semibold text-pos uv-num text-sm truncate">
                  {formatMoney(gestaoRecebido)}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2.5 rounded-xl bg-surface/60 px-3 py-2 border border-line">
              <span
                className="w-1 h-7 rounded-full bg-traffic shrink-0"
                aria-hidden="true"
              />
              <div className="min-w-0 flex-1">
                <div className="text-muted text-[11px]">Tráfego</div>
                <div className="font-semibold text-traffic uv-num text-sm truncate">
                  {formatMoney(trafegoRecebido)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Total a Receber (Frame 0046 "Deals won" style) */}
      <div className="uv-card p-5 sm:p-6 lg:col-span-3 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <span className="w-9 h-9 rounded-full bg-pos/15 border border-pos/30 text-pos inline-flex items-center justify-center shrink-0">
                <ArrowDownLeft className="w-4 h-4" aria-hidden="true" />
              </span>
              <h2 className="text-sm font-semibold text-fg">Total a Receber</h2>
            </div>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-pos/10 text-pos border border-pos/20">
              Pendente
            </span>
          </div>

          <div className="text-2xl lg:text-[28px] font-bold text-fg uv-num mt-4 leading-tight">
            {formatMoney(totalAReceber)}
          </div>
        </div>

        <div className="border-t border-line/70 pt-3.5 mt-4 grid grid-cols-2 gap-3 text-xs">
          <div className="flex items-start gap-2">
            <span
              className="w-1 h-8 rounded-full bg-pos shrink-0 mt-0.5"
              aria-hidden="true"
            />
            <div className="min-w-0">
              <span className="text-muted block text-[11px]">Gestão</span>
              <span className="font-semibold text-fg uv-num text-sm block truncate mt-0.5">
                {formatMoney(gestaoAReceber)}
              </span>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <span
              className="w-1 h-8 rounded-full bg-traffic shrink-0 mt-0.5"
              aria-hidden="true"
            />
            <div className="min-w-0">
              <span className="text-muted block text-[11px]">Tráfego</span>
              <span className="font-semibold text-fg uv-num text-sm block truncate mt-0.5">
                {formatMoney(trafegoAReceber)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Folha do Mês (Frame 0046 "Deals lost" style) */}
      <div className="uv-card p-5 sm:p-6 lg:col-span-3 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <span className="w-9 h-9 rounded-full bg-warn/15 border border-warn/30 text-warn inline-flex items-center justify-center shrink-0">
                <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
              </span>
              <h2 className="text-sm font-semibold text-fg">Folha do Mês</h2>
            </div>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-warn/10 text-warn border border-warn/20">
              Equipe
            </span>
          </div>

          <div className="text-2xl lg:text-[28px] font-bold text-fg uv-num mt-4 leading-tight">
            {formatMoney(folhaMes)}
          </div>
        </div>

        <div className="border-t border-line/70 pt-3.5 mt-4 space-y-2">
          <div
            className="h-2 w-full rounded-full bg-surface-2 overflow-hidden flex gap-0.5 p-0.5 border border-line"
            aria-hidden="true"
          >
            <span className="h-full w-3/5 rounded-full bg-warn" />
            <span className="h-full w-1/4 rounded-full bg-accent" />
            <span className="h-full flex-1 rounded-full bg-pos/60" />
          </div>
          <div className="flex items-center gap-1.5 text-xs text-subtle">
            <span
              className="w-2 h-2 rounded-full bg-warn shrink-0"
              aria-hidden="true"
            />
            <span className="truncate">
              Total de pagamentos de funcionários
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
