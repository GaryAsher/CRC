import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const { data: posts, error } = await locals.supabase
		.from('news_posts')
		.select('id, slug, title, date, excerpt, content, author, tags, featured')
		.eq('published', true)
		.order('date', { ascending: false });

	if (error) {
		console.error('News load error:', error.message);
	}

	return { posts: posts ?? [] };
};
