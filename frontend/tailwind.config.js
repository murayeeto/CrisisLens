/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        void: '#05070D',
        panel: {
          DEFAULT: '#0B1020',
          2: '#0F1629',
          raised: '#141B2E',
        },
        border: {
          subtle: 'rgba(148, 163, 184, 0.08)',
          DEFAULT: 'rgba(148, 163, 184, 0.14)',
          glow: 'rgba(34, 211, 238, 0.35)',
        },
        cyan: {
          500: '#22D3EE',
          400: '#67E8F9',
          glow: 'rgba(34, 211, 238, 0.45)',
        },
        blue: {
          500: '#3B82F6',
          600: '#2563EB',
        },
        sev: {
          crit: '#EF4444',
          high: '#F97316',
          mod: '#F59E0B',
          low: '#22D3EE',
          info: '#64748B',
        },
        text: {
          primary: '#F8FAFC',
          secondary: '#CBD5E1',
          muted: '#94A3B8',
          dim: '#64748B',
          mono: '#475569',
        },
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        sans: ['Inter', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        panel:
          '0 1px 0 rgba(255,255,255,0.04) inset, 0 0 0 1px rgba(148,163,184,0.08), 0 20px 60px -20px rgba(0,0,0,0.6)',
        'glow-cyan':
          '0 0 0 1px rgba(34,211,238,0.35), 0 0 40px -4px rgba(34,211,238,0.35)',
        'glow-red':
          '0 0 0 1px rgba(239,68,68,0.4), 0 0 40px -4px rgba(239,68,68,0.35)',
      },
      transitionTimingFunction: {
        crisp: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
      backdropBlur: {
        xl: '18px',
      },
      letterSpacing: {
        snugger: '-0.03em',
        snug: '-0.025em',
        tightish: '-0.02em',
        hud: '0.12em',
      },
      maxWidth: {
        '8xl': '90rem',
      },
    },
  },
  plugins: [],
}
