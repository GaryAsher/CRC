// =============================================================================
// Runner Per-Game Redirect
// =============================================================================
// The Jekyll site had /runners/{runner_id}/runs/{game_id}/ pages.
// Redirect these to the runner profile with a game query parameter,
// which the runner page reads to auto-select the game filter.
// =============================================================================

import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	throw redirect(301, `/runners/${params.runner_id}?game=${params.game_id}`);
};
