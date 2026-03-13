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

	// Fetch previous post (older)
	const { data: prevPost } = await locals.supabase
		.from('news_posts')
		.select('slug, title')
		.eq('published', true)
		.lt('date', post.date)
		.order('date', { ascending: false })
		.limit(1)
		.maybeSingle();

	// Fetch next post (newer)
	const { data: nextPost } = await locals.supabase
		.from('news_posts')
		.select('slug, title')
		.eq('published', true)
		.gt('date', post.date)
		.order('date', { ascending: true })
		.limit(1)
		.maybeSingle();

	return { post, prevPost, nextPost };
};
