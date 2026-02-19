import { getRunners, getRunCountForRunner } from '$lib/server/supabase';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const runners = await getRunners(locals.supabase);

	const runnersWithCounts = await Promise.all(
		runners.map(async (r) => ({
			...r,
			runCount: await getRunCountForRunner(locals.supabase, r.runner_id)
		}))
	);

	return { runners: runnersWithCounts };
};
