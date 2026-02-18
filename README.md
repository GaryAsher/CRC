# Challenge Run Community

Tracking challenge runs, deathless runs, and no-hit achievements across games.

**Live site:** https://www.challengerun.net

## Quick Start

```bash
pnpm install
pnpm dev          # Start dev server at localhost:5173
pnpm build        # Build for Cloudflare Pages
pnpm preview      # Preview production build locally
```

## Architecture

CRC is a SvelteKit app deployed on Cloudflare Pages with Supabase as the primary database.

```
Browser → Cloudflare Pages (SvelteKit SSR) → Supabase (dynamic data)
                                            → Repo files (static config)
    ↕
Cloudflare Worker (API: submissions, approvals)
    ↕
Supabase (pending queues, approved content)
```

**Dynamic content** (runs, runners, games, achievements) lives in Supabase and appears
instantly when approved — no redeployment needed.

**Static content** (global config, news posts, legal pages, styles) lives in the repo
and changes require a commit.

See [CLAUDE.md](./CLAUDE.md) for the full architecture guide, coding conventions, and
rules for AI assistants.

## Project Structure

```
src/
├── hooks.server.ts          # Auth middleware (every request)
├── data/                    # Static content: config YAML, posts, staff guides
├── lib/
│   ├── server/data.ts       # Loads static config from repo files
│   ├── supabase.ts          # Browser Supabase client
│   ├── components/          # Svelte components (layout, auth, shared)
│   ├── stores/              # Auth, theme, consent, scroll stores
│   ├── types/               # TypeScript interfaces
│   └── utils/               # Helpers (markdown rendering, formatDate, etc.)
├── routes/                  # SvelteKit pages (see src/routes/README.md)
└── styles/                  # SCSS (base, components, pages)
worker/                      # Cloudflare Worker API (submissions, approvals)
supabase/                    # Supabase edge functions
scripts/                     # CI/validation scripts
static/                      # Images, favicon, CNAME
```

## Tech Stack

| Layer | Technology |
|-|-|
| Framework | SvelteKit 2 + Svelte 5 |
| Language | TypeScript + SCSS |
| Database | Supabase (PostgreSQL) |
| Auth | Discord + Twitch OAuth → httpOnly cookies |
| API | Cloudflare Worker |
| Hosting | Cloudflare Pages |
| Package manager | pnpm |

## User Roles

| Role | Can do |
|-|-|
| Runner | Submit runs, manage own profile |
| Verifier | Approve/reject runs for assigned games |
| Game Moderator | Edit game definitions, categories, rules |
| Admin | Everything + site-wide config, user management |

## Key Workflows

**Run submission:** Runner fills form → Worker writes to `pending_runs` → Verifier approves → Worker moves to `runs` → visible on site instantly.

**Game submission:** Runner requests new game → Worker writes to `pending_games` → Admin reviews → approved game appears in game list.

**Profile creation:** User signs in via Discord/Twitch → creates profile → pending approval → approved profile is public.
