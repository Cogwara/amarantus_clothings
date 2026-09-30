import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          green: "#16803C",
          "dark-green": "#0F5C2E",
          "light-green": "#EAF7EE",
          orange: "#F28C28",
          "dark-orange": "#D96F0B",
          "light-orange": "#FFF1E2",
          "dark-text": "#17211B",
          "muted-text": "#66736B",
          border: "#DDE5DF",
          "off-white": "#F8FAF9",
          danger: "#DC2626",
          success: "#16803C",
          warning: "#F28C28",
        },
        primary: {
          DEFAULT: "#16803C",
          dark: "#0F5C2E",
          light: "#EAF7EE",
          foreground: "#FFFFFF",
        },
        secondary: {
          DEFAULT: "#F28C28",
          dark: "#D96F0B",
          light: "#FFF1E2",
          foreground: "#FFFFFF",
        },
        surface: {
          bg: "#F8FAF9",
          card: "#FFFFFF",
          border: "#DDE5DF",
          text: "#17211B",
          muted: "#66736B",
        }
      },
      borderRadius: {
        DEFAULT: "12px",
        card: "12px",
        btn: "10px",
      },
      boxShadow: {
        card: "0 2px 8px -1px rgba(22, 33, 27, 0.06), 0 1px 3px -1px rgba(22, 33, 27, 0.04)",
        cardHover: "0 8px 18px -2px rgba(22, 33, 27, 0.08), 0 4px 6px -2px rgba(22, 33, 27, 0.04)",
        modal: "0 20px 25px -5px rgba(22, 33, 27, 0.1), 0 8px 10px -6px rgba(22, 33, 27, 0.05)",
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
