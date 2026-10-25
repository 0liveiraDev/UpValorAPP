'use client';

import React from 'react';

export default function StatusBadge({ status, className = '' }) {
  const label = status || 'Pendente';
  let colorClass = 'bg-accent/12 text-accent-fg border-accent/25';
  let dotClass = 'bg-accent-fg';

  if (label === 'Pago') {
    colorClass = 'bg-pos/12 text-pos border-pos/25';
    dotClass = 'bg-pos';
  } else if (label === 'Atrasado') {
    colorClass = 'bg-neg/12 text-neg border-neg/25';
    dotClass = 'bg-neg';
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-0.5 rounded-full border ${colorClass} ${className}`.trim()}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotClass}`}
        aria-hidden="true"
      />
      {label}
    </span>
  );
}
