import { getActiveGames, getRunners, getTeams } from '$lib/server/supabase';
import { getPosts } from '$lib/server/data';
import type { RequestHandler } from './$types';

const SITE = 'https://www.challengerun.net';

function url(loc: string, priority: string, changefreq: string, lastmod?: string) {
	return `  <url>
    <loc>${SITE}${loc}</loc>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>${lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : ''}
  </url>`;
}

export const GET: RequestHandler = async ({ locals }) => {
	const [games, runners, teams, posts] = await Promise.all([
		getActiveGames(locals.supabase),
		getRunners(locals.supabase),
		getTeams(locals.supabase),
		Promise.resolve(getPosts())
	]);

	const urls: string[] = [];

	// Static pages
	urls.push(url('/', '1.0', 'daily'));
	urls.push(url('/games', '0.9', 'daily'));
	urls.push(url('/runners', '0.8', 'weekly'));
	urls.push(url('/teams', '0.7', 'weekly'));
	urls.push(url('/news', '0.7', 'weekly'));
	urls.push(url('/search', '0.5', 'monthly'));
	urls.push(url('/submit', '0.4', 'monthly'));
	urls.push(url('/submit-game', '0.4', 'monthly'));
	urls.push(url('/rules', '0.5', 'monthly'));
	urls.push(url('/guidelines', '0.5', 'monthly'));
	urls.push(url('/glossary', '0.5', 'monthly'));
	urls.push(url('/support', '0.4', 'monthly'));
	urls.push(url('/legal/terms', '0.3', 'yearly'));
	urls.push(url('/legal/privacy', '0.3', 'yearly'));
	urls.push(url('/legal/cookies', '0.3', 'yearly'));

	// Game pages
	for (const game of games) {
		const mod = game.updated_at ? new Date(game.updated_at).toISOString().slice(0, 10) : undefined;
		urls.push(url(`/games/${game.game_id}`, '0.8', 'weekly', mod));
		urls.push(url(`/games/${game.game_id}/runs`, '0.8', 'daily', mod));
		urls.push(url(`/games/${game.game_id}/rules`, '0.6', 'monthly', mod));
	}

	// Runner profiles
	for (const runner of runners) {
		if (runner.hidden || runner.status === 'test') continue;
		const mod = runner.updated_at ? new Date(runner.updated_at).toISOString().slice(0, 10) : undefined;
		urls.push(url(`/runners/${runner.runner_id}`, '0.6', 'weekly', mod));
	}

	// Team pages
	for (const team of teams) {
		urls.push(url(`/teams/${team.team_id}`, '0.5', 'monthly'));
	}

	// News posts
	for (const post of posts) {
		const date = post.date instanceof Date ? post.date : new Date(post.date);
		const mod = isNaN(date.getTime()) ? undefined : date.toISOString().slice(0, 10);
		urls.push(url(`/news/${post.slug}`, '0.6', 'monthly', mod));
	}

	const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;

	return new Response(xml.trim(), {
		headers: {
			'Content-Type': 'application/xml',
			'Cache-Control': 'max-age=3600'
		}
	});
};
