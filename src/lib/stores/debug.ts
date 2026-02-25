// =============================================================================
// Debug Role Store
// =============================================================================
// Shared reactive store for debug mode role simulation.
// Reads/writes sessionStorage('crc_debug_role').
//
// Usage:
//   import { debugRole, setDebugRole, exitDebugMode, initDebugStore } from '$stores/debug';
//   // Read:  $debugRole          (reactive via Svelte store subscription)
//   // Write: setDebugRole('admin')
//   // Clear: exitDebugMode()
//   // Init:  initDebugStore()    (call once in onMount)
// =============================================================================

import { writable } from 'svelte/store';
import { browser } from '$app/environment';

const STORAGE_KEY = 'crc_debug_role';

/** All valid debug role IDs */
export type DebugRoleId = 'super_admin' | 'admin' | 'moderator' | 'verifier' | 'user' | 'non_user';

/** The current debug role (null = debug mode off) */
export const debugRole = writable<DebugRoleId | null>(null);

/** Set the debug role (activates debug mode) */
export function setDebugRole(role: DebugRoleId) {
	debugRole.set(role);
	if (browser) sessionStorage.setItem(STORAGE_KEY, role);
}

/** Exit debug mode */
export function exitDebugMode() {
	debugRole.set(null);
	if (browser) sessionStorage.removeItem(STORAGE_KEY);
}

/** Initialize from sessionStorage — call once in onMount of root layout or DebugBar */
export function initDebugStore() {
	if (!browser) return;
	const stored = sessionStorage.getItem(STORAGE_KEY) as DebugRoleId | null;
	if (stored) debugRole.set(stored);
}

/**
 * Sync from sessionStorage (for detecting changes from other code paths).
 * Call from a polling interval or storage event listener.
 */
export function syncDebugStore() {
	if (!browser) return;
	const stored = sessionStorage.getItem(STORAGE_KEY) as DebugRoleId | null;
	debugRole.set(stored);
}
