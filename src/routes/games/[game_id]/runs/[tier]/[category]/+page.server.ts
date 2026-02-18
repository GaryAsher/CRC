import { getGame, getRunsForCategory } from '$lib/server/supabase';
import { findCategory } from '$lib/server/data';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
	const game = await getGame(locals.supabase, params.game_id);
	if (!game) throw error(404, 'Game not found');

	const category = findCategory(game, params.tier, params.category);
	if (!category) throw error(404, 'Category not found');

	const runs = await getRunsForCategory(locals.supabase, params.game_id, params.category);

	return { category, runs, tier: params.tier };
};
