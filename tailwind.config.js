/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'Segoe UI', 'Arial', 'sans-serif'],
      },
      colors: {
        civic: {
          ink: '#17202a',
          blue: '#1f5d7a',
          teal: '#0f766e',
          saffron: '#c47714',
          red: '#b42318',
          green: '#16794c',
          line: '#d8dee7',
          mist: '#eef3f7',
        },
      },
      boxShadow: {
        panel: '0 12px 28px rgba(20, 31, 44, 0.08)',
      },
    },
  },
  plugins: [],
};
