// =============================================================================
// Homepage Server Load
// =============================================================================
// Loads summary data for the homepage. This is the first real test of the
// data pipeline — if this works, the whole foundation is solid.
// =============================================================================

import {
	getActiveGames,
	getRunners,
	getRuns,
	getAchievements,
	getTeams,
	getPosts
} from '$lib/server/data';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const games = getActiveGames();
	const runners = getRunners();
	const runs = getRuns();
	const achievements = getAchievements();
	const teams = getTeams();
	const posts = getPosts();

	// Recent approved runs (newest first, limit 10)
	const recentRuns = runs
		.filter((r) => r.status === 'approved')
		.sort((a, b) => {
			const dateA = a.date_submitted instanceof Date ? a.date_submitted : new Date(a.date_submitted);
			const dateB = b.date_submitted instanceof Date ? b.date_submitted : new Date(b.date_submitted);
			return dateB.getTime() - dateA.getTime();
		})
		.slice(0, 10);

	return {
		games,
		runners,
		recentRuns,
		posts: posts.slice(0, 5),
		stats: {
			gameCount: games.length,
			runnerCount: runners.length,
			runCount: runs.filter((r) => r.status === 'approved').length,
			achievementCount: achievements.filter((a) => a.status === 'approved').length,
			teamCount: teams.length,
			postCount: posts.length
		}
	};
};
