import { getActiveGames, getRunCountForGame } from '$lib/server/supabase';
import { getPlatforms, getGenres, getChallenges } from '$lib/server/data';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const games = await getActiveGames(locals.supabase);

	const gamesWithCounts = await Promise.all(
		games.map(async (g) => ({
			...g,
			runCount: await getRunCountForGame(locals.supabase, g.game_id)
		}))
	);

	// Load filter options from YAML configs (already in data.ts)
	const platformsRaw = getPlatforms();
	const genresRaw = getGenres();
	const challengesRaw = getChallenges();

	// Transform YAML → TagItem[] for TagPicker
	const platforms = Object.entries(platformsRaw)
		.map(([id, val]) => ({
			id,
			label: val.label || id,
			aliases: (val as any).aliases || []
		}))
		.sort((a, b) => a.label.localeCompare(b.label));

	const genres = Object.entries(genresRaw)
		.map(([id, val]) => ({
			id,
			label: val.label || id,
			aliases: (val as any).aliases || []
		}))
		.sort((a, b) => a.label.localeCompare(b.label));

	const challenges = Object.entries(challengesRaw)
		.map(([id, val]) => ({
			id,
			label: val.label || id,
			aliases: (val as any).aliases || []
		}))
		.sort((a, b) => a.label.localeCompare(b.label));

	return {
		games: gamesWithCounts,
		platforms,
		genres,
		challenges
	};
};
