# src/lib/ — Shared Code

Importable via `$lib/` alias in SvelteKit.

## Files

| File | Purpose |
|-|-|
| `supabase.ts` | Browser-side Supabase client. `persistSession: false` (cookies are canonical). Exports `signOut()` which clears client session + server cookies + redirects. |
| `admin.ts` | `checkAdminRole()` — checks the current user's role against Supabase. Used by admin pages for fine-grained permission checks beyond the layout guard. |

## Directories

### `server/`
Server-only code (never sent to browser).

- **`data.ts`** — Loads static content from repo files via `import.meta.glob`. Provides: `getPosts()`, `getStaffGuides()`, `getPlatforms()`, `getGenres()`, `getBannedTerms()`, `getDefaultRules()`, `getAdminConfig()`, and other config loaders. Does NOT load runs, runners, or games — those come from Supabase.

### `components/`
Svelte components organized by function:

| Component | Purpose |
|-|-|
| `layout/Header.svelte` | Site header with nav, auth menu, theme toggle |
| `layout/Footer.svelte` | Site footer |
| `auth/AuthGuard.svelte` | Wraps content that requires authentication. Redirects to sign-in if no session. |
| `AchievementCard.svelte` | Renders an achievement with status badge |
| `BackToTop.svelte` | Scroll-to-top button |
| `CookieConsent.svelte` | GDPR cookie consent banner |
| `ReportModal.svelte` | Modal for reporting content |

### `stores/`
Svelte stores (reactive state shared across components):

| Store | Purpose |
|-|-|
| `auth.ts` | `session`, `user` (derived), `isLoading`. Hydrated from server session via `hydrateSession()`. |
| `theme.ts` | Dark/light theme toggle, persisted to localStorage |
| `consent.ts` | Cookie consent state |
| `scroll.ts` | Scroll position memory for game tab navigation |

### `types/`
- **`index.ts`** — All TypeScript interfaces: `Game`, `Runner`, `Run`, `Achievement`, `Team`, `Post`, `Platform`, `Genre`, config types, etc.

### `utils/`
| File | Purpose |
|-|-|
| `index.ts` | `formatDate()`, `formatTime()`, `isValidVideoUrl()`, and other shared helpers |
| `markdown.ts` | `renderMarkdown()` — marked + DOMPurify. All user-supplied markdown MUST go through this function. Also exports `sanitizeText()` for plain-text contexts. |
