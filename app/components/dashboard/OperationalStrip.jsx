'use client';

import React from 'react';
import { CheckCircle2, AlertCircle, Users } from 'lucide-react';

export default function OperationalStrip({
  active = 0,
  expired = 0,
  totalClients = 0,
}) {
  const segments = [
    {
      label: 'Contratos Ativos',
      subtitle: 'Recorrências em vigor',
      value: active,
      icon: CheckCircle2,
      badgeTone: 'bg-pos/12 text-pos border-pos/25',
      tag: 'Em dia',
    },
    {
      label: 'Vencidos',
      subtitle: 'Requerem renovação',
      value: expired,
      icon: AlertCircle,
      badgeTone: 'bg-neg/12 text-neg border-neg/25',
      tag: 'Atenção',
    },
    {
      label: 'Total de Clientes',
      subtitle: 'Carteira ativa cadastrada',
      value: totalClients,
      icon: Users,
      badgeTone: 'bg-accent/12 text-accent-fg border-accent/25',
      tag: 'Carteira',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {segments.map((item) => {
        const Icon = item.icon;
        return (
          <div
            key={item.label}
            className="uv-card p-4 sm:p-5 flex items-center justify-between gap-3"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <span
                className={`w-10 h-10 rounded-full border inline-flex items-center justify-center shrink-0 ${item.badgeTone}`}
              >
                <Icon className="w-5 h-5" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <div className="text-2xl font-bold text-fg uv-num leading-tight">
                  {item.value}
                </div>
                <div className="text-xs sm:text-sm font-medium text-fg truncate">
                  {item.label}
                </div>
                <div className="text-[11px] text-subtle truncate">
                  {item.subtitle}
                </div>
              </div>
            </div>

            <span
              className={`hidden md:inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium border shrink-0 ${item.badgeTone}`}
            >
              {item.tag}
            </span>
          </div>
        );
      })}
    </div>
  );
}
