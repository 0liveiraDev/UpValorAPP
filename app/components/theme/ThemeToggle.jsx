'use client';

import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from './ThemeProvider.jsx';

export default function ThemeToggle({ className = '' }) {
  const { theme, toggleTheme } = useTheme();

  const isDark = theme === 'dark';
  const label = isDark ? 'Ativar tema claro' : 'Ativar tema escuro';

  const baseClasses =
    'inline-flex items-center gap-1 p-1 h-9 rounded-full border border-line bg-surface-2/80 text-muted hover:text-fg hover:border-line-strong transition-all duration-150 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 cursor-pointer';

  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={className ? `${baseClasses} ${className}` : baseClasses}
      onClick={(e) => toggleTheme(e.currentTarget)}
    >
      <span
        className={`w-7 h-7 rounded-full inline-flex items-center justify-center transition-all duration-200 ${
          !isDark
            ? 'bg-fg text-bg shadow-xs scale-100'
            : 'text-muted hover:text-fg scale-95'
        }`}
      >
        <Sun className="w-3.5 h-3.5 stroke-[2.2]" aria-hidden="true" />
      </span>
      <span
        className={`w-7 h-7 rounded-full inline-flex items-center justify-center transition-all duration-200 ${
          isDark
            ? 'bg-fg text-bg shadow-xs scale-100'
            : 'text-muted hover:text-fg scale-95'
        }`}
      >
        <Moon className="w-3.5 h-3.5 stroke-[2.2]" aria-hidden="true" />
      </span>
    </button>
  );
}
