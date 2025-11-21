import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}",
    "./src/app/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "sans-serif"],
      },
      colors: {
        // Geist-inspired palette
        background: "#ffffff",
        foreground: "#000000",
        accents: {
          1: "#fafafa",
          2: "#eaeaea",
          3: "#999999",
          4: "#888888",
          5: "#666666",
          6: "#444444",
          7: "#333333",
          8: "#111111",
        },
        success: {
          lighter: "#d3e5ff",
          light: "#3291ff",
          DEFAULT: "#0070f3",
          dark: "#0761d1",
        },
        error: {
          lighter: "#f7d4d6",
          light: "#ff1a1a",
          DEFAULT: "#e00",
          dark: "#c50000",
        },
        warning: {
          lighter: "#ffefcf",
          light: "#f7b955",
          DEFAULT: "#f5a623",
          dark: "#ab570a",
        },
      },
      boxShadow: {
        "geist": "0 4px 12px rgba(0, 0, 0, 0.1)",
        "geist-hover": "0 6px 16px rgba(0, 0, 0, 0.12)",
      },
    },
  },
  plugins: [],
};

export default config;
