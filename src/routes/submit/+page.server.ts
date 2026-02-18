import { getActiveGames, getRunners } from '$lib/server/supabase';
import { getAllCategories } from '$lib/server/data';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const [rawGames, rawRunners] = await Promise.all([
		getActiveGames(locals.supabase),
		getRunners(locals.supabase)
	]);

	const games = rawGames.map((g) => ({
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

	const runners = rawRunners
		.filter((r) => r.status !== 'test' && !r.hidden)
		.map((r) => ({
			runner_id: r.runner_id,
			name: r.display_name || r.name || r.runner_id
		}));

	return { games, runners };
};
