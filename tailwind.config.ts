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
        saffron: "#E85D04",
        "saffron-dark": "#C44D03",
        forest: "#1A5C38",
        "forest-dark": "#134530",
        ink: "#0F172A",
        parchment: "#FFFBF5",
        stone: "#F1EDE4",
        "warm-border": "#E2D9CE",
        minor: "#CA8A04",
        noticeable: "#D97706",
        severe: "#B91C1C",
        critical: "#7F1D1D",
        "status-approved": "#F97316",
        "status-planned": "#3B82F6",
        "status-cleaned": "#1A5C38",
        "status-pending": "#9CA3AF",
        "status-rejected": "#EF4444"
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', "system-ui", "sans-serif"]
      },
      boxShadow: {
        soft: "0 4px 24px rgba(15, 23, 42, 0.08)",
        map: "0 8px 32px rgba(15, 23, 42, 0.16)"
      }
    }
  },
  plugins: []
};

export default config;
