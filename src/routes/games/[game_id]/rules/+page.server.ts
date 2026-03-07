import { getChallenges } from '$lib/server/data';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const globalChallenges = getChallenges();
	return { globalChallenges };
};
