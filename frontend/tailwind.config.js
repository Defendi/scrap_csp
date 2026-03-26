/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: 'oklch(0.6 0.25 260 / <alpha-value>)',
        secondary: 'oklch(0.7 0.2 190 / <alpha-value>)',
        accent: 'oklch(0.6 0.3 320 / <alpha-value>)',
        success: 'oklch(0.7 0.25 140 / <alpha-value>)',
        danger: 'oklch(0.6 0.25 25 / <alpha-value>)',
        background: 'oklch(0.15 0.05 260 / <alpha-value>)',
        surface: 'oklch(0.2 0.05 260 / 0.8)',
      }
    },
  },
  plugins: [],
}
