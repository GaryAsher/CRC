// =============================================================================
// Server-Side Data Loading
// =============================================================================
// Reads markdown collections and YAML config files using Vite's import.meta.glob
// so data is bundled at build time. This works on Cloudflare Workers (no fs).
//
// Replaces: Jekyll's collection system + all generate-*.js scripts
// =============================================================================

import matter from 'gray-matter';
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

// ─── Vite Glob Imports (resolved at build time) ────────────────────────────
// These eagerly load all matching files as raw strings.
// The keys are relative paths like "../../data/games/hades-2.md"

const gameFiles = import.meta.glob('../../data/games/*.md', { eager: true, query: '?raw', import: 'default' }) as Record<string, string>;
const runnerFiles = import.meta.glob('../../data/runners/*.md', { eager: true, query: '?raw', import: 'default' }) as Record<string, string>;
const runFiles = import.meta.glob('../../data/runs/**/*.md', { eager: true, query: '?raw', import: 'default' }) as Record<string, string>;
const achievementFiles = import.meta.glob('../../data/achievements/*.md', { eager: true, query: '?raw', import: 'default' }) as Record<string, string>;
const teamFiles = import.meta.glob('../../data/teams/*.md', { eager: true, query: '?raw', import: 'default' }) as Record<string, string>;
const postFiles = import.meta.glob('../../data/posts/*.md', { eager: true, query: '?raw', import: 'default' }) as Record<string, string>;
const configFiles = import.meta.glob('../../data/config/*.yml', { eager: true, query: '?raw', import: 'default' }) as Record<string, string>;

// ─── Generic Helpers ────────────────────────────────────────────────────────

/** Extract filename from a glob path like "../../data/games/hades-2.md" */
function getFilename(filepath: string): string {
	return filepath.split('/').pop() || '';
}

/**
 * Parse all markdown files from a glob result.
 * Skips files starting with _ (test content) and README.md.
 * Includes the markdown body as `content` if present.
 */
function parseCollection<T>(
	files: Record<string, string>,
	includeHidden = false
): T[] {
	return Object.entries(files)
		.filter(([filepath]) => {
			const filename = getFilename(filepath);
			if (filename === 'README.md') return false;
			if (!includeHidden && filename.startsWith('_')) return false;
			return true;
		})
		.map(([, raw]) => {
			const { data, content } = matter(raw);
			const trimmed = content.trim();
			return {
				...data,
				...(trimmed ? { content: trimmed } : {})
			} as T;
		});
}

/**
 * Parse a YAML config file by filename.
 */
function loadYaml<T>(filename: string): T {
	const match = Object.entries(configFiles).find(
		([filepath]) => getFilename(filepath) === filename
	);
	if (!match) {
		throw new Error(`Config file not found: ${filename}`);
	}
	return yaml.load(match[1]) as T;
}

// ─── Games ──────────────────────────────────────────────────────────────────

/** Get all active (non-hidden) games. */
export function getGames(): Game[] {
	return parseCollection<Game>(gameFiles);
}

/** Get all games including test/hidden ones (for admin). */
export function getAllGames(): Game[] {
	return parseCollection<Game>(gameFiles, true);
}

/** Get a single game by ID. Returns undefined if not found. */
export function getGame(gameId: string): Game | undefined {
	return getGames().find((g) => g.game_id === gameId);
}

/** Get active games only (status === 'Active'). */
export function getActiveGames(): Game[] {
	return getGames().filter((g) => g.status === 'Active');
}

// ─── Runners ────────────────────────────────────────────────────────────────

/** Get all active (non-hidden) runners. */
export function getRunners(): Runner[] {
	return parseCollection<Runner>(runnerFiles);
}

/** Get a single runner by ID. */
export function getRunner(runnerId: string): Runner | undefined {
	return getRunners().find((r) => r.runner_id === runnerId);
}

// ─── Runs ───────────────────────────────────────────────────────────────────

