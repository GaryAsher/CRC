// =============================================================================
// Server-Side Data Loading (Cloudflare Workers Compatible)
// =============================================================================
// Uses Vite's import.meta.glob to bundle markdown/YAML content at build time.
// This means the data is embedded in the deployed Worker code — no filesystem
// access needed at runtime. Content updates when you redeploy.
//
// Key difference from the fs-based version:
//   - fs.readFileSync → import.meta.glob (resolved at build time)
//   - gray-matter → lightweight frontmatter parser (no Node.js deps)
//   - Data is available on every request (SSR), not just at build time
// =============================================================================

import yaml from 'js-yaml';
import type {
	Game,
	Runner,
	Run,
	Achievement,
	Team,
	Post,
	AdminConfig
} from '$types';

// ─── Frontmatter Parser (replaces gray-matter) ─────────────────────────────
// gray-matter pulls in Node.js dependencies that don't work on Cloudflare
// Workers. This does the same thing for our use case: parse YAML front matter
// delimited by --- lines, return { data, content }.

function parseFrontmatter(raw: string): { data: Record<string, unknown>; content: string } {
	const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
	if (!match) return { data: {}, content: raw.trim() };
	return {
		data: (yaml.load(match[1]) as Record<string, unknown>) || {},
		content: match[2].trim()
	};
}

// ─── Import all data files at build time ────────────────────────────────────
// These are resolved by Vite during the build step. The file contents are
// embedded as strings in the output bundle. At runtime on Cloudflare's edge,
// we just parse the already-loaded strings.

const gameFiles = import.meta.glob('/src/data/games/*.md', {
	query: '?raw',
	import: 'default',
	eager: true
}) as Record<string, string>;

const runnerFiles = import.meta.glob('/src/data/runners/*.md', {
	query: '?raw',
	import: 'default',
	eager: true
}) as Record<string, string>;

const runFiles = import.meta.glob('/src/data/runs/**/*.md', {
	query: '?raw',
	import: 'default',
	eager: true
}) as Record<string, string>;

const achievementFiles = import.meta.glob('/src/data/achievements/*.md', {
	query: '?raw',
	import: 'default',
	eager: true
}) as Record<string, string>;

const teamFiles = import.meta.glob('/src/data/teams/*.md', {
	query: '?raw',
	import: 'default',
	eager: true
}) as Record<string, string>;

const postFiles = import.meta.glob('/src/data/posts/*.md', {
	query: '?raw',
	import: 'default',
	eager: true
}) as Record<string, string>;

const configFiles = import.meta.glob('/src/data/config/*.yml', {
	query: '?raw',
	import: 'default',
	eager: true
}) as Record<string, string>;

const historyFiles = import.meta.glob('/src/data/config/history/*.yml', {
	query: '?raw',
	import: 'default',
	eager: true
}) as Record<string, string>;

// ─── Generic Helpers ────────────────────────────────────────────────────────

/** Extract filename from a glob path like '/src/data/games/celeste.md' → 'celeste.md' */
function filename(filepath: string): string {
	return filepath.split('/').pop() || '';
}

/**
 * Parse a collection of glob-imported markdown files.
 * Filters out README.md and optionally files starting with _ (test/hidden content).
 */
function parseCollection<T>(
	files: Record<string, string>,
	includeHidden = false
): T[] {
	return Object.entries(files)
		.filter(([filepath]) => {
			const name = filename(filepath);
			if (name === 'README.md') return false;
			if (!includeHidden && name.startsWith('_')) return false;
			return true;
		})
		.map(([, raw]) => {
			const { data, content } = parseFrontmatter(raw);
			return {
				...data,
				...(content ? { content } : {})
			} as T;
		});
}

/**
 * Load a YAML config file by name.
 */
function loadYaml<T>(configName: string): T {
	const key = Object.keys(configFiles).find((k) => k.endsWith(`/${configName}`));
	if (!key || !configFiles[key]) {
		throw new Error(`Config file not found: ${configName}`);
	}
	return yaml.load(configFiles[key]) as T;
}

