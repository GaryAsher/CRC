# Reminders & Future Ideas

This document consolidates all reminders, future ideas, and planned features for CRC.
Cross-reference with `CLAUDE.md` Development Checklist for technical implementation details.

**Last updated:** 2026/02/28

---

## Fix Now (Blocking or Broken)

### Profile Approval → Runners Table Gap
- [ ] **Friend's account**: approved but `runner_id` is null — needs a manual Supabase fix.

---

## Revisit (Needs Polish)

### Admin Panel
- [] Submission Testers. Do we need this since we have Debug Tools?
    - It's a role simulation/QA tool (`/admin/debug`). Lets you preview the site as verifier/moderator/user without switching accounts. Works fine, no improvements needed.

### Global
- [ ] Icons for Admins, Super Admins, Verifiers — attach to profiles
- [ ] Add default profile picture and default banner
- [ ] Light mode CSS variables + colorblind mode testing
- [ ] Dark/light mode testing across all pages

---

## QA Feedback (Aves — 2/27/2026)

Tester: Aves | 19 passed, 7 failed, 2 partial

### Still To Do — Bugs
- [x] ~~**Submit Run: tier/category dropdowns not working**~~ — Fixed: `+page.server.ts` was stripping out `full_runs`, `mini_challenges`, etc. Now passes all fields the form needs.
- [ ] **Glossary: console error loading stylesheet** — check glossary route for missing/broken CSS import
- [x] ~~**Video URL "Could not retrieve video info"**~~ — Fixed: noembed.com has poor Twitch support. All 3 submit/edit pages now silently accept Twitch links instead of showing error.

### Still To Do — UX Polish
- [ ] **Favicon** — update once we have a logo (currently empty placeholder)
- [ ] **Light mode broken** — light mode CSS variables incomplete
- [x] ~~**Toast/snackbar for form submissions**~~ — Global Toast component added to layout. Fires on profile create and both submit forms.
- [x] ~~**Community Board padding**~~ — Bounty and Request boxes now have padding and card-style borders.
- [ ] **News container on homepage** — only shows News/Date/Title headers with no content visible. May need posts or a different empty state.
- [x] ~~**Nav text color inconsistency**~~ — All nav links now use `var(--fg)` (active state stays accent).
- [x] ~~**User dropdown menu**~~ — Added close ✕ button, rounded menu items with better padding/spacing.
- [x] ~~**Submit form: Select Game width**~~ — Wrapped in max-width container matching form width.
- [x] ~~**Run Statistics → footer spacing**~~ — Added 3rem bottom padding to runner profile page.
- [x] ~~**Achievements tab: Proof button padding**~~ — Proof button now vertically centered with auto margin.

### Still To Do — Suggestions (Lower Priority)
- [ ] **Add "Home" button in nav** — Aves recommends alongside logo
- [ ] **Add "Contact Us" in footer** — under Resources or Legal section
- [ ] **Nav layout rebalance** — Aves suggests tabs on left next to logo, search on right

---

## Short-Term Priorities

### 2. Content & Polish
- [ ] Fill glossary definitions (hit, damage, death, hitless vs damageless, etc.)
- [ ] Fill support page (FAQ, staff section, privacy request form)
- [ ] Test Discord webhooks (run submission, game submission)
- [ ] Audit SCSS for dead code

### 3. Legal & Compliance
- [ ] Review Terms of Service line-by-line
- [ ] Review Privacy Policy line-by-line
- [ ] Make email accounts for privacy and legal contacts
- [ ] Test user data export feature (GDPR compliance)
- [ ] Create disaster recovery plan document
- [ ] DMCA safe harbor policy + designated agent registration ($6)
- [ ] Review https://www.gdpradvisor.co.uk/gdpr-countries

---

## Medium-Term Priorities

### 4. Spanish Language Support
**PROMISED TO COMMUNITY — HIGH PRIORITY**
- [ ] Evaluate: `paraglide-js` or `$lib/i18n` approach
- [ ] Create translation files
- [ ] Add language toggle to header
- [ ] Request community translation help early

### 5. Verifier CMS
- [ ] Inline editing on game pages with diff preview
- [ ] Require 2 verifiers to approve rule changes
- [ ] Game submission UI in admin dashboard (replace external form)

### 6. Badges & Achievements System
- [ ] Design badge types (run count, challenge completion, community milestones)
- [ ] Run count badges on game cards
- [ ] Badge display on runner profiles
- [ ] Achievement progress tracking

### 7. Leaderboards
- [ ] Per-game leaderboards
- [ ] Per-challenge leaderboards
- [ ] Sortable/filterable tables

---

## Future Features (Backlog)

### Server-Side Pagination
- [ ] Cursor-based pagination for runs queries
    - only needed once a category has hundreds+ runs

### Modded Game Support
- [ ] Separate game pages for modded versions (Option A from earlier discussion)

### Multi-Game Run Support
- [ ] `is_multi_game` + `related_games` fields
- [ ] "🎮 MULTI-GAME" badge on game cards
- [ ] Treat like modded games — own game entry with linking relationship

### Team Profiles (LOW PRIORITY)
- [ ] Team submission process
- [ ] Team page layout with member lists
- [ ] Team badges

### Forum Integration
Decision needed: GitHub Discussions vs Discord vs embedded mini-forum
- [ ] `/games/[game_id]/forum` route placeholder exists
- [ ] Option C: Discord integration with widgets + channel links per game

### History Tab
- [ ] Rule changes, discussions, community milestones
- [ ] Needs Badges/Achievements system first
- [ ] News + history integration (unified timeline)

### Community Features
- [ ] Player-made challenges via forum, connected to profiles
- [ ] RSS feed optimization
- [ ] "How to Navigate the Site" guide / FAQ
- [ ] "Fixing Mistakes" guide for admins/verifiers

---

## 🛠️ Technical Debt

### Supabase
- [ ] Upgrade to paid plan (first service upgrade)
  - After upgrade: enable "Prevent use of leaked passwords" in Auth → Attack Protection
- [ ] GDPR export gap: `runs` and `game_achievements` RLS filters by `status = 'approved'` — admin can't export non-approved entries (minor, since tables only contain approved rows in practice)

### Runners Table Migration (Partially Complete)
`getRunners()` queries `profiles` first but falls back to `runners` table. 4 references remain:
- [ ] Remove fallback to `runners` table in `src/lib/server/supabase.ts` (lines ~101, ~132, ~334)
- [ ] Remove `runners` table reference in `src/routes/profile/setup/+page.svelte` (line ~118)
- [ ] Drop `runners` table after all references removed
- [ ] Remove `src/data/games/`, `src/data/runners/`, `src/data/runs/` markdown directories

### Global Search (Partially Complete)
Search page exists at `/search` — currently searches games + runners only.
- [ ] Add run search (search across approved runs)
- [ ] Add team search (once team profiles exist)

---

## 📝 Notes

### Supabase Upgrade Priority
Supabase is the first service to upgrade. After upgrading:
- Enable "Prevent use of leaked passwords" in Auth → Attack Protection

### Database Schema Rule
**Never guess database schemas, API shapes, or column names.** Always ask for actual schema/data before writing queries. Guessing causes repeated broken deploys.
