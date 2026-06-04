import type { Config } from "tailwindcss";
import formsPlugin from "@tailwindcss/forms";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}", 
    "./app/**/*.{js,ts,jsx,tsx,mdx}", // when using Next.js App Router
    "./node_modules/@tremor/react/**/*.{js,ts,jsx,tsx}", // include Tremor components
  ],
  theme: {
    extend: {
      colors: {
        // Tremor components look specifically for these object signatures.
        // Use CSS variables so they dynamically change when the theme changes.
        tremor: {
          brand: {
            faint: "var(--tremor-brand-faint, #eff6ff)",    // bg-blue-50
            muted: "var(--tremor-brand-muted, #bfdbfe)",    // bg-blue-200
            subtle: "var(--tremor-brand-subtle, #60a5fa)",  // bg-blue-400
            DEFAULT: "var(--tremor-brand-default, #3b82f6)", // bg-blue-500
            emphasis: "var(--tremor-brand-emphasis, #1d4ed8)",// bg-blue-700
            inverted: "var(--tremor-brand-inverted, #ffffff)",// white
          },
          background: {
            muted: "var(--tremor-bg-muted, #f9fafb)",      // bg-gray-50
            subtle: "var(--tremor-bg-subtle, #f3f4f6)",    // bg-gray-100
            DEFAULT: "var(--tremor-bg-default, #ffffff)",   // white
            emphasis: "var(--tremor-bg-emphasis, #374151)",// bg-gray-700
          },
          border: {
            DEFAULT: "var(--tremor-border-default, #e5e7eb)", // bg-gray-200
          },
          ring: {
            DEFAULT: "var(--tremor-ring-default, #e5e7eb)",   // bg-gray-200
          },
          content: {
            subtle: "var(--tremor-content-subtle, #9ca3af)",  // text-gray-400
            muted: "var(--tremor-content-muted, #6b7280)",   // text-gray-500
            DEFAULT: "var(--tremor-content-default, #374151)",// text-gray-700
            emphasis: "var(--tremor-content-emphasis, #111827)",// text-gray-900
          },
        },
      },
      boxShadow: {
        // Tremor components explicitly look for these shadow utilities
        "tremor-card": "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
        "tremor-dropdown": "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
      },
      borderRadius: {
        "tremor-small": "0.375rem",
        "tremor-default": "0.5rem",
        "tremor-full": "9999rem",
      },
    },
  },
  plugins: [formsPlugin],
};

export default config as Config;