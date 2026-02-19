import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	// History feature is planned — return empty array for now.
	// Will query an audit/history table once implemented.
	return {
		history: [] as Array<{
			action: string;
			date: string;
			target?: string;
			note?: string;
			by?: { discord?: string; github?: string };
		}>
	};
};
