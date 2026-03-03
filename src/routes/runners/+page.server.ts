import { getRunners, getRunCountsByRunner } from '$lib/server/supabase';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const [runners, runCounts] = await Promise.all([
		getRunners(locals.supabase),
		getRunCountsByRunner(locals.supabase)
	]);

	const runnersWithCounts = runners.map((r) => ({
		...r,
		runCount: runCounts.get(r.runner_id) || 0
	}));

	return { runners: runnersWithCounts };
};
