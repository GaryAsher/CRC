// =============================================================================
// Browser-Side Supabase Client
// =============================================================================
// Uses @supabase/ssr to properly handle PKCE code verifiers via cookies.
// This replaces the raw @supabase/supabase-js client.
//
// How it works:
// - createBrowserClient stores the PKCE code verifier in a browser cookie
//   during signInWithOAuth. This cookie survives the redirect to Discord/
//   Twitch and back, so the server-side callback can find and use it.
// - Session tokens are also stored in cookies (managed by @supabase/ssr).
// - The server hook (hooks.server.ts) reads these cookies to restore the
//   session on every request.
//
// NOTE: This uses the PUBLIC anon key which is safe to expose.
// Row Level Security in Supabase controls what data users can access.
// =============================================================================

import { createBrowserClient } from '@supabase/ssr';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';

export const supabase = createBrowserClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
	auth: {
		flowType: 'pkce',
		// Server hook handles token refresh via getSession()
		autoRefreshToken: false,
		// Server callback handles the code exchange — don't try client-side
		detectSessionInUrl: false
	}
});

/**
 * Sign out: clear the Supabase client session, clear server-side
 * cookies via the signout endpoint, and reload the page.
 */
export async function signOut(): Promise<void> {
	await supabase.auth.signOut();
	await fetch('/auth/signout', { method: 'POST' });
	window.location.href = '/';
}
