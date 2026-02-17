import { getGame, getRunsForGame, getGames, getAllCategories } from '$lib/server/data';
import { error } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ params }) => {
	const game = getGame(params.game_id);

	if (!game) {
		throw error(404, 'Game not found');
	}

	const runs = getRunsForGame(params.game_id);
	const allGames = getGames();
	const categories = getAllCategories(game);

	// Find modded versions of this game
	const moddedVersions = allGames.filter(
		(g) => g.base_game === game.game_id && g.is_modded
	);

	// Find base game if this is modded
	const baseGame = game.is_modded && game.base_game
		? allGames.find((g) => g.game_id === game.base_game)
		: null;

	return {
		game,
		runs,
		categories,
		moddedVersions,
		baseGame
	};
};
