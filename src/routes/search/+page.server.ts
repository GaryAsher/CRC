import { getActiveGames, getRunners, getRuns, getPosts } from '$lib/server/data';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const games = getActiveGames().map((g) => ({
		type: 'game' as const,
		id: g.game_id,
		name: g.game_name,
		aliases: g.game_name_aliases || [],
		genres: g.genres || [],
		url: `/games/${g.game_id}`
	}));

	const runners = getRunners()
		.filter((r) => r.status !== 'test' && !r.hidden)
		.map((r) => ({
			type: 'runner' as const,
			id: r.runner_id,
			name: r.display_name || r.name || r.runner_id,
			url: `/runners/${r.runner_id}`
		}));

	const runs = getRuns()
		.filter((r) => r.status === 'approved')
		.map((r) => ({
			type: 'run' as const,
			runner: r.runner_id || r.runner || '',
			game: r.game_id || '',
			challenge: r.challenge_id || '',
			category: r.category_slug || r.category || '',
			date: r.date_completed || '',
			url: `/games/${r.game_id}/runs/`
		}));

	const news = getPosts().map((p) => ({
		type: 'news' as const,
		title: p.title || '',
		url: p.url || `/news/${p.slug}`,
		date: p.date || '',
		excerpt: p.excerpt || ''
	}));

	return { games, runners, runs, news };
};
