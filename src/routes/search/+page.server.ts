import { getActiveGames, getRunners } from '$lib/server/supabase';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const [rawGames, rawRunners] = await Promise.all([
		getActiveGames(locals.supabase),
		getRunners(locals.supabase)
	]);

	const games = rawGames.map((g) => ({
		type: 'game' as const,
		id: g.game_id,
		name: g.game_name,
		aliases: g.game_name_aliases || [],
		genres: g.genres || [],
		url: `/games/${g.game_id}`
	}));

	const runners = rawRunners
		.filter((r) => r.status !== 'test' && !r.hidden)
		.map((r) => ({
			type: 'runner' as const,
			id: r.runner_id,
			name: r.display_name || r.name || r.runner_id,
			url: `/runners/${r.runner_id}`
		}));

	return { games, runners };
};
