import { getActiveGames, getRunsForGame } from '$lib/server/data';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const games = getActiveGames();

	const gamesWithCounts = games.map((g) => ({
		...g,
		runCount: getRunsForGame(g.game_id).length
	}));

	return { games: gamesWithCounts };
};
