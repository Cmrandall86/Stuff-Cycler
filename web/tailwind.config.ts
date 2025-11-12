import type { Config } from 'tailwindcss'
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        base: {
          900: "#0b0d0e", // near-black
          800: "#121416",
          700: "#1a1d1f",
          600: "#24282a",
        },
        ink: {
          400: "#cfd3d6",
          500: "#aab0b4",
          600: "#8a9094"
        },
        mint: {
          300: "#75d0a6", // cool green accents
          400: "#49be8b",
          500: "#2ea272",
          600: "#23835c"
        }
      },
      borderRadius: { '2xl': '1.25rem' }
    }
  },
  plugins: []
} satisfies Config

