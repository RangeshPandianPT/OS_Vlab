/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Colors defined via CSS variables so they switch with dark mode
        // and still support Tailwind opacity modifiers (e.g. bg-background/50)
        'background':   'rgb(var(--color-background) / <alpha-value>)',
        'panel':        'rgb(var(--color-panel)       / <alpha-value>)',
        'muted':        'rgb(var(--color-muted)       / <alpha-value>)',
        'text-primary': 'rgb(var(--color-text-primary)/ <alpha-value>)',
        'text-muted':   'rgb(var(--color-text-muted)  / <alpha-value>)',
        'accent':       '#ff4757',
        'accent-fg':    '#ffffff',
        'border-shadow':'rgb(var(--color-shadow-dark) / <alpha-value>)',
        'border-light': 'rgb(var(--color-shadow-light)/ <alpha-value>)',
        'border-dark':  'rgb(var(--color-border-dark) / <alpha-value>)',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'card':     '8px 8px 16px var(--shadow-dark), -8px -8px 16px var(--shadow-light)',
        'floating': '12px 12px 24px var(--shadow-dark), -12px -12px 24px var(--shadow-light), inset 1px 1px 0 rgba(255,255,255,0.5)',
        'pressed':  'inset 6px 6px 12px var(--shadow-dark), inset -6px -6px 12px var(--shadow-light)',
        'recessed': 'inset 4px 4px 8px var(--shadow-dark), inset -4px -4px 8px var(--shadow-light)',
        'sharp':    '4px 4px 8px rgba(0,0,0,0.15), -1px -1px 1px rgba(255,255,255,0.8)',
        'glow':         '0 0 10px 2px rgba(255, 71, 87, 0.6)',
        'glow-green':   '0 0 10px 2px rgba(34, 197, 94, 0.6)',
      }
    },
  },
  plugins: [],
}
