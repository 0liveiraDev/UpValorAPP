'use client';

import React from 'react';
import { TrendingUp, Briefcase } from 'lucide-react';
import PeriodControls from './PeriodControls.jsx';
import FinanceKpis from './FinanceKpis.jsx';
import OperationalStrip from './OperationalStrip.jsx';
import DueListPanel from './DueListPanel.jsx';
import HistoryCharts from './HistoryCharts.jsx';
import RecentTransactions from './RecentTransactions.jsx';
import LoadErrorBanner from './LoadErrorBanner.jsx';

export default function DashboardPanel({
  kpis,
  period,
  periodLabel = '',
  isCurrent = true,
  onFilterChange,
  onShift,
  receivableItems = [],
  paymentItems = [],
  onReceive,
  onPay,
  chartData = [],
  transactions = [],
  contracts = { active: 0, expired: 0, totalClients: 0 },
  loadError = false,
  onRetry,
}) {
  const periodLabelSuffix = periodLabel ? `— ${periodLabel}` : '';

  return (
    <div className="space-y-6">
      {/* Banner de erro quando houver falha de API */}
      {loadError && <LoadErrorBanner onRetry={onRetry} />}

      {/* Grupo 1: Cabeçalho com Título e Controles de Período */}
      <section className="uv-enter" style={{ '--uv-delay': '0ms' }}>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-[28px] font-semibold text-fg tracking-tight">
              Painel
            </h1>
            {periodLabel && (
              <p className="text-sm text-muted mt-0.5">{periodLabel}</p>
            )}
          </div>
          <PeriodControls
            filter={period?.filter || 'Mensal'}
            label={periodLabel}
            isCurrent={isCurrent}
            onFilterChange={onFilterChange}
            onShift={onShift}
          />
        </div>
      </section>

      {/* Grupo 2: Indicadores Financeiros (KPIs) */}
      <section className="uv-enter" style={{ '--uv-delay': '35ms' }}>
        <FinanceKpis kpis={kpis} />
      </section>

      {/* Grupo 3: Faixa Operacional */}
      <section className="uv-enter" style={{ '--uv-delay': '70ms' }}>
        <OperationalStrip
          active={contracts?.active ?? 0}
          expired={contracts?.expired ?? 0}
          totalClients={contracts?.totalClients ?? 0}
        />
      </section>

      {/* Grupo 4: Listas de Cobranças e Pagamentos */}
      <section className="uv-enter" style={{ '--uv-delay': '105ms' }}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <DueListPanel
            title={isCurrent ? 'A Receber' : 'Previsão'}
            periodLabel={periodLabelSuffix}
            icon={TrendingUp}
            iconClass="text-pos"
            items={receivableItems}
            amountClass="text-pos"
            actionLabel="Receber"
            actionClass="border border-accent/30 text-accent-fg hover:bg-accent/10"
            canAct={isCurrent}
            onAction={onReceive}
            emptyText="Nenhuma cobrança neste período."
          />
          <DueListPanel
            title="A Pagar aos Funcionários"
            periodLabel={periodLabelSuffix}
            icon={Briefcase}
            iconClass="text-warn"
            items={paymentItems}
            amountClass="text-neg"
            actionLabel="Pagar"
            actionClass="border border-warn/30 text-warn hover:bg-warn/10"
            canAct={isCurrent}
            onAction={onPay}
            emptyText="Nenhum pagamento neste período."
          />
        </div>
      </section>

      {/* Grupo 5: Gráficos Históricos e Últimas Transações */}
      <section className="uv-enter" style={{ '--uv-delay': '140ms' }}>
        <div className="space-y-6">
          <HistoryCharts data={chartData} />
          <RecentTransactions transactions={transactions} />
        </div>
      </section>
    </div>
  );
}
