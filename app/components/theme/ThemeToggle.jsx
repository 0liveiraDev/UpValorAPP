'use client';

import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from './ThemeProvider.jsx';

export default function ThemeToggle({ className = '' }) {
  const { theme, toggleTheme } = useTheme();

  const isDark = theme === 'dark';
  const label = isDark ? 'Ativar tema claro' : 'Ativar tema escuro';

  const baseClasses =
    'inline-flex items-center justify-center w-9 h-9 rounded-xl border border-line bg-surface text-muted hover:text-fg hover:border-line-strong transition-all duration-150 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 cursor-pointer';

  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={className ? `${baseClasses} ${className}` : baseClasses}
      onClick={(e) => toggleTheme(e.currentTarget)}
    >
      {isDark ? (
        <Sun className="w-[18px] h-[18px] stroke-[2]" aria-hidden="true" />
      ) : (
        <Moon className="w-[18px] h-[18px] stroke-[2]" aria-hidden="true" />
      )}
    </button>
  );
}
