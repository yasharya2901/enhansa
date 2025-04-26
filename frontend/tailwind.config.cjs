/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#9BEB3D',
        'primary-dark': '#79C924',
        secondary: '#4F5663',
        dark: '#121417',
        background: '#121417',
        card: '#1E2126',
        'text-primary': '#FFFFFF',
        'text-secondary': '#A1A1AA',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      animation: {
        'wave': 'wave 1.2s infinite ease-in-out',
      },
    },
  },
  plugins: [],
}
