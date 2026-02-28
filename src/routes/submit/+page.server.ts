import { getActiveGames, getRunners } from '$lib/server/supabase';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const [rawGames, rawRunners] = await Promise.all([
		getActiveGames(locals.supabase),
		getRunners(locals.supabase)
	]);

	const games = rawGames.map((g) => ({
		game_id: g.game_id,
		game_name: g.game_name,
		timing_method: g.timing_method || '',
		full_runs: g.full_runs || [],
		mini_challenges: g.mini_challenges || [],
		player_made: g.player_made || [],
		challenges_data: g.challenges_data || [],
		glitches_data: g.glitches_data || [],
		restrictions_data: g.restrictions_data || [],
		character_column: g.character_column || { enabled: false, label: 'Character' },
		characters_data: g.characters_data || [],
	}));

	const runners = rawRunners
		.filter((r) => r.status !== 'test' && !r.hidden)
		.map((r) => ({
			runner_id: r.runner_id,
			name: r.display_name || r.name || r.runner_id
		}));

	return { games, runners };
};
