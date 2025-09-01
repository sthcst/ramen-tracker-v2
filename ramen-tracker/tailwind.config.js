export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "Segoe UI", "Roboto", "Helvetica", "Arial", "Apple Color Emoji", "Segoe UI Emoji"],
      },
      colors: {
        ramen: {
          50:  "#fff7f3",
          100: "#ffe8df",
          200: "#ffd0bf",
          300: "#ffb296",
          400: "#ff8a62",
          500: "#ff5c2a",  // primary brand
          600: "#e24a1c",
          700: "#b83b18",
          800: "#93331a",
          900: "#7a2d19",
        },
      },
      boxShadow: {
        card: "0 6px 20px rgba(0,0,0,0.06)",
      },
    },
  },
  plugins: [],
}
