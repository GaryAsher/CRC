# src/styles/ — SCSS Stylesheets

Ported from the Jekyll site. Imported via `main.scss` in `src/routes/+layout.svelte`.

## Structure

### `base/` — Foundation
| File | Purpose |
|-|-|
| `_variables.scss` | CSS custom properties, color tokens, spacing, breakpoints |
| `_reset.scss` | CSS reset / normalize |
| `_responsive.scss` | Breakpoint mixins and responsive utilities |
| `_themes.scss` | Dark/light theme variable definitions |
| `_markdown.scss` | Styles for rendered markdown content |

### `components/` — Reusable UI
Styles for buttons, cards, forms, tabs, tags, tables, and other shared UI elements.
Named to match their visual function (e.g., `_runs-table.scss`, `_tag-chips.scss`).

### `pages/` — Page-Specific
Styles scoped to specific pages (homepage, news, category tiers, search, etc.).

## Conventions

- Use existing CSS variables (`--accent`, `--surface`, `--border`, `--fg`, `--muted`)
- Mobile-first: base styles are mobile, `@media` queries add desktop layouts
- Component-specific styles can go in Svelte `<style>` blocks instead of here
- New SCSS files must be imported in `main.scss`
