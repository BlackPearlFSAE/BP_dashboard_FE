# Theming

Tailwind v4 CSS-based theming. No `tailwind.config.js` — everything lives in `src/index.css`.

---

## Layers

- `:root` — light mode colours (default)
- `.dark` — dark mode overrides (class applied to `<html>`)
- `@theme` block — maps CSS custom properties to Tailwind utility classes

Toggling `document.documentElement.classList.toggle('dark')` is handled by `ThemeContext.toggleTheme()`; the switch lives in the sidebar footer.

---

## Key custom properties

| Variable | Purpose |
|---|---|
| `--color-primary` | Accent (orange) — buttons, active nav, gauge highlights |
| `--color-background` | Page background |
| `--color-surface` | Card / panel background |
| `--color-border` | Dividers, input outlines |
| `--color-text` | Primary text |
| `--color-muted` | Secondary / hint text |

All components consume these through Tailwind utilities (`bg-surface`, `text-muted`, `border-border`, etc.), so switching themes never requires touching component code.
