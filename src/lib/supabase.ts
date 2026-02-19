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

/**
 * Custom storage adapter for the Supabase auth client.
 *
 * Why this exists: We use PKCE flow + httpOnly cookies for session management.
 * The PKCE flow generates a one-time code verifier before the OAuth redirect
 * that must survive the page navigation (browser → Discord → back to site).
 * With `persistSession: false` and no custom storage, Supabase stores the
 * code verifier in memory — which is wiped when the browser navigates away.
 *
 * This adapter stores ONLY the PKCE code verifier in localStorage. It is a
 * short-lived, one-time-use value (not a secret). Session tokens are still
 * managed exclusively via httpOnly cookies set by /auth/callback (POST).
 */
const authStorage = {
	getItem: (key: string): string | null => {
		if (typeof window === 'undefined') return null;
		return localStorage.getItem(key);
	},
	setItem: (key: string, value: string): void => {
		if (typeof window === 'undefined') return;
		localStorage.setItem(key, value);
	},
	removeItem: (key: string): void => {
		if (typeof window === 'undefined') return;
		localStorage.removeItem(key);
	}
};

export const supabase = createClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
	auth: {
		flowType: 'pkce',
		// Session is managed via httpOnly cookies, not localStorage.
		// persistSession: false tells Supabase not to auto-restore sessions
		// from storage. We still provide a storage adapter so the PKCE code
		// verifier persists across the OAuth redirect.
		persistSession: false,
		detectSessionInUrl: true,
		autoRefreshToken: false,
		storage: authStorage
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
