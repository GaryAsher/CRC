# i18n — Spanish Language Support (Paraglide JS)

**Status:** Phase 1 complete — Phase 2 complete — Phase 3 (community translation review) next
**Added:** March 2026
**Last updated:** March 8, 2026

## What's Done

### Phase 1 — Wire In ✅
- [x] Paraglide JS v2 installed (`pnpm add -D @inlang/paraglide-js -w`)
- [x] Inlang project config (`project.inlang/settings.json`) — `en` base, `es` secondary
- [x] URL strategy: English at `/` (no prefix), Spanish at `/es/` prefix
- [x] `disableAsyncLocalStorage: true` for Cloudflare Pages compatibility
- [x] Vite plugin wired up in `vite.config.ts` (must be listed **before** `sveltekit()`)
- [x] `app.html` uses `lang="en"` (Paraglide handles locale detection at runtime)
- [x] Translation files (`messages/en.json`, `messages/es.json`) with nav + language switcher labels
- [x] `LanguageSwitcher.svelte` component (dropdown with 🌐 toggle)
- [x] `HrefLang.svelte` component (SEO `<link rel="alternate" hreflang="...">` tags)
- [x] `HrefLang` added to root `+layout.svelte` (**outside** `<svelte:head>`, not inside it)
- [x] `LanguageSwitcher` added to `Header.svelte` nav-user area
- [x] `src/hooks.js` created with `reroute` function (required for `/es/` URL routing)
- [x] `src/lib/paraglide/` added to `.gitignore`
- [x] Header nav links localized with `localizeHref()` and `m.*()` message functions
- [x] Header: all remaining strings (Submit, More dropdown, search placeholder, user menu, Login, role labels)
- [x] Footer: all links, headings, descriptions, copyright
- [x] DebugBar: chrome strings (badge, buttons, toast)
- [x] Sign-in page: all strings (title, description, buttons, agree text)
- [x] Game page layout: tabs translated + back link localized + tab hrefs localized
- [x] Runner profile: all 5 tabs translated
- [x] Profile edit: tabs, page title, back link, Save/Reset buttons translated
- [x] Game submit: sign-in required, success state, submit button, verification text
- [x] Game suggest: submit suggestion button, submit another button
- [x] Profile create: submit for review button
- [x] Profile setup: save & continue, skip buttons
- [x] Submit-game: 7 tabs, save draft, submit game request, browse games, submit another, add suggestions buttons
- [x] Submit run form: all 11 sections (category, platform, runner, character, challenges, glitch, restrictions, timing, date, video, notes) + validation messages
- [x] Submit-game form: all page-level text, all 7 tab contents (General with sub-sections, Categories, Challenges, Characters, Restrictions, Timing & Glitches, Rules & Notes), supporter form, validation messages
- [x] Glossary page: heading, description, challenge types heading, empty/alias states
- [x] Error page (+error.svelte): all status headings (404, 403, 500), messages, action buttons
- [x] Admin layout: access denied state with role name, hint text, navigation buttons
- [x] Admin dashboard: page title, role labels, stats labels, all 11 nav card titles + descriptions
- [x] Header sidebar: all admin panel nav items, section titles, role badges translated
- [x] All 13 admin pages: access denied blocks, Go Home / Back to Dashboard buttons
- [x] `/es/games` loads Spanish locale, `/games` stays English

## Critical Setup Details

These caused bugs during setup. Future assistants: read carefully.

### 1. The message format plugin is required
`project.inlang/settings.json` **must** include the message format plugin or generated files will be empty:
```
"https://cdn.jsdelivr.net/npm/@inlang/plugin-message-format@latest/dist/index.js"
```
The lint rule modules alone are not enough. Without this plugin, `src/lib/paraglide/messages/en.js` generates as just `/* eslint-disable */` with no message functions.

### 2. `src/hooks.js` is required for URL routing
Paraglide v2 does **not** export a `reroute` hook. You must write it manually:
```js
// src/hooks.js
import { deLocalizeHref } from '$lib/paraglide/runtime';

/** @type {import('@sveltejs/kit').Reroute} */
export function reroute({ url }) {
    return deLocalizeHref(url.pathname);
}
```
Without this file, `/es/games` returns a 404 because SvelteKit doesn't know to map it to the `/games` route.

### 3. `HrefLang` goes outside `<svelte:head>`
`HrefLang.svelte` has its own `<svelte:head>` block. Nesting it inside another `<svelte:head>` in `+layout.svelte` breaks all styles. Place it in the template body:
```svelte
<svelte:head>
    <meta name="description" content="..." />
</svelte:head>

<HrefLang />
```

