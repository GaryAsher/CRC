import { getChallengesConfig, getGlossaryConfig } from '$lib/server/supabase';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const [challenges, glossary] = await Promise.all([
		getChallengesConfig(locals.supabase),
		getGlossaryConfig(locals.supabase)
	]);
	return { challenges, glossary };
};
