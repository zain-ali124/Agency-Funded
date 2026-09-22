/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#050505",
        bgSecondary: "#0B0D0F",
        card: "#111417",
        cardElevated: "#161A1E",
        borderDark: "#252A30",
        textPrimary: "#FFFFFF",
        textSecondary: "#A7ADB4",
        textMuted: "#6F767E",
        brand: "#00E676",
        brandSecondary: "#00C853",
        danger: "#FF4D5E",
        warning: "#FFB020",
        info: "#4DA3FF",
      },
      borderRadius: {
        sm: "8px",
        md: "12px",
        lg: "18px",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 40px rgba(0, 230, 118, 0.08)",
      },
    },
  },
  plugins: [],
};
