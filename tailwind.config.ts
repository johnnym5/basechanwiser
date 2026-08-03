import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        google: {
          blue: "#1a73e8",
          darkBlue: "#1557b0",
          lightBlue: "#e8f0fe",
          bg: "#F8F9FA",
          surface: "#ffffff",
          text: "#1f1f1f",
          subtext: "#5f6368",
        },
        traffic: {
          green: "#1e8e3e",
          greenBg: "#e6f4ea",
          yellow: "#f9ab00",
          yellowBg: "#fef7e0",
          orange: "#e37400",
          orangeBg: "#feefe3",
          red: "#d93025",
          redBg: "#fce8e6",
        },
      },
      borderRadius: {
        m3: "16px",
        "m3-sm": "12px",
        "m3-lg": "24px",
      },
    },
  },
  plugins: [],
};
export default config;
