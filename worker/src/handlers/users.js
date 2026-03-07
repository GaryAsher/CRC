// ═══════════════════════════════════════════════════════════════════════════════
// USER / ROLE HANDLERS
// ═══════════════════════════════════════════════════════════════════════════════

import { jsonResponse } from '../lib/cors.js';
import { sanitizeInput } from '../lib/utils.js';
import { supabaseQuery, verifySupabaseToken, isAdmin, writeGameHistory } from '../lib/supabase.js';

/**
 * Role hierarchy levels (higher = more powerful):
 *   4 = super_admin   (can assign: admin, moderator, verifier)
 *   3 = admin         (can assign: moderator, verifier)
 *   2 = moderator     (can assign: verifier)
 *   1 = verifier      (cannot assign anyone)
 *   0 = user          (cannot assign anyone)
 */
function getRoleLevel(roleObj) {
  if (roleObj.superAdmin) return 4;
  if (roleObj.admin) return 3;
  if (roleObj.moderator) return 2;
  if (roleObj.verifier) return 1;
  return 0;
}

function targetRoleLevel(roleName) {
  switch (roleName) {
    case 'admin': return 3;
    case 'moderator': return 2;
    case 'verifier': return 1;
    case 'user': return 0;
    default: return -1;
  }
}

export async function handleAssignRole(body, env, request) {
  // 1. Authenticate the caller
  const token = body.token;
  if (!token) return jsonResponse({ error: 'Missing token' }, 401, env, request);

  const callerUser = await verifySupabaseToken(env, token);
  if (!callerUser?.id) return jsonResponse({ error: 'Invalid or expired token' }, 401, env, request);

  const callerRole = await isAdmin(env, callerUser.id);
  const callerLevel = getRoleLevel(callerRole);

  // Minimum: moderator can assign verifier
  if (callerLevel < 2) {
    return jsonResponse({ error: 'Insufficient permissions. Moderator or higher required.' }, 403, env, request);
  }

  // 2. Validate input
  const { target_user_id, new_role, game_ids } = body;
  if (!target_user_id || typeof target_user_id !== 'string') {
    return jsonResponse({ error: 'Missing target_user_id' }, 400, env, request);
  }
  if (!new_role || typeof new_role !== 'string') {
    return jsonResponse({ error: 'Missing new_role' }, 400, env, request);
  }

  const validRoles = ['admin', 'moderator', 'verifier', 'user'];
  if (!validRoles.includes(new_role)) {
    return jsonResponse({ error: `Invalid role. Must be one of: ${validRoles.join(', ')}` }, 400, env, request);
  }

  // 3. Cannot assign super_admin
  if (new_role === 'super_admin') {
    return jsonResponse({ error: 'Cannot assign super_admin role via this endpoint' }, 403, env, request);
  }

  // 4. Caller can only assign roles STRICTLY below their own level
  const newLevel = targetRoleLevel(new_role);
  if (newLevel >= callerLevel) {
    return jsonResponse({ error: 'Cannot assign a role equal to or above your own' }, 403, env, request);
  }

  // 5. Cannot modify someone at or above your own level
  const targetRole = await isAdmin(env, target_user_id);
  const targetCurrentLevel = getRoleLevel(targetRole);
  if (targetCurrentLevel >= callerLevel) {
    return jsonResponse({ error: 'Cannot modify a user at or above your own role level' }, 403, env, request);
  }

  // 6. Cannot modify yourself
  if (target_user_id === callerUser.id) {
    return jsonResponse({ error: 'Cannot change your own role' }, 403, env, request);
  }

  // 7. Apply the role change
  try {
    // Build profile update based on new role
    let profileUpdate = {};
    switch (new_role) {
      case 'admin':
        profileUpdate = { is_admin: true, is_super_admin: false, role: 'admin' };
        break;
      case 'moderator':
        profileUpdate = { is_admin: false, is_super_admin: false, role: 'moderator' };
        break;
      case 'verifier':
        profileUpdate = { is_admin: false, is_super_admin: false, role: 'verifier' };
        break;
      case 'user':
        profileUpdate = { is_admin: false, is_super_admin: false, role: null };
        break;
    }

    // Update profiles table
    const profileRes = await supabaseQuery(env,
      `profiles?user_id=eq.${encodeURIComponent(target_user_id)}`,
      { method: 'PATCH', body: profileUpdate }
    );
    if (!profileRes.ok) {
      return jsonResponse({ error: 'Failed to update profile role' }, 500, env, request);
    }

    // Handle game verifiers table
    if (new_role === 'verifier' && Array.isArray(game_ids) && game_ids.length > 0) {
      // Clear existing verifier assignments for this user
      await supabaseQuery(env,
        `role_game_verifiers?user_id=eq.${encodeURIComponent(target_user_id)}`,
        { method: 'DELETE' }
      );
      // Insert new game assignments
      const rows = game_ids.map(gid => ({ user_id: target_user_id, game_id: sanitizeInput(gid, 100) }));
      await supabaseQuery(env, 'role_game_verifiers', {
        method: 'POST',
        body: rows,
        headers: { Prefer: 'resolution=merge-duplicates' }
      });
      // Write history for each assigned game
      for (const gid of game_ids) {
        await writeGameHistory(env, {
          game_id: sanitizeInput(gid, 100),
          action: 'gm_added',
          target: target_user_id,
          note: 'verifier assigned',
          actor_id: callerUser.id,
        });
      }
    } else if (new_role !== 'verifier') {
      // If demoting away from verifier, or promoting above it, clear verifier assignments
      await supabaseQuery(env,
        `role_game_verifiers?user_id=eq.${encodeURIComponent(target_user_id)}`,
        { method: 'DELETE' }
      );
    }

    return jsonResponse({
      ok: true,
      message: `Role updated to ${new_role}`,
      assigned_by: callerRole.runnerId || callerUser.id,
    }, 200, env, request);

  } catch (err) {
    console.error('assign-role error:', err);
    return jsonResponse({ error: 'Internal error during role assignment' }, 500, env, request);
  }
}
