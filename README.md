# Challenge Run Community (SvelteKit)

Tracking challenge runs, deathless runs, and no-hit achievements across games.

> **Migration status:** Phase 1 (scaffold) complete. See [migration guide](./MIGRATION.md) for full plan.

## Quick Start

```bash
# Install dependencies
pnpm install

# Start dev server
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview
```

## Project Structure

```
src/
├── data/                    # Markdown collections & YAML config (from Jekyll)
│   ├── games/               # Game definitions (_games/*.md)
│   ├── runners/             # Runner profiles (_runners/*.md)
│   ├── runs/                # Run submissions (_runs/**/*.md)
│   ├── achievements/        # Achievement completions
│   ├── teams/               # Team profiles
│   ├── posts/               # News/blog posts
│   ├── config/              # YAML config files (from _data/)
│   └── templates/           # Templates for new content
├── lib/
│   ├── components/          # Svelte components
│   │   ├── layout/          # Header, Footer, etc.
│   │   ├── game/            # Game page components
│   │   ├── runner/          # Runner profile components
│   │   ├── admin/           # Admin panel components
│   │   ├── forms/           # Form components
│   │   └── shared/          # Shared/reusable components
│   ├── server/
│   │   └── data.ts          # Server-side data loading (replaces Jekyll collections)
│   ├── stores/              # Svelte stores (auth, theme)
│   ├── types/               # TypeScript type definitions
│   └── utils/               # Utility functions
├── routes/                  # SvelteKit file-based routing
│   ├── games/[game_id]/     # Dynamic game pages
│   ├── runners/[runner_id]/ # Dynamic runner pages
│   ├── admin/               # Protected admin routes
│   └── ...
├── styles/                  # SCSS (ported from Jekyll)
│   ├── base/
│   ├── components/
│   └── pages/
static/                      # Static assets (images, CNAME)
worker/                      # Cloudflare Worker (API layer — unchanged)
supabase/                    # Supabase edge functions (unchanged)
scripts/                     # CI/validation scripts (surviving from Jekyll)
```

## Key Differences from Jekyll

| Jekyll | SvelteKit |
|---|---|
| 123+ generated HTML files | ~5 dynamic route files |
| Liquid templates | Svelte components |
| `_data/supabase-config.yml` | `.env` with `PUBLIC_` prefix convention |
| Client-side auth in `auth.js` | Server-side hooks + httpOnly cookies |
| `generate-game-pages.js` etc. | Dynamic `[game_id]` routing |

## Tech Stack

- **Framework:** SvelteKit 2 + Svelte 5
- **Styling:** SCSS (same styles from Jekyll)
- **Auth & Data:** Supabase
- **API:** Cloudflare Workers
- **Deployment:** GitHub Pages (static adapter) → Cloudflare Pages (future)
- **Language:** TypeScript
 
