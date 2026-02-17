import { getActiveGames, getRunners, getAllCategories } from '$lib/server/data';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const games = getActiveGames().map((g) => ({
		game_id: g.game_id,
		game_name: g.game_name,
		characters_data: g.characters_data || [],
		categories: getAllCategories(g).map((c) => ({
			slug: c.slug,
			label: c.label,
			tier: c.tier,
			parentGroupLabel: c.parentGroupLabel || null
		}))
	}));

	const runners = getRunners()
		.filter((r) => r.status !== 'test' && !r.hidden)
		.map((r) => ({
			runner_id: r.runner_id,
			name: r.display_name || r.name || r.runner_id
		}));

	return { games, runners };
};
