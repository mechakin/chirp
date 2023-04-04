/** @type {import('tailwindcss').Config} */
const config = {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      height: {
        screen: '100dvh'
      }
    },
  },
  plugins: [],
};

module.exports = config;
