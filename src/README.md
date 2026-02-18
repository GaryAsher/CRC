# src/ — Application Source

## Files

| File | Purpose |
|-|-|
| `app.html` | HTML shell. Contains favicon, meta tags, RSS link, and SvelteKit placeholders. |
| `app.d.ts` | TypeScript declarations. Defines `App.Locals` (session, supabase client) and `App.Platform` (Cloudflare bindings). |
| `hooks.server.ts` | Runs on every server-side request. Creates a Supabase client, restores session from httpOnly cookies, and refreshes tokens when needed. This is the auth backbone. |

## Directories

| Directory | Contents | Details |
|-|-|-|
| `data/` | Static content: config YAML, news posts, staff guides, templates | Read by `lib/server/data.ts` via `import.meta.glob`. Does NOT contain dynamic content (runs, runners, games live in Supabase). |
| `lib/` | Shared code: components, stores, types, utilities, server-side data loader | See `lib/README.md` |
| `routes/` | SvelteKit pages and API endpoints | See `routes/README.md` |
| `styles/` | SCSS stylesheets (base, components, pages) | Imported in `routes/+layout.svelte` via `main.scss` |
