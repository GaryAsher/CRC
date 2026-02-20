# CRC Development Handoff — Context for New AI Assistants

**Last updated:** 2026-02-20
**Purpose:** This document supplements `CLAUDE.md` (in the repo root) with lessons learned from active development sessions. Read `CLAUDE.md` first, then this document.

---

## 1. Critical Rule: Never Guess Schemas

The single most important lesson from development so far:

> **Never assume database column names, table structures, or API shapes. Always ask the user for the actual schema before writing queries.**

Guessing has caused multiple failed deploys. The user will happily run a SQL query and share the results. It takes 30 seconds and prevents hours of debugging.

To get a table's columns:
```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'your_table_name'
ORDER BY ordinal_position;
```

To get RLS policies:
```sql
SELECT policyname, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'your_table_name';
```

---

## 2. Actual Database Schema (Verified)

These column lists were confirmed by querying `information_schema.columns` directly:

### `runner_profiles` (approved profiles — row existence = approved)
| Column | Type | Notes |
|-|-|-|
| id | uuid | PK |
| user_id | uuid | FK to auth.users |
| runner_id | text | Unique slug, e.g. "gary-asher" |
| display_name | text | |
| pronouns | text | |
| location | text | |
| bio | text | |
| avatar_url | text | |
| socials | jsonb | `{ twitch, youtube, twitter, bluesky, instagram, other[] }` |
| games | ARRAY | |
| featured_runs | jsonb | |
| badges | jsonb | |
| is_public | boolean | |
| is_admin | boolean | **This is the admin flag** |
| role | text | |
| verified_games | ARRAY | |
| theme_settings | jsonb | Custom theme data |
| membership_tier | text | |
| membership_expires | timestamptz | |
| other_links_pending | ARRAY | |
| achievements | jsonb | |
| contributions | jsonb | |
| status_message | text | |
| personal_goals | jsonb | |
| banner_url | text | |
| created_at | timestamptz | |
| updated_at | timestamptz | |
| approved_at | timestamptz | |
| approved_by | uuid | |

**Key insight:** There is NO `status` column on `runner_profiles`. If a row exists, the profile is approved. Pending profiles live in `pending_profiles`.

RLS policies:
- SELECT: own row only (`auth.uid() = user_id`)
- INSERT: own row only
- UPDATE: own row only
- DELETE: admins/moderators only

### `pending_profiles` (awaiting approval)
| Column | Type |
|-|-|
| id | uuid |
| user_id | uuid |
| requested_runner_id | text |
| display_name | text |
| pronouns, location, bio, avatar_url | text |
| socials | jsonb |
| games | ARRAY |
| status | USER-DEFINED (enum) |
| rejection_reason | text |
| submitted_at | timestamptz |
| reviewed_at, reviewed_by, reviewer_notes | ... |

### `runners` (public-facing runner data)
| Column | Type |
|-|-|
| runner_id | text | PK slug |
| runner_name | text |
| display_name | text |
| avatar | text |
| joined_date | date |
| pronouns, location | text |
| status | text | Freeform (e.g. "test status 33") — NOT an enum |
| hidden | boolean |
| bio | text |
| accent_color, cover_position, banner | text |
| is_admin | boolean |
| can_view_test_content | boolean |
| socials | jsonb |
| featured_runs | jsonb |
| personal_goals, contributions | jsonb |
| user_id | uuid |

### `moderators`
| Column | Type |
|-|-|
| id | uuid |
| user_id | uuid |
| role | text |
| can_approve_profiles | boolean |
| can_reject_profiles | boolean |
| can_suspend_profiles | boolean |
| can_edit_any_profile | boolean |
| can_manage_moderators | boolean |
| assigned_games | ARRAY |
| added_at | timestamptz |
| added_by | uuid |
| notes | text |

---

## 3. Auth Architecture — What Actually Works

### Server Side (reliable)
- `hooks.server.ts` reads httpOnly cookies → creates Supabase server client → sets `locals.session`
- `+layout.server.ts` passes session to client
- Server-side queries via `locals.supabase` always have auth

### Client Side (nuances)
- `src/lib/supabase.ts` creates a `createBrowserClient` with `autoRefreshToken: false` and `detectSessionInUrl: false`
- The `$user` store (from `$stores/auth`) is hydrated from server session data
- **Problem pattern:** `supabase.from('table').update(...)` may not reliably include the auth JWT
- **Working pattern:** `admin.ts` uses `supabase.auth.getSession()` to get the access token, then raw `fetch()` with explicit `Authorization: Bearer ${token}` header

### The Pattern That Works (use this for client-side DB writes):
```typescript
import { supabase } from '$lib/supabase';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';

const { data: { session } } = await supabase.auth.getSession();
if (!session) return;

const res = await fetch(
  `${PUBLIC_SUPABASE_URL}/rest/v1/runner_profiles?user_id=eq.${session.user.id}`,
  {
    method: 'PATCH',
    headers: {
      'apikey': PUBLIC_SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal'
    },
    body: JSON.stringify({ column_name: value })
  }
);
```

### The Pattern That May Fail (avoid for writes):
```typescript
// This may not include auth token properly
const { error } = await supabase
  .from('runner_profiles')
  .update({ column: value })
  .eq('user_id', userId);
```

### Profile State Logic (Header.svelte)
The Header determines profile state as follows:
1. Query `runner_profiles` for `runner_id, is_admin, role` where `user_id = current user`
2. If row exists → profile is **active** (approved). Link to `/runners/{runner_id}`
3. If no row → query `pending_profiles` for `id` where `user_id = current user`
4. If pending row exists → profile is **pending**. Link to `/profile/status`
5. Otherwise → **no profile**. Link to `/profile/create`

