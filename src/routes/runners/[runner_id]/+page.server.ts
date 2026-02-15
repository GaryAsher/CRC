import {
	getRunner,
	getRunners,
	getRunsForRunner,
	getAchievementsForRunner,
	getGames,
	getTeams,
	getRuns
} from '$lib/server/data';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export function entries() {
	return getRunners()
		.filter((r) => !r.runner_id.startsWith('_'))
		.map((r) => ({ runner_id: r.runner_id }));
}

export const load: PageServerLoad = async ({ params }) => {
	const runner = getRunner(params.runner_id);
	if (!runner) throw error(404, 'Runner not found');

	const runs = getRunsForRunner(params.runner_id);
	const achievements = getAchievementsForRunner(params.runner_id);
	const allGames = getGames();
	const allTeams = getTeams();
	const allRuns = getRuns();

	// ── Group runs by game ──────────────────────────────────
	const gameMap = new Map<string, { game: (typeof allGames)[0]; runs: typeof runs }>();
	for (const run of runs) {
		if (!gameMap.has(run.game_id)) {
			const game = allGames.find((g) => g.game_id === run.game_id);
			if (game) gameMap.set(run.game_id, { game, runs: [] });
		}
		gameMap.get(run.game_id)?.runs.push(run);
	}
	const gameGroups = Array.from(gameMap.values());

	// ── Team affiliations ───────────────────────────────────
	const teams = allTeams.filter(
		(t) => t.members?.some((m) => m.runner_id === params.runner_id)
	).map((t) => ({
		team_id: t.team_id,
		name: t.name,
		logo: t.logo
	}));

	// ── Stats ───────────────────────────────────────────────
	let fullRunCount = 0;
	let miniRunCount = 0;
	for (const run of runs) {
		const game = allGames.find((g) => g.game_id === run.game_id);
		if (!game) { fullRunCount++; continue; }
		const isFull = game.full_runs?.some((fr) => fr.slug === run.category_slug);
		const isMini = !isFull && game.mini_challenges?.some((mc) =>
			mc.slug === run.category_slug ||
			mc.children?.some((ch) => ch.slug === run.category_slug)
		);
		if (isMini) miniRunCount++;
		else fullRunCount++;
	}

	// Most played game
	let mostPlayedId = '';
	let mostPlayedCount = 0;
	for (const [gameId, group] of gameMap) {
		if (group.runs.length > mostPlayedCount) {
			mostPlayedCount = group.runs.length;
			mostPlayedId = gameId;
		}
	}
	const mostPlayedGame = mostPlayedId
		? allGames.find((g) => g.game_id === mostPlayedId)
		: null;

	// Top genres
	const genreCounts = new Map<string, number>();
	for (const [, group] of gameMap) {
		for (const genre of group.game.genres || []) {
			genreCounts.set(genre, (genreCounts.get(genre) || 0) + 1);
		}
	}
	const topGenres = [...genreCounts.entries()]
		.sort((a, b) => b[1] - a[1])
		.slice(0, 3)
		.map(([g]) => g);

	// ── Achievements with game info ─────────────────────────
	const enrichedAchievements = achievements
		.filter((a) => a.status === 'approved')
		.map((a) => {
			const game = allGames.find((g) => g.game_id === a.game_id);
			const def = game?.community_achievements?.find(
				(ca) => ca.slug === a.achievement_slug
			);
			return {
				...a,
				gameName: game?.game_name || a.game_id,
				gameId: a.game_id,
				title: def?.title || a.achievement_slug,
				description: def?.description || '',
				icon: def?.icon || '🏆',
				difficulty: def?.difficulty || null
			};
		});

	// ── Credits (games where this runner is listed) ─────────
	const credits: { gameId: string; gameName: string; cover?: string; role: string }[] = [];
	for (const game of allGames) {
		// Check maintainers (if stored as array of runner_ids in game data)
		const isMaintainer = (game as any).maintainers?.includes(params.runner_id);
		const creditEntry = (game as any).credits?.find(
			(c: any) => c.runner_id === params.runner_id
		);
		if (isMaintainer) {
			credits.push({ gameId: game.game_id, gameName: game.game_name, cover: game.cover, role: 'Maintainer' });
		} else if (creditEntry) {
			credits.push({ gameId: game.game_id, gameName: game.game_name, cover: game.cover, role: creditEntry.role || 'Contributor' });
		}
	}

	// ── Verification count ──────────────────────────────────
	const verifiedCount = allRuns.filter(
		(r) => r.verified_by === params.runner_id || r.verified_by === runner.runner_name
	).length;

	// ── Player-made challenges ──────────────────────────────
	const playerMadeChallenges: { label: string; gameName: string; gameId: string }[] = [];
	for (const game of allGames) {
		for (const pm of game.player_made || []) {
			if ((pm as any).created_by === params.runner_id || (pm as any).creator === params.runner_id) {
				playerMadeChallenges.push({
					label: pm.label,
					gameName: game.game_name,
					gameId: game.game_id
				});
			}
		}
	}

	// ── Activity timeline ───────────────────────────────────
	type TimelineItem = {
		date: string;
		type: 'run' | 'achievement';
		gameId: string;
		gameName: string;
		detail: string;
		extra?: string;
	};
	const timeline: TimelineItem[] = [];

	for (const run of runs) {
		const game = allGames.find((g) => g.game_id === run.game_id);
		const dateStr = run.date_completed instanceof Date
			? run.date_completed.toISOString().split('T')[0]
			: String(run.date_completed || '');
		timeline.push({
			date: dateStr,
			type: 'run',
			gameId: run.game_id,
			gameName: game?.game_name || run.game_id,
			detail: run.category || run.category_slug || 'Run',
			extra: run.time_primary
		});
	}

	for (const ach of enrichedAchievements) {
		const dateStr = ach.date_completed instanceof Date
			? ach.date_completed.toISOString().split('T')[0]
			: String(ach.date_completed || '');
		timeline.push({
			date: dateStr,
			type: 'achievement',
			gameId: ach.gameId,
			gameName: ach.gameName,
			detail: ach.title,
			extra: undefined
		});
	}

	timeline.sort((a, b) => (b.date || '').localeCompare(a.date || ''));

	return {
		runner,
		runs,
		achievements: enrichedAchievements,
		gameGroups,
		teams,
		stats: {
			totalRuns: runs.length,
			fullRunCount,
			miniRunCount,
			gamesCount: gameMap.size,
			mostPlayedGame: mostPlayedGame
				? { game_id: mostPlayedGame.game_id, game_name: mostPlayedGame.game_name, count: mostPlayedCount }
				: null,
			topGenres
		},
		credits,
		verifiedCount,
		playerMadeChallenges,
		timeline: timeline.slice(0, 30)
	};
};
