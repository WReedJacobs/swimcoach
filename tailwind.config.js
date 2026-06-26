/** @type {import('tailwindcss').Config} */

// Tokens resolve to CSS variables (space-separated RGB channels) so Tailwind's
// opacity modifiers — bg-primary/10, ring-primary/40, etc. — keep working.
// The actual values (and dark/light) live in index.css.
const ch = (v) => `rgb(var(${v}) / <alpha-value>)`

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: ch('--c-primary'),
          dark: ch('--c-primary-dark'),
        },
        // Ink that sits ON a primary fill — legible in both themes.
        'on-primary': ch('--c-on-primary'),
        secondary: ch('--c-secondary'),
        accent: ch('--c-accent'),
        danger: ch('--c-danger'),
        // Beginner mode accent
        coral: ch('--c-coral'),
        bg: ch('--c-bg'),
        surface: ch('--c-surface'),
        border: ch('--c-border'),
        text: {
          primary: ch('--c-text-primary'),
          secondary: ch('--c-text-secondary'),
          muted: ch('--c-text-muted'),
        },
      },
      fontFamily: {
        sans: ['Space Grotesk', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        component: '6px',
        card: '10px',
        modal: '14px',
      },
    },
  },
  plugins: [],
}
