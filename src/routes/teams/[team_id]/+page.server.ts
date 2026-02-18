import { getTeam, getGames, getRunner } from '$lib/server/supabase';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
	const team = await getTeam(locals.supabase, params.team_id);
	if (!team) throw error(404, 'Team not found');

	const allGames = await getGames(locals.supabase);

	// Resolve game names from IDs
	const games = (team.games || [])
		.map((gid) => {
			const game = allGames.find((g) => g.game_id === gid);
			return game ? { game_id: game.game_id, game_name: game.game_name } : null;
		})
		.filter(Boolean) as { game_id: string; game_name: string }[];

	// Resolve member runner profiles
	const members = await Promise.all(
		(team.members || []).map(async (m) => {
			const runner = await getRunner(locals.supabase, m.runner_id);
			return {
				runner_id: m.runner_id,
				name: m.name || runner?.runner_name || m.runner_id,
				role: m.role,
				avatar: runner?.avatar || null,
				hasProfile: !!runner
			};
		})
	);

	return {
		team,
		games,
		members,
		achievements: team.achievements || []
	};
};
