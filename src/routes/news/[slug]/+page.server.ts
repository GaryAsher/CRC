import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
	const { data: post, error: dbError } = await locals.supabase
		.from('news_posts')
		.select('*')
		.eq('slug', params.slug)
		.eq('published', true)
		.maybeSingle();

	if (dbError || !post) throw error(404, 'Post not found');
	return { post };
};
