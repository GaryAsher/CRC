import { getTeams } from '$lib/server/supabase';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	return { teams: await getTeams(locals.supabase) };
};
