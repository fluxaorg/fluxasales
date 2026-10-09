import type { Config } from 'tailwindcss'

// Cor via variável CSS que ainda aceita modificador de opacidade (ex.: bg-linear-indigo/30).
// Com 'var(--x)' puro o Tailwind não gera as classes com "/NN" e elas eram ignoradas em silêncio.
const v = (name: string) => `color-mix(in srgb, var(${name}) calc(<alpha-value> * 100%), transparent)`

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
          bg:                v('--linear-bg'),
          surface:           v('--linear-surface'),
          'surface-elevated':v('--linear-surface-elevated'),
          'surface-hover':   v('--linear-surface-hover'),
          indigo:            v('--linear-indigo'),
          violet:            v('--linear-violet'),
          'violet-hover':    v('--linear-violet-hover'),
          border:            v('--linear-border'),
          'border-strong':   v('--linear-border-strong'),
          text: {
            primary:   v('--linear-text-primary'),
            secondary: v('--linear-text-secondary'),
            tertiary:  v('--linear-text-tertiary'),
            quaternary:v('--linear-text-quaternary'),
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
