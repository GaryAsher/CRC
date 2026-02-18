# supabase/ — Supabase Edge Functions

Deno-based edge functions deployed to Supabase.

## Functions

### `on-profile-update/`

**Status:** Legacy — will be simplified when Supabase-first migration completes.

Currently triggers a GitHub Action via `repository_dispatch` when a runner profile
is updated in Supabase. This was needed when profiles were stored as markdown files
in the repo. Once profiles are read directly from Supabase, this function can be
simplified to just emit a Discord notification or be removed entirely.

**Trigger:** Database trigger on the `runner_profiles` table (AFTER UPDATE).

**Deployment:**
```bash
supabase functions deploy on-profile-update
```

## Supabase Project

- **URL:** Configured via `PUBLIC_SUPABASE_URL` env var
- **Dashboard:** https://supabase.com/dashboard (project: riwcekvwpwmbtihjqhmh)
- **Plan:** Free tier (500MB database, 1GB storage)

## Tables Overview

See [CLAUDE.md](../CLAUDE.md) for the full table schema documentation.

### Core tables (dynamic content):
- `games`, `runs`, `runners`, `achievements`, `teams`

### Queue tables (pending approval):
- `pending_runs`, `pending_games`, `pending_profiles`

### Supporting tables:
- `linked_accounts`, `support_tickets`, `audit_log`
