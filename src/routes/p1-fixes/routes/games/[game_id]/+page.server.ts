import {
	getGames,
	getAchievementsForGame,
	getRunner
} from '$lib/server/data';
import type { PageServerLoad, EntryGenerator } from './$types';

export const prerender = true;

export const entries: EntryGenerator = () => {
	return getGames()
		.filter((g) => !g.game_id.startsWith('_'))
		.map((g) => ({ game_id: g.game_id }));
};

export const load: PageServerLoad = async ({ params, parent }) => {
	const { game } = await parent();

	// ── Achievement completions ─────────────────────────────
	const rawAchievements = getAchievementsForGame(params.game_id);

	// Group by achievement_slug with completion/progress counts + runner details
	const achievementStats = (game.community_achievements || []).map((def: any) => {
		const completions = rawAchievements.filter(
			(a) => a.achievement_slug === def.slug && a.status === 'approved'
		);
		const completed = completions.filter((a) => a.date_completed);
		const inProgress = completions.filter((a) => !a.date_completed);

		const runners = completed.map((a) => {
			const runner = getRunner(a.runner_id);
			return {
				runner_id: a.runner_id,
				name: runner?.runner_name || a.runner_id,
				avatar: runner?.avatar || null,
				date: a.date_completed,
				proof_url: a.proof_url
			};
		});

		return {
			...def,
			completedCount: completed.length,
			inProgressCount: inProgress.length,
			runners
		};
	});

	return {
		achievementStats
	};
};
