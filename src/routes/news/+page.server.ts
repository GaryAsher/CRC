import { getPosts } from '$lib/server/data';
import type { PageServerLoad } from './$types';

export const prerender = true;

export const load: PageServerLoad = async () => {
	return { posts: getPosts() };
};
