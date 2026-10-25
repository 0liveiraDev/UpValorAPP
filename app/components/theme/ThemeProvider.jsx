'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from 'react';
import { flushSync } from 'react-dom';
import { THEME_KEY, normalizeTheme, revealRadius } from '@/lib/theme/theme.js';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('dark');
  const transitionRef = useRef(null);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      const current = normalizeTheme(document.documentElement.dataset.theme);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTheme(current);
    }
  }, []);

  const toggleTheme = useCallback(
    (originEl = null) => {
      if (transitionRef.current) {
        return;
      }

      const next = theme === 'dark' ? 'light' : 'dark';

      const apply = () => {
        if (typeof document !== 'undefined') {
          document.documentElement.dataset.theme = next;
        }
        try {
          localStorage.setItem(THEME_KEY, next);
        } catch {
          // localStorage pode falhar em ambientes restritos
        }
        flushSync(() => {
          setTheme(next);
        });
      };

      const hasStartViewTransition =
        typeof document !== 'undefined' &&
        typeof document.startViewTransition === 'function';

      if (!hasStartViewTransition || !originEl) {
        apply();
        return;
      }

      try {
        const rect = originEl.getBoundingClientRect();
        const x = rect.left + rect.width / 2;
        const y = rect.top + rect.height / 2;
        const r = revealRadius(x, y, window.innerWidth, window.innerHeight);

        const transition = document.startViewTransition(apply);
        transitionRef.current = transition;

        transition.ready
          .then(() => {
            if (document.documentElement.animate) {
              document.documentElement.animate(
                {
                  clipPath: [
                    `circle(0px at ${x}px ${y}px)`,
                    `circle(${r}px at ${x}px ${y}px)`,
                  ],
                },
                {
                  duration: 450,
                  easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
                  pseudoElement: '::view-transition-new(root)',
                }
              );
            }
          })
          .catch(() => {});

        transition.finished
          .catch(() => {})
          .finally(() => {
            transitionRef.current = null;
          });
      } catch {
        apply();
        transitionRef.current = null;
      }
    },
    [theme]
  );

  const value = useMemo(
    () => ({
      theme,
      toggleTheme,
    }),
    [theme, toggleTheme]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme deve ser utilizado dentro de um ThemeProvider');
  }
  return context;
}
