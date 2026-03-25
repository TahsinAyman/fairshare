import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-display)", "system-ui", "sans-serif"],
      },
      colors: {
        brand: "#F5A623",
        "brand-dim": "#C4841A",
        "brand-glow": "#FDD28A",
        surface: "#0C0C0E",
        "surface-raised": "#131316",
        "surface-border": "#232328",
        "surface-hover": "#2A2A30",
        ink: "#F0EFE9",
        "ink-muted": "#7A7980",
        "ink-faint": "#3D3D44",
      },
      borderRadius: {
        DEFAULT: "10px",
        lg: "14px",
        xl: "20px",
      },
      boxShadow: {
        card: "0 2px 8px rgba(0, 0, 0, 0.4), 0 1px 2px rgba(0, 0, 0, 0.3)",
        focus: "0 0 0 2px #0C0C0E, 0 0 0 4px #F5A623",
        brand: "0 4px 24px rgba(245, 166, 35, 0.25)",
      },
    },
  },
  plugins: [],
} satisfies Config;
