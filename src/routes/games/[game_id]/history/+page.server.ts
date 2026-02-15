import { getGames } from '$lib/server/data';
import type { PageServerLoad, EntryGenerator } from './$types';
import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

export const entries: EntryGenerator = () => {
	return getGames()
		.filter((g) => !g.game_id.startsWith('_'))
		.map((g) => ({ game_id: g.game_id }));
};

interface HistoryEntry {
	date: string;
	action: string;
	target?: string;
	note?: string;
	by?: { discord?: string; github?: string };
}

export const load: PageServerLoad = async ({ params, parent }) => {
	const { game } = await parent();

	const historyPath = path.join(
		process.cwd(),
		'src',
		'data',
		'config',
		'history',
		`${params.game_id}.yml`
	);

	let history: HistoryEntry[] = [];
	try {
		if (fs.existsSync(historyPath)) {
			const raw = fs.readFileSync(historyPath, 'utf-8');
			const parsed = yaml.load(raw);
			if (Array.isArray(parsed)) {
				history = parsed as HistoryEntry[];
			}
		}
	} catch {
		// No history file or parse error — empty list
	}

	// Sort newest first
	history.sort((a, b) => (b.date || '').localeCompare(a.date || ''));

	return { history };
};
