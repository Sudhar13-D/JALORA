/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        jalora: {
          blue: '#0070C0',
          'blue-dark': '#005a9e',
          'blue-light': '#EBF5FF',
          navy: '#1F3864',
          'navy-dark': '#142543',
          green: '#2E9E5B',
          'green-light': '#EDF8F2',
          amber: '#F2B01E',
          'amber-light': '#FEF8EA',
          red: '#D64545',
          'red-light': '#FCEDED',
          bg: '#F8FAFC',
          surface: '#FFFFFF',
          border: '#E2E8F0',
        },
      },
    },
  },
  plugins: [],
}
