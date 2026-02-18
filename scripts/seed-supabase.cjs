#!/usr/bin/env node
/**
 * CRC Seed Script — Phase 1 Supabase Migration
 *
 * Reads existing markdown files from src/data/ and generates SQL INSERT
 * statements to seed the Supabase tables.
 *
 * Usage:
 *   node scripts/seed-supabase.js > supabase/migrations/002_seed_data.sql
 *
 * Then paste the output into Supabase SQL Editor and run it.
 *
 * This is a ONE-TIME migration script. After running, the markdown files
 * become legacy and all new data goes directly into Supabase.
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'src', 'data');

// ─── YAML Front Matter Parser ───────────────────────────────────────────────
// Simple parser that handles the subset of YAML used in CRC markdown files.
// For production use, consider js-yaml, but this avoids a dependency.

function parseFrontMatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return { meta: {}, body: '' };

  const yamlStr = match[1];
  const body = content.slice(match[0].length).trim();

  // Use js-yaml if available, otherwise fall back to JSON-ish parsing
  try {
    const yaml = require('js-yaml');
    return { meta: yaml.load(yamlStr) || {}, body };
  } catch {
    // Fallback: try to load it
    console.error('Warning: js-yaml not found. Install with: npm install js-yaml');
    process.exit(1);
  }
}

// ─── SQL Helpers ────────────────────────────────────────────────────────────

function sqlStr(val) {
  if (val === null || val === undefined || val === '') return 'NULL';
  const s = String(val).replace(/'/g, "''");
  return `'${s}'`;
}

function sqlBool(val) {
  return val ? 'true' : 'false';
}

function sqlDate(val) {
  if (!val) return 'NULL';
  if (val instanceof Date) {
    return sqlStr(val.toISOString().slice(0, 10));
  }
  return sqlStr(String(val).slice(0, 10));
}

function sqlTimestamp(val) {
  if (!val) return 'NULL';
  if (val instanceof Date) {
    return sqlStr(val.toISOString());
  }
  return sqlStr(String(val));
}

function sqlArray(arr) {
  if (!arr || !Array.isArray(arr) || arr.length === 0) return "'{}'";
  const items = arr.map(i => `"${String(i).replace(/"/g, '\\"')}"`).join(',');
  return `'{${items}}'`;
}

function sqlJsonb(val) {
  if (val === null || val === undefined) return "'[]'::jsonb";
  const json = JSON.stringify(val).replace(/'/g, "''");
  return `'${json}'::jsonb`;
}

// ─── Read Games ─────────────────────────────────────────────────────────────

function readGames() {
  const dir = path.join(DATA_DIR, 'games');
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.md') && !f.startsWith('_') && f !== 'README.md');

  const inserts = [];

  for (const file of files) {
    const content = fs.readFileSync(path.join(dir, file), 'utf-8');
    const { meta, body } = parseFrontMatter(content);

    if (!meta.game_id) continue;

    inserts.push(`INSERT INTO games (
  game_id, game_name, game_name_aliases, status, reviewers,
  is_modded, base_game, genres, platforms, tabs,
  general_rules, challenges_data, restrictions_data, glitches_data, glitches_relevant,
  full_runs, mini_challenges, player_made,
  character_column, characters_data, timing_method,
  community_achievements, community_challenges, credits,
  cover, cover_position, content
) VALUES (
  ${sqlStr(meta.game_id)}, ${sqlStr(meta.game_name)}, ${sqlArray(meta.game_name_aliases)}, ${sqlStr(meta.status || 'Active')}, ${sqlArray(meta.reviewers)},
  ${sqlBool(meta.is_modded)}, ${sqlStr(meta.base_game)}, ${sqlArray(meta.genres)}, ${sqlArray(meta.platforms)}, ${sqlJsonb(meta.tabs)},
  ${sqlStr(meta.general_rules)}, ${sqlJsonb(meta.challenges_data)}, ${sqlJsonb(meta.restrictions_data)}, ${sqlJsonb(meta.glitches_data)}, ${sqlBool(meta.glitches_relevant !== false)},
  ${sqlJsonb(meta.full_runs)}, ${sqlJsonb(meta.mini_challenges)}, ${sqlJsonb(meta.player_made)},
  ${sqlJsonb(meta.character_column)}, ${sqlJsonb(meta.characters_data)}, ${sqlStr(meta.timing_method || 'IGT')},
  ${sqlJsonb(meta.community_achievements)}, ${sqlJsonb(meta.community_challenges)}, ${sqlJsonb(meta.credits)},
  ${sqlStr(meta.cover)}, ${sqlStr(meta.cover_position || 'center')}, ${sqlStr(body)}
) ON CONFLICT (game_id) DO NOTHING;`);
  }

  return inserts;
}

// ─── Read Runners ───────────────────────────────────────────────────────────

function readRunners() {
  const dir = path.join(DATA_DIR, 'runners');
  if (!fs.existsSync(dir)) return [];
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.md') && !f.startsWith('_') && f !== 'README.md');

  const inserts = [];

  for (const file of files) {
    const content = fs.readFileSync(path.join(dir, file), 'utf-8');
    const { meta, body } = parseFrontMatter(content);

    if (!meta.runner_id) continue;

    inserts.push(`INSERT INTO runners (
  runner_id, runner_name, display_name, avatar, joined_date,
  pronouns, location, status, hidden, bio,
  accent_color, cover_position, banner,
  is_admin, can_view_test_content,
  socials, featured_runs, personal_goals, contributions, content
) VALUES (
  ${sqlStr(meta.runner_id)}, ${sqlStr(meta.runner_name)}, ${sqlStr(meta.display_name)}, ${sqlStr(meta.avatar)}, ${sqlDate(meta.joined_date)},
  ${sqlStr(meta.pronouns)}, ${sqlStr(meta.location)}, ${sqlStr(meta.status || 'active')}, ${sqlBool(meta.hidden)}, ${sqlStr(meta.bio)},
  ${sqlStr(meta.accent_color)}, ${sqlStr(meta.cover_position || 'center')}, ${sqlStr(meta.banner)},
  ${sqlBool(meta.is_admin)}, ${sqlBool(meta.can_view_test_content)},
  ${sqlJsonb(meta.socials)}, ${sqlJsonb(meta.featured_runs)}, ${sqlJsonb(meta.personal_goals)}, ${sqlJsonb(meta.contributions)}, ${sqlStr(body)}
) ON CONFLICT (runner_id) DO NOTHING;`);
  }

  return inserts;
}

// ─── Read Runs ──────────────────────────────────────────────────────────────

function readRuns() {
  const runsDir = path.join(DATA_DIR, 'runs');
  if (!fs.existsSync(runsDir)) return [];

  const inserts = [];

  // Runs are organized as runs/{game_id}/*.md
  const gameDirs = fs.readdirSync(runsDir).filter(d => {
    const p = path.join(runsDir, d);
    return fs.statSync(p).isDirectory() && d !== 'rejected';
  });

  for (const gameDir of gameDirs) {
    const dirPath = path.join(runsDir, gameDir);
    const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.md') && f !== 'README.md');

    for (const file of files) {
      const content = fs.readFileSync(path.join(dirPath, file), 'utf-8');
      const { meta } = parseFrontMatter(content);

      if (!meta.game_id || !meta.runner_id) continue;

      // Determine status — only seed approved runs into the runs table
      const status = meta.status || (meta.verified ? 'approved' : 'pending');
      if (status !== 'approved') continue;

      inserts.push(`INSERT INTO runs (
  game_id, runner_id, category_tier, category_slug, category,
  standard_challenges, community_challenge, character, glitch_id,
  restrictions, restriction_ids,
  runner, video_url, time_primary, timing_method_primary,
  time_secondary, timing_method_secondary, date_completed, run_time,
  submission_id, submitted_at, date_submitted,
  status, verified, verified_by
) VALUES (
  ${sqlStr(meta.game_id)}, ${sqlStr(meta.runner_id)}, ${sqlStr(meta.category_tier || 'full_runs')}, ${sqlStr(meta.category_slug)}, ${sqlStr(meta.category)},
  ${sqlArray(meta.standard_challenges)}, ${sqlStr(meta.community_challenge)}, ${sqlStr(meta.character)}, ${sqlStr(meta.glitch_id)},
  ${sqlArray(meta.restrictions)}, ${sqlArray(meta.restriction_ids)},
  ${sqlStr(meta.runner)}, ${sqlStr(meta.video_url)}, ${sqlStr(meta.time_primary)}, ${sqlStr(meta.timing_method_primary)},
  ${sqlStr(meta.time_secondary)}, ${sqlStr(meta.timing_method_secondary)}, ${sqlDate(meta.date_completed)}, ${sqlStr(meta.run_time)},
  ${sqlStr(meta.submission_id)}, ${sqlTimestamp(meta.submitted_at)}, ${sqlDate(meta.date_submitted || meta.date)},
  'approved', true, ${sqlStr(meta.verified_by)}
);`);
    }
  }

  return inserts;
}

// ─── Read Achievements ──────────────────────────────────────────────────────

function readAchievements() {
  const dir = path.join(DATA_DIR, 'achievements');
  if (!fs.existsSync(dir)) return [];
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.md') && f !== 'README.md');

  const inserts = [];

  for (const file of files) {
    const content = fs.readFileSync(path.join(dir, file), 'utf-8');
    const { meta } = parseFrontMatter(content);

    if (!meta.game_id || !meta.runner_id || !meta.achievement_slug) continue;

    inserts.push(`INSERT INTO achievements (
  game_id, runner_id, achievement_slug,
  date_completed, proof_url, notes,
  status, verified_by, verified_at
) VALUES (
  ${sqlStr(meta.game_id)}, ${sqlStr(meta.runner_id)}, ${sqlStr(meta.achievement_slug)},
  ${sqlDate(meta.date_completed)}, ${sqlStr(meta.proof_url)}, ${sqlStr(meta.notes)},
  ${sqlStr(meta.status || 'pending')}, ${sqlStr(meta.verified_by)}, ${sqlTimestamp(meta.verified_at)}
) ON CONFLICT (game_id, runner_id, achievement_slug) DO NOTHING;`);
  }

  return inserts;
}

// ─── Read Teams ─────────────────────────────────────────────────────────────

function readTeams() {
  const dir = path.join(DATA_DIR, 'teams');
  if (!fs.existsSync(dir)) return [];
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.md') && !f.startsWith('_') && f !== 'README.md');

  const inserts = [];

  for (const file of files) {
    const content = fs.readFileSync(path.join(dir, file), 'utf-8');
    const { meta, body } = parseFrontMatter(content);

    if (!meta.team_id) continue;

    inserts.push(`INSERT INTO teams (
  team_id, name, tagline, logo,
  socials, games, members, achievements, content
) VALUES (
  ${sqlStr(meta.team_id)}, ${sqlStr(meta.name)}, ${sqlStr(meta.tagline)}, ${sqlStr(meta.logo)},
  ${sqlJsonb(meta.socials)}, ${sqlArray(meta.games)}, ${sqlJsonb(meta.members)}, ${sqlJsonb(meta.achievements)}, ${sqlStr(body)}
) ON CONFLICT (team_id) DO NOTHING;`);
  }

  return inserts;
}

// ─── Main ───────────────────────────────────────────────────────────────────

function main() {
  console.log('-- =============================================================================');
  console.log('-- CRC Seed Data — Generated from src/data/ markdown files');
  console.log(`-- Generated at: ${new Date().toISOString()}`);
  console.log('-- =============================================================================');
  console.log('');
  console.log('BEGIN;');
  console.log('');

  // Games must be inserted first (runs reference them via FK)
  // But modded games reference base games, so insert non-modded first
  const games = readGames();
  if (games.length) {
    console.log('-- ─── GAMES (' + games.length + ') ────────────────────────────────────────────');
    console.log('-- Insert non-modded games first (modded games reference base_game)');
    console.log('');
    // Sort: non-modded first
    const sorted = [...games].sort((a, b) => {
      const aModded = a.includes("is_modded, base_game") && !a.includes("false, NULL");
      const bModded = b.includes("is_modded, base_game") && !b.includes("false, NULL");
      return aModded - bModded;
    });
    sorted.forEach(s => { console.log(s); console.log(''); });
  }

  const runners = readRunners();
  if (runners.length) {
    console.log('-- ─── RUNNERS (' + runners.length + ') ──────────────────────────────────────────');
    console.log('');
    runners.forEach(s => { console.log(s); console.log(''); });
  }

  const runs = readRuns();
  if (runs.length) {
    console.log('-- ─── RUNS (' + runs.length + ') ────────────────────────────────────────────');
    console.log('');
    runs.forEach(s => { console.log(s); console.log(''); });
  }

  const achievements = readAchievements();
  if (achievements.length) {
    console.log('-- ─── ACHIEVEMENTS (' + achievements.length + ') ──────────────────────────────────');
    console.log('');
    achievements.forEach(s => { console.log(s); console.log(''); });
  }

  const teams = readTeams();
  if (teams.length) {
    console.log('-- ─── TEAMS (' + teams.length + ') ──────────────────────────────────────────');
    console.log('');
    teams.forEach(s => { console.log(s); console.log(''); });
  }

  console.log('COMMIT;');
  console.log('');
  console.log('-- ─── SUMMARY ──────────────────────────────────────────────────────────────');
  console.log(`-- Games:        ${games.length}`);
  console.log(`-- Runners:      ${runners.length}`);
  console.log(`-- Runs:         ${runs.length}`);
  console.log(`-- Achievements: ${achievements.length}`);
  console.log(`-- Teams:        ${teams.length}`);
}

main();
