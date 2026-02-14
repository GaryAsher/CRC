import {
	getRunner,
	getRunners,
	getRunsForRunner,
	getAchievementsForRunner,
	getGames
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

	// Group runs by game
	const gameMap = new Map<string, { game: typeof allGames[0]; runs: typeof runs }>();
	for (const run of runs) {
		if (!gameMap.has(run.game_id)) {
			const game = allGames.find((g) => g.game_id === run.game_id);
			if (game) gameMap.set(run.game_id, { game, runs: [] });
		}
		gameMap.get(run.game_id)?.runs.push(run);
	}

	return {
		runner,
		runs,
		achievements,
		gameGroups: Array.from(gameMap.values())
	};
};
