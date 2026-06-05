/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#EEEDFE',
          100: '#CECBF6',
          200: '#AFA9EC',
          400: '#7F77DD',
          600: '#534AB7',
          800: '#3C3489',
          900: '#26215C',
        },
        surface: '#F7F7FB',
      },
      fontFamily: {
        sans: ['DM Sans', 'ui-sans-serif', 'system-ui'],
        display: ['Syne', 'ui-sans-serif'],
      },
      borderRadius: {
        xl:  '16px',
        '2xl': '20px',
      },
    },
  },
  plugins: [],
}
