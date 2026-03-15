import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
	const gameId = params.game_id;

	// Fetch committee members with display names
	const { data: members } = await locals.supabase
		.from('rules_committee_members')
		.select('id, game_id, user_id, role, joined_at')
		.eq('game_id', gameId)
		.order('joined_at');

	const memberUserIds = (members || []).map((m: any) => m.user_id);
	let memberProfiles: Record<string, { display_name: string; runner_id: string; avatar_url: string }> = {};

	if (memberUserIds.length > 0) {
		const { data: profiles } = await locals.supabase
			.from('profiles')
			.select('user_id, display_name, runner_id, avatar_url')
			.in('user_id', memberUserIds);
		for (const p of profiles || []) {
			memberProfiles[p.user_id] = {
				display_name: p.display_name,
				runner_id: p.runner_id,
				avatar_url: p.avatar_url
			};
		}
	}

	const enrichedMembers = (members || []).map((m: any) => ({
		...m,
		...(memberProfiles[m.user_id] || { display_name: 'Unknown', runner_id: null, avatar_url: null })
	}));

	// Fetch proposals
	const { data: proposals } = await locals.supabase
		.from('rule_proposals')
		.select('*')
		.eq('game_id', gameId)
		.order('created_at', { ascending: false })
		.limit(100);

	// Fetch display names for proposal authors
	const proposalUserIds = [...new Set((proposals || []).map((p: any) => p.user_id))];
	let proposalProfiles: Record<string, { display_name: string; runner_id: string }> = {};

	if (proposalUserIds.length > 0) {
		const { data: profiles } = await locals.supabase
			.from('profiles')
			.select('user_id, display_name, runner_id')
			.in('user_id', proposalUserIds);
		for (const p of profiles || []) {
			proposalProfiles[p.user_id] = { display_name: p.display_name, runner_id: p.runner_id };
		}
	}

	const enrichedProposals = (proposals || []).map((p: any) => ({
		...p,
		...(proposalProfiles[p.user_id] || { display_name: 'Unknown', runner_id: null })
	}));

	// Fetch current user's votes (if logged in)
	let userVotes: Record<string, string> = {};
	if (locals.session?.user?.id && proposals?.length) {
		const { data: votes } = await locals.supabase
			.from('rule_proposal_votes')
			.select('proposal_id, vote')
			.eq('user_id', locals.session.user.id)
			.in('proposal_id', proposals.map((p: any) => p.id));
		for (const v of votes || []) {
			userVotes[v.proposal_id] = v.vote;
		}
	}

	return {
		members: enrichedMembers,
		proposals: enrichedProposals,
		userVotes
	};
};
