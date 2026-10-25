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
import { BarChart3 } from 'lucide-react';
import { useTheme } from '@/app/components/theme/ThemeProvider.jsx';
import { CHART_PALETTE } from '@/lib/theme/palette.js';
import { formatMoney } from '@/lib/dashboard/format.js';

function CustomTooltip({ active, payload, seriesName, seriesColor, palette }) {
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
      className="rounded-xl border px-3.5 py-2.5 text-xs shadow-xl backdrop-blur-md"
    >
      <div className="inline-flex items-center px-2 py-0.5 rounded-md bg-white/10 font-semibold text-muted mb-1.5">
        {dataItem?.fullLabel || dataItem?.label}
      </div>
      <div className="flex items-center justify-between gap-3">
        <span className="flex items-center gap-1.5">
          <span
            className="w-2 h-2 rounded-full shrink-0"
            style={{ backgroundColor: seriesColor }}
          />
          <span>{seriesName}:</span>
        </span>
        <span className="font-bold uv-num">
          {isNoData ? 'Sem dados' : formatMoney(value)}
        </span>
      </div>
    </div>
  );
}

export default function HistoryCharts({ data = [] }) {
  const { theme } = useTheme();
  const palette = CHART_PALETTE[theme] || CHART_PALETTE.dark;

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
      toneClass: 'bg-pos/12 text-pos border-pos/25',
    },
    {
      title: 'Tráfego recebido',
      key: 'trafego',
      color: palette.traffic,
      toneClass: 'bg-traffic/12 text-traffic border-traffic/25',
    },
    {
      title: 'Folha (paga + pendente)',
      key: 'folha',
      color: palette.warn,
      toneClass: 'bg-warn/12 text-warn border-warn/25',
    },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {seriesConfig.map((s) => (
        <div
          key={s.key}
          className="uv-card p-4 sm:p-5 flex flex-col justify-between"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <span
                className={`w-8 h-8 rounded-full border inline-flex items-center justify-center shrink-0 ${s.toneClass}`}
              >
                <BarChart3 className="w-4 h-4" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <h2 className="text-sm font-semibold text-fg truncate">
                  {s.title}
                </h2>
                <p className="text-[11px] text-muted mt-0.5 truncate">
                  Últimos 6 meses · por vencimento
                </p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-surface-2 text-muted border border-line shrink-0">
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: s.color }}
              />
              6M
            </span>
          </div>

          <div
            role="img"
            aria-label={`${s.title}, últimos 6 meses`}
            className="w-full h-[168px] mt-4"
          >
            <ResponsiveContainer width="100%" height={168}>
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
                    <CustomTooltip
                      seriesName={s.title}
                      seriesColor={s.color}
                      palette={palette}
                    />
                  }
                  cursor={{ fill: 'rgba(128, 128, 128, 0.08)', radius: 8 }}
                />
                <Bar
                  dataKey={s.key}
                  fill={s.color}
                  radius={[6, 6, 0, 0]}
                  isAnimationActive={true}
                  animationDuration={500}
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
