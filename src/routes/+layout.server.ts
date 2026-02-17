// =============================================================================
// Root Layout Server Load
// =============================================================================
// Runs on every server-side request. Passes the session to the client so
// components can show/hide auth-dependent UI without additional server calls.
//
// NOTE: prerender is NOT set here. This means:
//   - Dynamic pages (games, runners, teams) are rendered on each request (SSR)
//   - Static pages (legal, glossary, rules) opt in with their own prerender = true
//   - Auth session is always fresh on every page load
// =============================================================================

import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
	return {
		session: locals?.session ?? null
	};
};
