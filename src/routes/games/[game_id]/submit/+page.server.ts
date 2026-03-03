import { getPlatforms } from '$lib/server/data';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const raw = getPlatforms();
	const platforms = Object.entries(raw).map(([id, p]) => ({ id, label: p.label }));
	platforms.sort((a, b) => a.label.localeCompare(b.label));

	// Load runner profile for auto-fill
	let runnerProfile: { runner_id: string; display_name: string; avatar_url: string | null; pronouns: string | null; location: string | null; socials: any | null } | null = null;
	if (locals.session?.user?.id) {
		const { data: profile } = await locals.supabase
			.from('profiles')
			.select('runner_id, display_name, avatar_url, pronouns, location, socials')
			.eq('user_id', locals.session.user.id)
			.eq('status', 'approved')
			.maybeSingle();
		if (profile?.runner_id) {
			runnerProfile = {
				runner_id: profile.runner_id,
				display_name: profile.display_name || profile.runner_id,
				avatar_url: profile.avatar_url || null,
				pronouns: profile.pronouns || null,
				location: profile.location || null,
				socials: profile.socials || null
			};
		}
	}

	return { platforms, runnerProfile };
};
