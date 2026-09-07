import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f0f6fe",
          100: "#dbeafe",
          200: "#bfdbfe",
          300: "#93c5fd",
          400: "#60a5fa",
          500: "#2563eb", // Vibrant corporate blue
          600: "#1d4ed8",
          700: "#1e40af",
          800: "#1e3a8a",
          900: "#0f172a", // Deep Navy
          950: "#090d16",
        },
        fabric: {
          cream: "#FAF8F5",
          sand: "#EFECE6",
          charcoal: "#23262D",
          amber: "#D97706",
          emerald: "#059669",
        }
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "-apple-system", "sans-serif"],
        heading: ["var(--font-heading)", "system-ui", "-apple-system", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
