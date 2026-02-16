import { getGames } from '$lib/server/data';
import type { EntryGenerator } from './$types';

export const prerender = true;

export const entries: EntryGenerator = () => {
	return getGames()
		.filter((g) => !g.game_id.startsWith('_'))
		.map((g) => ({ game_id: g.game_id }));
};
