/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fff2ef',
          100: '#ffe1da',
          200: '#ffc3b6',
          300: '#fb9c88',
          400: '#f6745a',
          500: '#f1543f',
          600: '#db3a26',
          700: '#b72f1e',
          800: '#94271b',
          900: '#7a251c',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
