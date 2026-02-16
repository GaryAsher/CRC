import { getActiveGames, getRunners, getRuns } from '$lib/server/data';
import type { PageServerLoad } from './$types';

export const prerender = true;

export const load: PageServerLoad = async () => {
	const games = getActiveGames().map((g) => ({
		type: 'game' as const,
		id: g.game_id,
		name: g.game_name,
		aliases: g.game_name_aliases || [],
		genres: g.genres || [],
		url: `/games/${g.game_id}`
	}));

	const runners = getRunners()
		.filter((r) => r.status !== 'test' && !r.hidden)
		.map((r) => ({
			type: 'runner' as const,
			id: r.runner_id,
			name: r.display_name || r.name || r.runner_id,
			url: `/runners/${r.runner_id}`
		}));

	return { games, runners };
};
