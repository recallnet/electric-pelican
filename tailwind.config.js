/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        mono: ['"Fira Mono"', "ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      colors: {
        // Savant brand colors
        brand: {
          black: "#1D1F2B",
          blue: "#0064C7",
          green: "#38A430",
          yellow: "#F9B700",
          red: "#E5342A",
          "gray-01": "#D2D9E1",
          "gray-02": "#93A5BA",
          "gray-03": "#596E89",
          "gray-04": "#43505F",
          white: "#E9EDF1",
        },
        // Material 3 inspired interactive surfaces
        "interactive-surface": {
          primary: "#0064C7",
          secondary: "#38A430",
          tertiary: "#F9B700",
        },
        "on-primary": "#FFFFFF",
        "on-secondary": "#FFFFFF",
        "on-tertiary": "#1D1F2B",
      },
      backdropBlur: {
        sm: "8px",
        md: "16px",
        lg: "24px",
      },
      spacing: {
        // 8px base scale
        1: "4px",
        2: "8px",
        3: "12px",
        4: "16px",
        5: "24px",
        6: "32px",
      },
      borderRadius: {
        sm: "4px",
        md: "8px",
        lg: "16px",
        full: "9999px",
      },
      boxShadow: {
        e1: "0 2px 4px rgba(0,0,0,0.1)",
        e2: "0 4px 8px rgba(0,0,0,0.1)",
      },
      fontSize: {
        display: ["2.5rem", { lineHeight: "1.2", fontWeight: "700" }], // ~40px
        headline: ["1.5rem", { lineHeight: "1.3", fontWeight: "600" }], // 24px
        body: ["1rem", { lineHeight: "1.5", fontWeight: "400" }],
        label: ["0.875rem", { lineHeight: "1.25", fontWeight: "500" }],
      },
    },
  },
  plugins: [require("tailwind-glassmorphism")],
};
