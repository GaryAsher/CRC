import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
	if (!locals.session?.user?.id) {
		throw redirect(302, `/sign-in?redirect=/profile/submissions`);
	}

	const userId = locals.session.user.id;

	const { data: game, error: gameErr } = await locals.supabase
		.from('pending_games')
		.select('*')
		.eq('id', params.id)
		.single();

	if (gameErr || !game) {
		throw error(404, 'Submission not found');
	}

	if (game.submitted_by !== userId) {
		throw error(403, 'You can only edit your own submissions');
	}

	return { game };
};
