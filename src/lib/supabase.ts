// =============================================================================
// Browser-Side Supabase Client
// =============================================================================
// Used in Svelte components for:
// - OAuth sign-in flows (signInWithOAuth, exchangeCodeForSession)
// - Real-time subscriptions (if added later)
// - Client-side auth state changes
//
// Session persistence is handled by httpOnly cookies (set via /auth/callback
// server endpoint, read by hooks.server.ts). The client Supabase instance
// does NOT persist sessions to localStorage — cookies are the single
// source of truth for auth state.
//
// NOTE: This uses the PUBLIC anon key which is safe to expose.
// Row Level Security in Supabase controls what data users can access.
// =============================================================================

import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';

export const supabase = createClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
	auth: {
		flowType: 'pkce',
		// Session is managed via httpOnly cookies, not localStorage.
		// The client still needs detectSessionInUrl for the OAuth callback flow.
		persistSession: false,
		detectSessionInUrl: true,
		autoRefreshToken: false
	}
});

/**
 * Sign out: clear the Supabase client session, clear server-side
 * httpOnly cookies, and reset the auth store.
 */
export async function signOut(): Promise<void> {
	// Clear client-side Supabase session
	await supabase.auth.signOut();

	// Clear server-side httpOnly cookies
	await fetch('/auth/signout', { method: 'POST' });

	// Force a full page reload to reset all state cleanly
	window.location.href = '/';
}
