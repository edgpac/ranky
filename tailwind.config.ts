import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#16A34A',
          light: '#22C55E',
          dark: '#15803D',
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
