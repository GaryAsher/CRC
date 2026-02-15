// =============================================================================
// Server-Side Data Loading
// =============================================================================
// Reads markdown collections and YAML config files at build/request time.
// This file uses Node's `fs` and only runs server-side (in +page.server.ts,
// +layout.server.ts, hooks.server.ts, or +server.ts files).
//
// Replaces: Jekyll's collection system + all generate-*.js scripts
// =============================================================================

import fs from 'node:fs';
import path from 'node:path';
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

// Resolve from project root (works in both dev and build)
const DATA_DIR = path.resolve('src/data');

// ─── Generic Helpers ────────────────────────────────────────────────────────

/**
 * Read all .md files from a directory and parse YAML front matter.
 * Skips files starting with _ (test content) and README.md.
 * Includes the markdown body as `content` if present.
 */
function loadCollection<T>(dir: string, includeHidden = false): T[] {
	const fullPath = path.join(DATA_DIR, dir);
	if (!fs.existsSync(fullPath)) return [];

	return fs
		.readdirSync(fullPath)
		.filter((f) => {
			if (!f.endsWith('.md')) return false;
			if (f === 'README.md') return false;
			if (!includeHidden && f.startsWith('_')) return false;
			return true;
		})
		.map((f) => {
			const raw = fs.readFileSync(path.join(fullPath, f), 'utf-8');
			const { data, content } = matter(raw);
			const trimmed = content.trim();
			return {
				...data,
				...(trimmed ? { content: trimmed } : {})
			} as T;
		});
}

/**
 * Recursively load .md files from a directory and all subdirectories.
 * Used for runs (which are organized in game_id subdirectories).
 * Skips the `rejected/` subdirectory.
 */
function loadCollectionRecursive<T>(dir: string): T[] {
	const fullPath = path.join(DATA_DIR, dir);
	if (!fs.existsSync(fullPath)) return [];

	const results: T[] = [];

	function walk(currentDir: string) {
		for (const entry of fs.readdirSync(currentDir, { withFileTypes: true })) {
			if (entry.isDirectory()) {
				// Skip rejected runs and hidden directories
				if (entry.name === 'rejected' || entry.name.startsWith('.')) continue;
				walk(path.join(currentDir, entry.name));
			} else if (
				entry.isFile() &&
				entry.name.endsWith('.md') &&
				!entry.name.startsWith('_') &&
				entry.name !== 'README.md'
			) {
				const raw = fs.readFileSync(path.join(currentDir, entry.name), 'utf-8');
				const { data } = matter(raw);
				results.push(data as T);
			}
		}
	}

	walk(fullPath);
	return results;
}

/**
 * Load a YAML config file from the config/ directory (_data/ equivalent).
 */
function loadYaml<T>(filename: string): T {
	const filePath = path.join(DATA_DIR, 'config', filename);
	if (!fs.existsSync(filePath)) {
		throw new Error(`Config file not found: ${filename}`);
	}
	const raw = fs.readFileSync(filePath, 'utf-8');
	return yaml.load(raw) as T;
}

// ─── Games ──────────────────────────────────────────────────────────────────

/** Get all active (non-hidden) games. */
export function getGames(): Game[] {
	return loadCollection<Game>('games');
}

/** Get all games including test/hidden ones (for admin). */
export function getAllGames(): Game[] {
	return loadCollection<Game>('games', true);
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
	return loadCollection<Runner>('runners');
}

/** Get a single runner by ID. */
export function getRunner(runnerId: string): Runner | undefined {
	return getRunners().find((r) => r.runner_id === runnerId);
}

// ─── Runs ───────────────────────────────────────────────────────────────────

/** Get all approved runs across all games. */
export function getRuns(): Run[] {
	return loadCollectionRecursive<Run>('runs');
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
	return loadCollection<Achievement>('achievements');
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
	return loadCollection<Team>('teams');
}

export function getTeam(teamId: string): Team | undefined {
	return getTeams().find((t) => t.team_id === teamId);
}

// ─── Posts ───────────────────────────────────────────────────────────────────

/** Get all blog/news posts, sorted newest first. */
export function getPosts(): Post[] {
	const fullPath = path.join(DATA_DIR, 'posts');
	if (!fs.existsSync(fullPath)) return [];

	return fs
		.readdirSync(fullPath)
		.filter((f) => f.endsWith('.md') && f !== 'README.md')
		.map((f) => {
			const raw = fs.readFileSync(path.join(fullPath, f), 'utf-8');
			const { data, content } = matter(raw);

			// Extract slug from filename: 2026-01-12-welcome-to-crc.md → welcome-to-crc
			const slug = f.replace(/^\d{4}-\d{2}-\d{2}-/, '').replace(/\.md$/, '');

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

// ─── Game History ───────────────────────────────────────────────────────────

export interface HistoryEntry {
	date: string;
	action: string;
	target?: string;
	note?: string;
	by?: { discord?: string; github?: string };
}

export function getGameHistory(gameId: string): HistoryEntry[] {
	const historyPath = path.join(DATA_DIR, 'config', 'history', `${gameId}.yml`);
	try {
		if (fs.existsSync(historyPath)) {
			const raw = fs.readFileSync(historyPath, 'utf-8');
			const parsed = yaml.load(raw);
			if (Array.isArray(parsed)) {
				return (parsed as HistoryEntry[]).sort((a, b) =>
					(b.date || '').localeCompare(a.date || '')
				);
			}
		}
	} catch {
		// No history file or parse error
	}
	return [];
}
