/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#0a2540',
        surface: '#1a1f36',
        'surface-border': '#2a2f45',
        stripe: {
          navy: '#0a2540',
          dark: '#0f172a',
          card: '#1a1f36',
          border: '#2a2f45',
          blurple: '#635bff',
          'blurple-hover': '#544dc9',
          cyan: '#00d4b2',
          emerald: '#10b981',
          amber: '#f59e0b',
          rose: '#ef4444'
        }
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Menlo', 'Consolas', 'monospace']
      }
    },
  },
  plugins: [],
}
