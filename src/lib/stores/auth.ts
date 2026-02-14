// =============================================================================
// Auth Store
// =============================================================================
// Provides reactive auth state across all components.
// Replaces the scattered auth checks in assets/js/auth.js.
//
// Usage in components:
//   import { session, user } from '$stores/auth';
//   {#if $session} ... {/if}
// =============================================================================

import { writable } from 'svelte/store';
import type { Session, User } from '@supabase/supabase-js';

export const session = writable<Session | null>(null);
export const user = writable<User | null>(null);
export const isLoading = writable(true);

/**
 * Initialize auth listener. Called once from the root layout.
 * Subscribes to Supabase auth state changes and updates stores.
 */
export function initAuth(supabaseClient: typeof import('$lib/supabase').supabase) {
	// Get initial session
	supabaseClient.auth.getSession().then(({ data }) => {
		session.set(data.session);
		user.set(data.session?.user ?? null);
		isLoading.set(false);
	});

	// Listen for changes (sign in, sign out, token refresh)
	const {
		data: { subscription }
	} = supabaseClient.auth.onAuthStateChange((_event, newSession) => {
		session.set(newSession);
		user.set(newSession?.user ?? null);
		isLoading.set(false);
	});

	// Return unsubscribe function for cleanup
	return () => subscription.unsubscribe();
}
