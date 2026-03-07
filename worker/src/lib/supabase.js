// ═══════════════════════════════════════════════════════════════════════════════
// SUPABASE HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

/** Service-role query helper */
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

/** Write a game_history entry (best-effort, never throws) */
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
