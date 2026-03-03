# CRC Staff Procedures — Profile Recovery Guide

**Internal Document — Not Public-Facing**
Last updated: March 3, 2026

---

## Purpose

This guide documents how to recover a user profile after accidental deletion, and the safeguards to prevent data loss. It covers recovery for both staff and regular runners.

**Lesson learned:** On March 3, 2026, a super admin accidentally deleted their own profile via the Supabase SQL editor. The profile was restored, but highlights, personal goals, and bio were lost because the audit log only captured one early entry. This guide exists to prevent that from happening again.

---

## Prevention: Before You Delete Anything

### Golden Rules

1. **Always run SELECT before DELETE.** Confirm the rows you're about to remove are the correct ones.
2. **Never run DELETE on `profiles` without a backup.** Export the row first.
3. **Use the SQL editor's "Run as postgres" toggle** — RLS can silently cause INSERTs to fail while reporting success.
4. **The SQL editor runs statements in order.** If statement 3 fails, statements 1 and 2 already ran.

### Pre-Deletion Backup Query

Before deleting any profile, always export the full row first:

```sql
-- Run this FIRST and save the output
SELECT *
FROM profiles
WHERE user_id = 'TARGET_USER_ID';
```

Copy the JSON result somewhere safe (a local file, a note, etc.) before proceeding with any deletion.

---

## Recovery Scenarios

### Scenario 1: Profile Row Deleted, Auth Account Intact

**Symptoms:** User can sign in but gets redirected to `/profile/create`. No admin access. Profile page returns 404.

**How to verify:**

```sql
-- Check auth account exists
SELECT id, email, raw_user_meta_data
FROM auth.users
WHERE id = 'TARGET_USER_ID';

-- Confirm profile is gone
SELECT id, user_id, runner_id
FROM profiles
WHERE user_id = 'TARGET_USER_ID';
```

**Recovery steps:**

1. **Check the audit log for old data:**

```sql
SELECT action, old_values, new_values, performed_at
FROM audit_profile_log
WHERE user_id = 'TARGET_USER_ID'
ORDER BY performed_at DESC;
```

2. **Re-insert the profile** (run as postgres to bypass RLS):

```sql
INSERT INTO profiles (
  user_id, runner_id, display_name, pronouns, location,
  bio, avatar_url, socials, is_admin, is_super_admin,
  is_public, status, role, created_at, updated_at, approved_at
) VALUES (
  'TARGET_USER_ID',
  'their-runner-id',
  'Display Name',
  'Pronouns',
  'Location',
  'Bio text',
  'https://avatar-url',
  '{"twitch": "...", "youtube": "...", "bluesky": "..."}'::jsonb,
  false,        -- is_admin (set true ONLY for admins)
  false,        -- is_super_admin (set true ONLY for super admins)
  true,         -- is_public
  'approved',
  null,         -- role
  NOW(), NOW(), NOW()
);
```

> **CRITICAL:** You MUST run this as postgres (toggle "Use Postgres role" or "Bypass RLS" in the SQL editor). Without this, the INSERT will silently fail due to RLS policies, and you'll see "Success" but the row won't exist.

3. **Restore linked accounts** (if also deleted):

```sql
-- Check current schema first
SELECT column_name FROM information_schema.columns
WHERE table_name = 'linked_accounts' ORDER BY ordinal_position;

-- Then insert (adjust columns to match current schema)
INSERT INTO linked_accounts (user_id, provider, provider_user_id, provider_username, provider_avatar_url, provider_email, linked_at)
VALUES ('TARGET_USER_ID', 'discord', 'DISCORD_ID', 'username', 'avatar_url', 'email', NOW())
ON CONFLICT DO NOTHING;
```

4. **Verify recovery:**

```sql
SELECT runner_id, display_name, is_admin, is_super_admin, status
FROM profiles
WHERE user_id = 'TARGET_USER_ID';
```

5. **Tell the user** to sign out and back in to refresh their session.

### Scenario 2: Auth Account Also Deleted

**Symptoms:** User cannot sign in at all. Their Discord/Twitch OAuth no longer connects to any account.

**Recovery:**

