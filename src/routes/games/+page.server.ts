import { getActiveGames, getRunsForGame, getPlatforms, getGenres, getChallenges } from '$lib/server/data';
import type { PageServerLoad } from './$types';

export const prerender = true;

export const load: PageServerLoad = async () => {
	const games = getActiveGames();

	const gamesWithCounts = games.map((g) => ({
		...g,
		runCount: getRunsForGame(g.game_id).length
	}));

	// Load filter data from config YAML files
	const rawPlatforms = getPlatforms() as Record<string, { label: string; aliases?: string[] }> || {};
	const rawGenres = getGenres() as Record<string, { label: string }> || {};
	const rawChallenges = getChallenges() as Record<string, { label: string; aliases?: string[] }> || {};

	const platforms = Object.entries(rawPlatforms)
		.map(([id, v]) => ({ id, label: v.label || id, aliases: v.aliases || [] }))
		.sort((a, b) => a.label.localeCompare(b.label));

	const genres = Object.entries(rawGenres)
		.map(([id, v]) => ({ id, label: v.label || id }))
		.sort((a, b) => a.label.localeCompare(b.label));

	const challenges = Object.entries(rawChallenges)
		.map(([id, v]) => ({ id, label: v.label || id, aliases: v.aliases || [] }))
		.sort((a, b) => a.label.localeCompare(b.label));

	return { games: gamesWithCounts, platforms, genres, challenges };
};
