# CRC Development Handoff — Context for New AI Assistants

**Last updated:** 2026-02-24
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

## 2. Database Schema (Current — Feb 2026)

### Recent Migration (Feb 24, 2026)
Tables were renamed and consolidated:
- `runner_profiles` → **`profiles`** (the canonical user data table)
- `achievements` → **`game_achievements`**
- `ticket_messages` → **`support_messages`**
- `profile_audit_log` → **`audit_profile_log`**
- **`moderators`** → DROPPED (replaced by role tables + `profiles.is_admin`)
- New: **`role_game_moderators`**, **`role_game_verifiers`** (role assignment tables)

### `profiles` (approved profiles — single source of truth)
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
| is_admin | boolean | **Admin flag** |
| is_super_admin | boolean | **Super admin flag** |
| role | text | |
| verified_games | ARRAY | |
| theme_settings | jsonb | Custom theme data |
| contributions | jsonb | |
| personal_goals | jsonb | |
| banner_url | text | |
| status | text | 'approved', 'pending', etc. |
| created_at / updated_at / approved_at | timestamptz | |

**Key insight:** `profiles` now has a `status` column. Row with `status = 'approved'` means the profile is live.

### `pending_profiles` (awaiting approval)
| Column | Type |
|-|-|
| id | uuid |
| user_id | uuid |
| requested_runner_id | text |
| display_name | text |
| has_profile | boolean |
| status | enum (pending/approved/rejected) |
| submitted_at / reviewed_at | timestamptz |

### `runners` (legacy public-facing data — still used by /runners page)
**NOTE:** This table still exists and powers `getRunners()` in `src/lib/server/supabase.ts`. It will eventually be replaced by `profiles`, but that migration hasn't happened yet. Do NOT drop it.

### `role_game_verifiers` / `role_game_moderators`
Per-game role assignments. Each row grants a user a role for a specific game.
| Column | Type |
|-|-|
| id | uuid |
| user_id | uuid |
| game_id | text |
| assigned_by | uuid |
| assigned_at | timestamptz |

### Admin/Verifier Detection Pattern
```typescript
// Check profiles for admin
const { data: profile } = await supabase
  .from('profiles')
  .select('is_admin, is_super_admin')
  .eq('user_id', userId)
  .maybeSingle();

// Check role_game_verifiers for verifier
const { data: verifier } = await supabase
  .from('role_game_verifiers')
  .select('id')
  .eq('user_id', userId)
  .limit(1)
  .maybeSingle();
```

---

## 3. Auth Architecture — What Actually Works

### Server Side (reliable)
- `hooks.server.ts` reads httpOnly cookies → creates Supabase server client → sets `locals.session`
- `+layout.server.ts` passes session to client
- Server-side queries via `locals.supabase` always have auth

### Client Side (nuances)
- `src/lib/supabase.ts` creates a `createBrowserClient`
- The `$user` store (from `$stores/auth`) is hydrated from server session data
- **Working pattern for writes:** `admin.ts` uses `supabase.auth.getSession()` to get the access token, then raw `fetch()` with explicit `Authorization: Bearer ${token}` header

### Profile State Logic (Header.svelte)
1. Query `profiles` for `runner_id, is_admin, is_super_admin, status` where `user_id = current user`
2. If row with `runner_id` + `status = 'approved'` → **active**
3. If row with `runner_id` but not approved → **pending**
4. If no row → query `pending_profiles` for `has_profile`
5. If `has_profile = true` → **pending**. Otherwise → **none** (needs setup)

### New User Flow
1. User signs in via OAuth (Discord/Twitch)
2. Auth callback creates `pending_profiles` stub
3. Redirects to `/profile/setup` (lightweight: just runner_id + display_name)
4. If pre-approved: profile row created immediately
5. If not: waits for admin approval
6. User can skip setup and explore, but can't submit runs without a runner_id

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

**Event modifier syntax doesn't exist in Svelte 5.**

---

## 5. Styling System

