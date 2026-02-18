import { getRunners, getRunsForRunner } from '$lib/server/supabase';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const runners = await getRunners(locals.supabase);

	const runnersWithCounts = await Promise.all(
		runners.map(async (r) => ({
			...r,
			runCount: (await getRunsForRunner(locals.supabase, r.runner_id)).length
		}))
	);

	return { runners: runnersWithCounts };
};
