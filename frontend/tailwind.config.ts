import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "../components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        sep: {
          background: "#0a0a0a",
          foreground: "#fafafa",
          card: "#141414",
          border: "#262626",
          primary: "#3b82f6",
          muted: "#737373",
        },
      },
    },
  },
  plugins: [],
};

export default config;
