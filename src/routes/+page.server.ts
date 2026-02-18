// =============================================================================
// Homepage Server Load
// =============================================================================

import { getActiveGames, getRecentRuns, getTeams, getCounts } from '$lib/server/supabase';
import { getPosts } from '$lib/server/data';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const [games, recentRuns, teams, stats, posts] = await Promise.all([
		getActiveGames(locals.supabase),
		getRecentRuns(locals.supabase, 10),
		getTeams(locals.supabase),
		getCounts(locals.supabase),
		Promise.resolve(getPosts())
	]);

	return {
		games,
		recentRuns,
		posts: posts.slice(0, 5),
		teams: teams.slice(0, 4),
		stats: {
			...stats,
			postCount: posts.length
		}
	};
};
