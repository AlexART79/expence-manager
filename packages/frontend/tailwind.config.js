/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: "rgb(var(--color-surface) / <alpha-value>)",
          muted: "rgb(var(--color-surface-muted) / <alpha-value>)",
          raised: "rgb(var(--color-surface-raised) / <alpha-value>)"
        },
        line: {
          DEFAULT: "rgb(var(--color-line) / <alpha-value>)",
          strong: "rgb(var(--color-line-strong) / <alpha-value>)"
        },
        control: {
          DEFAULT: "rgb(var(--color-control) / <alpha-value>)",
          hover: "rgb(var(--color-control-hover) / <alpha-value>)"
        },
        text: {
          DEFAULT: "rgb(var(--color-text) / <alpha-value>)",
          muted: "rgb(var(--color-text-muted) / <alpha-value>)"
        },
        accent: {
          DEFAULT: "rgb(var(--color-accent) / <alpha-value>)",
          strong: "rgb(var(--color-accent-strong) / <alpha-value>)"
        },
        danger: {
          DEFAULT: "rgb(var(--color-danger) / <alpha-value>)",
          strong: "rgb(var(--color-danger-strong) / <alpha-value>)",
          surface: "rgb(var(--color-danger-surface) / <alpha-value>)",
          border: "rgb(var(--color-danger-border) / <alpha-value>)"
        },
        warning: {
          DEFAULT: "rgb(var(--color-warning) / <alpha-value>)",
          strong: "rgb(var(--color-warning-strong) / <alpha-value>)",
          surface: "rgb(var(--color-warning-surface) / <alpha-value>)",
          border: "rgb(var(--color-warning-border) / <alpha-value>)"
        }
      }
    }
  },
  plugins: []
};
