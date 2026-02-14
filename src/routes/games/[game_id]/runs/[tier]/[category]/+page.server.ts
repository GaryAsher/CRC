import { getGame, getGames, findCategory, getRunsForCategory, getAllCategories } from '$lib/server/data';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export function entries() {
	const entries: { game_id: string; tier: string; category: string }[] = [];
	for (const game of getGames().filter((g) => !g.game_id.startsWith('_'))) {
		for (const cat of getAllCategories(game)) {
			entries.push({ game_id: game.game_id, tier: cat.tier, category: cat.slug });
		}
	}
	return entries;
}

export const load: PageServerLoad = async ({ params }) => {
	const game = getGame(params.game_id);
	if (!game) throw error(404, 'Game not found');

	const category = findCategory(game, params.tier, params.category);
	if (!category) throw error(404, 'Category not found');

	const runs = getRunsForCategory(params.game_id, params.category);

	return { category, runs, tier: params.tier };
};
