import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const prerender = false;

export const load: PageServerLoad = async ({ locals, parent }) => {
	const { staffRole } = await parent();

	// Super admin only
	if (staffRole !== 'super_admin') {
		throw redirect(302, '/admin');
	}

	const { data: settings } = await locals.supabase
		.from('site_settings')
		.select('key, value, updated_at')
		.order('key');

	return {
		settings: settings || []
	};
};
