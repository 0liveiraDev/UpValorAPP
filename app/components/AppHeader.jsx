'use client';

import React from 'react';
import { LogOut } from 'lucide-react';
import { motion } from 'framer-motion';
import ThemeToggle from './theme/ThemeToggle.jsx';

export default function AppHeader({
  navItems = [],
  activeTab = 'painel',
  onTabChange,
  userName = '',
  onLogout,
}) {
  return (
    <>
      <header
        className="sticky top-0 z-40 border-b border-line backdrop-blur-xl"
        style={{ background: 'var(--uv-nav)' }}
      >
        <div className="max-w-7xl mx-auto px-3 md:px-8 h-16 flex items-center justify-between gap-3">
          {/* Esquerda: Logo */}
          <div className="flex items-center">
            <img
              src="/logo.png"
              alt="UpValor"
              width="112"
              height="32"
              className="h-8 w-auto"
            />
          </div>

          {/* Centro (≥ md): Nav Principal em cápsula */}
          <nav
            aria-label="Principal"
            className="hidden md:flex rounded-full border border-line bg-fg/[0.04] p-1 gap-1"
          >
            {navItems.map((item) => {
              const active = activeTab === item.name;
              return (
                <button
                  key={item.name}
                  type="button"
                  aria-current={active ? 'page' : undefined}
                  onClick={() => onTabChange?.(item.name)}
                  className={`relative px-4 h-9 rounded-full text-sm font-medium transition-colors duration-150 flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 cursor-pointer ${
                    active ? 'text-white' : 'text-muted hover:text-fg'
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="navPill"
                      className="absolute inset-0 rounded-full bg-accent"
                      transition={{
                        type: 'tween',
                        duration: 0.18,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                    />
                  )}
                  <span className="relative z-10">{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Direita: ThemeToggle, Nome do Usuário, Botão Sair */}
          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle />
            {userName && (
              <span
                className="text-sm font-medium text-fg max-w-[10rem] truncate hidden sm:block"
                title={userName}
              >
                {userName}
              </span>
            )}
            <button
              type="button"
              onClick={onLogout}
              aria-label="Sair do sistema"
              title="Sair do sistema"
              className="p-2 text-muted hover:text-neg rounded-xl transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 cursor-pointer"
            >
              <LogOut className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </header>

      {/* Nav Mobile (< md): Cápsula fixa inferior */}
      <nav
        aria-label="Navegação móvel"
        className="md:hidden fixed bottom-4 left-1/2 -translate-x-1/2 z-50 rounded-full border border-line backdrop-blur-xl p-1 flex gap-1 shadow-xl"
        style={{ background: 'var(--uv-nav)' }}
      >
        {navItems.map((item) => {
          const active = activeTab === item.name;
          const Icon = item.icon;
          return (
            <button
              key={item.name}
              type="button"
              aria-label={item.label}
              aria-current={active ? 'page' : undefined}
              onClick={() => onTabChange?.(item.name)}
              className={`relative p-2.5 h-10 w-10 rounded-full flex items-center justify-center transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 cursor-pointer ${
                active ? 'text-white' : 'text-muted hover:text-fg'
              }`}
            >
              {active && (
                <motion.span
                  layoutId="navPillMobile"
                  className="absolute inset-0 rounded-full bg-accent"
                  transition={{
                    type: 'tween',
                    duration: 0.18,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                />
              )}
              {Icon && (
                <Icon className="relative z-10 w-5 h-5" aria-hidden="true" />
              )}
            </button>
          );
        })}
      </nav>
    </>
  );
}
