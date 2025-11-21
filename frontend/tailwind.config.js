/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        stellar: {
          primary: '#7B6BA8',
          dark: '#5D4A7E',
          light: '#9B8BC5',
        },
        orange: {
          primary: '#FF6B35',
          light: '#FF8C61',
        },
      },
    },
  },
  plugins: [],
}

