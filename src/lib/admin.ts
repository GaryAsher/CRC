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
 * Returns { admin, verifier, runnerId } or null if not authenticated.
 */
export async function checkAdminRole(): Promise<{
	admin: boolean;
	verifier: boolean;
	runnerId: string | null;
} | null> {
	const { data: { session } } = await supabase.auth.getSession();
	if (!session) return null;

	const userId = session.user.id;

	// Query profiles for admin status
	const res = await fetch(
		`${PUBLIC_SUPABASE_URL}/rest/v1/profiles?user_id=eq.${userId}&select=is_admin,is_super_admin,runner_id`,
		{
			headers: {
				'apikey': PUBLIC_SUPABASE_ANON_KEY,
				'Authorization': `Bearer ${session.access_token}`
			}
		}
	);

	if (res.ok) {
		const data = await res.json();
		if (data.length > 0) {
			const isAdmin = data[0].is_admin === true || data[0].is_super_admin === true;
			return {
				admin: isAdmin,
				verifier: false,
				runnerId: data[0].runner_id
			};
		}
	}

	// Check if user is a game verifier (from role_game_verifiers)
	const vRes = await fetch(
		`${PUBLIC_SUPABASE_URL}/rest/v1/role_game_verifiers?user_id=eq.${userId}&select=game_id&limit=1`,
		{
			headers: {
				'apikey': PUBLIC_SUPABASE_ANON_KEY,
				'Authorization': `Bearer ${session.access_token}`
			}
		}
	);

	if (vRes.ok) {
		const vData = await vRes.json();
		if (vData.length > 0) {
			return { admin: false, verifier: true, runnerId: null };
		}
	}

	return { admin: false, verifier: false, runnerId: null };
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