This is more destructive. The user must sign in again via Discord/Twitch, which creates a **new** `auth.users` row with a **new UUID**. Then:

1. User signs in → gets new UUID
2. Admin creates a profile row with the **new** UUID but the **old** runner_id
3. Any existing `runs` rows referencing the old runner_id still display correctly (they match on `runner_id`, not `user_id`)
4. Old `runs` rows referencing the old `user_id` would need to be updated:

```sql
UPDATE runs SET user_id = 'NEW_UUID' WHERE user_id = 'OLD_UUID';
UPDATE pending_runs SET user_id = 'NEW_UUID' WHERE user_id = 'OLD_UUID';
```

### Scenario 3: Runner Wants to Recover a Self-Deleted Profile

**Symptoms:** Runner deleted their profile through the UI and now wants it back.

**Steps:**

1. Verify their identity (they must be signed in with the same OAuth account)
2. Check audit log for their last known profile state
3. Follow Scenario 1 steps to re-insert
4. For non-admin runners, set `is_admin` and `is_super_admin` to `false`
5. The runner can update bio, socials, etc. through `/profile/edit`

---

## Data That Can Be Recovered

| Data | Where to find it |
|-|-|
| Core fields (name, pronouns, location, socials) | `audit_profile_log.old_values` |
| Runs | `runs` table (not deleted when profile is deleted) |
| Achievements | `game_achievements` table (separate from profile) |
| Auth identity | `auth.users` (if not deleted from Authentication dashboard) |
| Avatar | Supabase Storage `avatars` bucket (if not deleted) |

## Data That May Be Lost

| Data | Recovery option |
|-|-|
| Bio, highlights, personal goals | Only if captured in `audit_profile_log` or Supabase backups |
| Featured runs configuration | Only in `audit_profile_log` |
| Theme settings | Only in `audit_profile_log` |
| Badge assignments | Only in `audit_profile_log` |
| Contributions | Only in `audit_profile_log` |

---

## Known Gotcha: RLS Silent Failures

The Supabase SQL editor defaults to running queries with the **anon role** (RLS enabled). This means:

- **INSERT into `profiles`** will silently succeed but insert nothing (the `profiles_insert` policy may block it)
- **SELECT from `profiles`** only returns rows matching RLS conditions
- **DELETE from `profiles`** only affects rows the anon role can see

**Always toggle "Run as postgres"** when doing admin recovery operations. If you see "Success. No rows returned" after an INSERT, this is almost certainly the cause.

---

## Known Gotcha: RLS Infinite Recursion

Several RLS policies and helper functions query the `profiles` table. If these functions don't use `SECURITY DEFINER`, they trigger the SELECT policy, which calls the function again, causing infinite recursion (500 errors).

**Functions that MUST be `SECURITY DEFINER`:**

- `is_admin()` — used in SELECT, DELETE, and UPDATE policies on `profiles`
- `is_game_moderator(game_id_param)` — queries `profiles` for admin check
- `is_game_verifier(game_id_param)` — queries `profiles` for admin check
- `protect_profile_insert_fields()` — INSERT trigger on `profiles`
- `protect_profile_sensitive_fields()` — UPDATE trigger on `profiles`

**How to verify they're set correctly:**

```sql
SELECT proname, prosecdef
FROM pg_proc
WHERE proname IN ('is_admin', 'is_game_moderator', 'is_game_verifier',
  'protect_profile_sensitive_fields', 'protect_profile_insert_fields')
AND pronamespace = 'public'::regnamespace;
```

All should show `prosecdef = true`. If any show `false`, re-create the function with `SECURITY DEFINER SET search_path = public`.

---

## Improving Audit Coverage

The current `audit_profile_log` may not capture all profile changes. To ensure full recovery is possible in the future, verify that the audit trigger fires on UPDATE and DELETE:

```sql
-- Check existing triggers on profiles
SELECT trigger_name, event_manipulation, action_timing
FROM information_schema.triggers
WHERE event_object_table = 'profiles';
```

If there's no DELETE trigger logging to `audit_profile_log`, consider adding one so that the full profile state is captured before any deletion.
