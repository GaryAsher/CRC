// =============================================================================
// Admin Layout Server Guard
// =============================================================================
// Runs before ANY admin page renders. If the user doesn't have a valid
// server-side session, they get redirected to sign-in before any admin
// content is ever sent to the client.
//
// Individual admin pages can do additional role checks (admin vs verifier)
// client-side, but this ensures no admin markup leaks to anonymous users.
// =============================================================================

import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const prerender = false;

export const load: LayoutServerLoad = async ({ locals, url }) => {
	if (!locals.session) {
		throw redirect(302, `/sign-in?redirect=${encodeURIComponent(url.pathname)}`);
	}

	return {
		session: locals.session
	};
};
