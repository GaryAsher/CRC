// =============================================================================
// Staff Guides Server Load
// =============================================================================
// Loads staff guide content server-side. The admin layout guard already
// ensures the user has a valid session, so guide content is never sent
// to unauthenticated users.
// =============================================================================

import { getStaffGuides } from '$lib/server/data';
import type { PageServerLoad } from './$types';

export const prerender = false;

export const load: PageServerLoad = async () => {
	const guides = getStaffGuides();
	return { guides };
};
