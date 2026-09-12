/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', '"Noto Sans SC"', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        serif: ['"Noto Serif SC"', 'serif'],
        mono: ['"Plus Jakarta Sans"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      boxShadow: {
        '2xs': '0 1px 2px 0 rgba(0, 0, 0, 0.04)',
      }
    },
  },
  plugins: [],
}
