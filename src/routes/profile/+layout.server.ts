// =============================================================================
// Profile Layout Server Guard
// =============================================================================
// All profile pages require authentication. Redirect to sign-in if
// no server-side session exists.
// =============================================================================

import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const prerender = false;

export const load: LayoutServerLoad = async ({ locals, url }) => {
	// Profile create is a special case — allow it if the user
	// has a session but no profile yet
	if (!locals.session) {
		throw redirect(302, `/sign-in?redirect=${encodeURIComponent(url.pathname)}`);
	}

	return {
		session: locals.session
	};
};
