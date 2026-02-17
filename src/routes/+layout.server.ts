// =============================================================================
// Root Layout Server Load
// =============================================================================
// Runs on every page. Passes the session to the client so components
// can show/hide auth-dependent UI without additional server calls.
// =============================================================================

import type { LayoutServerLoad } from './$types';

export const prerender = true;

export const load: LayoutServerLoad = async ({ locals }) => {
	return {
		session: locals?.session ?? null
	};
};
