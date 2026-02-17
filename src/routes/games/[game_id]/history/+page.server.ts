import { getGames, getHistory } from '$lib/server/data';
import type { EntryGenerator, PageServerLoad } from './$types';

export const entries: EntryGenerator = () => {
	return getGames()
		.filter((g) => !g.game_id.startsWith('_'))
		.map((g) => ({ game_id: g.game_id }));
};

export const load: PageServerLoad = ({ params }) => {
	const history = getHistory(params.game_id);
	return { history };
};
