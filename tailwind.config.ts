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
        "gold-mid": "#E0B84B",
        "gold-light": "#F9E27D",
        "gold-dark": "#8E6A13",
        ivory: "#FFFDF8",
        charcoal: "#1B1B1B",
        void: "#0D0D0D",
        muted: "#9CA3AF",
      },
      boxShadow: {
        luxury:
          "0 12px 40px rgba(0, 0, 0, 0.45), 0 0 28px rgba(200, 154, 42, 0.14)",
        "luxury-sm":
          "0 6px 24px rgba(0, 0, 0, 0.35), 0 0 16px rgba(200, 154, 42, 0.1)",
        "luxury-glow":
          "0 0 32px rgba(249, 226, 125, 0.45), 0 4px 24px rgba(200, 154, 42, 0.3)",
        metal:
          "0 4px 20px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(249, 226, 125, 0.45)",
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
