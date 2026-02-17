import { getRunners, getRunsForRunner } from '$lib/server/data';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const runners = getRunners();

	const runnersWithCounts = runners.map((r) => ({
		...r,
		runCount: getRunsForRunner(r.runner_id).length
	}));

	return { runners: runnersWithCounts };
};
