import {
	getAchievementsForGame,
	getRunsForGame,
	getRunners,
	getDefaultRules,
	getAllCategories
} from '$lib/server/data';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ parent }) => {
	const { game } = await parent();

	const achievements = getAchievementsForGame(game.game_id);
	const runs = getRunsForGame(game.game_id);
	const runners = getRunners();
	const categories = getAllCategories(game);

	// Build a lookup of runner_id → runner for display
	const runnerMap: Record<string, { runner_name: string; avatar?: string }> = {};
	for (const r of runners) {
		runnerMap[r.runner_id] = { runner_name: r.runner_name, avatar: r.avatar };
	}

	// Run counts per category slug
	const runCountByCategory: Record<string, number> = {};
	for (const run of runs) {
		const slug = run.category_slug;
		runCountByCategory[slug] = (runCountByCategory[slug] || 0) + 1;
	}

	// Total run count
	const totalRunCount = runs.length;

	// Default rules fallback
	const defaults = getDefaultRules() as { general_rules?: string } | null;
	const defaultGeneralRules = defaults?.general_rules || null;

	return {
		achievements,
		runnerMap,
		runCountByCategory,
		totalRunCount,
		defaultGeneralRules,
		categories
	};
};
