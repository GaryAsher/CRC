// =============================================================================
// Auth Store (Svelte 5)
// =============================================================================
// Server-side session (from httpOnly cookies via hooks.server.ts) is the
// canonical auth source. The client store is hydrated from the server data
// passed through +layout.server.ts, and updated on client-side auth events
// (sign-in, sign-out, token refresh).
// =============================================================================

import { writable, derived } from 'svelte/store';
import type { Session, User } from '@supabase/supabase-js';

export const session = writable<Session | null>(null);
export const user = derived(session, ($s) => $s?.user ?? null);
export const isLoading = writable(true);

/**
 * Hydrate from server-side session. Called once from root layout
 * with the session data from +layout.server.ts.
 */
export function hydrateSession(serverSession: Session | null) {
	session.set(serverSession);
	isLoading.set(false);
}

/**
 * Subscribe to client-side auth changes (sign-in, sign-out, token refresh).
 * Called once from root layout. Returns unsubscribe function.
 */
export function listenForAuthChanges(supabaseClient: { auth: { onAuthStateChange: Function } }) {
	const { data: { subscription } } = supabaseClient.auth.onAuthStateChange(
		(_event: string, newSession: Session | null) => {
			session.set(newSession);
			isLoading.set(false);
		}
	);
	return () => subscription.unsubscribe();
}
