import type { PageServerLoad } from './$types';

export const prerender = false;

export const load: PageServerLoad = async ({ locals }) => {
	// Fetch all suggestions with user display names
	const { data: suggestions } = await locals.supabase
		.from('rule_suggestions')
		.select('*')
		.order('created_at', { ascending: false })
		.limit(200);

	// Fetch display names for suggestion authors
	const userIds = [...new Set((suggestions || []).map((s: any) => s.user_id).filter(Boolean))];
	let profileMap: Record<string, { display_name: string; runner_id: string }> = {};

	if (userIds.length > 0) {
		const { data: profiles } = await locals.supabase
			.from('profiles')
			.select('user_id, display_name, runner_id')
			.in('user_id', userIds);
		for (const p of profiles || []) {
			profileMap[p.user_id] = { display_name: p.display_name, runner_id: p.runner_id };
		}
	}

	// Enrich suggestions with display names
	const enriched = (suggestions || []).map((s: any) => ({
		...s,
		display_name: profileMap[s.user_id]?.display_name || 'Unknown',
		runner_id: profileMap[s.user_id]?.runner_id || null,
	}));

	return { suggestions: enriched };
};
