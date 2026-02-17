import {
	getRunner,
	getRunners,
	getRunsForRunner,
	getAchievementsForRunner,
	getGames,
	getTeams
} from '$lib/server/data';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export function entries() {
	return getRunners()
		.filter((r) => !r.runner_id.startsWith('_'))
		.map((r) => ({ runner_id: r.runner_id }));
}

export const load: PageServerLoad = async ({ params }) => {
	const runner = getRunner(params.runner_id);
	if (!runner) throw error(404, 'Runner not found');

	const runs = getRunsForRunner(params.runner_id);
	const achievements = getAchievementsForRunner(params.runner_id);
	const allGames = getGames();
	const allTeams = getTeams();

	// Group runs by game
	const gameMap = new Map<string, { game: typeof allGames[0]; runs: typeof runs }>();
	for (const run of runs) {
		if (!gameMap.has(run.game_id)) {
			const game = allGames.find((g) => g.game_id === run.game_id);
			if (game) gameMap.set(run.game_id, { game, runs: [] });
		}
		gameMap.get(run.game_id)?.runs.push(run);
	}

	// Find teams this runner belongs to
	const runnerTeams = allTeams.filter(
		(t) => t.members?.some((m) => m.runner_id === params.runner_id)
	);

	// Compute stats
	const mostPlayedEntry = Array.from(gameMap.entries()).sort(
		(a, b) => b[1].runs.length - a[1].runs.length
	)[0];

	// Collect unique genres from runner's games
	const genreSet = new Set<string>();
	for (const { game } of gameMap.values()) {
		game.genres?.forEach((g) => genreSet.add(g));
	}

	// Build activity timeline (last 20 events)
	type TimelineItem = { date: string; type: 'run' | 'achievement'; gameId: string; detail: string; extra?: string };
	const timeline: TimelineItem[] = [];
	for (const run of runs) {
		timeline.push({
			date: String(run.date_completed),
			type: 'run',
			gameId: run.game_id,
			detail: run.category || run.category_slug,
			extra: run.time_primary
		});
	}
	for (const ach of achievements) {
		if (ach.status === 'approved') {
			timeline.push({
				date: String(ach.date_completed),
				type: 'achievement',
				gameId: ach.game_id,
				detail: ach.achievement_slug
			});
		}
	}
	timeline.sort((a, b) => b.date.localeCompare(a.date));

	// Verified runs count
	const verifiedByRunner = allGames.length > 0 ? 0 : 0; // Would need all runs data

	return {
		runner,
		runs,
		achievements: achievements.filter((a) => a.status === 'approved'),
		gameGroups: Array.from(gameMap.values()),
		teams: runnerTeams,
		stats: {
			totalRuns: runs.length,
			totalGames: gameMap.size,
			totalAchievements: achievements.filter((a) => a.status === 'approved').length,
			mostPlayed: mostPlayedEntry
				? { name: mostPlayedEntry[1].game.game_name, id: mostPlayedEntry[1].game.game_id, count: mostPlayedEntry[1].runs.length }
				: null,
			topGenres: Array.from(genreSet).slice(0, 3)
		},
		timeline: timeline.slice(0, 20),
		allGames
	};
};
