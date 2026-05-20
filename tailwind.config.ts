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
        ink: "#111827",
        civic: "#0F766E",
        saffron: "#F97316",
        clean: "#22C55E"
      },
      boxShadow: {
        soft: "0 18px 60px rgba(17, 24, 39, 0.10)"
      }
    }
  },
  plugins: []
};

export default config;
