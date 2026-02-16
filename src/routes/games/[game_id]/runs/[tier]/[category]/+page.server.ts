import { getGame, getGames, findCategory, getRunsForCategory, getAllCategories } from '$lib/server/data';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const prerender = true;

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

	// Build sibling categories for pill navigation
	let siblingCategories: { slug: string; label: string }[] = [];
	if (params.tier === 'full-runs') {
		siblingCategories = (game.full_runs || []).map((c) => ({ slug: c.slug, label: c.label }));
	} else if (params.tier === 'mini-challenges') {
		// For mini-challenges, show the top-level groups as pills
		siblingCategories = (game.mini_challenges || []).map((g) => ({ slug: g.slug, label: g.label }));
	} else if (params.tier === 'player-made') {
		siblingCategories = (game.player_made || []).map((c) => ({ slug: c.slug, label: c.label }));
	}

	// Build subcategory pills (children of the current group for mini-challenges)
	let subcategories: { slug: string; label: string }[] = [];
	if (params.tier === 'mini-challenges') {
		const parentSlug = category.parentGroup || params.category;
		const group = (game.mini_challenges || []).find((g) => g.slug === parentSlug);
		if (group?.children?.length) {
			subcategories = group.children.map((c) => ({ slug: c.slug, label: c.label }));
		}
	}

	// Pass filter metadata from the game so the client can build advanced filters
	const filterMeta = {
		challenges: (game.challenges_data || []).map((c) => ({ id: c.slug, label: c.label })),
		restrictions: (game.restrictions_data || []).map((r) => ({ id: r.slug, label: r.label })),
		characters: (game.characters_data || []).map((c) => ({ id: c.slug, label: c.label })),
		glitches: (game.glitches_data || []).map((g) => ({ id: g.slug, label: g.label })),
		showCharacter: !!game.character_column?.enabled,
		characterLabel: game.character_column?.label || 'Character',
		showGlitches: (game.glitches_data?.length || 0) > 0,
		timingMethod: game.timing_method || ''
	};

	return {
		category,
		runs,
		tier: params.tier,
		siblingCategories,
		subcategories,
		parentSlug: category.parentGroup || null,
		filterMeta
	};
};