Admin status comes from `runner_profiles.is_admin`. Verifier status comes from the `moderators` table.

---

## 4. Svelte 5 Conventions

The project uses Svelte 5 runes. Common mistakes to avoid:

| Wrong (Svelte 4) | Right (Svelte 5) |
|-|-|
| `export let prop` | `let { prop } = $props()` |
| `$: derived = x + y` | `let derived = $derived(x + y)` |
| `$: { sideEffect() }` | `$effect(() => { sideEffect() })` |
| `on:click={handler}` | `onclick={handler}` |
| `on:click\|preventDefault` | `onclick={(e) => { e.preventDefault(); handler() }}` |
| `<slot />` | `{@render children()}` with `let { children } = $props()` |

**Event modifier syntax doesn't exist in Svelte 5.** `onpointerdown|preventDefault` will cause a build error. Always use the inline handler pattern.

---

## 5. Styling System

### Global SCSS (`src/styles/`)
- CSS custom properties: `--accent`, `--bg`, `--fg`, `--border`, `--panel`, `--surface`, `--muted`
- Radius tokens: `--radius-sm`, `--radius-md`, `--radius-lg`
- Focus: `--focus`, `--focus-2`
- Existing component classes: `.az` (A-Z nav), `.tag-chip`, `.filter`, `.select`, `.card`, `.card-lift`, `.btn`, `.muted`

### Import Path Aliases
- `$lib` → `src/lib`
- `$stores` → `src/lib/stores`
- `$components` → `src/lib/components`
- `$types` → `src/lib/types`
- `$data` → `src/data`

---

## 6. File Locations

| What | Where |
|-|-|
| Auth store | `src/lib/stores/auth.ts` — exports `session`, `user`, `isLoading` |
| Admin utilities | `src/lib/admin.ts` — `checkAdminRole()`, `fetchPending()`, `adminAction()`, `getAccessToken()` |
| Browser Supabase | `src/lib/supabase.ts` — client with `persistSession: false` |
| Server Supabase | `src/lib/server/supabase.ts` — query helpers |
| Static data | `src/lib/server/data.ts` — YAML config loaders |
| Types | `src/lib/types/index.ts` |
| Filter utils | `src/lib/utils/filters.ts` — reusable filter functions |
| A-Z nav | `src/lib/components/AzNav.svelte` |
| Tag picker | `src/lib/components/TagPicker.svelte` |
| Header | `src/lib/components/layout/Header.svelte` |
| Admin guard | `src/routes/admin/+layout.server.ts` — server-side auth check |
| Admin panel | `src/routes/admin/+layout.svelte` — slide-out sidebar with role-based nav |

---

## 7. Current State & Pending Work

### Recently Completed
- [x] A-Z navigation on Games and Runners pages
- [x] Advanced filters on Games page (platform, genre, challenge TagPickers)
- [x] Header profile link fix (correct tables, correct state logic)
- [x] Admin panel sidebar (role-based slide-out on admin pages)
- [x] Theme link in profile dropdown
- [x] Theme save fix (explicit auth token pattern)

### Known Pending Tasks
- [ ] **Profile Edit page** — Currently a basic form. Needs 5-tab rebuild matching Jekyll: Basic Info, Customize, Socials, Goals, Highlights. Should write to `runner_profiles` using the explicit auth fetch pattern.
- [ ] **Admin Dashboard index** — Currently shows inline pending tabs. Jekyll had a card-grid navigation hub with stats counters. The sidebar panel now handles navigation, but the index could be improved to show at-a-glance stats.
- [ ] Profile edit needs to handle the `socials` jsonb field (twitch, youtube, twitter, bluesky, instagram, speedruncom, steam, other links)
- [ ] Profile edit needs `personal_goals` jsonb editor (icon, title, description, game, progress, completion status)
- [ ] Profile edit needs `featured_runs` jsonb editor (pin up to 3 runs)
- [ ] Avatar upload (needs Supabase Storage bucket — may not be set up yet; ask user)

### Architecture Decisions Log
- **Client-side filtering** for Games/Runners — all data loaded at once, filtered via `$derived`. Works fine at current scale (<100 games, <200 runners). Migrate to server-side if scale exceeds 1000+.
- **Client-side profile query in Header** — runs once when user signs in, uses `$effect`. Avoids needing server-side profile data in every page load.
- **Admin panel as layout component** — `admin/+layout.svelte` wraps all admin pages automatically. Role check via `checkAdminRole()` from `admin.ts`.

---

## 8. Testing Workflow

The user's development workflow:
1. Extract provided files to `C:\Dev\CRC-main`
2. Test locally with `pnpm dev`
3. Push via git
4. Cloudflare Pages auto-deploys
5. Check Cloudflare build log for errors

Common build failures:
- Svelte 4 syntax in Svelte 5 project (event modifiers, `export let`, `$:`)
- Querying non-existent columns (ask for schema first!)
- `node:fs` or `node:path` usage (won't work on Cloudflare Workers)

---

## 9. Key Contact Points

- **Supabase Dashboard:** User can run SQL queries and share results
- **Cloudflare Pages:** Build logs show exact errors with line numbers
- **Browser Console:** F12 → Console shows runtime errors from client-side code
- **Jekyll Archive:** Available at `/home/claude/jekyll-old/challenge-run-site-main/` in the AI workspace (if loaded from previous session)

---

## 10. Communication Style

The user prefers:
- **Ask before guessing.** It's always OK to ask for schema, error messages, or clarification. Never guess and deploy broken code.
- **Complete deliverables.** Provide full replacement files, not partial snippets.
- **Honest about mistakes.** Own errors, explain the root cause, fix it.
- **Concise explanations.** Don't over-explain simple changes. Do explain architectural decisions.
