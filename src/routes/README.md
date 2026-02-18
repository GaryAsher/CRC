# src/routes/ — Pages & API Endpoints

SvelteKit file-based routing. Each directory is a URL path.

## Route Map

### Public Pages

| Route | Purpose | Data Source |
|-|-|-|
| `/` | Homepage — news carousel, recent runs, stats, teams | Supabase (runs, runners, games) + data.ts (posts) |
| `/games` | Game index with filtering | Supabase `games` table |
| `/games/[game_id]` | Game overview page | Supabase `games` table |
| `/games/[game_id]/runs` | All runs for a game | Supabase `runs` table (paginated) |
| `/games/[game_id]/runs/[tier]/[category]` | Filtered leaderboard | Supabase `runs` table (filtered) |
| `/games/[game_id]/rules` | Game-specific rules | Supabase `games.rules_md` |
| `/games/[game_id]/resources` | Community resources | Supabase `games.resources_md` |
| `/games/[game_id]/history` | Game tracking history | Supabase or config YAML |
| `/games/[game_id]/forum` | Discussion (future) | Supabase |
| `/games/[game_id]/submit` | Submit a run for this game | Auth required |
| `/games/[game_id]/guides` | Game-specific guides | Supabase |
| `/runners` | Runner index | Supabase `runners` table |
| `/runners/[runner_id]` | Runner profile + run history | Supabase `runners` + `runs` join |
| `/runners/[runner_id]/runs/[game_id]` | Legacy URL — 301 redirects to runner profile with game filter |
| `/teams` | Team index | Supabase `teams` table |
| `/teams/[team_id]` | Team profile | Supabase `teams` table |
| `/news` | News/blog index | data.ts `getPosts()` (markdown) |
| `/news/[slug]` | Individual news article | data.ts `getPosts()` (markdown) |
| `/search` | Global search | Supabase full-text search |
| `/rules` | Global site rules | Static markdown (prerendered) |
| `/guidelines` | Community guidelines | Static markdown (prerendered) |
| `/glossary` | Term definitions | Static markdown (prerendered) |
| `/support` | Support ticket form | Supabase `support_tickets` |
| `/submit` | Submit a run (general) | Auth required |
| `/submit-game` | Request a new game | Auth required |
| `/sign-in` | OAuth sign-in page | Supabase Auth |

### Auth Endpoints

| Route | Type | Purpose |
|-|-|-|
| `/auth/callback` | Page + POST API | Handles OAuth return, sets httpOnly cookies |
| `/auth/signout` | POST API | Clears auth cookies |

### Protected: Profile (requires authentication)

| Route | Purpose |
|-|-|
| `/profile` | View own profile |
| `/profile/create` | Create runner profile (first-time setup) |
| `/profile/edit` | Edit profile details |
| `/profile/settings` | Account settings, linked accounts |
| `/profile/settings/link-callback` | OAuth linking callback |
| `/profile/status` | Submission status tracker |
| `/profile/theme` | Theme customization |

### Protected: Admin (requires admin/verifier role)

| Route | Purpose |
|-|-|
| `/admin` | Dashboard overview |
| `/admin/runs` | View all runs |
| `/admin/runs-queue` | Pending run approval queue |
| `/admin/games` | Manage games |
| `/admin/game-updates` | Game update requests |
| `/admin/profiles` | Manage runner profiles |
| `/admin/profiles/theme` | Profile theme previews |
| `/admin/users` | User management |
| `/admin/staff-guides` | Internal documentation |
| `/admin/financials` | Financial tracking |
| `/admin/health` | System health checks |
| `/admin/debug` | Debug tools (dev only) |

### API Routes

| Route | Type | Purpose |
|-|-|-|
| `/feed.xml` | GET | RSS feed of news posts |

## File Conventions

Each route directory can contain:

| File | Purpose |
|-|-|
| `+page.svelte` | The page component (UI) |
| `+page.server.ts` | Server-side data loading (runs on server, returns data to page) |
| `+page.ts` | Universal data loading (only for static/prerendered pages) |
| `+layout.svelte` | Shared layout wrapper (e.g., game tab navigation) |
| `+layout.server.ts` | Layout data loading + auth guards |
| `+server.ts` | API endpoint (e.g., `/auth/callback`, `/feed.xml`) |
| `+error.svelte` | Error page (404, 500, etc.) |

## Auth Guards

- `admin/+layout.server.ts` — Redirects to `/sign-in` if no session. Admin pages do additional role checks client-side via `admin.ts`.
- `profile/+layout.server.ts` — Redirects to `/sign-in` if no session.
- Individual pages may check specific roles (verifier, game mod, admin) in their own server load functions.
