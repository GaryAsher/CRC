import { getPlatforms } from '$lib/server/data';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const raw = getPlatforms();
	const platforms = Object.entries(raw).map(([id, p]) => ({ id, label: p.label }));
	platforms.sort((a, b) => a.label.localeCompare(b.label));
	return { platforms };
};
