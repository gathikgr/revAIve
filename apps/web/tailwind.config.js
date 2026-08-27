/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#090d16',
        surface: '#111726',
        'surface-border': '#1e293b',
        accent: {
          primary: '#10b981', // Emerald yield green
          indigo: '#6366f1',  // Agent diagnostic indigo
          amber: '#f59e0b',   // Pending gate amber
          rose: '#ef4444'     // Unrecoverable red
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Menlo', 'monospace']
      }
    },
  },
  plugins: [],
}
