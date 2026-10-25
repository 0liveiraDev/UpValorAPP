'use client';

import React from 'react';
import Image from 'next/image';
import { LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ThemeToggle from './theme/ThemeToggle.jsx';

function getInitials(name = '') {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'UV';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

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
          <div className="flex items-center gap-2.5">
            <Image unoptimized
              src="/logo.png"
              alt="UpValor"
              width="112"
              height="32"
              className="h-8 w-auto"
            />
          </div>

          {/* Centro (≥ md): Nav Principal em cápsula com passagem fluida e ícone retrátil */}
          <nav
            aria-label="Principal"
            className="hidden md:flex items-center rounded-full border border-line bg-surface-2/85 p-1 gap-1 shadow-sm"
          >
            {navItems.map((item) => {
              const active = activeTab === item.name;
              const Icon = item.icon;
              return (
                <motion.button
                  layout
                  key={item.name}
                  type="button"
                  aria-current={active ? 'page' : undefined}
                  onClick={() => onTabChange?.(item.name)}
                  transition={{
                    layout: {
                      type: 'spring',
                      stiffness: 420,
                      damping: 32,
                    },
                  }}
                  className={`relative px-3 md:px-3.5 lg:px-4 h-9 rounded-full text-sm font-medium transition-colors duration-150 flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 cursor-pointer ${
                    active ? 'text-white' : 'text-muted hover:text-fg'
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="lampNav"
                      className="absolute inset-0 rounded-full bg-accent shadow-md shadow-accent/25"
                      transition={{
                        type: 'spring',
                        stiffness: 400,
                        damping: 30,
                      }}
                    >
                      <span
                        className="absolute -top-1 left-1/2 -translate-x-1/2 w-7 h-1 rounded-t-full bg-accent-fg/90"
                        style={{ boxShadow: '0 0 10px 1px var(--uv-accent)' }}
                      />
                    </motion.span>
                  )}

                  <AnimatePresence initial={false} mode="popLayout">
                    {active && Icon && (
                      <motion.span
                        key={`${item.name}-icon`}
                        initial={{ width: 0, opacity: 0, scale: 0.6 }}
                        animate={{ width: 'auto', opacity: 1, scale: 1 }}
                        exit={{ width: 0, opacity: 0, scale: 0.6 }}
                        transition={{
                          duration: 0.2,
                          ease: [0.22, 1, 0.36, 1],
                        }}
                        className="relative z-10 inline-flex items-center overflow-hidden"
                      >
                        <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                      </motion.span>
                    )}
                  </AnimatePresence>

                  <motion.span layout="position" className="relative z-10">
                    {item.label}
                  </motion.span>
                </motion.button>
              );
            })}
          </nav>

          {/* Direita: ThemeToggle, Avatar + Nome do Usuário, Botão Sair */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            <ThemeToggle />
            {userName && (
              <div className="flex items-center gap-2 pl-1">
                <span
                  className="w-8 h-8 rounded-full bg-accent/15 border border-accent/30 text-accent-fg text-xs font-semibold inline-flex items-center justify-center shrink-0"
                  aria-hidden="true"
                >
                  {getInitials(userName)}
                </span>
                <span
                  className="text-sm font-medium text-fg max-w-[10rem] truncate hidden lg:block"
                  title={userName}
                >
                  {userName}
                </span>
              </div>
            )}
            <button
              type="button"
              onClick={onLogout}
              aria-label="Sair do sistema"
              title="Sair do sistema"
              className="p-2 text-muted hover:text-neg hover:bg-neg/10 rounded-full transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 cursor-pointer"
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
                    type: 'spring',
                    stiffness: 400,
                    damping: 30,
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
