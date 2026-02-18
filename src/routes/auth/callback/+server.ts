// =============================================================================
// Auth Callback Server Endpoint
// =============================================================================
// Receives tokens from the client-side OAuth exchange and sets them as
// httpOnly cookies. This bridges the gap between the client-side Supabase
// SDK (which handles the OAuth code exchange) and the server-side session
// management in hooks.server.ts.
// =============================================================================

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, cookies }) => {
	try {
		const { access_token, refresh_token } = await request.json();

		if (!access_token || !refresh_token) {
			return json({ ok: false, error: 'Missing tokens' }, { status: 400 });
		}

		cookies.set('sb-access-token', access_token, {
			path: '/',
			httpOnly: true,
			secure: true,
			sameSite: 'lax',
			maxAge: 60 * 60 // 1 hour
		});

		cookies.set('sb-refresh-token', refresh_token, {
			path: '/',
			httpOnly: true,
			secure: true,
			sameSite: 'lax',
			maxAge: 60 * 60 * 24 * 30 // 30 days
		});

		return json({ ok: true });
	} catch {
		return json({ ok: false, error: 'Invalid request' }, { status: 400 });
	}
};
