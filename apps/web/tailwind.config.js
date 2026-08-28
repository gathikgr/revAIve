/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#f6f9fc',
        surface: '#ffffff',
        'surface-border': '#e6ebf1',
        stripe: {
          navy: '#32325d',
          dark: '#1c202c',
          card: '#ffffff',
          border: '#e6ebf1',
          blurple: '#635bff',
          'blurple-hover': '#544dc9',
          cyan: '#00d4b2',
          emerald: '#22c55e',
          amber: '#f59e0b',
          rose: '#ef4444',
          textPrimary: '#32325d',
          textSecondary: '#6b7c93',
          bgLight: '#f6f9fc'
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
