/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#5B8DEF",
        secondary: "#7C4DFF",
        accent: "#00D4AA",
        background: "#0F172A",
        surface: "#1E293B",
        card: "rgba(255,255,255,0.12)",
        success: "#22C55E",
        warning: "#F59E0B",
        error: "#EF4444",
        info: "#38BDF8",
      },
    },
  },
  plugins: [],
}
