# Adding a New Language to CRC

This guide covers everything needed to add a new language to the site. The i18n system uses [Paraglide JS v2](https://inlang.com/m/gerre34r/library-inlang-paraglideJs) with a URL prefix strategy — English lives at `/`, all other languages at `/{locale}/`.

---

## Quick Reference

| What | Where |
|-|-|
| Inlang config | `project.inlang/settings.json` |
| Translation files | `messages/{locale}.json` |
| Generated runtime (don't edit) | `src/lib/paraglide/` |
| Language switcher | `src/lib/components/LanguageSwitcher.svelte` |
| SEO hreflang tags | `src/lib/components/HrefLang.svelte` |
| Vite plugin config | `vite.config.ts` |

---

## Step-by-Step: Add a New Language

### 1. Register the locale

Open `project.inlang/settings.json` and add the locale code to `languageTags`:

```json
"languageTags": ["en", "es", "ru"]
```

Use standard BCP 47 codes: `ru`, `fr`, `de`, `ja`, `ko`, `pt`, `zh`, etc.

### 2. Create the translation file

Copy `messages/en.json` to `messages/{locale}.json` and translate the values:

```
copy messages\en.json messages\ru.json
```

Then open `messages/ru.json` and replace the English strings with translations. **Keep the keys identical** — only change the values.

Example:
```json
{
  "nav_home": "Главная",
  "nav_games": "Игры",
  "nav_runners": "Бегуны",
  "nav_teams": "Команды",
  "language_english": "English",
  "language_spanish": "Español",
  "language_russian": "Русский",
  "language_switch": "Сменить язык"
}
```

### 3. Add the language label key to ALL translation files

Every language file needs a `language_{name}` key for the new language so the switcher can display its full name. Add to each file:

**`messages/en.json`** — add: `"language_russian": "Русский"`
**`messages/es.json`** — add: `"language_russian": "Русский"`
**`messages/ru.json`** — already has it from step 2

This pattern repeats: every language file should have a `language_*` key for every supported language.

### 4. Update the language switcher

Open `src/lib/components/LanguageSwitcher.svelte` and add entries to both maps:

```typescript
const labels: Record<string, string> = {
    en: 'EN',
    es: 'ES',
    ru: 'RU'       // ← add
};

const fullLabels: Record<string, () => string> = {
    en: () => m.language_english(),
    es: () => m.language_spanish(),
    ru: () => m.language_russian()  // ← add
};
```

### 5. Regenerate and test

```
rmdir /s /q src\lib\paraglide
pnpm dev
```

Then verify:
- `http://localhost:5173/` → English (no prefix)
- `http://localhost:5173/ru/` → Russian
- `http://localhost:5173/ru/games` → Russian games page
- Language switcher shows all options and links work
- Switching languages preserves the current page

---

## Adding New Translatable Strings

When you add new UI text that should be translated:

1. Add the key + English value to `messages/en.json`:
   ```json
   "submit_run": "Submit Run"
   ```

2. Add translations to every other language file:
   ```json
   "submit_run": "Enviar carrera"
   ```

3. Use it in a Svelte component:
   ```svelte
   <script>
     import * as m from '$lib/paraglide/messages';
   </script>
   <button>{m.submit_run()}</button>
   ```

4. For strings with variables:
   ```json
   "welcome_user": "Welcome, {name}!"
   ```
   ```svelte
   <p>{m.welcome_user({ name: runner.display_name })}</p>
   ```

Paraglide gives you autocomplete and type errors if you miss a parameter.

---

## Localizing Links

Use `localizeHref` to make internal links locale-aware:

```svelte
<script>
  import { localizeHref } from '$lib/paraglide/runtime';
</script>
<a href={localizeHref('/games')}>Games</a>
```

English users see `/games`, Spanish users see `/es/games`, etc.

---

## Rules

- **Never translate URL slugs.** `/ru/games/dark-souls` is correct. `/ru/игры/dark-souls` is wrong — it breaks routing.
- **Don't translate user-generated content.** Game names, runner bios, run notes come from Supabase and stay in their original language. Only translate UI chrome (nav, buttons, labels, headings).
- **Don't edit files in `src/lib/paraglide/`.** They're generated. Edit `messages/*.json` instead.
- **Keep `src/lib/paraglide/` in `.gitignore`.** It's regenerated on `pnpm dev` and `pnpm build`.
- **Message keys use snake_case.** Keep them descriptive: `nav_home`, `submit_run`, `error_not_found`.

---

## Troubleshooting

**"X is not a function" error after adding new keys:**
Delete `src/lib/paraglide/` and restart `pnpm dev`. The generated files were stale.

**`/es/` or `/{locale}/` returns 404:**
Make sure the Paraglide Vite plugin is listed before `sveltekit()` in `vite.config.ts` and has `strategy: ['url', 'cookie', 'baseLocale']`.

**Generated message files are empty (`/* eslint-disable */` only):**
The message format plugin is missing from `project.inlang/settings.json`. Ensure this module is listed:
```
"https://cdn.jsdelivr.net/npm/@inlang/plugin-message-format@latest/dist/index.js"
```

**Encoding issues (e.g. `├▒` instead of `ñ`):**
Save translation files as UTF-8. In VS Code: bottom status bar → click encoding → "Save with Encoding" → UTF-8.

---

## Cloudflare Pages Notes

- `disableAsyncLocalStorage: true` is required in the Paraglide Vite plugin config. Cloudflare Pages isolates each request, so there's no concurrency risk.
- No special Cloudflare routing config is needed — Paraglide handles the URL prefixes at the SvelteKit level.
