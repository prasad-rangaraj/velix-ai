/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: { sans: ['"Plus Jakarta Sans"', "system-ui", "sans-serif"] },
      colors: {
        bg:       "#0F1117",
        surface:  "#161B27",
        surface2: "#1C2237",
        border:   "#1F2840",
        border2:  "#2A3450",
        ink:  { DEFAULT: "#E2E8F0", 2: "#94A3B8", 3: "#4E6080" },
        acc:  { DEFAULT: "#818CF8", dk: "#6366F1", dim: "rgba(129,140,248,0.12)", glow: "rgba(129,140,248,0.25)" },
      },
      boxShadow: {
        card:    "0 1px 3px rgba(0,0,0,0.4)",
        accent:  "0 0 20px rgba(129,140,248,0.25)",
        "accent-sm": "0 2px 8px rgba(129,140,248,0.20)",
      },
      borderRadius: { "2xl": "1rem", "3xl": "1.25rem" },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
