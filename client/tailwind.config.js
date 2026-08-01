/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#e8fff4',
          100: '#c7ffe4',
          200: '#8effca',
          300: '#4df5ac',
          400: '#1fe08f',
          500: '#00c46f',
          600: '#009c57',
          700: '#037a47',
          800: '#08603a',
          900: '#094f31',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
