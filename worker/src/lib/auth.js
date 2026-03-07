// ═══════════════════════════════════════════════════════════════════════════════
// AUTH MIDDLEWARE
// ═══════════════════════════════════════════════════════════════════════════════

import { verifySupabaseToken, isAdmin } from './supabase.js';

/** Extract Bearer token from Authorization header */
export function extractBearerToken(request) {
  const auth = request?.headers?.get('Authorization') || '';
  if (auth.startsWith('Bearer ')) return auth.slice(7);
  return null;
}

/** Authenticate an admin/staff user — requires verifier+ role */
export async function authenticateAdmin(env, body, request) {
  const token = extractBearerToken(request) || body.token;
  if (!token) return { error: 'Missing token', status: 401 };

  const user = await verifySupabaseToken(env, token);
  if (!user?.id) return { error: 'Invalid or expired token', status: 401 };

  const role = await isAdmin(env, user.id);
  if (!role.admin && !role.verifier && !role.moderator) {
    return { error: 'Insufficient permissions', status: 403 };
  }

  return { user, role };
}

/** Authenticate any signed-in user (no role required) */
export async function authenticateUser(env, body, request) {
  const token = extractBearerToken(request) || body.token;
  if (!token) return { error: 'Missing token', status: 401 };

  const user = await verifySupabaseToken(env, token);
  if (!user?.id) return { error: 'Invalid or expired token', status: 401 };

  return { user };
}
