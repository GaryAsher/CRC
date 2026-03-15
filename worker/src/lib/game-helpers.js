// ═══════════════════════════════════════════════════════════════════════════════
// Game-Related Helpers — History, Claims, Access Checks, Role Levels
// ═══════════════════════════════════════════════════════════════════════════════

import { supabaseQuery, isAdmin } from './supabase.js';

export function isClaimActive(claimedAt) {
  if (!claimedAt) return false;
  const TWO_WEEKS_MS = 14 * 24 * 60 * 60 * 1000;
  return (Date.now() - new Date(claimedAt).getTime()) < TWO_WEEKS_MS;
}

export async function writeGameHistory(env, { game_id, action, target, note, actor_id }) {
  try {
    // Best-effort actor name lookup — use runner_id from profiles
    let actor_name = null;
    try {
      const profResult = await supabaseQuery(env,
        `profiles?user_id=eq.${encodeURIComponent(actor_id)}&select=runner_id,display_name`,
        { method: 'GET' });
      if (profResult.ok && profResult.data?.length) {
        actor_name = profResult.data[0].display_name || profResult.data[0].runner_id || null;
      }
    } catch { /* ignore */ }

    await supabaseQuery(env, 'game_history', {
      method: 'POST',
      body: { game_id, action, target: target || null, note: note || null, actor_id, actor_name }
    });
  } catch { /* best-effort — never block main flow */ }
}

export function getRoleLevel(roleObj) {
  if (roleObj.superAdmin) return 4;
  if (roleObj.admin) return 3;
  if (roleObj.moderator) return 2;
  if (roleObj.verifier) return 1;
  return 0;
}

export function targetRoleLevel(roleName) {
  switch (roleName) {
    case 'admin': return 3;
    case 'moderator': return 2;
    case 'verifier': return 1;
    case 'user': return 0;
    default: return -1;
  }
}

export const GAME_ADMIN_ONLY_FIELDS = ['game_name', 'game_name_aliases', 'status', 'is_modded', 'base_game'];

/** All allowed game data fields — anything not in this list is stripped */
export const GAME_ALLOWED_FIELDS = [
  'game_name', 'game_name_aliases', 'status', 'timing_method',
  'genres', 'platforms', 'cover', 'cover_position',
  'full_runs', 'mini_challenges', 'player_made',
  'general_rules', 'challenges_data', 'glitches_data',
  'restrictions_data', 'character_column', 'characters_data',
  'difficulty_column', 'difficulties_data',
  'additional_tabs', 'community_achievements', 'credits',
  'is_modded', 'base_game', 'tabs', 'reviewers',
  'nmg_rules', 'glitch_doc_links'
];

/** Verify caller has game editor access for a specific game */
export async function checkGameEditorAccess(env, userId, gameId) {
  const role = await isAdmin(env, userId);

  // Admins and super admins can edit any game
  if (role.admin) return { allowed: true, role, isAdmin: true };

  // Moderators can edit games they're assigned to
  if (role.moderator) {
    const modCheck = await supabaseQuery(env,
      `role_game_moderators?user_id=eq.${encodeURIComponent(userId)}&game_id=eq.${encodeURIComponent(gameId)}&select=id`,
      { method: 'GET' });
    if (modCheck.ok && Array.isArray(modCheck.data) && modCheck.data.length > 0) {
      return { allowed: true, role, isAdmin: false };
    }
  }

  return { allowed: false, role, isAdmin: false };
}
