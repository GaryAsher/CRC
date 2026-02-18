import { getPosts } from '$lib/server/data';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export function entries() {
	return getPosts().map((p) => ({ slug: p.slug }));
}

export const load: PageServerLoad = async ({ params }) => {
	const post = getPosts().find((p) => p.slug === params.slug);
	if (!post) throw error(404, 'Post not found');
	return { post };
};
