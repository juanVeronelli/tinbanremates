/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      colors: {
        // Azul Tinban #0b5ed7 (reiniciar dev server si ves verde)
        brand: {
          50: "#e8f2fd",
          100: "#cce0fa",
          200: "#99c2f5",
          300: "#66a3f0",
          400: "#3385eb",
          500: "#0b5ed7",
          600: "#0952c2",
          700: "#0746ad",
          800: "#053a98",
          900: "#042e83",
        },
      },
    },
  },
  plugins: [],
};
