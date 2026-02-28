import { supabase } from '$lib/supabase';
import { PUBLIC_WORKER_URL, PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';

/**
 * Get the current user's access token for API calls.
 */
export async function getAccessToken(): Promise<string | null> {
	const { data } = await supabase.auth.getSession();
	return data.session?.access_token ?? null;
}

/**
 * Check if the current user is an admin by querying profiles.
 * Returns role info including gameIds for per-game moderator access.
 */
export async function checkAdminRole(): Promise<{
	admin: boolean;
	superAdmin: boolean;
	moderator: boolean;
	verifier: boolean;
	runnerId: string | null;
	gameIds: string[];
} | null> {
	const { data: { session } } = await supabase.auth.getSession();
	if (!session) return null;

	const userId = session.user.id;

	// Query profiles for admin status
	const res = await fetch(
		`${PUBLIC_SUPABASE_URL}/rest/v1/profiles?user_id=eq.${userId}&select=is_admin,is_super_admin,runner_id,role`,
		{
			headers: {
				'apikey': PUBLIC_SUPABASE_ANON_KEY,
				'Authorization': `Bearer ${session.access_token}`
			}
		}
	);

	// Also load game assignments (used by moderators for per-game access)
	const gRes = await fetch(
		`${PUBLIC_SUPABASE_URL}/rest/v1/role_game_verifiers?user_id=eq.${userId}&select=game_id`,
		{
			headers: {
				'apikey': PUBLIC_SUPABASE_ANON_KEY,
				'Authorization': `Bearer ${session.access_token}`
			}
		}
	);
	const assignedGameIds: string[] = [];
	if (gRes.ok) {
		const gData = await gRes.json();
		for (const row of gData) if (row.game_id) assignedGameIds.push(row.game_id);
	}

	if (res.ok) {
		const data = await res.json();
		if (data.length > 0) {
			const p = data[0];
			const isSuperAdmin = p.is_super_admin === true;
			const isAdmin = p.is_admin === true || isSuperAdmin;
			const isModerator = !isAdmin && p.role === 'moderator';
			if (isAdmin || isModerator) {
				return {
					admin: isAdmin,
					superAdmin: isSuperAdmin,
					moderator: isModerator,
					verifier: false,
					runnerId: p.runner_id,
					gameIds: assignedGameIds
				};
			}
		}
	}

	// Check if user is a game verifier (from role_game_verifiers)
	if (assignedGameIds.length > 0) {
		return { admin: false, superAdmin: false, moderator: false, verifier: true, runnerId: null, gameIds: assignedGameIds };
	}

	return { admin: false, superAdmin: false, moderator: false, verifier: false, runnerId: null, gameIds: [] };
}

/**
 * Fetch pending items from Supabase.
 */
export async function fetchPending(table: string): Promise<any[]> {
	const token = await getAccessToken();
	if (!token) return [];

	const res = await fetch(
		`${PUBLIC_SUPABASE_URL}/rest/v1/${table}?status=eq.pending&order=submitted_at.desc&limit=100`,
		{
			headers: {
				'apikey': PUBLIC_SUPABASE_ANON_KEY,
				'Authorization': `Bearer ${token}`
			}
		}
	);

	if (res.ok) return res.json();
	return [];
}

/**
 * Call a Worker admin endpoint (approve/reject).
 */
export async function adminAction(
	endpoint: string,
	payload: Record<string, any>
): Promise<{ ok: boolean; message: string; data?: any }> {
	const token = await getAccessToken();
	if (!token) return { ok: false, message: 'Not authenticated' };

	try {
		const res = await fetch(`${PUBLIC_WORKER_URL}${endpoint}`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ ...payload, token })
		});

		const data = await res.json();
		if (res.ok && data.ok) {
			return { ok: true, message: data.message || 'Success', data };
		}
		return { ok: false, message: data.error || 'Action failed' };
	} catch (err: any) {
		return { ok: false, message: err?.message || 'Network error' };
	}
}
