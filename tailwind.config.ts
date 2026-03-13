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
        sans: ["var(--font-nunito)", "var(--font-noto-sans-sc)", "system-ui", "sans-serif"],
        display: ["var(--font-zcool)", "var(--font-nunito)", "cursive"],
      },
      colors: {
        "warm-cream": "#FFF8F0",
        "warm-light": "#FFF1E6",
        "warm-sand": "#F5E6D3",
        "warm-peach": "#FFAD85",
        "warm-coral": "#FF6B6B",
        "warm-amber": "#FFB347",
        "warm-pink": "#FFB5C2",
        "warm-brown": "#8B6F47",
        "warm-dark": "#4A3728",
        "warm-text": "#7A6652",
        "warm-border": "#F0D9C4",
      },
      animation: {
        "fade-in": "fadeIn 0.8s ease-out",
        "fade-in-up": "fadeInUp 0.8s ease-out both",
        float: "float 6s ease-in-out infinite",
        "float-delayed": "float 6s ease-in-out 2s infinite",
        "float-slow": "float 8s ease-in-out 1s infinite",
        wiggle: "wiggle 1s ease-in-out infinite",
        marquee: "marquee 30s linear infinite",
        "marquee-reverse": "marquee-reverse 30s linear infinite",
        shimmer: "shimmer 2s linear infinite",
        "bounce-in": "bounceIn 0.5s ease-out",
        "spin-slow": "spin 8s linear infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        fadeInUp: {
          "0%": { opacity: "0", transform: "translateY(30px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-12px)" },
        },
        wiggle: {
          "0%, 100%": { transform: "rotate(0deg)" },
          "25%": { transform: "rotate(-3deg)" },
          "75%": { transform: "rotate(3deg)" },
        },
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        "marquee-reverse": {
          "0%": { transform: "translateX(-50%)" },
          "100%": { transform: "translateX(0)" },
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
      },
      boxShadow: {
        warm: "0 4px 20px rgba(255, 173, 133, 0.15)",
        "warm-lg": "0 10px 40px rgba(255, 173, 133, 0.2)",
        "warm-card": "0 2px 12px rgba(139, 111, 71, 0.08)",
        "warm-card-hover": "0 12px 40px rgba(255, 173, 133, 0.25)",
      },
    },
  },
  plugins: [],
};

export default config;
