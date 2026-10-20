/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        loft: {
          orange: '#F56738',
          orangeHover: '#D94616',
          orangeActive: '#B83207',
          orangeLight: '#FFF2EC',
          dark: '#121619',
          surface: '#1A2024',
          muted: '#627D98',
          border: '#E1E9EF',
        },
        copan: {
          orange: '#F56738',
          dark: '#121619',
          surface: '#1A2024',
          border: '#E1E9EF',
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
    },
  },
  plugins: [],
  corePlugins: {
    preflight: false, // Prevents Ant Design reset conflicts
  },
};
