import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'dark-base': '#090e0c',
        'dark-surface': '#0f1612',
        'dark-raised': '#161b22',
        'dark-border': '#1a2820',
        'dark-text': '#e2ede8',
        'dark-text-secondary': '#a3c9b8',
        'dark-text-muted': '#4d7a66',
      },
    },
  },
  plugins: [],
} satisfies Config;
