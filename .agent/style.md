Below is a **text-based UI Kit** for **Project “Electric Pelican”**, tailored for your Next.js + Tailwind setup. It’s minimalistic, mobile-first, and heavily text‑driven with glassmorphic touches inspired by Apple & Material 3.

---

## 1. 📦 Libraries to Install

```bash
npm install \
  tailwind-glassmorphism \
  @sinskiy/tailwind-material-colors
```

- **`tailwind-glassmorphism`** provides utility classes like `.glassmorphism-25/50/75` for backdrop-blur + transparency + border ([skypack.dev][1]).
- **`@sinskiy/tailwind-material-colors`** gives you Material 3 color palettes, dynamic theming, `surface-*`, and `interactive-surface-*` utilities ([tailwind-material-colors-docs.vercel.app][2]).

---

## 2. 🛠️ `tailwind.config.js`

```js
const { withMaterialColors } = require("@sinskiy/tailwind-material-colors");

module.exports = withMaterialColors(
  {
    content: ["./pages/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
    theme: {
      extend: {
        colors: {
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
    plugins: [
      require("tailwind-glassmorphism"),
      // Material surfaces come from @sinskiy plugin
    ],
  },
  {
    primary: "#0064C7",
    secondary: "#38A430",
    tertiary: "#F9B700",
  },
  {
    scheme: "expressive",
  },
);
```

---

## 3. 🧩 Core Utility Patterns

### 3.1 Glass Card (used for panels, nav, modals)

```html
<div class="glassmorphism-50 backdrop-blur-md border border-white/20 rounded-lg shadow-e1 p-4">
  <!-- Content here -->
</div>
```

- `.glassmorphism-50`: 50% opacity + blur + border ([skypack.dev][1])
- `backdrop-blur-md`: 16px blur
- `border-white/20` + `shadow-e1`: soft outline & lift
- `rounded-lg`: consistent 16px corner

---

### 3.2 Buttons (full-width 🟦 mobile → inline wide screens)

```html
<button
  class="
  interactive-surface-primary
  w-full sm:w-auto
  text-on-primary
  rounded-md
  py-2 px-4
  font-semibold
"
>
  Fight!
</button>
```

- `interactive-surface-primary`: dynamic M3 color, hover press states built-in from the plugin ([tailwindcss-glassmorphism.vercel.app][3], [epicweb.dev][4], [dev.to][5], [tailwind-material-colors-docs.vercel.app][2]).
- `rounded-md`: 8px corner
- `w-full sm:w-auto`: mobile first width

---

### 3.3 Text Styles

| Role     | Tailwind Class                            | Use Case                  |
| -------- | ----------------------------------------- | ------------------------- |
| Display  | `text-display text-brand-black`           | Page or section titles    |
| Headline | `text-headline text-brand-black`          | Bracket titles, labels    |
| Body     | `text-body text-brand-gray-04`            | Prompt, descriptions      |
| Label    | `text-label text-brand-gray-03 uppercase` | UI labels, bracket labels |

---

### 3.4 Tournament Brackets (text-heavy components)

```html
<div class="flex flex-col sm:flex-row gap-4">
  <div class="flex flex-col w-full sm:w-1/2 gap-2">
    <div class="text-headline">Match #1: AI-A vs AI-B</div>
    <div class="px-2 py-1 bg-brand-gray-01 rounded-md">AI‑A wins</div>
  </div>
  <!-- Repeat for Match #2 -->
</div>
```

- `flex-col` → `flex-row` on `sm` breakpoint
- `bg-brand-gray-01 rounded-md`: subtle container for text
- Consistent typography and spacing

---

### 3.5 Full‑Screen Layout Skeleton

```html
<div class="min-h-screen bg-brand-white flex flex-col">
  <header class="glassmorphism-25 backdrop-blur-sm border-b border-white/10 p-4">
    <h1 class="text-display">Electric Pelican</h1>
  </header>
  <main class="flex-grow p-4">
    <!-- tournament UI -->
  </main>
  <footer class="p-4 text-center text-label text-brand-gray-02">&copy; AI Tournament, 2025</footer>
</div>
```

- `min-h-screen`: fill viewport
- `glassmorphism-25` + `border-b`: lightly frosted nav bar
- Mobile → desktop spacing automatically scalable

---

## 4. 🧭 Guidelines at a Glance

- **Minimalism:** limit to one glass layer at a time; keep backgrounds subtle. Use white/gray for text contrast.
- **Full‑Screen & Responsive:** use Tailwind `sm`, `md` breakpoints—always dev mobile‑first.
- **Text-Only UI:** no images/icons—use spacing, typography, containers to convey structure.
- **Mobile Optimization:** full‑width buttons, columns stack → flex-row on `sm+`.

---a

## 5. 🧱 Tailwind `<Tailwind />` Example for Next.js

```tsx
export default function Button({ children, onClick }) {
  return (
    <button
      className="interactive-surface-primary text-on-primary rounded-md py-2 px-4 font-semibold w-full sm:w-auto transition"
      onClick={onClick}
    >
      {children}
    </button>
  );
}
```

Simple, reusable, follows style guide.

---

## 6. ✅ Next Steps

1. **Component wrappers**: create `<GlassPanel>`, `<Bracket>`, `<Button>` with standardized classes.
2. **Write docs**: add code snippets above to your style guide.
3. **Test contrast/accessibility**, adjust as needed.
4. **Iterate**: tweak blur, spacing tokens to match your branded aesthetic.

---

### In Summary

Project “Electric Pelican” uses:

- **glassmorphism plugin** and **Material 3 colors**, customized with your brand palette,
- **Tokenized typography, spacing, and containers** in Tailwind,
- A **mobile‑first, minimalist style** with full‑screen layouts and responsive scaling,
- A **text‑heavy, text‑only UI** for AI model tournaments.

This UI Kit empowers developers to consistently build the bracket, prompt, and button-heavy interface with ease and modern styling. Let me know if you’d like help scaffolding React components or Next.js pages!

[1]: https://www.skypack.dev/view/tailwind-glassmorphism?utm_source=chatgpt.com "npm:tailwind-glassmorphism - Skypack.dev"
[2]: https://tailwind-material-colors-docs.vercel.app/?utm_source=chatgpt.com "Tailwind Material Colors"
[3]: https://tailwindcss-glassmorphism.vercel.app/?utm_source=chatgpt.com "Tailwindcss Glassmorphism Generator"
[4]: https://www.epicweb.dev/tips/creating-glassmorphism-effects-with-tailwind-css?utm_source=chatgpt.com "Creating Glassmorphism Effects with Tailwind CSS | Epic Web Dev"
[5]: https://dev.to/thedevdavid/glassmorphism-with-tailwind-css-under-60-seconds-2nej?utm_source=chatgpt.com "Glassmorphism with Tailwind CSS Under 60 seconds"
