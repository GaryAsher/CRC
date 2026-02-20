# CRC SvelteKit Migration Guide

## Table of Contents

1. [Migration Overview](#1-migration-overview)
2. [Prerequisites & Setup](#2-prerequisites--setup)
3. [Phase 1: Project Scaffolding](#3-phase-1-project-scaffolding)
4. [Phase 2: Data Layer & Content Pipeline](#4-phase-2-data-layer--content-pipeline)
5. [Phase 3: Shared Layout & Components](#5-phase-3-shared-layout--components)
6. [Phase 4: Static Pages](#6-phase-4-static-pages)
7. [Phase 5: Game Pages (Dynamic Routes)](#7-phase-5-game-pages-dynamic-routes)
8. [Phase 6: Runner Profiles](#8-phase-6-runner-profiles)
9. [Phase 7: Authentication](#9-phase-7-authentication)
10. [Phase 8: Forms & Submissions](#10-phase-8-forms--submissions)
11. [Phase 9: Admin Panel](#11-phase-9-admin-panel)
12. [Phase 10: Search, News & Extras](#12-phase-10-search-news--extras)
13. [Phase 11: Deployment & Cutover](#13-phase-11-deployment--cutover)
14. [File Mapping Reference](#14-file-mapping-reference)
15. [Scripts That Survive vs. Die](#15-scripts-that-survive-vs-die)
16. [Security Considerations](#16-security-considerations)

---

## 1. Migration Overview

### What You're Moving

| Current (Jekyll) | Lines/Files | SvelteKit Equivalent |
|---|---|---|
| 7 game markdown files | `_games/*.md` | Same files, loaded via `gray-matter` |
| 123+ generated HTML pages in `games/` | Individual HTML files | ~5 dynamic route files |
| 6 layouts (1,100+ lines each) | `_layouts/*.html` | Svelte components |
| 13 includes (up to 1,286 lines) | `_includes/*.html` | Svelte components |
| 8 vanilla JS files (5,454 lines) | `assets/js/*.js` | Component logic + stores |
| 41 SCSS files | `assets/scss/` | Same SCSS, component-scoped |
| 11 admin pages (7,178 lines) | `admin/**/*.html` | Protected route group |
| 6 profile pages | `profile/**/*.html` | Protected route group |
| Cloudflare Worker (1 file) | `worker/src/index.js` | Stays as-is (API layer) |
| Supabase functions | `supabase/functions/` | Stays as-is |
| 11 generation/validation scripts | `scripts/` | Most eliminated by routing |

### What Stays Exactly the Same

These don't change at all during migration:

- **`worker/`** — Your Cloudflare Worker API (run submissions, approvals, etc.)
- **`supabase/`** — Edge functions, RLS policies, auth config
- **`_games/*.md`**, **`_runners/*.md`**, **`_runs/**/*.md`**, **`_achievements/*.md`** — All markdown data files
- **`_data/*.yml`** — Parsed differently but same source files
- **`_posts/*.md`** — News/blog posts
- **`_teams/*.md`** — Team data
- **`assets/img/`** — Static images move to `static/img/`

### Migration Principles

1. **Work in a new repo** (or a `sveltekit` branch). Don't modify the Jekyll site until cutover.
2. **Migrate page by page**, testing each one before moving on.
3. **Keep the Jekyll site live** throughout — users see no downtime.
4. **Port logic, not markup** — Don't try to convert Liquid → Svelte line by line. Rewrite each component from scratch using the Jekyll version as a reference for what it should do.

---

## 2. Prerequisites & Setup

### Install Required Tools

```bash
# Node.js 20+ (you likely already have this)
node --version  # Should be 20.x+

# Install/update pnpm (recommended over npm for SvelteKit)
npm install -g pnpm
```

### Recommended VS Code Extensions

- **Svelte for VS Code** (`svelte.svelte-vscode`) — Syntax highlighting, intellisense
- **Svelte Intellisense** — Component prop autocomplete
- **Tailwind CSS IntelliSense** — If you decide to add Tailwind later

---

## 3. Phase 1: Project Scaffolding

### Step 1: Create the SvelteKit Project

```bash
# From your projects directory (NOT inside the Jekyll repo)
pnpm create svelte@latest challenge-run-site-v2

# When prompted:
# ┌  Welcome to SvelteKit!
# │  Which template? → Skeleton project
# │  TypeScript? → Yes, using TypeScript syntax
# │  Additional options:
# │    ✓ ESLint
# │    ✓ Prettier
# │    ✓ Vitest (for testing)
```

TypeScript is recommended because your data structures (games, runs, runners) are complex and type safety will catch bugs early. You can always use `.js` files where you want — TypeScript is opt-in per file.

### Step 2: Install Dependencies

```bash
cd challenge-run-site-v2
pnpm install

# Cloudflare Pages adapter
pnpm add -D @sveltejs/adapter-cloudflare

# Data & content
pnpm add gray-matter          # Parse YAML front matter from .md files
pnpm add js-yaml              # Parse _data/*.yml files
pnpm add marked               # Render markdown to HTML (for bios, rules, etc.)
pnpm add -D mdsvex             # Optional: if you want .svelte inside .md files

# Supabase
pnpm add @supabase/supabase-js @supabase/ssr

# SCSS support
pnpm add -D sass

# Utilities
pnpm add dompurify             # Sanitize user-generated HTML (bios, etc.)
pnpm add isomorphic-dompurify  # Works in SSR + client
```

### Step 3: Configure the Adapter

Replace the contents of `svelte.config.js`:

```javascript
import adapter from '@sveltejs/adapter-cloudflare';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter({
      routes: {
        include: ['/*'],
        exclude: ['<all>']
      }
    }),
    alias: {
      '$data': 'src/data',
      '$components': 'src/lib/components',
      '$stores': 'src/lib/stores',
      '$types': 'src/lib/types'
    }
  }
};

export default config;
```

### Step 4: Set Up the Directory Structure

```bash
# Create the full directory structure
mkdir -p src/lib/components/{layout,game,runner,admin,forms,shared}
mkdir -p src/lib/stores
mkdir -p src/lib/types
mkdir -p src/lib/server
mkdir -p src/lib/utils
mkdir -p src/data
mkdir -p src/routes/games/[game_id]/runs/[tier]/[category]
mkdir -p src/routes/games/[game_id]/{rules,history,resources,forum,submit}
mkdir -p src/routes/runners/[runner_id]
mkdir -p src/routes/teams/[team_id]
mkdir -p src/routes/admin/{runs,games,profiles,users,health,debug,financials}
mkdir -p src/routes/auth/callback
mkdir -p src/routes/profile/{create,edit,settings,status,theme}
mkdir -p src/routes/submit
mkdir -p src/routes/{news,search,legal,glossary,guidelines,support,rules,sign-in}
mkdir -p static/img
```

### Step 5: Copy Over Static Assets and Data

```bash
# From the Jekyll repo root, copy into the new project:

# Data files (these are your source of truth)
cp -r _games/ <new-project>/src/data/games/
cp -r _runners/ <new-project>/src/data/runners/
cp -r _runs/ <new-project>/src/data/runs/
cp -r _teams/ <new-project>/src/data/teams/
cp -r _achievements/ <new-project>/src/data/achievements/
cp -r _posts/ <new-project>/src/data/posts/
cp -r _data/ <new-project>/src/data/config/
cp -r _templates/ <new-project>/src/data/templates/

# Static assets
cp -r assets/img/* <new-project>/static/img/
cp CNAME <new-project>/static/

# SCSS (we'll restructure, but copy for reference)
cp -r assets/scss/ <new-project>/src/styles/
```

### Step 6: Environment Variables

Create `.env` in the project root (this replaces `_data/supabase-config.yml`):

```env
# Supabase (PUBLIC_ prefix makes these available client-side in SvelteKit)
PUBLIC_SUPABASE_URL=https://riwcekvwpwmbtihjqhmh.supabase.co
PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Site
PUBLIC_SITE_URL=https://www.challengerun.net
PUBLIC_WORKER_URL=https://crc-run-submissions.280sauce.workers.dev

# Turnstile
PUBLIC_TURNSTILE_SITE_KEY=your_site_key_here

# Build-time only (no PUBLIC_ prefix = server-side only)
SUPABASE_SERVICE_KEY=your_service_key_here
```

> **Security note:** The `_data/supabase-config.yml` currently exposes the anon key in a YAML file that ships to the client anyway, so using `PUBLIC_SUPABASE_ANON_KEY` is the same exposure level. The important thing is that `SUPABASE_SERVICE_KEY` stays server-side only (no `PUBLIC_` prefix).

### Step 7: Verify It Runs

```bash
pnpm dev
# Visit http://localhost:5173 — you should see the skeleton page
```

---

## 4. Phase 2: Data Layer & Content Pipeline

This is the foundation everything else builds on. Get this right before touching any UI.

### Step 1: Define TypeScript Types

Create `src/lib/types/index.ts`:

```typescript
// Mirrors your _games/*.md front matter
export interface Game {
  game_id: string;
  game_name: string;
  game_name_aliases?: string[];
  status: string;
  layout: string;
  genres: string[];
  platforms: string[];
  reviewers: string[];
  tabs: {
    overview: boolean;
    runs: boolean;
    rules: boolean;
    history: boolean;
    resources: boolean;
    forum: boolean;
    extra_1: boolean;
    extra_2: boolean;
  };
  general_rules: string;
  challenges_data: ChallengeCategory[];
  mini_challenges?: MiniChallengeGroup[];
  community_challenges?: CommunityChallenge[];
  // Add remaining fields as you port them
}

export interface ChallengeCategory {
  slug: string;
  name?: string;
  description?: string;
  rules?: string;
  // etc. — fill in from your actual game markdown
}

export interface MiniChallengeGroup {
  group_slug: string;
  group_name: string;
  challenges: ChallengeCategory[];
}

export interface CommunityChallenge {
  slug: string;
  name: string;
  // etc.
}

export interface Runner {
  runner_id: string;
  runner_name: string;
  avatar?: string;
  joined_date: string;
  pronouns?: string;
  location?: string;
  status?: string;
  bio?: string;
  accent_color?: string;
  cover_position?: string;
  is_admin?: boolean;
  can_view_test_content?: boolean;
  socials: {
    twitch?: string;
    youtube?: string;
    discord?: string;
    twitter?: string;
    bluesky?: string;
    instagram?: string;
    speedruncom?: string;
    steam?: string;
  };
}

export interface Run {
  game_id: string;
  runner_id: string;
  runner: string;
  category_slug: string;
  category: string;
  standard_challenges: string[];
  community_challenge: string;
  character?: string;
  restrictions?: string[];
  restriction_ids?: string[];
  time_primary: string;
  timing_method_primary: string;
  time_secondary?: string;
  timing_method_secondary?: string;
  date_completed: string;
  date_submitted: string;
  video_url: string;
  status: string;
  verified: boolean;
  verified_by?: string;
  glitch_id?: string;
}

export interface Achievement {
  game_id: string;
  runner_id: string;
  achievement_slug: string;
  status: string;
  // etc.
}

export interface Team {
  team_id: string;
  team_name: string;
  // etc.
}
```

You'll refine these as you port each page. Start with what you know and add fields as you encounter them.

### Step 2: Create the Data Loading Utilities

Create `src/lib/server/data.ts` — this is the core module that replaces all Jekyll collection logic:

```typescript
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import yaml from 'js-yaml';
import type { Game, Runner, Run, Achievement, Team } from '$types';

const DATA_DIR = path.resolve('src/data');

// ─── Generic Helpers ────────────────────────────────────────────────────────

/** Read all .md files from a directory, parse front matter */
function loadCollection<T>(dir: string): T[] {
  const fullPath = path.join(DATA_DIR, dir);
  if (!fs.existsSync(fullPath)) return [];

  return fs.readdirSync(fullPath)
    .filter(f => f.endsWith('.md') && !f.startsWith('_') && f !== 'README.md')
    .map(f => {
      const raw = fs.readFileSync(path.join(fullPath, f), 'utf-8');
      const { data } = matter(raw);
      return data as T;
    });
}

/** Load .md files recursively (for runs which are in subdirectories) */
function loadCollectionRecursive<T>(dir: string): T[] {
  const fullPath = path.join(DATA_DIR, dir);
  if (!fs.existsSync(fullPath)) return [];

  const results: T[] = [];

  function walk(currentDir: string) {
    for (const entry of fs.readdirSync(currentDir, { withFileTypes: true })) {
      if (entry.isDirectory() && entry.name !== 'rejected') {
        walk(path.join(currentDir, entry.name));
      } else if (entry.isFile() && entry.name.endsWith('.md') 
                 && !entry.name.startsWith('_') && entry.name !== 'README.md') {
        const raw = fs.readFileSync(path.join(currentDir, entry.name), 'utf-8');
        const { data } = matter(raw);
        results.push(data as T);
      }
    }
  }

  walk(fullPath);
  return results;
}

/** Load a YAML config file from _data/ */
function loadYaml<T>(filename: string): T {
  const raw = fs.readFileSync(path.join(DATA_DIR, 'config', filename), 'utf-8');
  return yaml.load(raw) as T;
}

// ─── Public API ─────────────────────────────────────────────────────────────

export function getGames(): Game[] {
  return loadCollection<Game>('games');
}

export function getGame(gameId: string): Game | undefined {
  const games = getGames();
  return games.find(g => g.game_id === gameId);
}

export function getRunners(): Runner[] {
  return loadCollection<Runner>('runners');
}

export function getRunner(runnerId: string): Runner | undefined {
  return getRunners().find(r => r.runner_id === runnerId);
}

export function getRuns(): Run[] {
  return loadCollectionRecursive<Run>('runs');
}

export function getRunsForGame(gameId: string): Run[] {
  return getRuns().filter(r => r.game_id === gameId && r.status === 'approved');
}

export function getRunsForRunner(runnerId: string): Run[] {
  return getRuns().filter(r => r.runner_id === runnerId && r.status === 'approved');
}

export function getAchievements(): Achievement[] {
  return loadCollection<Achievement>('achievements');
}

export function getTeams(): Team[] {
  return loadCollection<Team>('teams');
}

// ─── Config Data ────────────────────────────────────────────────────────────

export function getDefaultRules() {
  return loadYaml('default-rules.yml');
}

export function getPlatforms() {
  return loadYaml('platforms.yml');
}

export function getGenres() {
  return loadYaml('genres.yml');
}

export function getFormFieldsOrder() {
  return loadYaml('form-fields-order.yml');
}

export function getBannedTerms() {
  return loadYaml('banned-terms.yml');
}

export function getGameModerators() {
  return loadYaml('game-moderators.yml');
}

export function getChallenges() {
  return loadYaml('challenges.yml');
}
```

> **Why server-only?** This file uses `fs` and `path` which only work on the server. SvelteKit's `+page.server.ts` load functions run on the server at build time (for static pages) or request time (for SSR pages), then pass the data to the client as serialized JSON. The markdown files never ship to the browser.

### Step 3: Set Up Supabase Client

Create `src/lib/server/supabase.ts`:

```typescript
import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';

// Server-side client (for +page.server.ts, +layout.server.ts, hooks)
export function createServerClient(cookies: { get: (name: string) => string | undefined }) {
  return createClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
    auth: {
      flowType: 'pkce',
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
      // Extract tokens from cookies set during auth callback
      ...(cookies.get('sb-access-token') && {
        initialSession: {
          access_token: cookies.get('sb-access-token')!,
          refresh_token: cookies.get('sb-refresh-token')!,
        }
      })
    }
  });
}
```

Create `src/lib/supabase.ts` (client-side):

```typescript
import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';

// Browser-side client (for reactive auth state, real-time subscriptions)
export const supabase = createClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
  auth: {
    flowType: 'pkce',
    persistSession: true,
  }
});
```

### Step 4: Create Auth Hook

Create `src/hooks.server.ts` — this runs on every server request:

```typescript
import type { Handle } from '@sveltejs/kit';
import { createServerClient } from '$lib/server/supabase';

export const handle: Handle = async ({ event, resolve }) => {
  // Make Supabase client available to all server load functions
  event.locals.supabase = createServerClient(event.cookies);

  // Try to get current session
  const { data: { session } } = await event.locals.supabase.auth.getSession();
  event.locals.session = session;

  return resolve(event);
};
```

Create `src/app.d.ts` for type declarations:

```typescript
import type { SupabaseClient, Session } from '@supabase/supabase-js';

declare global {
  namespace App {
    interface Locals {
      supabase: SupabaseClient;
      session: Session | null;
    }
  }
}

export {};
```

### Step 5: Verify Data Loading

Create a quick test route at `src/routes/+page.server.ts`:

```typescript
import { getGames, getRunners, getRuns } from '$lib/server/data';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
  const games = getGames();
  const runners = getRunners();
  const runs = getRuns();

  return {
    gameCount: games.length,
    runnerCount: runners.length,
    runCount: runs.length,
    gameNames: games.map(g => g.game_name)
  };
};
```

And `src/routes/+page.svelte`:

```svelte
<script lang="ts">
  export let data;
</script>

<h1>CRC Data Test</h1>
<p>Games: {data.gameCount}</p>
<p>Runners: {data.runnerCount}</p>
<p>Runs: {data.runCount}</p>
<ul>
  {#each data.gameNames as name}
    <li>{name}</li>
  {/each}
</ul>
```

Run `pnpm dev` and verify the counts match your Jekyll site.

---

## 5. Phase 3: Shared Layout & Components

### Step 1: Port SCSS

Create `src/styles/main.scss` that imports your existing SCSS structure:

```scss
// Base
@import './base/variables';
@import './base/reset';
@import './base/themes';
@import './base/responsive';
@import './base/markdown';

// Components
@import './components/layout';
@import './components/shared';
@import './components/buttons';
@import './components/cards';
@import './components/tabs';
// ... import all your component SCSS files

// Pages
@import './pages/homepage';
@import './pages/news-carousel';
// ... import all page SCSS files
```

In `src/routes/+layout.svelte`:

```svelte
<script lang="ts">
  import '../styles/main.scss';
  import Header from '$components/layout/Header.svelte';
  import Footer from '$components/layout/Footer.svelte';
  import CookieConsent from '$components/shared/CookieConsent.svelte';

  export let data;
</script>

<Header session={data.session} />

<main>
  <slot />
</main>

<Footer />
<CookieConsent />
```

### Step 2: Port the Header (631 lines → Component)

The header is your biggest shared include. Break it into sub-components:

```
src/lib/components/layout/
├── Header.svelte          (main wrapper, mobile menu toggle)
├── NavLinks.svelte        (desktop nav links)
├── MobileMenu.svelte      (slide-out mobile menu)
├── UserMenu.svelte        (auth state, avatar, dropdown)
├── ThemeToggle.svelte     (dark/light mode)
└── AdminBadge.svelte      (notification count for pending items)
```

The approach for each:

1. Open the Jekyll `_includes/header.html`
2. Identify distinct sections (nav, user menu, theme toggle, etc.)
3. For each section, create a Svelte component
4. Move inline `<script>` logic into the Svelte `<script>` block
5. Move inline `<style>` into the Svelte `<style>` block (or reference your SCSS)
6. Replace Liquid `{% if %}` / `{% for %}` with Svelte `{#if}` / `{#each}`

Quick Liquid → Svelte cheat sheet:

| Jekyll (Liquid) | SvelteKit |
|---|---|
| `{% if condition %}` | `{#if condition}` |
| `{% for item in list %}` | `{#each list as item}` |
| `{% include file.html %}` | `<Component />` |
| `{{ variable }}` | `{variable}` |
| `{{ variable \| escape }}` | `{variable}` (auto-escaped by default) |
| `{{ variable \| markdownify }}` | `{@html marked(variable)}` |
| `{% assign x = y %}` | `$: x = y` (reactive) or `let x = y` |
| `{{ site.data.config.key }}` | Loaded via `+page.server.ts` and passed as prop |

### Step 3: Port the Footer

Much simpler — `_includes/footer.html` (209 lines) becomes `src/lib/components/layout/Footer.svelte`.

### Step 4: Create the Root Layout Server Load

Create `src/routes/+layout.server.ts`:

```typescript
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
  return {
    session: locals.session,
  };
};
```

This makes session data available to every page through the layout.

---

## 6. Phase 4: Static Pages

Port these first because they're simple and let you validate the layout works.

### Pages to Port (in order)

| Jekyll Page | SvelteKit Route | Complexity |
|---|---|---|
| `index.html` | `src/routes/+page.svelte` | Medium (recent runs, news carousel) |
| `glossary/index.html` | `src/routes/glossary/+page.svelte` | Low |
| `guidelines/index.html` | `src/routes/guidelines/+page.svelte` | Low |
| `rules/index.html` | `src/routes/rules/+page.svelte` | Low |
| `support/index.html` | `src/routes/support/+page.svelte` | Low |
| `legal/terms/index.html` | `src/routes/legal/terms/+page.svelte` | Low |
| `legal/privacy/index.html` | `src/routes/legal/privacy/+page.svelte` | Low |
| `legal/cookies/index.html` | `src/routes/legal/cookies/+page.svelte` | Low |
| `news/index.html` | `src/routes/news/+page.svelte` | Medium (loads posts) |

### Example: Glossary Page

Jekyll `glossary/index.html` → SvelteKit:

**`src/routes/glossary/+page.svelte`**:
```svelte
<script lang="ts">
  // If the glossary page has any dynamic data, it would come from:
  // export let data;
</script>

<svelte:head>
  <title>Glossary | Challenge Run Community</title>
  <meta name="description" content="Definitions of speedrunning and challenge run terminology." />
</svelte:head>

<div class="page-width">
  <h1>Glossary</h1>
  <!-- Port the HTML content directly, replacing Liquid with Svelte syntax -->
</div>
```

### Example: Homepage (needs data)

**`src/routes/+page.server.ts`**:
```typescript
import { getGames, getRuns, getRunners } from '$lib/server/data';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
  const games = getGames().filter(g => g.status === 'Active');
  const runs = getRuns()
    .filter(r => r.status === 'approved')
    .sort((a, b) => new Date(b.date_submitted).getTime() - new Date(a.date_submitted).getTime())
    .slice(0, 10);

  return { games, recentRuns: runs };
};
```

---

## 7. Phase 5: Game Pages (Dynamic Routes)

This is the biggest win of the migration. Your 123+ generated HTML files in `games/` become a handful of route files.

### The Route Structure

```
src/routes/games/
├── +page.svelte                              # /games (index)
├── +page.server.ts                           # loads all games
├── [game_id]/
│   ├── +layout.svelte                        # shared game layout (tabs, hero)
│   ├── +layout.server.ts                     # loads game data + runs
│   ├── +page.svelte                          # /games/hades-2 (overview)
│   ├── rules/
│   │   └── +page.svelte                      # /games/hades-2/rules
│   ├── history/
│   │   └── +page.svelte                      # /games/hades-2/history
│   ├── resources/
│   │   └── +page.svelte                      # /games/hades-2/resources
│   ├── forum/
│   │   └── +page.svelte                      # /games/hades-2/forum
│   ├── submit/
│   │   └── +page.svelte                      # /games/hades-2/submit
│   └── runs/
│       ├── +page.svelte                      # /games/hades-2/runs (tier index)
│       └── [tier]/
│           ├── +page.svelte                  # /games/hades-2/runs/full-runs
│           └── [category]/
│               ├── +page.svelte              # /games/hades-2/runs/full-runs/underworld-any
│               └── +page.server.ts           # loads filtered runs
```

### Step 1: Game Layout (replaces `_layouts/game.html`)

**`src/routes/games/[game_id]/+layout.server.ts`**:

```typescript
import { getGame, getRunsForGame } from '$lib/server/data';
import { error } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ params }) => {
  const game = getGame(params.game_id);

  if (!game) {
    throw error(404, 'Game not found');
  }

  // Hide test content from non-testers
  if (game.game_id.startsWith('_')) {
    throw error(404, 'Game not found');
  }

  const runs = getRunsForGame(params.game_id);

  return { game, runs };
};
```

**`src/routes/games/[game_id]/+layout.svelte`**:

```svelte
<script lang="ts">
  import GameHeaderTabs from '$components/game/GameHeaderTabs.svelte';
  import GameHero from '$components/game/GameHero.svelte';

  export let data;
</script>

<svelte:head>
  <title>{data.game.game_name} | Challenge Run Community</title>
</svelte:head>

<GameHero game={data.game} />
<GameHeaderTabs game={data.game} />

<div class="page-width game-content">
  <slot />
</div>
```

### Step 2: Runs Category Page (replaces 100+ generated pages)

**`src/routes/games/[game_id]/runs/[tier]/[category]/+page.server.ts`**:

```typescript
import { getGame, getRunsForGame } from '$lib/server/data';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
  const game = getGame(params.game_id);
  if (!game) throw error(404);

  const allRuns = getRunsForGame(params.game_id);

  // Filter runs by category slug
  const runs = allRuns.filter(r => r.category_slug === params.category);

  // Validate that this category exists in the game's data
  // (This replaces the page generation script's validation)
  const categoryExists = findCategory(game, params.tier, params.category);
  if (!categoryExists) throw error(404, 'Category not found');

  return {
    runs,
    tier: params.tier,
    categorySlug: params.category,
    categoryName: categoryExists.name
  };
};

function findCategory(game: any, tier: string, slug: string) {
  // Search through the game's challenge tiers for the matching category
  if (tier === 'full-runs') {
    return game.challenges_data?.find((c: any) => c.slug === slug);
  }
  if (tier === 'mini-challenges') {
    for (const group of game.mini_challenges || []) {
      const found = group.challenges?.find((c: any) => c.slug === slug);
      if (found) return found;
    }
  }
  // Add community-created tier logic as needed
  return null;
}
```

**`src/routes/games/[game_id]/runs/[tier]/[category]/+page.svelte`**:

```svelte
<script lang="ts">
  import RunsTable from '$components/game/RunsTable.svelte';
  import RunsFilter from '$components/game/RunsFilter.svelte';

  export let data;
</script>

<svelte:head>
  <title>{data.categoryName} - {data.game.game_name} | CRC</title>
</svelte:head>

<h2>{data.categoryName}</h2>

<RunsFilter runs={data.runs} game={data.game} />
<RunsTable runs={data.runs} game={data.game} />
```

### Step 3: Port the Runs Table Component

The `_layouts/game-runs.html` (806 lines) becomes a set of Svelte components:

```
src/lib/components/game/
├── RunsTable.svelte        (the table itself)
├── RunsFilter.svelte       (filter bar — ports runs-filter.js + filter-utils.js)
├── RunRow.svelte            (single table row)
├── ChallengeChips.svelte   (the colored challenge type indicators)
└── VideoLink.svelte        (YouTube/Twitch link with thumbnail)
```

### Step 4: Port the Rules Component

`_includes/game-rules.html` (1,286 lines!) needs to be broken up:

```
src/lib/components/game/
├── GameRules.svelte         (main container, iterates sections)
├── RuleSection.svelte       (individual rule block with expand/collapse)
├── RuleBuilder.svelte       (interactive rule builder tool)
└── DefaultRules.svelte      (shared rules across games)
```

### Step 5: Static Generation for Game Pages

Since game data doesn't change at runtime (it's in markdown files), you can statically generate all game pages at build time. Add to your game layout:

**`src/routes/games/[game_id]/+layout.server.ts`** — add at the bottom:

```typescript
import { getGames } from '$lib/server/data';

// Tell SvelteKit to prerender all game pages
export function entries() {
  return getGames()
    .filter(g => !g.game_id.startsWith('_'))
    .map(g => ({ game_id: g.game_id }));
}

export const prerender = true;
```

Similarly for the nested runs routes, generate entries for all valid tier/category combinations.

---

## 8. Phase 6: Runner Profiles

### Route Structure

```
src/routes/runners/
├── +page.svelte                    # /runners (index)
├── +page.server.ts
└── [runner_id]/
    ├── +page.svelte                # /runners/gary-asher
    ├── +page.server.ts
    └── [game_id]/
        ├── +page.svelte            # /runners/gary-asher/hades-2
        └── +page.server.ts
```

### Runner Profile Load

**`src/routes/runners/[runner_id]/+page.server.ts`**:

```typescript
import { getRunner, getRunsForRunner, getGames, getAchievements } from '$lib/server/data';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
  const runner = getRunner(params.runner_id);
  if (!runner) throw error(404, 'Runner not found');

  const runs = getRunsForRunner(params.runner_id);
  const games = getGames();
  const achievements = getAchievements()
    .filter(a => a.runner_id === params.runner_id);

  // Group runs by game for the profile display
  const runsByGame = new Map<string, typeof runs>();
  for (const run of runs) {
    const existing = runsByGame.get(run.game_id) || [];
    existing.push(run);
    runsByGame.set(run.game_id, existing);
  }

  return {
    runner,
    runs,
    games,
    achievements,
    runsByGame: Object.fromEntries(runsByGame)
  };
};
```

The `_layouts/runner.html` (1,106 lines) breaks into:

```
src/lib/components/runner/
├── RunnerProfile.svelte      (header, avatar, socials, bio)
├── RunnerStats.svelte        (run counts, achievement counts)
├── RunnerGameCard.svelte     (per-game breakdown card)
├── RunnerRunsList.svelte     (runs table filtered to this runner)
├── RunnerAchievements.svelte (achievement cards)
└── AccentColorStyle.svelte   (applies the runner's custom accent color)
```

---

## 9. Phase 7: Authentication

### How Auth Changes

| Jekyll (Current) | SvelteKit (New) |
|---|---|
| `assets/js/auth.js` (450 lines) manages everything client-side | Server hooks + client store |
| Session in localStorage | Session in httpOnly cookies |
| Auth state scattered across pages | Centralized in `+layout.server.ts` |
| `_data/supabase-config.yml` exposed | `.env` with `PUBLIC_` prefix convention |

### Step 1: Auth Callback Route

**`src/routes/auth/callback/+server.ts`**:

```typescript
import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, locals, cookies }) => {
  const code = url.searchParams.get('code');
  const next = url.searchParams.get('next') ?? '/';

  if (code) {
    const { data, error } = await locals.supabase.auth.exchangeCodeForSession(code);

    if (!error && data.session) {
      // Set session cookies (httpOnly for security)
      cookies.set('sb-access-token', data.session.access_token, {
        path: '/',
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        maxAge: 60 * 60 // 1 hour
      });
      cookies.set('sb-refresh-token', data.session.refresh_token, {
        path: '/',
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30 // 30 days
      });
    }
  }

  throw redirect(303, next);
};
```

### Step 2: Sign-In Page

**`src/routes/sign-in/+page.svelte`**:

```svelte
<script lang="ts">
  import { supabase } from '$lib/supabase';
  import { PUBLIC_SITE_URL } from '$env/static/public';

  async function signInWithDiscord() {
    await supabase.auth.signInWithOAuth({
      provider: 'discord',
      options: {
        redirectTo: `${PUBLIC_SITE_URL}/auth/callback`
      }
    });
  }

  async function signInWithTwitch() {
    await supabase.auth.signInWithOAuth({
      provider: 'twitch',
      options: {
        redirectTo: `${PUBLIC_SITE_URL}/auth/callback`
      }
    });
  }
</script>
```

### Step 3: Auth Store (Client-Side Reactive State)

Create `src/lib/stores/auth.ts`:

```typescript
import { writable } from 'svelte/store';
import { supabase } from '$lib/supabase';
import type { Session, User } from '@supabase/supabase-js';

export const session = writable<Session | null>(null);
export const user = writable<User | null>(null);

// Listen for auth state changes
supabase.auth.onAuthStateChange((_event, newSession) => {
  session.set(newSession);
  user.set(newSession?.user ?? null);
});
```

### Step 4: Route Protection

For pages that require authentication (profile, admin), create a layout guard:

**`src/routes/profile/+layout.server.ts`**:

```typescript
import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
  if (!locals.session) {
    throw redirect(303, '/sign-in');
  }

  return {
    session: locals.session
  };
};
```

**`src/routes/admin/+layout.server.ts`**:

```typescript
import { redirect, error } from '@sveltejs/kit';
import { getRunner } from '$lib/server/data';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
  if (!locals.session) {
    throw redirect(303, '/sign-in');
  }

  // Check admin status — look up the runner profile linked to this auth user
  // You'll need to map Supabase user ID → runner_id via your profiles table
  const { data: profile } = await locals.supabase
    .from('profiles')
    .select('runner_id')
    .eq('user_id', locals.session.user.id)
    .single();

  if (!profile) throw error(403, 'No profile found');

  const runner = getRunner(profile.runner_id);
  if (!runner?.is_admin) {
    throw error(403, 'Admin access required');
  }

  return {
    session: locals.session,
    adminRunner: runner
  };
};
```

---

## 10. Phase 8: Forms & Submissions

### Submit Run Form

The `_includes/submit-run-form.html` (461 lines) + `assets/js/submit-run.js` (1,473 lines) become:

```
src/routes/submit/
├── +page.svelte               (the form page)
├── +page.server.ts            (loads form config data)
src/lib/components/forms/
├── SubmitRunForm.svelte       (main form container)
├── GameSelector.svelte        (game dropdown)
├── TierSelector.svelte        (tier selection after game)
├── CategorySelector.svelte    (category based on tier)
├── ChallengeSelector.svelte   (standard/community challenges)
├── RunDetailsFields.svelte    (time, video, character, etc.)
├── RestrictionPicker.svelte   (multi-select restrictions)
├── VideoValidator.svelte      (YouTube oEmbed validation)
└── TurnstileWidget.svelte     (Cloudflare Turnstile captcha)
```

The form still submits to your Cloudflare Worker — that doesn't change. But instead of vanilla JS fetch calls, you use SvelteKit's form actions or client-side fetch within Svelte components:

```svelte
<script lang="ts">
  import { PUBLIC_WORKER_URL } from '$env/static/public';

  let submitting = false;
  let error = '';

  async function handleSubmit(formData: FormData) {
    submitting = true;
    error = '';

    try {
      const res = await fetch(PUBLIC_WORKER_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(Object.fromEntries(formData))
      });

      if (!res.ok) {
        const data = await res.json();
        error = data.error || 'Submission failed';
        return;
      }

      // Success — redirect or show confirmation
    } catch (e) {
      error = 'Network error. Please try again.';
    } finally {
      submitting = false;
    }
  }
</script>
```

### Profile Forms

The profile pages (`profile/create`, `profile/edit`, `profile/settings`, `profile/theme`) follow the same pattern — Svelte components calling your existing Cloudflare Worker or Supabase directly.

---

## 11. Phase 9: Admin Panel

### Route Group with Protection

```
src/routes/admin/
├── +layout.svelte              (admin nav sidebar, notification badges)
├── +layout.server.ts           (auth + admin role check)
├── +page.svelte                (dashboard)
├── runs/
│   └── +page.svelte            (manage runs — ports admin/runs/index.html, 918 lines)
├── runs-queue/
│   └── +page.svelte            (pending runs queue)
├── games/
│   └── +page.svelte            (manage games)
├── profiles/
│   ├── +page.svelte            (manage profiles)
│   └── theme/+page.svelte
├── users/
│   └── +page.svelte            (manage users)
├── health/
│   └── +page.svelte            (site health dashboard — 1,846 lines, biggest admin page)
├── debug/
│   └── +page.svelte
├── financials/
│   └── +page.svelte
└── game-updates/
    └── +page.svelte
```

The admin pages are all client-side heavy (fetching from Supabase, calling Worker endpoints). They work well as client-rendered Svelte pages with `export const ssr = false;` if you prefer, or as SSR pages that hydrate with interactive functionality.

The key refactor: `assets/js/admin.js` (985 lines) gets split across the individual admin page components instead of being one monolithic file.

---

## 12. Phase 10: Search, News & Extras

### Search

Your current `search/index.html` (8,000 chars) becomes `src/routes/search/+page.svelte` with client-side search logic. If you're searching markdown data, you can either build a search index at build time (using something like `flexsearch` or `fuse.js`) or query Supabase.

### News/Blog

```
src/routes/news/
├── +page.svelte                 # news index
├── +page.server.ts              # loads _posts/*.md
└── [slug]/
    ├── +page.svelte             # individual post
    └── +page.server.ts          # loads single post
```

### Cookie Consent

`_includes/cookie-consent.html` (339 lines) → `src/lib/components/shared/CookieConsent.svelte` using a Svelte store for consent state instead of direct localStorage manipulation.

### Report Modal

`_includes/report-modal.html` (372 lines) → `src/lib/components/shared/ReportModal.svelte`

### 404 Page

`404.html` → `src/routes/+error.svelte`

### RSS Feed

`feed.xml` → `src/routes/feed.xml/+server.ts` (generates XML from post data)

---

## 13. Phase 11: Deployment & Cutover

### Step 1: Configure Cloudflare Pages

1. Go to Cloudflare Dashboard → Pages → Create a project
2. Connect your GitHub repo (the new SvelteKit one)
3. Build settings:
   - **Build command**: `pnpm build`
   - **Build output directory**: `.svelte-kit/cloudflare`
   - **Node version**: `20`
4. Add all environment variables from your `.env`

### Step 2: Test on Preview URL

Cloudflare Pages gives you a preview URL for every push. Test thoroughly:

- [ ] All game pages render correctly
- [ ] Run tables show correct data
- [ ] Auth flow works (Discord + Twitch)
- [ ] Run submission form works end-to-end
- [ ] Profile creation and editing works
- [ ] Admin panel loads and functions
- [ ] Search works
- [ ] Mobile responsive layout
- [ ] Dark/light theme toggle
- [ ] Cookie consent
- [ ] 404 page
- [ ] RSS feed

### Step 3: DNS Cutover

1. In Cloudflare Pages, add your custom domain: `www.challengerun.net`
2. Update CNAME record to point to Cloudflare Pages instead of GitHub Pages
3. Cloudflare handles SSL automatically

### Step 4: Post-Cutover

- Keep the Jekyll repo archived (don't delete it)
- Update your GitHub Actions workflows for the new repo structure
- Update the Cloudflare Worker's `ALLOWED_ORIGIN` if the domain doesn't change (it shouldn't)

---

## 14. File Mapping Reference

### Layouts → Components

| Jekyll Layout | Lines | SvelteKit Equivalent |
|---|---|---|
| `_layouts/default.html` | 121 | `src/routes/+layout.svelte` |
| `_layouts/game.html` | 444 | `src/routes/games/[game_id]/+layout.svelte` + child components |
| `_layouts/game-runs.html` | 806 | `src/routes/games/[game_id]/runs/[tier]/[category]/+page.svelte` + `RunsTable.svelte` |
| `_layouts/runner.html` | 1,106 | `src/routes/runners/[runner_id]/+page.svelte` + runner components |
| `_layouts/team.html` | 130 | `src/routes/teams/[team_id]/+page.svelte` |
| `_layouts/post.html` | 51 | `src/routes/news/[slug]/+page.svelte` |

### Includes → Components

| Jekyll Include | Lines | SvelteKit Component |
|---|---|---|
| `_includes/header.html` | 668 | `Header.svelte` + sub-components |
| `_includes/footer.html` | 209 | `Footer.svelte` |
| `_includes/game-rules.html` | 1,286 | `GameRules.svelte` + sub-components |
| `_includes/submit-run-form.html` | 461 | `SubmitRunForm.svelte` + sub-components |
| `_includes/report-modal.html` | 372 | `ReportModal.svelte` |
| `_includes/cookie-consent.html` | 339 | `CookieConsent.svelte` |
| `_includes/game-header-tabs.html` | 176 | `GameHeaderTabs.svelte` |
| `_includes/game-history.html` | 202 | `GameHistory.svelte` |
| `_includes/achievement-card.html` | 110 | `AchievementCard.svelte` |
| `_includes/role-preview.html` | 129 | `RolePreview.svelte` |
| `_includes/turnstile.html` | 47 | `TurnstileWidget.svelte` |
| `_includes/profile-form-styles.html` | 201 | Absorbed into profile component styles |

### JS → Svelte Components/Stores

| Jekyll JS | Lines | SvelteKit Equivalent |
|---|---|---|
| `assets/js/main.js` | 751 | Split across layout components + stores |
| `assets/js/submit-run.js` | 1,473 | `SubmitRunForm.svelte` + sub-components |
| `assets/js/admin.js` | 985 | Split across admin route components |
| `assets/js/runs-filter.js` | 847 | `RunsFilter.svelte` |
| `assets/js/filter-utils.js` | 523 | `$lib/utils/filters.ts` |
| `assets/js/auth.js` | 450 | `$lib/stores/auth.ts` + hooks + auth routes |
| `assets/js/banned-terms.js` | 305 | `$lib/utils/banned-terms.ts` |
| `assets/js/utils.js` | 120 | `$lib/utils/index.ts` |

---

## 15. Scripts That Survive vs. Die

### Scripts That Are Eliminated

These are replaced entirely by SvelteKit's dynamic routing:

| Script | Why It Dies |
|---|---|
| `generate-game-pages.js` | Dynamic `[game_id]` route handles all games |
| `generate-run-category-pages.js` | Dynamic `[tier]/[category]` route handles all categories |
| `generate-runner-game-pages.js` | Dynamic `[runner_id]/[game_id]` route handles all combos |
| `generate-form-index.js` | `+page.server.ts` load functions query data directly |

### Scripts That Survive (Modified)

| Script | What Changes |
|---|---|
| `validate-schema.js` | Stays. Run in CI to validate markdown files |
| `validate-runs.js` | Stays. Run in CI |
| `check-banned-terms.js` | Stays. Run in CI |
| `promote-runs.js` | Stays. Still needed for queue → approved workflow |
| `sync-runner-profiles.js` | Stays. Still syncs Supabase → markdown |
| `generate-codeowners.js` | Stays if you still use CODEOWNERS |
| `generate-game-file.py` | Stays. Template for new game scaffolding |

### New Scripts to Create

| Script | Purpose |
|---|---|
| `scripts/migrate-test-content.ts` | Replace `_test-game.md` / `_test-runner.md` underscore pattern with env-based filtering |

---

## 16. Security Considerations

### What Improves

1. **Supabase keys**: The anon key currently sits in `_data/supabase-config.yml` which gets built into every page. In SvelteKit, it's still public (`PUBLIC_SUPABASE_ANON_KEY`) but the service key stays server-side.

2. **Auth tokens**: Currently managed client-side in `auth.js`. SvelteKit moves session management to `httpOnly` cookies via `hooks.server.ts`, preventing XSS from stealing tokens.

3. **Admin route protection**: Currently relies on client-side checks in `admin.js`. SvelteKit's `+layout.server.ts` enforces admin checks server-side before any page content is sent.

4. **No inline scripts**: The current site has ~1,550 lines of inline JavaScript. SvelteKit bundles everything properly, enabling a strict Content Security Policy.

### What to Watch For

1. **CSRF on form actions**: If you use SvelteKit's native form actions (progressive enhancement), CSRF protection is built-in. If you stick with client-side fetch to your Worker, you're relying on the Worker's CORS + Turnstile, which is already in place.

2. **Prerender + sensitive data**: Don't accidentally prerender pages that should be dynamic (admin, profile edit). Use `export const prerender = false;` on protected routes.

3. **XSS via markdown**: When rendering user bios or rules that contain markdown, always sanitize the HTML output:

```typescript
import { marked } from 'marked';
import DOMPurify from 'isomorphic-dompurify';

export function renderMarkdown(input: string): string {
  const raw = marked.parse(input);
  return DOMPurify.sanitize(raw);
}
```

4. **Environment variables**: Double-check that no `SUPABASE_SERVICE_KEY` or other secrets get a `PUBLIC_` prefix.

---

## Quick Reference: Migration Order Checklist

- [ ] **Phase 1**: Scaffold SvelteKit project, install deps, set up directory structure
- [ ] **Phase 2**: Data layer working (can load games, runners, runs from markdown)
- [ ] **Phase 3**: Root layout with Header, Footer, SCSS, theme toggle
- [ ] **Phase 4**: Static pages (glossary, guidelines, legal, support)
- [ ] **Phase 5**: Game pages (overview, rules, history, runs tables with filters)
- [ ] **Phase 6**: Runner profiles (profile page, per-game breakdown)
- [ ] **Phase 7**: Auth (sign-in, callback, session management, route guards)
- [ ] **Phase 8**: Forms (submit run, profile create/edit)
- [ ] **Phase 9**: Admin panel (all 11 admin pages)
- [ ] **Phase 10**: Search, news, cookie consent, RSS, 404, report modal
- [ ] **Phase 11**: Deploy to Cloudflare Pages, test, DNS cutover

Estimated timeline: 4–8 weeks depending on hours per week. Phases 1–4 can happen in a weekend. Phase 5 is the heaviest lift (game pages + runs tables + filters). Phase 9 (admin) is the second biggest.
