# src/data/ — Static Content

This directory holds content that is committed to the repo and only changes via git.
It is read by `src/lib/server/data.ts` using `import.meta.glob` at build/request time.

**This directory does NOT hold dynamic content.** Runs, runners, games, achievements,
and teams are stored in Supabase and queried at request time.

## What's Here

### `config/` — YAML Configuration Files

Site-wide settings that rarely change. Admin-only edits via git commits.

| File | Purpose |
|-|-|
| `platforms.yml` | Platform definitions (PC, PS5, Switch, etc.) with labels |
| `genres.yml` | Genre definitions (Metroidvania, Roguelike, etc.) with labels |
| `banned-terms.yml` | Blocked words/patterns for content moderation |
| `challenges.yml` | Global challenge type definitions (no-hit, deathless, etc.) |
| `default-rules.yml` | Default rule sets applied to new games |
| `admin-config.yml` | Admin dashboard configuration |
| `form-fields-order.yml` | Field ordering for submission forms |
| `game-moderators.yml` | Game moderator assignments |
| `reviewers.yml` | Reviewer/verifier assignments |
| `run_grid_columns.yml` | Column definitions for run tables |
| `codeowners.yml` | GitHub CODEOWNERS source data |
| `cloudflare_analytics.yml` | Analytics configuration |
| `supabase-config.yml` | Supabase table/column mappings |
| `history/` | Per-game history timeline YAML files |

### `posts/` — News & Blog Posts

Markdown files with YAML frontmatter. Filename format: `YYYY-MM-DD-slug.md`.

Used by: `/news` index and `/news/[slug]` detail pages.

### `staff-guides/` — Internal Staff Documentation

Markdown guides for moderators, verifiers, and admins. Loaded server-side only
(never included in client bundles). Protected by the admin layout guard.

### `templates/` — Content Templates

Reference templates showing the expected frontmatter structure for games, runs,
and runners. Used by generation scripts and for documentation.

## Legacy Directories (Migration in Progress)

The following directories contain markdown files from the Jekyll migration. They are
being replaced by Supabase tables and will be removed once migration is complete:

- `games/` → Supabase `games` table
- `runners/` → Supabase `runners` table
- `runs/` → Supabase `runs` table
- `achievements/` → Supabase `achievements` table
- `teams/` → Supabase `teams` table

**Do not add new files to these directories.** New content goes into Supabase.
