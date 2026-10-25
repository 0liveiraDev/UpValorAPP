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
      value: active,
      icon: CheckCircle2,
      colorClass: 'text-pos',
    },
    {
      label: 'Vencidos',
      value: expired,
      icon: AlertCircle,
      colorClass: 'text-neg',
    },
    {
      label: 'Total de Clientes',
      value: totalClients,
      icon: Users,
      colorClass: 'text-muted',
    },
  ];

  return (
    <div className="uv-card p-4 sm:p-5">
      <div className="grid grid-cols-3 divide-x divide-line">
        {segments.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.label}
              className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3 px-2 sm:px-4 text-center sm:text-left"
            >
              <Icon
                className={`w-5 h-5 shrink-0 ${item.colorClass}`}
                aria-hidden="true"
              />
              <div>
                <div className="text-2xl font-semibold text-fg uv-num leading-tight">
                  {item.value}
                </div>
                <div className="text-[13px] text-muted leading-tight">
                  {item.label}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
