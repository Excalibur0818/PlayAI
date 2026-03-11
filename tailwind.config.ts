import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-dm-sans)", "system-ui", "-apple-system", "sans-serif"],
        display: ["var(--font-playfair)", "Georgia", "serif"],
      },
      colors: {
        "apple-gray": "#f5f5f7",
        "apple-dark": "#1d1d1f",
        "apple-light": "#fbfbfd",
        "apple-blue": "#0071e3",
        "apple-blue-hover": "#0077ed",
        "apple-border": "#d2d2d7",
        "apple-text": "#86868b",
        "apple-subtext": "#6e6e73",
      },
      animation: {
        "fade-in": "fadeIn 0.8s ease-out",
        "fade-in-up": "fadeInUp 1s ease-out",
        float: "float 6s ease-in-out infinite",
        shimmer: "shimmer 2s linear infinite",
        "bounce-in": "bounceIn 0.5s ease-out",
        shake: "shake 0.5s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        fadeInUp: {
          "0%": { opacity: "0", transform: "translateY(40px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-20px)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        bounceIn: {
          "0%": { transform: "scale(0)" },
          "50%": { transform: "scale(1.1)" },
          "100%": { transform: "scale(1)" },
        },
        shake: {
          "0%, 100%": { transform: "translateX(0)" },
          "25%": { transform: "translateX(-5px)" },
          "75%": { transform: "translateX(5px)" },
        },
      },
      boxShadow: {
        premium: "0 40px 80px rgba(0, 0, 0, 0.08), 0 20px 40px rgba(0, 0, 0, 0.04)",
      },
    },
  },
  plugins: [],
};

export default config;