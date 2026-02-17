import { getGenres, getPlatforms, getChallenges, getActiveGames } from '$lib/server/data';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const genresRaw = getGenres() as Record<string, { label: string }>;
	const platformsRaw = getPlatforms() as Record<string, { label: string; aliases?: string[] }>;
	const challengesRaw = getChallenges() as Record<string, { label: string; description?: string }>;

	const genres = Object.entries(genresRaw).map(([id, v]) => ({ id, label: v.label }));
	const challenges = Object.entries(challengesRaw).map(([id, v]) => ({ id, label: v.label }));

	// Categorize platforms
	const platforms = Object.entries(platformsRaw).map(([id, v]) => {
		let cat = 'console';
		if (id.startsWith('pc-') || id === 'pc') cat = 'pc';
		else if (['ios', 'android'].includes(id)) cat = 'mobile';
		else if (
			id.includes('game-boy') || id.includes('-ds') || id.includes('3ds') ||
			id.includes('psp') || id.includes('vita') || id.includes('lynx') ||
			id.includes('game-gear') || id.includes('steam-deck') ||
			id.includes('neo-geo-pocket') || id.includes('wonderswan') ||
			id.includes('n-gage') || id.includes('nomad')
		) cat = 'handheld';
		return { id, label: v.label, cat };
	});

	// Games list for "base game" dropdown (modded games)
	const baseGames = getActiveGames()
		.filter((g) => !g.is_modded)
		.map((g) => ({ id: g.game_id, name: g.game_name }));

	return { genres, platforms, challenges, baseGames };
};
