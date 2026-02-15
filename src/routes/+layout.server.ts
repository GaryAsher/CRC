// =============================================================================
// Root Layout Server Load
// =============================================================================
// Runs on every page. Passes the session to the client so components
// can show/hide auth-dependent UI without additional server calls.
// =============================================================================

import type { LayoutServerLoad } from './$types';

// With adapter-cloudflare, pages are server-rendered by default.
// Add `export const prerender = true` to individual static pages
// (games, glossary, legal, etc.) if you want them pre-built at deploy time.
// For now, all pages are rendered on-demand by Cloudflare Workers — which is fine.

export const load: LayoutServerLoad = async ({ locals }) => {
	return {
		session: locals?.session ?? null
	};
};
