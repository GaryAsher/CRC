import yaml from 'js-yaml';
import fs from 'node:fs';
import path from 'node:path';
import type { PageServerLoad } from './$types';

const DATA_DIR = path.resolve('src/data');

export const load: PageServerLoad = async () => {
	// Load genres
	const genresRaw = fs.readFileSync(path.join(DATA_DIR, 'config', 'genres.yml'), 'utf-8');
	const genresData = yaml.load(genresRaw) as Record<string, { label: string }>;
	const genres = Object.entries(genresData)
		.filter(([, v]) => v && typeof v === 'object' && v.label)
		.map(([slug, data]) => ({ slug, label: data.label }))
		.sort((a, b) => a.label.localeCompare(b.label));

	// Load platforms (just the labels, not the full config)
	const platformsRaw = fs.readFileSync(path.join(DATA_DIR, 'config', 'platforms.yml'), 'utf-8');
	const platformsData = yaml.load(platformsRaw) as Record<string, { label: string }>;
	const platforms = Object.entries(platformsData)
		.filter(([, v]) => v && typeof v === 'object' && v.label)
		.map(([slug, data]) => ({ slug, label: data.label }))
		.sort((a, b) => a.label.localeCompare(b.label));

	return { genres, platforms };
};
