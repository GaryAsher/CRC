<script lang="ts">
	import { onMount } from 'svelte';
	import { session, user, isLoading } from '$stores/auth';
	import { debugRole } from '$stores/debug';
	import { goto } from '$app/navigation';
	import { checkAdminRole } from '$lib/admin';
	import { supabase } from '$lib/supabase';
	import { realRoleToDebugId, canAccessRoute } from '$lib/permissions';
	import type { DebugRoleId } from '$stores/debug';
	import { localizeHref } from '$lib/paraglide/runtime';
	import * as m from '$lib/paraglide/messages';

	let role = $state<{ admin: boolean; superAdmin: boolean; moderator: boolean; verifier: boolean; runnerId: string | null } | null>(null);
	let realRoleId = $state<DebugRoleId>('user');
	let checking = $state(true);
	let counts = $state<Record<string, number>>({});
	let countsLoading = $state(true);

	// Effective role for UI filtering
	let effectiveRole = $derived($debugRole ?? realRoleId);

	onMount(() => {
		const unsub = isLoading.subscribe(async (loading) => {
			if (!loading) {
				let sess: any;
				session.subscribe(s => sess = s)();
				if (!sess) {
					goto('/sign-in?redirect=/admin');
					return;
				}

				const fullRole = await checkAdminRole();
				role = fullRole;
				realRoleId = realRoleToDebugId(fullRole);
				checking = false;

				if (fullRole?.admin || fullRole?.verifier || fullRole?.moderator) {
					await loadCounts();
				}
			}
		});
		return unsub;
	});

	async function loadCounts() {
		countsLoading = true;
		try {
			const [profiles, games, runs, gameUpdates, reports] = await Promise.all([
				supabase.from('pending_profiles').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
				supabase.from('pending_games').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
				supabase.from('pending_runs').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
				supabase.from('game_update_requests').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
				supabase.from('user_reports').select('id', { count: 'exact', head: true }).eq('status', 'pending')
			]);
			counts = {
				pendingProfiles: profiles.count ?? 0,
				pendingGames: games.count ?? 0,
				pendingRuns: runs.count ?? 0,
				pendingUpdates: gameUpdates.count ?? 0,
				pendingReports: reports.count ?? 0
			};
		} catch (err) {
			console.error('Failed to load counts:', err);
		}
		countsLoading = false;
	}

	// Navigation sections — 2-column grid: left = game-related, right = user-related.
	// canAccessRoute() from permissions.ts handles per-role filtering.
	const NAV_SECTIONS = [
		// Super Admin
		{ key: 'health',       icon: '💚', title: m.admin_nav_health(),      desc: m.admin_nav_health_desc(),               href: '/admin/health' },
		{ key: 'financials',   icon: '💰', title: m.admin_nav_financials(),       desc: m.admin_nav_financials_desc(),                         href: '/admin/financials' },
		{ key: 'site-settings', icon: '⚙️', title: 'Site Settings',               desc: 'Default rules template and global config',           href: '/admin/site-settings' },
		// Admin (left = games, right = profiles)
		{ key: 'games',        icon: '🎮', title: m.admin_nav_games(),            desc: m.admin_nav_games_desc(),    href: '/admin/games',       countKey: 'pendingGames' },
		{ key: 'profiles',     icon: '👥', title: m.admin_nav_profiles(),         desc: m.admin_nav_profiles_desc(),  href: '/admin/profiles',    countKey: 'pendingProfiles' },
		// Moderator (left = users, right = game editor)
		{ key: 'game-editor',  icon: '🛠️', title: m.admin_nav_game_editor(),      desc: m.admin_nav_game_editor_desc(), href: '/admin/game-editor' },
		{ key: 'users',        icon: '👥', title: m.admin_nav_users(),    desc: m.admin_nav_users_desc(),                    href: '/admin/users' },
		// Verifier (left = game updates, right = runs)
		{ key: 'game-updates', icon: '📝', title: m.admin_nav_game_updates(),     desc: m.admin_nav_game_updates_desc(), href: '/admin/game-updates', countKey: 'pendingUpdates' },
		{ key: 'runs',         icon: '🏃', title: m.admin_nav_runs(),             desc: m.admin_nav_runs_desc(),            href: '/admin/runs',        countKey: 'pendingRuns' },
		{ key: 'reports',      icon: '🚩', title: m.admin_nav_reports(),          desc: m.admin_nav_reports_desc(), href: '/admin/reports',    countKey: 'pendingReports' },
		{ key: 'rule-suggestions', icon: '💬', title: 'Rule Suggestions',          desc: 'Community rule change proposals',                     href: '/admin/rule-suggestions' },
		// All staff
		{ key: 'staff-guides', icon: '📖', title: m.admin_nav_staff_guides(),     desc: m.admin_nav_staff_guides_desc(),                       href: '/admin/staff-guides' },
		{ key: 'debug',        icon: '🔧', title: m.admin_nav_debug(),      desc: m.admin_nav_debug_desc(),                    href: '/admin/debug' },
	];

	// Filter nav cards based on effective role (real or debug)
	let visibleSections = $derived(
		NAV_SECTIONS.filter(s => canAccessRoute(effectiveRole, s.href))
	);

	// Admin+ can see profile/game pending counts; lower roles only see runs + updates
	let isAdminPlus = $derived(
		effectiveRole === 'super_admin' || effectiveRole === 'admin'
	);
