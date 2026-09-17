/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts}'],
  // Modo oscuro dirigido por el atributo data-theme (ThemeService).
  darkMode: ['selector', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        // ── Tokens semánticos del Design System (backed by CSS vars) ──────
        // Uso: bg-surface, text-ink, border-border, text-accent, bg-ok, etc.
        // Definidos en src/styles/design-system.css. Son la vía nueva; la
        // paleta numérica de abajo queda por compatibilidad durante la
        // migración de pantallas (Fase 5) y se retirará al final.
        canvas: 'var(--canvas)',
        surface: 'var(--surface)',
        'surface-2': 'var(--surface-2)',
        sunken: 'var(--sunken)',

        border: 'var(--border)',
        'border-soft': 'var(--border-soft)',
        'border-strong': 'var(--border-strong)',

        ink: 'var(--ink)',
        'ink-2': 'var(--ink-2)',
        'ink-3': 'var(--ink-3)',
        'ink-4': 'var(--ink-4)',

        accent: 'var(--accent)',
        'accent-hi': 'var(--accent-hi)',
        'accent-fill': 'var(--accent-fill)',
        'accent-line': 'var(--accent-line)',

        ok: 'var(--ok)',
        attn: 'var(--attn)',
        stop: 'var(--stop)',
        led: 'var(--led)',

        rail: 'var(--rail)',
        'rail-hover': 'var(--rail-hover)',
        'rail-ink': 'var(--rail-ink)',
        'rail-ink-hi': 'var(--rail-ink-hi)',
        nav: 'var(--nav)',
        'nav-border': 'var(--nav-border)',
        'nav-hover': 'var(--nav-hover)',
        'nav-field': 'var(--nav-field)',
        'nav-ink': 'var(--nav-ink)',
        'nav-lbl': 'var(--nav-lbl)',
        'nav-icon': 'var(--nav-icon)',
        'nav-active': 'var(--nav-active)',

        // ── Paleta legacy (compatibilidad; se retira en Fase 5) ───────────
        // Primary brand color - Blue
        primary: {
          50:  '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        // Success - Emerald
        success: {
          50:  '#f0fdf4',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
        },
        // Warning - Amber
        warning: {
          50:  '#fffbeb',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
        },
        // Danger - Red
        danger: {
          50:  '#fef2f2',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
        },
        // Info - Sky
        info: {
          50:  '#f0f9ff',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
        },
      },
      fontFamily: {
        sans: ['IBM Plex Sans', 'system-ui', 'Segoe UI', 'sans-serif'],
        mono: ['IBM Plex Mono', 'ui-monospace', 'monospace'],
        display: ['IBM Plex Sans', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        // escala del Design System: 21 / 16 / 14 / 13 / 12,5 / 10 (base 14)
        'ds-xl': ['1.3125rem', { lineHeight: '1.4' }],
        'ds-lg': ['1rem', { lineHeight: '1.5' }],
        'ds-base': ['0.875rem', { lineHeight: '1.5' }],
        'ds-sm': ['0.8125rem', { lineHeight: '1.5' }],
        'ds-xs': ['0.78125rem', { lineHeight: '1.4' }],
        'ds-2xs': ['0.625rem', { lineHeight: '1.3' }],
      },
      spacing: {
        xs: '0.25rem',   // 4px
        sm: '0.5rem',    // 8px
        md: '1rem',      // 16px
        lg: '1.5rem',    // 24px
        xl: '2rem',      // 32px
        '2xl': '3rem',   // 48px
        '3xl': '4rem',   // 64px
      },
      borderRadius: {
        // Design System
        ds: 'var(--r)',        // 10px
        'ds-sm': 'var(--r-sm)', // 7px
        // legacy (se retira en Fase 5)
        sm: '0.375rem',    // 6px
        md: '0.5rem',      // 8px
        lg: '0.75rem',     // 12px
        xl: '1rem',        // 16px
        full: '9999px',
      },
      boxShadow: {
        sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
        xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
        '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.05)',
      },
      animation: {
        fadeIn: 'fadeIn 300ms ease-in-out',
        slideInUp: 'slideInUp 300ms ease-in-out',
        slideInDown: 'slideInDown 300ms ease-in-out',
        pulse: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        shimmer: 'shimmer 2s infinite',
      },
      keyframes: {
        fadeIn: {
          'from': { opacity: '0' },
          'to': { opacity: '1' },
        },
        slideInUp: {
          'from': {
            transform: 'translateY(10px)',
            opacity: '0',
          },
          'to': {
            transform: 'translateY(0)',
            opacity: '1',
          },
        },
        slideInDown: {
          'from': {
            transform: 'translateY(-10px)',
            opacity: '0',
          },
          'to': {
            transform: 'translateY(0)',
            opacity: '1',
          },
        },
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
      },
      transitionTimingFunction: {
        smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
    },
  },
  plugins: [],
};