### Global SCSS (`src/styles/`)
- CSS custom properties: `--accent`, `--bg`, `--fg`, `--border`, `--panel`, `--surface`, `--muted`
- Radius tokens: `--radius-sm`, `--radius-md`, `--radius-lg`
- Tab styles in `_tabs.scss` are global and apply to `.runner-tabs .tab`, `.game-tabs .game-tab`, and `.edit-tabs .edit-tab` — all use the same folder-style appearance
- Footer grid in `_footer.scss` uses 4-column layout (brand + Explore + Resources + Legal)

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
| Admin utilities | `src/lib/admin.ts` — `checkAdminRole()`, `fetchPending()`, `adminAction()` |
| Browser Supabase | `src/lib/supabase.ts` |
| Server Supabase | `src/lib/server/supabase.ts` — query helpers |
| Utility functions | `src/lib/utils/index.ts` — `isValidVideoUrl()`, `formatDate()`, etc. |
| Header | `src/lib/components/layout/Header.svelte` |
| Footer | `src/lib/components/layout/Footer.svelte` |
| A-Z nav | `src/lib/components/AzNav.svelte` |
| Profile setup | `src/routes/profile/setup/+page.svelte` (lightweight onboarding) |
| Profile create | `src/routes/profile/create/+page.svelte` (full form) |
| CSP headers | `_headers` (Cloudflare Pages custom headers) |
| Worker | `worker/src/index.js` (Cloudflare Worker for admin actions) |

---

## 7. Content Security Policy

CSP is defined in `_headers` at the repo root. Key `connect-src` entries:
- `'self'` — same origin
- `https://*.supabase.co` — Supabase API
- `https://crc-run-submissions.280sauce.workers.dev` — Worker
- `https://challenges.cloudflare.com` — Turnstile
- `https://noembed.com` — Video URL metadata lookup

If a new external API is added, its domain must be added to `connect-src` or client-side fetches will be blocked.

---

## 8. Allowed Video URLs

Defined in `src/lib/utils/index.ts` → `isValidVideoUrl()`:
- YouTube (youtube.com, m.youtube.com, youtu.be)
- Twitch (twitch.tv, m.twitch.tv, player.twitch.tv)
- Bilibili (bilibili.com)

**Nicovideo was removed** per user request. HTTPS only.

---

## 9. Runner Profile Page Structure

The runner profile at `/runners/[runner_id]` has 4 tabs:
- **Overview** (default): About/bio, Highlights, Contributions, Game Credits, In-Progress Goals
- **Run Statistics**: Stats cards, fun stats, game grid with detail drill-down
- **Achievements**: Community achievements, Completed personal goals
- **Activity**: Timeline of recent runs and achievements

Game cards throughout the profile use a zoom-in hover effect on background images.

---

## 10. Current State & Recent Work

### Recently Completed (Feb 23-24, 2026)
- [x] Database reorganization (table renames, role tables, RLS cleanup)
- [x] Frontend code migration to new table names (14 files)
- [x] Worker updated for new table names
- [x] RLS policy consolidation (no duplicates, no search_path warnings)
- [x] Header redesign: centered search bar, theme toggle in user dropdown
- [x] Minimal profile setup page (`/profile/setup`) with skip option
- [x] Auth callback redirects to setup page with `?next=` return URL
- [x] Run submit redirects to setup if no runner_id
- [x] Search page reads `?q=` param from URL
- [x] A-Z nav: clicking same letter no longer deselects
- [x] Footer: 3-column grid layout (Explore, Resources, Legal)
- [x] Unified folder-style tabs across runner profiles, game pages, and profile edit
- [x] Video URL validation on profile edit highlights
- [x] Video URL lookup (noembed) on profile edit highlights
- [x] Personal goals split: completed → Achievements tab, in-progress → Overview tab
- [x] Zoom-in hover effect on highlight cards and credit game cards
- [x] Admin badge text color fix (white on accent)
- [x] Nicovideo removed from allowed video URLs
- [x] CSP updated to allow noembed.com

### Known Pending Tasks
- [ ] Migrate `/runners` page queries from `runners` table to `profiles` table
- [ ] Drop `runners` table after migration
- [ ] Global search feature (search across games, runners, runs, teams)
- [ ] Profile page needs the full create form to still work for detailed profiles
- [ ] Avatar upload (needs Supabase Storage bucket)

---

## 11. Communication Style

The user prefers:
- **Ask before guessing.** Always OK to ask for schema, error messages, or clarification.
- **Complete deliverables.** Provide full replacement files, not partial snippets.
- **Honest about mistakes.** Own errors, explain root cause, fix it.
- **Concise explanations.** Don't over-explain simple changes. Do explain architectural decisions.
- **Update this doc every ~5 prompts** to keep it current.
