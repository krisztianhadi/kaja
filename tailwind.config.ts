import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        "2xl": "1.25rem",
      },
      boxShadow: {
        soft: "0 1px 2px rgb(20 14 10 / 0.04), 0 4px 16px rgb(20 14 10 / 0.06)",
        lifted: "0 2px 4px rgb(20 14 10 / 0.06), 0 12px 28px rgb(20 14 10 / 0.1)",
      },
      keyframes: {
        // Modals animate from the center (the keyframes keep the centering
        // translate so the dialog never appears to slide in from a corner).
        "dialog-in": {
          from: {
            opacity: "0",
            transform: "translate(-50%, -50%) scale(0.95)",
          },
          to: {
            opacity: "1",
            transform: "translate(-50%, -50%) scale(1)",
          },
        },
        "dialog-out": {
          from: {
            opacity: "1",
            transform: "translate(-50%, -50%) scale(1)",
          },
          to: {
            opacity: "0",
            transform: "translate(-50%, -50%) scale(0.95)",
          },
        },
        "sheet-in-bottom": {
          from: {
            opacity: "0",
            transform: "translateY(12px)",
          },
          to: {
            opacity: "1",
            transform: "translateY(0)",
          },
        },
        // analysis loader: food icons travel left-to-right into the robot
        "kaja-fall": {
          "0%": {
            opacity: "0",
            transform: "translate(-50%, -50%) translateX(-150px)",
          },
          "15%": { opacity: "1" },
          "62%": {
            opacity: "1",
            transform: "translate(-50%, -50%) translateX(0)",
          },
          "100%": {
            opacity: "0",
            transform: "translate(-50%, -50%) translateX(0)",
          },
        },
        // analysis loader: report sheets come out the right side of the robot
        "kaja-out": {
          "0%": {
            opacity: "0",
            transform: "translate(-50%, -50%) translateX(0) scale(0.6)",
          },
          "12%": {
            opacity: "1",
            transform: "translate(-50%, -50%) translateX(0) scale(1)",
          },
          "62%": {
            opacity: "1",
            transform: "translate(-50%, -50%) translateX(150px) scale(1)",
          },
          "100%": {
            opacity: "0",
            transform: "translate(-50%, -50%) translateX(190px) scale(1)",
          },
        },
        // analysis loader: the robot head breathes while working
        "kaja-breathe": {
          "0%, 100%": {
            transform: "translate(-50%, -50%) scale(1)",
            opacity: "1",
          },
          "50%": {
            transform: "translate(-50%, -50%) scale(1.06)",
            opacity: "0.85",
          },
        },
      },
      animation: {
        "dialog-in": "dialog-in 150ms ease-out",
        "dialog-out": "dialog-out 120ms ease-in",
        "sheet-in-bottom": "sheet-in-bottom 180ms ease-out",
        "kaja-fall": "kaja-fall 2.7s linear infinite",
        "kaja-out": "kaja-out 2.7s linear infinite",
        "kaja-breathe": "kaja-breathe 2.2s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
