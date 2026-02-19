// =============================================================================
// Server Hooks
// =============================================================================
// Runs on every server-side request. Sets up the Supabase client and
// extracts the user session from cookies.
//
// This replaces the scattered auth checks in assets/js/auth.js with
// a single centralized server-side auth flow.
// =============================================================================

import type { Handle } from '@sveltejs/kit';
import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';

export const handle: Handle = async ({ event, resolve }) => {
	// ── Redirect safety net ──────────────────────────────────────────────
	// If Supabase sends the OAuth code to the homepage (Site URL fallback)
	// instead of /auth/callback, redirect so the callback page can handle it.
	const url = event.url;
	if (url.pathname === '/' && url.searchParams.has('code') && !event.locals.session) {
		const callbackUrl = new URL('/auth/callback', url.origin);
		callbackUrl.searchParams.set('code', url.searchParams.get('code')!);
		return new Response(null, {
			status: 302,
			headers: { Location: callbackUrl.toString() }
		});
	}
	// Create a Supabase client for this request
	event.locals.supabase = createClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
		auth: {
			flowType: 'pkce',
			autoRefreshToken: false,
			detectSessionInUrl: false,
			persistSession: false
		}
	});

	// Try to restore session from cookies
	const accessToken = event.cookies.get('sb-access-token');
	const refreshToken = event.cookies.get('sb-refresh-token');

	if (accessToken && refreshToken) {
		const { data } = await event.locals.supabase.auth.setSession({
			access_token: accessToken,
			refresh_token: refreshToken
		});
		event.locals.session = data.session;

		// If the token was refreshed, update cookies
		if (data.session && data.session.access_token !== accessToken) {
			event.cookies.set('sb-access-token', data.session.access_token, {
				path: '/',
				httpOnly: true,
				secure: true,
				sameSite: 'lax',
				maxAge: 60 * 60 // 1 hour
			});
			event.cookies.set('sb-refresh-token', data.session.refresh_token, {
				path: '/',
				httpOnly: true,
				secure: true,
				sameSite: 'lax',
				maxAge: 60 * 60 * 24 * 30 // 30 days
			});
		}
	} else {
		event.locals.session = null;
	}

	return resolve(event);
};
