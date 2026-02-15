import {
	getActiveGames,
	getRunners,
	getRuns,
	getAchievements,
	getTeams,
	getPosts,
	getGames,
	getRunner
} from '$lib/server/data';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const games = getActiveGames();
	const runners = getRunners();
	const runs = getRuns();
	const achievements = getAchievements();
	const teams = getTeams();
	const posts = getPosts();
	const allGames = getGames();

	// Recent approved runs (newest first, limit 8) with game names
	const recentRuns = runs
		.filter((r) => r.status === 'approved')
		.sort((a, b) => {
			const dateA = a.date_submitted instanceof Date ? a.date_submitted : new Date(a.date_submitted);
			const dateB = b.date_submitted instanceof Date ? b.date_submitted : new Date(b.date_submitted);
			return dateB.getTime() - dateA.getTime();
		})
		.slice(0, 8)
		.map((run) => {
			const game = allGames.find((g) => g.game_id === run.game_id);
			const runner = getRunner(run.runner_id);
			return {
				...run,
				game_name: game?.game_name || run.game_id,
				runner_name: runner?.runner_name || run.runner || run.runner_id
			};
		});

	// Featured posts (featured first, then newest)
	const sortedPosts = [...posts].sort((a, b) => {
		if (a.featured && !b.featured) return -1;
		if (!a.featured && b.featured) return 1;
		return new Date(b.date).getTime() - new Date(a.date).getTime();
	});

	// Featured teams (limit 6)
	const featuredTeams = teams.slice(0, 6).map((t) => ({
		team_id: t.team_id,
		name: t.name,
		logo: t.logo,
		tagline: t.tagline,
		memberCount: t.members?.length || 0
	}));

	// Games with covers for the grid (limit 8)
	const featuredGames = games
		.filter((g) => g.cover)
		.slice(0, 8)
		.map((g) => ({
			game_id: g.game_id,
			game_name: g.game_name,
			cover: g.cover,
			cover_position: g.cover_position || 'center'
		}));

	return {
		games,
		recentRuns,
		posts: sortedPosts.slice(0, 5),
		featuredTeams,
		featuredGames,
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
