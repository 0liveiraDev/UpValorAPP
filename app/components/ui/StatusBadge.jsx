'use client';

import React from 'react';

export default function StatusBadge({ status, className = '' }) {
  const label = status || 'Pendente';
  let colorClass = 'bg-accent/10 text-accent-fg border-accent/20';

  if (label === 'Pago') {
    colorClass = 'bg-pos/10 text-pos border-pos/20';
  } else if (label === 'Atrasado') {
    colorClass = 'bg-neg/10 text-neg border-neg/20';
  }

  return (
    <span
      className={`inline-flex items-center text-xs font-medium px-2.5 py-0.5 rounded-full border ${colorClass} ${className}`.trim()}
    >
      {label}
    </span>
  );
}
