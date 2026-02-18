# scripts/ — CI & Validation Scripts

Node.js scripts for data validation, CI checks, and maintenance tasks.
Run via `node scripts/<name>.js` or triggered by GitHub Actions.

## Scripts

| Script | Purpose | When it runs |
|-|-|-|
| `validate-schema.js` | Validates frontmatter in markdown files against expected schemas | CI on push |
| `validate-runs.js` | Checks run data integrity (valid game IDs, categories, etc.) | CI on push |
| `check-banned-terms.js` | Scans content for banned words/patterns | CI on push |
| `generate-codeowners.js` | Generates `.github/CODEOWNERS` from `config/codeowners.yml` | CI auto-regenerate |
| `generate-game-file.py` | Creates game markdown from structured input (used by game submission workflow) | GitHub Action |
| `promote-runs.js` | Moves verified runs from pending to approved (legacy — being replaced by Supabase workflow) | Manual |
| `sync-runner-profiles.js` | Syncs runner profile data from Supabase to markdown (legacy) | GitHub Action |

## Shared Library (`lib/`)

| File | Purpose |
|-|-|
| `lib/index.js` | Shared exports |
| `lib/parsers/front-matter.js` | YAML frontmatter parser for markdown files |
| `lib/utils/file-utils.js` | File system helpers |
| `lib/validators/constants.js` | Validation constants (allowed values, patterns) |
| `lib/validators/field-validators.js` | Per-field validation functions |

## Notes

- These scripts use `node:fs` and `node:path` — they run in Node.js (CI), NOT in the SvelteKit app
- The SvelteKit app cannot import from this directory (Cloudflare Workers don't support Node APIs)
- Some scripts (`promote-runs.js`, `sync-runner-profiles.js`) are legacy from the markdown-based flow and will be simplified or removed as the Supabase migration completes