</script>

<svelte:head><title>{m.admin_panel()} | Challenge Run Community</title></svelte:head>

<div class="page-width">
	{#if checking || $isLoading}
		<div class="admin-loading">
			<div class="spinner"></div>
			<p class="muted">{m.admin_checking_permissions()}</p>
		</div>
	{:else if !role?.admin && !role?.verifier && !role?.moderator}
		<div class="admin-denied">
			<h1>🔒 {m.admin_access_denied()}</h1>
			<p class="muted">{m.admin_denied_message()}</p>
			<a href={localizeHref("/")} class="btn btn--outline">{m.error_go_home()}</a>
		</div>
	{:else}
		<div class="dash">
			<!-- Header -->
			<div class="dash-header">
				<div class="dash-header__info">
					<h1>{m.admin_panel()}</h1>
					<p class="muted">
						{#if effectiveRole === 'super_admin'}⭐ Super Admin
						{:else if effectiveRole === 'admin'}🛡️ Admin
						{:else if effectiveRole === 'moderator'}🔰 Moderator
						{:else if effectiveRole === 'verifier'}✅ Verifier
						{:else}👤 User{/if}
						{#if $debugRole}<span style="font-size: 0.75rem; opacity: 0.6;">(debug)</span>{/if}
					</p>
				</div>
				{#if $user}
					<div class="dash-header__user">
						{#if $user.user_metadata?.avatar_url}
							<img class="dash-header__avatar" src={$user.user_metadata.avatar_url} alt="" />
						{/if}
						<span>{$user.user_metadata?.full_name || $user.user_metadata?.name || 'Staff'}</span>
					</div>
				{/if}
			</div>

			<!-- Stats row — game-related left, user-related right -->
			<div class="dash-stats">
				{#if isAdminPlus}
					<div class="dash-stat" class:dash-stat--alert={counts.pendingGames > 0}>
						<span class="dash-stat__value">{countsLoading ? '…' : counts.pendingGames ?? 0}</span>
						<span class="dash-stat__label">{m.admin_pending_games()}</span>
					</div>
				{/if}
				<div class="dash-stat" class:dash-stat--alert={(counts.pendingUpdates ?? 0) > 0}>
					<span class="dash-stat__value">{countsLoading ? '…' : counts.pendingUpdates ?? 0}</span>
					<span class="dash-stat__label">{m.admin_pending_game_updates()}</span>
				</div>
				{#if isAdminPlus}
					<div class="dash-stat" class:dash-stat--alert={counts.pendingProfiles > 0}>
						<span class="dash-stat__value">{countsLoading ? '…' : counts.pendingProfiles ?? 0}</span>
						<span class="dash-stat__label">{m.admin_pending_profiles()}</span>
					</div>
				{/if}
				<div class="dash-stat" class:dash-stat--alert={counts.pendingRuns > 0}>
					<span class="dash-stat__value">{countsLoading ? '…' : counts.pendingRuns ?? 0}</span>
					<span class="dash-stat__label">{m.admin_pending_runs()}</span>
				</div>
			</div>

			<!-- Navigation grid -->
			<div class="dash-nav">
				{#each visibleSections as sec}
					<a class="dash-nav-card" href={sec.href}>
						<span class="dash-nav-card__icon">{sec.icon}</span>
						<span class="dash-nav-card__title">
							{sec.title}
							{#if sec.countKey && (counts[sec.countKey] ?? 0) > 0}
								<span class="dash-nav-card__badge">{counts[sec.countKey]}</span>
							{/if}
						</span>
						<p class="dash-nav-card__desc">{sec.desc}</p>
					</a>
				{/each}
			</div>
		</div>
	{/if}
</div>

<style>
	.admin-loading, .admin-denied { text-align: center; padding: 4rem 0; }
	.spinner {
		width: 36px; height: 36px;
		border: 3px solid var(--border); border-top-color: var(--accent);
		border-radius: 50%; margin: 0 auto 1rem;
		animation: spin 0.8s linear infinite;
	}
	@keyframes spin { to { transform: rotate(360deg); } }

	.dash { max-width: 960px; margin: 0 auto; }

	/* Header */
	.dash-header {
		display: flex; justify-content: space-between; align-items: flex-start;
		margin-bottom: 2rem; flex-wrap: wrap; gap: 1rem;
	}
	.dash-header h1 { margin: 0; font-size: 1.5rem; }
	.dash-header__user {
		display: flex; align-items: center; gap: 0.75rem;
		font-size: 0.9rem; color: var(--muted);
	}
	.dash-header__avatar {
		width: 36px; height: 36px; border-radius: 50%;
		object-fit: cover; background: var(--surface);
	}

	/* Stats row */
	.dash-stats {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
		gap: 1rem; margin-bottom: 2rem;
	}
	.dash-stat {
		background: var(--surface); border: 1px solid var(--border);
		border-radius: 12px; padding: 1.25rem; text-align: center;
	}
	.dash-stat--alert {
		background: rgba(239, 68, 68, 0.06);
		border-color: rgba(239, 68, 68, 0.25);
	}
	.dash-stat__value {
		display: block; font-size: 2rem; font-weight: 700;
		line-height: 1.2; color: var(--fg);
	}
	.dash-stat--alert .dash-stat__value { color: #ef4444; }
	.dash-stat__label {
		display: block; font-size: 0.8rem; font-weight: 500;
		color: var(--muted); margin-top: 0.25rem;
	}

	/* Nav grid — 2 columns */
	.dash-nav {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 1rem;
	}
	.dash-nav-card {
		display: block; padding: 1.25rem;
		background: var(--surface); border: 1px solid var(--border);
		border-radius: 12px; text-decoration: none; color: var(--fg);
		transition: border-color 0.15s, box-shadow 0.15s;
	}
	.dash-nav-card:hover {
		border-color: var(--accent);
		box-shadow: 0 2px 12px rgba(99, 102, 241, 0.1);
	}
	.dash-nav-card__icon { font-size: 1.5rem; display: block; margin-bottom: 0.5rem; }
	.dash-nav-card__title {
		font-size: 1rem; font-weight: 700; display: flex;
		align-items: center; gap: 0.5rem;
	}
	.dash-nav-card__badge {
		display: inline-flex; align-items: center; justify-content: center;
		min-width: 22px; height: 22px; padding: 0 6px;
		border-radius: 11px; font-size: 0.75rem; font-weight: 700;
		background: #ef4444; color: #fff;
	}
	.dash-nav-card__desc {
		margin: 0.35rem 0 0; font-size: 0.85rem;
		color: var(--muted); line-height: 1.4;
	}

	@media (max-width: 600px) {
		.dash-stats { grid-template-columns: repeat(2, 1fr); }
		.dash-nav { grid-template-columns: 1fr; }
	}
</style>
