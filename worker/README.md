# worker/ — Cloudflare Worker API

The backend API layer. Handles all write operations to Supabase. Deployed separately
from the SvelteKit app via Wrangler.

**Base URL:** `https://crc-run-submissions.280sauce.workers.dev`

## Endpoints

| Method | Path | Auth | Purpose |
|-|-|-|-|
| POST | `/` | Turnstile captcha | Submit a new run |
| POST | `/submit-game` | Turnstile captcha | Submit a new game request |
| POST | `/approve` | Admin JWT | Approve a pending run |
| POST | `/approve-profile` | Admin JWT | Approve a pending profile |
| POST | `/approve-game` | Admin JWT | Approve a pending game |
| POST | `/notify` | Admin JWT | Send Discord notification (reject/changes requested) |
| POST | `/export-data` | User JWT | GDPR/CCPA data export (own data only) |

## Security

- **CORS:** Restricted to allowed origins (production domain + localhost in dev)
- **Rate limiting:** Per-IP limits on submission endpoints
- **Input sanitization:** All user input stripped of HTML, event handlers, JS protocols
- **Turnstile:** Cloudflare captcha on public submission endpoints
- **JWT verification:** Admin endpoints verify Supabase JWT and check role claims

## Secrets (set via `wrangler secret put`)

| Secret | Purpose |
|-|-|
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_KEY` | Service role key (full database access) |
| `GITHUB_TOKEN` | GitHub API token (for legacy file creation — being removed) |
| `GITHUB_REPO` | Repository path (e.g., `owner/CRC-main`) |
| `TURNSTILE_SECRET` | Cloudflare Turnstile server-side secret |
| `DISCORD_WEBHOOK_RUNS` | Discord webhook for run notifications |
| `DISCORD_WEBHOOK_GAMES` | Discord webhook for game notifications |
| `DISCORD_WEBHOOK_PROFILES` | Discord webhook for profile notifications |
| `ALLOWED_ORIGIN` | Comma-separated allowed CORS origins |

## Files

| File | Purpose |
|-|-|
| `src/index.js` | All Worker logic (single file) |
| `wrangler.toml` | Wrangler deployment configuration |

## Data Flow

```
Public submission → Turnstile verify → sanitize → Supabase pending table → Discord notification
Admin approval → JWT verify → role check → update Supabase status → Discord notification
```

## Deployment

```bash
cd worker
wrangler deploy
```
