/** @type {import('tailwindcss').Config} */

// Colors are driven by CSS variables (RGB triplets) so a single `.dark` class
// on <html> swaps the whole palette — including opacity modifiers like
// bg-cream/70 — without changing any component classes. Light values live in
// :root and match the original hex exactly, so the light theme is unchanged.
const withVar = (name) => `rgb(var(--c-${name}) / <alpha-value>)`;

export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        coffee: {
          DEFAULT: withVar('coffee'),
          dark: withVar('coffee-dark'),
          light: withVar('coffee-light'),
          50: withVar('coffee-50'),
          100: withVar('coffee-100'),
          200: withVar('coffee-200'),
          300: withVar('coffee-300'),
          800: withVar('coffee-800'),
          900: withVar('coffee-900'),
        },
        caramel: {
          DEFAULT: withVar('caramel'),
          dark: withVar('caramel-dark'),
          light: withVar('caramel-light'),
          50: withVar('caramel-50'),
          100: withVar('caramel-100'),
          200: withVar('caramel-200'),
        },
        'warm-beige': {
          DEFAULT: withVar('warm-beige'),
          light: withVar('warm-beige-light'),
          dark: withVar('warm-beige-dark'),
        },
        cream: {
          DEFAULT: withVar('cream'),
          pure: withVar('cream-pure'),
          dark: withVar('cream-dark'),
        },
        'expense-red': {
          DEFAULT: withVar('expense-red'),
          dark: withVar('expense-red-dark'),
          light: withVar('expense-red-light'),
          50: withVar('expense-red-50'),
          100: withVar('expense-red-100'),
        },
        'accent-red': {
          DEFAULT: withVar('accent-red'),
          dark: withVar('accent-red-dark'),
          light: withVar('accent-red-light'),
        },
        'border-warm': withVar('border-warm'),
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