### 4. Paraglide Vite plugin goes before sveltekit()
In `vite.config.ts`, `paraglideVitePlugin()` must be listed **before** `sveltekit()` in the plugins array.

### 5. Stale generated files
If you add new message keys and get "X is not a function" errors:
```
rmdir /s /q src\lib\paraglide   (Windows)
rm -rf src/lib/paraglide         (Mac/Linux)
pnpm dev
```

---

## What's Left

### Phase 2 — Extract Strings (incremental)
Replace hardcoded strings with `m.key_name()` calls and wrap `href` attributes with `localizeHref()`.

Every component with internal links needs:
```svelte
<script>
    import { localizeHref } from '$lib/paraglide/runtime';
    import * as m from '$lib/paraglide/messages';
</script>

<!-- Before -->
<a href="/games">Games</a>

<!-- After -->
<a href={localizeHref('/games')}>{m.nav_games()}</a>
```

Priority order:
- [x] Header navigation (Home, Games, Runners, Teams + all dropdown/user menu links)
- [x] Footer (all links and headings)
- [x] Dev banner
- [x] Sign-in / auth pages
- [x] Game page tabs (Overview, Runs, Rules, etc.)
- [x] Runner profile tabs
- [x] Common action buttons (Submit, Cancel, Save, Approve, Reject)
- [x] Submit run form labels and validation messages
- [x] Submit game form
- [x] Glossary page section headings
- [x] Error pages (404, 500)
- [x] Admin panel (lower priority — admin-only, not public-facing)

### Phase 3 — Community Translation
- [ ] Share `messages/es.json` with Spanish-speaking community members for review
- [ ] Set up Fink (inlang's translation editor) or share JSON directly
- [ ] Add translation contribution guide to repo or Discord

### Phase 4 — Additional Languages
Adding a new language (e.g. Russian) requires only:

1. Add `"ru"` to `languageTags` in `project.inlang/settings.json`
2. Create `messages/ru.json` (copy `en.json`, translate values)
3. Add `"language_russian": "Русский"` to **all existing** message files
4. Add `ru` entries to the two maps in `LanguageSwitcher.svelte`

No routing changes, no link changes, no new imports. All existing `localizeHref()` calls automatically handle the new `/ru/` prefix.

See `docs/ADDING-LANGUAGES.md` for the full step-by-step guide.

---

## How to Add a Translated String

1. Add the key to `messages/en.json`:
   ```json
   "my_new_string": "Hello {name}, welcome!"
   ```

2. Add the Spanish version to `messages/es.json`:
   ```json
   "my_new_string": "¡Hola {name}, bienvenido!"
   ```

3. Use it in a Svelte component:
   ```svelte
   <script>
     import * as m from '$lib/paraglide/messages';
   </script>
   <h1>{m.my_new_string({ name: 'Runner' })}</h1>
   ```

4. Paraglide gives you autocomplete and type errors if you miss a parameter.

## How to Localize Links

Use `localizeHref` from the Paraglide runtime to prefix links for the current locale:

```svelte
<script>
  import { localizeHref } from '$lib/paraglide/runtime';
</script>
<a href={localizeHref('/games')}>Games</a>
```

English users see `/games`, Spanish users see `/es/games`.

For detecting active nav state on localized paths, use `deLocalizeHref` to strip the prefix before comparing:
```svelte
<script>
  import { deLocalizeHref } from '$lib/paraglide/runtime';
</script>
```

## Important Notes
- **Don't translate URL slugs.** `/es/games/dark-souls` is correct. `/es/juegos/dark-souls` is not — it breaks routing.
- **Dynamic content from Supabase stays in its original language.** Game names, runner bios, run notes — these are user-generated and not translated. Only UI chrome is translated.
- **The `$lib/paraglide/` directory is generated.** Don't edit files in it. Edit `messages/*.json` instead.
- **Cloudflare Pages:** The `disableAsyncLocalStorage: true` flag is required. Each Pages request gets its own isolate, so there's no concurrency risk.
- **Save translation files as UTF-8.** If you see encoding issues like `├▒` instead of `ñ`, re-save as UTF-8 in your editor.

## File Locations

| What | Where |
|-|-|
| Inlang config | `project.inlang/settings.json` |
| English messages | `messages/en.json` |
| Spanish messages | `messages/es.json` |
| Generated runtime (don't edit) | `src/lib/paraglide/` |
| Language switcher | `src/lib/components/LanguageSwitcher.svelte` |
| SEO hreflang tags | `src/lib/components/HrefLang.svelte` |
| Vite plugin config | `vite.config.ts` |
| URL reroute hook | `src/hooks.js` |
| Adding languages guide | `docs/ADDING-LANGUAGES.md` |
