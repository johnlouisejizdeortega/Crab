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
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"SF Pro Text"',
          '"SF Pro Display"',
          'Inter',
          'system-ui',
          'sans-serif',
        ],
      },
      boxShadow: {
        soft: '0 1px 2px rgba(15,23,42,0.04), 0 8px 24px -12px rgba(15,23,42,0.16)',
        float: '0 8px 40px -12px rgba(15,23,42,0.28)',
        material: 'inset 0 1px 0 rgba(255,255,255,0.6), 0 10px 34px -14px rgba(0,0,0,0.22)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.35s ease-out',
      },
    },
  },
  plugins: [],
};
