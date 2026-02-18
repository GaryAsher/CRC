// =============================================================================
// Sign-Out Server Endpoint
// =============================================================================
// Clears the httpOnly auth cookies. Called by the client-side sign-out
// flow after supabase.auth.signOut() completes.
// =============================================================================

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ cookies }) => {
	cookies.delete('sb-access-token', { path: '/' });
	cookies.delete('sb-refresh-token', { path: '/' });

	return json({ ok: true });
};
