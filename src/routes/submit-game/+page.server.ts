// =============================================================================
// Submit Game Page Server Load
// =============================================================================
// Loads genres and platforms for the game submission form.
// Uses the data layer (import.meta.glob) instead of node:fs for
// Cloudflare Workers compatibility.
// =============================================================================

import { getGenres, getPlatforms } from '$lib/server/data';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const genresData = getGenres() as Record<string, { label: string }>;
	const genres = Object.entries(genresData)
		.filter(([, v]) => v && typeof v === 'object' && v.label)
		.map(([slug, data]) => ({ slug, label: data.label }))
		.sort((a, b) => a.label.localeCompare(b.label));

	const platformsData = getPlatforms() as Record<string, { label: string }>;
	const platforms = Object.entries(platformsData)
		.filter(([, v]) => v && typeof v === 'object' && v.label)
		.map(([slug, data]) => ({ slug, label: data.label }))
		.sort((a, b) => a.label.localeCompare(b.label));

	return { genres, platforms };
};
