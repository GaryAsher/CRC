import { getTeam, getTeams, getGames, getRunner } from '$lib/server/data';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export function entries() {
	return getTeams().map((t) => ({ team_id: t.team_id }));
}

export const load: PageServerLoad = async ({ params }) => {
	const team = getTeam(params.team_id);
	if (!team) throw error(404, 'Team not found');

	const allGames = getGames();

	// Resolve game names from IDs
	const games = (team.games || [])
		.map((gid) => {
			const game = allGames.find((g) => g.game_id === gid);
			return game ? { game_id: game.game_id, game_name: game.game_name } : null;
		})
		.filter(Boolean) as { game_id: string; game_name: string }[];

	// Resolve member runner profiles
	const members = (team.members || []).map((m) => {
		const runner = getRunner(m.runner_id);
		return {
			runner_id: m.runner_id,
			name: m.name || runner?.runner_name || m.runner_id,
			role: m.role,
			avatar: runner?.avatar || null,
			hasProfile: !!runner
		};
	});

	return {
		team,
		games,
		members,
		achievements: team.achievements || []
	};
};
