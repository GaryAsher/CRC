/**
 * Scroll Position Memory
 *
 * Saves scroll position when navigating between game tabs (or any scoped route group).
 * Restores it when navigating back to the same group.
 *
 * Usage in +layout.svelte:
 *   import { scrollMemory } from '$lib/stores/scroll';
 *   <svelte:window use:scrollMemory />
 *
 * Or call saveScroll / restoreScroll manually in beforeNavigate / afterNavigate.
 */

const SCROLL_TTL_MS = 10 * 60 * 1000; // 10 minutes

interface ScrollEntry {
	y: number;
	ts: number;
}

/**
 * Extract the route group root from a pathname.
 * e.g. /games/hades-2/rules → /games/hades-2/
 *      /runners/gary-asher → /runners/gary-asher/
 */
function getGroupRoot(pathname: string): string | null {
	// Match /games/{id}/ group
	const gameMatch = pathname.match(/^\/games\/([^/]+)\//);
	if (gameMatch) return `/games/${gameMatch[1]}/`;

	// Match /runners/{id}/ group
	const runnerMatch = pathname.match(/^\/runners\/([^/]+)\//);
	if (runnerMatch) return `/runners/${runnerMatch[1]}/`;

	return null;
}

function storageKey(root: string): string {
	return `crc_scroll:${root}`;
}

export function saveScroll(pathname?: string): void {
	const path = pathname || (typeof window !== 'undefined' ? window.location.pathname : '');
	const root = getGroupRoot(path);
	if (!root) return;

	try {
		const entry: ScrollEntry = { y: window.scrollY || 0, ts: Date.now() };
		sessionStorage.setItem(storageKey(root), JSON.stringify(entry));
	} catch {
		// Storage disabled — non-critical
	}
}

export function restoreScroll(pathname?: string): void {
	const path = pathname || (typeof window !== 'undefined' ? window.location.pathname : '');
	const root = getGroupRoot(path);
	if (!root) return;

	try {
		const raw = sessionStorage.getItem(storageKey(root));
		if (!raw) return;

		const entry: ScrollEntry = JSON.parse(raw);
		if (typeof entry.y !== 'number') return;
		if (Date.now() - entry.ts > SCROLL_TTL_MS) return;

		// Use double rAF to ensure DOM has rendered
		requestAnimationFrame(() => {
			requestAnimationFrame(() => {
				window.scrollTo(0, entry.y);
			});
		});
	} catch {
		// Parse error — non-critical
	}
}

export function clearScroll(pathname?: string): void {
	const path = pathname || (typeof window !== 'undefined' ? window.location.pathname : '');
	const root = getGroupRoot(path);
	if (!root) return;

	try {
		sessionStorage.removeItem(storageKey(root));
	} catch {
		// Ignore
	}
}
