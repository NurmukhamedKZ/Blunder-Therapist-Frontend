/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        // Calm therapeutic palette - NOT chess.com green/brown
        ink: {
          900: "#0a0a0f",
          800: "#13131a",
          700: "#1c1c26",
          600: "#252533",
          500: "#3a3a4f",
        },
        accent: {
          500: "#f97e5e", // warm coral - friendly, non-aggressive
          400: "#ff9a7e",
        },
        signal: {
          green: "#7eebab",
          amber: "#ffc868",
          red: "#ff6b8a",
        },
      },
      fontFamily: {
        display: ["ui-serif", "Georgia", "serif"],
        sans: ["ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["ui-monospace", "monospace"],
      },
    },
  },
  plugins: [],
};
