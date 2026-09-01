/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        coffee: {
          DEFAULT: '#3B2314',
          dark: '#26160B',
          light: '#533420',
          50: '#FBF8F5',
          100: '#F5EFEA',
          200: '#E6D7CB',
          300: '#D4BCAC',
          800: '#3B2314',
          900: '#26160B',
        },
        caramel: {
          DEFAULT: '#8B4A20',
          dark: '#703816',
          light: '#A65C2B',
          50: '#FAF4EF',
          100: '#F2E4D8',
          200: '#E3C5AD',
        },
        'warm-beige': {
          DEFAULT: '#F5E6D3',
          light: '#FAF2E8',
          dark: '#E8D4BE',
        },
        cream: {
          DEFAULT: '#FFF6ED',
          pure: '#FFFFFF',
          dark: '#FCEFE2',
        },
        'expense-red': {
          DEFAULT: '#C62828',
          dark: '#B71C1C',
          light: '#D32F2F',
          50: '#FFEBEE',
          100: '#FFCDD2',
        },
        'accent-red': {
          DEFAULT: '#E53935',
          dark: '#C62828',
          light: '#EF5350',
        },
        'border-warm': '#E5D3C1',
      },
      fontFamily: {
        sans: ['Poppins', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'warm-sm': '0 1px 3px 0 rgba(59, 35, 20, 0.06), 0 1px 2px 0 rgba(59, 35, 20, 0.04)',
        'warm-md': '0 4px 14px -2px rgba(59, 35, 20, 0.08), 0 2px 6px -1px rgba(59, 35, 20, 0.04)',
        'warm-lg': '0 10px 25px -3px rgba(59, 35, 20, 0.1), 0 4px 10px -2px rgba(59, 35, 20, 0.05)',
        'warm-modal': '0 20px 40px -10px rgba(59, 35, 20, 0.25)',
      },
      borderRadius: {
        'card': '16px',
        'btn': '12px',
        'modal': '20px',
      }
    },
  },
  plugins: [],
}