// ─── Cached Collections ─────────────────────────────────────────────────────
// Since the data is embedded at build time and never changes at runtime,
// we parse once and cache the results.

let _games: Game[] | null = null;
let _allGames: Game[] | null = null;
let _runners: Runner[] | null = null;
let _runs: Run[] | null = null;
let _achievements: Achievement[] | null = null;
let _teams: Team[] | null = null;
let _posts: Post[] | null = null;

// ─── Games ──────────────────────────────────────────────────────────────────

export function getGames(): Game[] {
	if (!_games) _games = parseCollection<Game>(gameFiles);
	return _games;
}

export function getAllGames(): Game[] {
	if (!_allGames) _allGames = parseCollection<Game>(gameFiles, true);
	return _allGames;
}

export function getGame(gameId: string): Game | undefined {
	return getGames().find((g) => g.game_id === gameId);
}

export function getActiveGames(): Game[] {
	return getGames().filter((g) => g.status === 'Active');
}

// ─── Runners ────────────────────────────────────────────────────────────────

export function getRunners(): Runner[] {
	if (!_runners) _runners = parseCollection<Runner>(runnerFiles);
	return _runners;
}

export function getRunner(runnerId: string): Runner | undefined {
	return getRunners().find((r) => r.runner_id === runnerId);
}

// ─── Runs ───────────────────────────────────────────────────────────────────

export function getRuns(): Run[] {
	if (!_runs) {
		// Filter out rejected runs and README files
		const filtered: Record<string, string> = {};
		for (const [filepath, content] of Object.entries(runFiles)) {
			if (filepath.includes('/rejected/')) continue;
			filtered[filepath] = content;
		}
		_runs = parseCollection<Run>(filtered);
	}
	return _runs;
}

export function getRunsForGame(gameId: string): Run[] {
	return getRuns().filter((r) => r.game_id === gameId && r.status === 'approved');
}

export function getRunsForRunner(runnerId: string): Run[] {
	return getRuns().filter((r) => r.runner_id === runnerId && r.status === 'approved');
}

export function getRunsForCategory(gameId: string, categorySlug: string): Run[] {
	return getRuns().filter(
		(r) => r.game_id === gameId && r.category_slug === categorySlug && r.status === 'approved'
	);
}

// ─── Achievements ───────────────────────────────────────────────────────────

export function getAchievements(): Achievement[] {
	if (!_achievements) _achievements = parseCollection<Achievement>(achievementFiles);
	return _achievements;
}

export function getAchievementsForRunner(runnerId: string): Achievement[] {
	return getAchievements().filter(
		(a) => a.runner_id === runnerId && a.status === 'approved'
	);
}

export function getAchievementsForGame(gameId: string): Achievement[] {
	return getAchievements().filter(
		(a) => a.game_id === gameId && a.status === 'approved'
	);
}

// ─── Teams ──────────────────────────────────────────────────────────────────

export function getTeams(): Team[] {
	if (!_teams) _teams = parseCollection<Team>(teamFiles);
	return _teams;
}

export function getTeam(teamId: string): Team | undefined {
	return getTeams().find((t) => t.team_id === teamId);
}

// ─── Posts ───────────────────────────────────────────────────────────────────

export function getPosts(): Post[] {
	if (!_posts) {
		_posts = Object.entries(postFiles)
			.filter(([filepath]) => {
				const name = filename(filepath);
				return name.endsWith('.md') && name !== 'README.md';
			})
			.map(([filepath, raw]) => {
				const { data, content } = parseFrontmatter(raw);
				const name = filename(filepath);
				const slug = name.replace(/^\d{4}-\d{2}-\d{2}-/, '').replace(/\.md$/, '');
				return {
					...data,
					slug,
					content
				} as Post;
			})
			.sort((a, b) => {
				const dateA = a.date instanceof Date ? a.date : new Date(a.date);
				const dateB = b.date instanceof Date ? b.date : new Date(b.date);
				return dateB.getTime() - dateA.getTime();
			});
	}
	return _posts;
}

