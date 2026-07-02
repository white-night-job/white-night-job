import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        gold: "#C89A2A",
        "gold-mid": "#E6C15A",
        "gold-light": "#F9E7A5",
        "gold-dark": "#8A6510",
        champagne: "#F9E7A5",
        ivory: "#FFFDF8",
        charcoal: "#111111",
        void: "#111111",
        "dark-brown": "#2A1E08",
        muted: "#6B5E4A",
      },
      boxShadow: {
        luxury:
          "0 14px 44px rgba(42, 30, 8, 0.14), 0 6px 20px rgba(200, 154, 42, 0.22), inset 0 1px 0 rgba(255, 255, 255, 0.85)",
        "luxury-lg":
          "0 20px 56px rgba(42, 30, 8, 0.18), 0 8px 28px rgba(200, 154, 42, 0.28), inset 0 1px 0 rgba(255, 255, 255, 0.9)",
        "luxury-sm":
          "0 8px 28px rgba(42, 30, 8, 0.1), 0 4px 14px rgba(200, 154, 42, 0.16), inset 0 1px 0 rgba(255, 255, 255, 0.75)",
        "luxury-glow":
          "0 0 40px rgba(249, 231, 165, 0.45), 0 8px 32px rgba(200, 154, 42, 0.28)",
        metal:
          "0 4px 18px rgba(42, 30, 8, 0.22), inset 0 1px 0 rgba(249, 231, 165, 0.65), inset 0 -1px 0 rgba(138, 101, 16, 0.35)",
        "image-3d":
          "0 10px 28px rgba(42, 30, 8, 0.2), 0 4px 12px rgba(200, 154, 42, 0.18), inset 0 1px 0 rgba(255, 255, 255, 0.4)",
      },
      fontFamily: {
        sans: ["var(--font-sans)"],
        serif: ["var(--font-serif)"],
      },
    },
  },
  plugins: [],
};

export default config;
