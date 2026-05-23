import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#101828",
        panel: "#ffffff",
        line: "#d9dee7",
        mantle: "#00a67d",
        warning: "#f97316",
        accent: "#2563eb"
      },
      boxShadow: {
        soft: "0 12px 36px rgba(16, 24, 40, 0.08)"
      }
    }
  },
  plugins: []
};

export default config;
