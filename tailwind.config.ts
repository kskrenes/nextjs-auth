import type { Config } from "tailwindcss";

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
        // Override them in global.css for each theme as needed.
        tremor: {
          border: {
            DEFAULT: "var(--tremor-border-default, #e5e7eb)", // bg-gray-200
          },
        },
      },
      borderRadius: {
        "tremor-small": "0.375rem",
        "tremor-default": "0.5rem",
        "tremor-full": "9999rem",
      },
    },
  },
  plugins: [],
};

export default config as Config;