// ═══════════════════════════════════════════════════════════════════════════════
// Supabase Helpers — Query, Notifications, Token Verification, Roles
// ═══════════════════════════════════════════════════════════════════════════════

export async function supabaseQuery(env, path, { method = 'GET', body, headers: extra } = {}) {
  const url = `${env.SUPABASE_URL}/rest/v1/${path}`;
  const headers = {
    apikey: env.SUPABASE_SERVICE_KEY,
    Authorization: `Bearer ${env.SUPABASE_SERVICE_KEY}`,
    'Content-Type': 'application/json',
    Prefer: method === 'POST' ? 'return=representation' : 'return=representation',
    ...extra,
  };
  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  try {
    return { ok: res.ok, status: res.status, data: JSON.parse(text) };
  } catch {
    return { ok: res.ok, status: res.status, data: text };
  }
}

/**
 * Insert an in-app notification for a user.
 * Fire-and-forget — failures are logged but don't block the response.
 * @param {object} env - Worker env with SUPABASE_URL, SUPABASE_SERVICE_KEY
 * @param {string} userId - Target user's auth.users UUID
 * @param {string} type - e.g. 'run_approved', 'profile_rejected'
 * @param {string} title - Short notification title
 * @param {object} opts - Optional: { message, link, metadata }
 */
export async function insertNotification(env, userId, type, title, opts = {}) {
  if (!userId) return;
  try {
    await supabaseQuery(env, 'notifications', {
      method: 'POST',
      body: {
        user_id: userId,
        type,
        title,
        message: opts.message || null,
        link: opts.link || null,
        metadata: opts.metadata || {},
      },
    });
  } catch (err) {
    console.error('insertNotification failed:', err);
  }
}

/** Verify a Supabase access token → returns user object or null */
export async function verifySupabaseToken(env, accessToken) {
  const res = await fetch(`${env.SUPABASE_URL}/auth/v1/user`, {
    headers: {
      apikey: env.SUPABASE_SERVICE_KEY,
      Authorization: `Bearer ${accessToken}`,
    },
  });
  if (!res.ok) return null;
  return res.json();
}

/** Check user roles: admin, moderator, verifier (with per-game assignments) */
export async function isAdmin(env, userId) {
  const encodedUserId = encodeURIComponent(userId);

  // Query profile and both role tables in parallel
  const [profile, verifierResult, moderatorResult] = await Promise.all([
    supabaseQuery(env,
      `profiles?user_id=eq.${encodedUserId}&select=is_admin,is_super_admin,runner_id,role`, { method: 'GET' }),
    supabaseQuery(env,
      `role_game_verifiers?user_id=eq.${encodedUserId}&select=game_id`, { method: 'GET' }),
    supabaseQuery(env,
      `role_game_moderators?user_id=eq.${encodedUserId}&select=game_id`, { method: 'GET' })
  ]);

  // Collect per-game assignments
  const verifierGameIds = (verifierResult.ok && Array.isArray(verifierResult.data))
    ? verifierResult.data.map(r => r.game_id).filter(Boolean) : [];
  const moderatorGameIds = (moderatorResult.ok && Array.isArray(moderatorResult.data))
    ? moderatorResult.data.map(r => r.game_id).filter(Boolean) : [];
  const assignedGames = [...new Set([...verifierGameIds, ...moderatorGameIds])];

  // Build role flags from profile
  let isAdminFlag = false;
  let isSuperAdmin = false;
  let isModerator = false;
  let runnerId = null;

  if (profile.ok && Array.isArray(profile.data) && profile.data.length > 0) {
    const p = profile.data[0];
    isSuperAdmin = p.is_super_admin === true;
    isAdminFlag = p.is_admin === true || isSuperAdmin;
    isModerator = p.role === 'moderator';
    runnerId = p.runner_id;
  }

  const hasVerifierRole = verifierGameIds.length > 0;
  const hasModeratorRole = moderatorGameIds.length > 0 || isModerator;

  return {
    admin: isAdminFlag,
    superAdmin: isSuperAdmin,
    moderator: hasModeratorRole,
    verifier: hasVerifierRole,
    runnerId,
    assignedGames
  };
}
