import { getGames, getGameHistory } from '$lib/server/data';
import type { PageServerLoad, EntryGenerator } from './$types';

export const prerender = true;

export const entries: EntryGenerator = () => {
	return getGames()
		.filter((g) => !g.game_id.startsWith('_'))
		.map((g) => ({ game_id: g.game_id }));
};

export const load: PageServerLoad = async ({ params }) => {
	const history = getGameHistory(params.game_id);
	return { history };
};
