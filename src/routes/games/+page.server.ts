import { getActiveGames, getRunCountForGame } from '$lib/server/supabase';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const games = await getActiveGames(locals.supabase);

	const gamesWithCounts = await Promise.all(
		games.map(async (g) => ({
			...g,
			runCount: await getRunCountForGame(locals.supabase, g.game_id)
		}))
	);

	return { games: gamesWithCounts };
};