/** Get all approved runs across all games. */
export function getRuns(): Run[] {
	// Filter out rejected directory and README/hidden files
	return Object.entries(runFiles)
		.filter(([filepath]) => {
			const filename = getFilename(filepath);
			if (filename === 'README.md') return false;
			if (filename.startsWith('_')) return false;
			// Skip rejected runs
			if (filepath.includes('/rejected/')) return false;
			return true;
		})
		.map(([, raw]) => {
			const { data } = matter(raw);
			return data as Run;
		});
}

/** Get all approved runs for a specific game. */
export function getRunsForGame(gameId: string): Run[] {
	return getRuns().filter((r) => r.game_id === gameId && r.status === 'approved');
}

/** Get all approved runs for a specific runner. */
export function getRunsForRunner(runnerId: string): Run[] {
	return getRuns().filter((r) => r.runner_id === runnerId && r.status === 'approved');
}

/**
 * Get runs for a specific game + category combination.
 * This replaces the generated category pages entirely.
 */
export function getRunsForCategory(gameId: string, categorySlug: string): Run[] {
	return getRuns().filter(
		(r) => r.game_id === gameId && r.category_slug === categorySlug && r.status === 'approved'
	);
}

// ─── Achievements ───────────────────────────────────────────────────────────

/** Get all achievements. */
export function getAchievements(): Achievement[] {
	return parseCollection<Achievement>(achievementFiles);
}

/** Get achievements for a specific runner. */
export function getAchievementsForRunner(runnerId: string): Achievement[] {
	return getAchievements().filter(
		(a) => a.runner_id === runnerId && a.status === 'approved'
	);
}

/** Get achievements for a specific game. */
export function getAchievementsForGame(gameId: string): Achievement[] {
	return getAchievements().filter(
		(a) => a.game_id === gameId && a.status === 'approved'
	);
}

// ─── Teams ──────────────────────────────────────────────────────────────────

export function getTeams(): Team[] {
	return parseCollection<Team>(teamFiles);
}

export function getTeam(teamId: string): Team | undefined {
	return getTeams().find((t) => t.team_id === teamId);
}

// ─── Posts ───────────────────────────────────────────────────────────────────

/** Get all blog/news posts, sorted newest first. */
export function getPosts(): Post[] {
	return Object.entries(postFiles)
		.filter(([filepath]) => {
			const filename = getFilename(filepath);
			return filename !== 'README.md';
		})
		.map(([filepath, raw]) => {
			const { data, content } = matter(raw);
			const filename = getFilename(filepath);
			// Extract slug from filename: 2026-01-12-welcome-to-crc.md → welcome-to-crc
			const slug = filename.replace(/^\d{4}-\d{2}-\d{2}-/, '').replace(/\.md$/, '');

			return {
				...data,
				slug,
				content: content.trim()
			} as Post;
		})
		.sort((a, b) => {
			const dateA = a.date instanceof Date ? a.date : new Date(a.date);
			const dateB = b.date instanceof Date ? b.date : new Date(b.date);
			return dateB.getTime() - dateA.getTime();
		});
}

// ─── Config Data ────────────────────────────────────────────────────────────
// Replaces site.data.* in Jekyll/Liquid templates

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
// Used by dynamic routes to validate tier/category URL params

export interface CategoryInfo {
	slug: string;
	label: string;
	description?: string;
	tier: 'full-runs' | 'mini-challenges' | 'player-made';
	parentGroup?: string;
	parentGroupLabel?: string;
}

/**
 * Find a specific category within a game's three-tier structure.
 * Returns null if the tier/category combination doesn't exist.
 */
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
			// Check if the slug matches the group itself
			if (group.slug === categorySlug) {
				return {
					slug: group.slug,
					label: group.label,
					description: group.description,
					tier: 'mini-challenges'
				};
			}
			// Check children
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

/**
 * Get all valid tier/category combinations for a game.
 * Used by the entries() function for static prerendering.
 */
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
		// The group page itself
		categories.push({
			slug: group.slug,
			label: group.label,
			description: group.description,
			tier: 'mini-challenges'
		});
		// Each child challenge
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
