import { getActiveGames } from '$lib/server/data';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const games = getActiveGames().map((g) => ({
		id: g.game_id,
		name: g.game_name
	}));

	return { games };
};