// ─── History ────────────────────────────────────────────────────────────────

export interface HistoryEntry {
	date: string;
	action: string;
	target?: string;
	note?: string;
	by?: {
		discord?: string;
		github?: string;
	};
}

export function getHistory(gameId: string): HistoryEntry[] {
	const key = Object.keys(historyFiles).find((k) => k.endsWith(`/${gameId}.yml`));
	if (!key || !historyFiles[key]) return [];
	const data = yaml.load(historyFiles[key]) as HistoryEntry[] | null;
	return (data || []).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

// ─── Config Data ────────────────────────────────────────────────────────────

export function getAdminConfig(): AdminConfig {
	return loadYaml<AdminConfig>('admin-config.yml');
}

export function getDefaultRules(): unknown {
	return loadYaml('default-rules.yml');
}

export function getPlatforms(): unknown {
	return loadYaml('platforms.yml');
}

export function getGenres(): unknown {
	return loadYaml('genres.yml');
}

export function getFormFieldsOrder(): unknown {
	return loadYaml('form-fields-order.yml');
}

export function getBannedTerms(): unknown {
	return loadYaml('banned-terms.yml');
}

export function getGameModerators(): unknown {
	return loadYaml('game-moderators.yml');
}

export function getChallenges(): unknown {
	return loadYaml('challenges.yml');
}

// ─── Utility: Find Category in Game ─────────────────────────────────────────

export interface CategoryInfo {
	slug: string;
	label: string;
	description?: string;
	tier: 'full-runs' | 'mini-challenges' | 'player-made';
	parentGroup?: string;
	parentGroupLabel?: string;
}

export function findCategory(
	game: Game,
	tier: string,
	categorySlug: string
): CategoryInfo | null {
	if (tier === 'full-runs') {
		const cat = game.full_runs?.find((c) => c.slug === categorySlug);
		if (cat) {
			return { slug: cat.slug, label: cat.label, description: cat.description, tier: 'full-runs' };
		}
	}

	if (tier === 'mini-challenges') {
		for (const group of game.mini_challenges || []) {
			if (group.slug === categorySlug) {
				return {
					slug: group.slug,
					label: group.label,
					description: group.description,
					tier: 'mini-challenges'
				};
			}
			const child = group.children?.find((c) => c.slug === categorySlug);
			if (child) {
				return {
					slug: child.slug,
					label: child.label,
					tier: 'mini-challenges',
					parentGroup: group.slug,
					parentGroupLabel: group.label
				};
			}
		}
	}

	if (tier === 'player-made') {
		const cat = game.player_made?.find((c) => c.slug === categorySlug);
		if (cat) {
			return {
				slug: cat.slug,
				label: cat.label,
				description: cat.description,
				tier: 'player-made'
			};
		}
	}

	return null;
}

export function getAllCategories(game: Game): CategoryInfo[] {
	const categories: CategoryInfo[] = [];

	for (const cat of game.full_runs || []) {
		categories.push({
			slug: cat.slug,
			label: cat.label,
			description: cat.description,
			tier: 'full-runs'
		});
	}

	for (const group of game.mini_challenges || []) {
		categories.push({
			slug: group.slug,
			label: group.label,
			description: group.description,
			tier: 'mini-challenges'
		});
		for (const child of group.children || []) {
			categories.push({
				slug: child.slug,
				label: child.label,
				tier: 'mini-challenges',
				parentGroup: group.slug,
				parentGroupLabel: group.label
			});
		}
	}

	for (const cat of game.player_made || []) {
		categories.push({
			slug: cat.slug,
			label: cat.label,
			description: cat.description,
			tier: 'player-made'
		});
	}

	return categories;
}
