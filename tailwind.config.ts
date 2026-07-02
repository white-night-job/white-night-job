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
        gold: "#C9A227",
        "gold-mid": "#D4AF37",
        "gold-light": "#E5C76B",
        "gold-dark": "#9A7B1A",
        ivory: "#FFFDF8",
        charcoal: "#1a1a1a",
        muted: "#6b6b6b",
      },
      boxShadow: {
        luxury:
          "0 8px 32px rgba(154, 123, 26, 0.16), 0 2px 10px rgba(26, 26, 26, 0.06)",
        "luxury-sm":
          "0 4px 20px rgba(154, 123, 26, 0.14), 0 1px 6px rgba(26, 26, 26, 0.05)",
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
