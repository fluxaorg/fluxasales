import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class', 'class'],
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-dm-sans)', 'sans-serif'],
        inter: ['Inter', 'sans-serif'],
      },
      colors: {
        apple: {
          blue: '#0066CC',
          'blue-focus': '#0071e3',
          'link-blue': '#2997ff',
          ink: '#1d1d1f',
          parchment: '#f5f5f7',
          border: 'rgba(0,0,0,0.08)',
          'tile-1': '#272729',
          'tile-2': '#2a2a2c',
          'tile-3': '#252527',
        },
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        border: 'var(--border)',
        // All linear colors now use CSS variables → theme-aware
        linear: {
          bg:                'var(--linear-bg)',
          surface:           'var(--linear-surface)',
          'surface-elevated':'var(--linear-surface-elevated)',
          'surface-hover':   'var(--linear-surface-hover)',
          indigo:            'var(--linear-indigo)',
          violet:            'var(--linear-violet)',
          'violet-hover':    'var(--linear-violet-hover)',
          border:            'var(--linear-border)',
          'border-strong':   'var(--linear-border-strong)',
          text: {
            primary:   'var(--linear-text-primary)',
            secondary: 'var(--linear-text-secondary)',
            tertiary:  'var(--linear-text-tertiary)',
            quaternary:'var(--linear-text-quaternary)',
          },
        },
        accent: '#0066CC',
        'accent-hover': '#005bb5',
      },
      animation: {
        marquee: 'marquee 30s linear infinite',
      },
      keyframes: {
        marquee: {
          from: { transform: 'translateX(0)' },
          to: { transform: 'translateX(-50%)' },
        },
      },
    },
  },
  plugins: [],
}

export default config
