import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: { DEFAULT: "#16121F", soft: "#5E5873", faint: "#9A94AD" },
        pink: { DEFAULT: "#FF4F93", deep: "#E5317A", soft: "#FFE3EF" },
        lav: { DEFAULT: "#F1ECFD", deep: "#DCD2F7", ink: "#6B4FD8" },
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 18px 50px -18px rgba(70, 40, 140, 0.35), 0 4px 14px -6px rgba(22, 18, 31, 0.12)",
        soft: "0 6px 24px -10px rgba(70, 40, 140, 0.25)",
        pop: "0 10px 28px -8px rgba(255, 79, 147, 0.55)",
      },
      keyframes: {
        shimmer: { "100%": { transform: "translateX(100%)" } },
      },
      animation: { shimmer: "shimmer 1.6s infinite" },
    },
  },
  plugins: [],
};

export default config;
