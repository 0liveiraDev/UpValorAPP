'use client';

import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { useReducedMotion } from 'framer-motion';
import { useTheme } from '@/app/components/theme/ThemeProvider.jsx';
import { CHART_PALETTE } from '@/lib/theme/palette.js';
import { formatMoney } from '@/lib/dashboard/format.js';

function CustomTooltip({ active, payload, seriesName, palette }) {
  if (!active || !payload || !payload.length) return null;
  const item = payload[0];
  const value = item.value;
  const dataItem = item.payload;
  const isNoData = value === null || value === undefined;

  return (
    <div
      style={{
        backgroundColor: palette.tooltipBg,
        borderColor: palette.tooltipBorder,
        color: palette.tooltipFg,
      }}
      className="rounded-lg border px-3 py-2 text-xs shadow-lg"
    >
      <div className="font-medium text-muted mb-1">
        {dataItem?.fullLabel || dataItem?.label}
      </div>
      <div className="flex items-center gap-2">
        <span>{seriesName}:</span>
        <span className="font-semibold uv-num">
          {isNoData ? 'Sem dados' : formatMoney(value)}
        </span>
      </div>
    </div>
  );
}

export default function HistoryCharts({ data = [] }) {
  const { theme } = useTheme();
  const palette = CHART_PALETTE[theme] || CHART_PALETTE.dark;
  const reduced = Boolean(useReducedMotion());

  const safeData = Array.isArray(data) ? data : [];

  const formatYAxis = (v) => {
    if (v === null || v === undefined || v === 0) return '0';
    if (Math.abs(v) >= 1000) {
      return `${Math.round(v / 1000)}k`;
    }
    return String(v);
  };

  const seriesConfig = [
    {
      title: 'Gestão recebida',
      key: 'gestao',
      color: palette.pos,
    },
    {
      title: 'Tráfego recebido',
      key: 'trafego',
      color: palette.traffic,
    },
    {
      title: 'Folha (paga + pendente)',
      key: 'folha',
      color: palette.warn,
    },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {seriesConfig.map((s) => (
        <div
          key={s.key}
          className="uv-card p-4 sm:p-5 flex flex-col justify-between"
        >
          <div>
            <h2 className="text-sm font-semibold text-fg">{s.title}</h2>
            <p className="text-xs text-muted mt-0.5">
              Últimos 6 meses · por vencimento
            </p>
          </div>

          <div
            role="img"
            aria-label={`${s.title}, últimos 6 meses`}
            className="w-full h-[160px] mt-4"
          >
            <ResponsiveContainer width="100%" height={160}>
              <BarChart
                data={safeData}
                margin={{ top: 8, right: 8, left: -20, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={palette.grid}
                  vertical={false}
                />
                <XAxis
                  dataKey="label"
                  stroke={palette.axis}
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: palette.grid }}
                />
                <YAxis
                  stroke={palette.axis}
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={formatYAxis}
                />
                <Tooltip
                  content={
                    <CustomTooltip seriesName={s.title} palette={palette} />
                  }
                  cursor={{ fill: 'rgba(128, 128, 128, 0.08)' }}
                />
                <Bar
                  dataKey={s.key}
                  fill={s.color}
                  radius={[4, 4, 0, 0]}
                  isAnimationActive={!reduced}
                  animationDuration={400}
                />
              </BarChart>
            </ResponsiveContainer>
            <table className="sr-only">
              <caption>{`${s.title}, últimos 6 meses`}</caption>
              <thead>
                <tr>
                  <th scope="col">Mês</th>
                  <th scope="col">{s.title}</th>
                </tr>
              </thead>
              <tbody>
                {safeData.map((d) => (
                  <tr key={d.key || d.label}>
                    <td>{d.fullLabel || d.label}</td>
                    <td>
                      {d[s.key] === null || d[s.key] === undefined
                        ? 'Sem dados'
                        : formatMoney(d[s.key])}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}
