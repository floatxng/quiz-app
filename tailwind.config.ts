import type { Config } from "tailwindcss";

const rgb = (variable: string) => `rgb(var(${variable}) / <alpha-value>)`;

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          900: rgb("--ink-900"),
          850: rgb("--ink-850"),
          800: rgb("--ink-800"),
          750: rgb("--ink-750"),
          700: rgb("--ink-700"),
          650: rgb("--ink-650"),
          600: rgb("--ink-600"),
        },
        bone: {
          DEFAULT: rgb("--bone"),
          dim: rgb("--bone-dim"),
          faint: rgb("--bone-faint"),
        },
        flare: {
          DEFAULT: rgb("--amber"),
          soft: rgb("--amber-soft"),
          deep: rgb("--amber-deep"),
        },
        ember: rgb("--ember"),
        mint: rgb("--mint"),

        // Backwards-compatible aliases for any class names that
        // existed before the redesign. They all reroute into the
        // new "broadcast" palette so legacy markup keeps working.
        bg: rgb("--ink-900"),
        panel: rgb("--ink-800"),
        border: rgb("--ink-700"),
        accent: rgb("--amber"),
        accent2: rgb("--mint"),
        muted: rgb("--bone-dim"),
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      letterSpacing: {
        broadcast: "0.22em",
      },
      boxShadow: {
        bevel: "inset 0 1px 0 0 rgba(255,255,255,0.18), 0 1px 0 0 rgba(0,0,0,0.5)",
      },
    },
  },
  plugins: [],
};
export default config;
