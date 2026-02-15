<script lang="ts">
	import { onMount } from 'svelte';
	import { session, user, isLoading } from '$stores/auth';
	import { goto } from '$app/navigation';
	import { checkAdminRole, fetchPending, adminAction } from '$lib/admin';

	type Tab = 'overview' | 'runs' | 'profiles' | 'games';

	let activeTab = $state<Tab>('overview');
	let role = $state<{ admin: boolean; verifier: boolean; runnerId: string | null } | null>(null);
	let checking = $state(true);
	let pendingRuns = $state<any[]>([]);
	let pendingProfiles = $state<any[]>([]);
	let pendingGames = $state<any[]>([]);
	let loadingData = $state(false);
	let actionMessage = $state<{ type: 'success' | 'error'; text: string } | null>(null);
	let processingId = $state<number | null>(null);

	onMount(async () => {
		const unsub = isLoading.subscribe(async (loading) => {
			if (!loading) {
				let sess: any;
				session.subscribe(s => sess = s)();
				if (!sess) {
					goto('/sign-in?redirect=/admin');
					return;
				}
				role = await checkAdminRole();
				checking = false;
				if (role?.admin || role?.verifier) {
					await loadPendingData();
				}
			}
		});
		return unsub;
	});

	async function loadPendingData() {
		loadingData = true;
		try {
			const [runs, profiles, games] = await Promise.all([
				fetchPending('pending_runs'),
				fetchPending('pending_profiles'),
				fetchPending('pending_games')
			]);
			pendingRuns = runs;
			pendingProfiles = profiles;
			pendingGames = games;
		} catch (err) {
			console.error('Failed to load pending data:', err);
		} finally {
			loadingData = false;
		}
	}

	async function approveRun(id: number) {
		processingId = id;
		actionMessage = null;
		const result = await adminAction('/approve', { run_id: id });
		actionMessage = { type: result.ok ? 'success' : 'error', text: result.message };
		if (result.ok) pendingRuns = pendingRuns.filter(r => r.id !== id);
		processingId = null;
	}

	async function rejectRun(id: number) {
		if (!confirm('Reject this run? This cannot be undone.')) return;
		processingId = id;
		actionMessage = null;
		const result = await adminAction('/approve', { run_id: id, action: 'reject' });
		actionMessage = { type: result.ok ? 'success' : 'error', text: result.message };
		if (result.ok) pendingRuns = pendingRuns.filter(r => r.id !== id);
		processingId = null;
	}

	async function approveProfile(id: number) {
		processingId = id;
		actionMessage = null;
		const result = await adminAction('/approve-profile', { profile_id: id });
		actionMessage = { type: result.ok ? 'success' : 'error', text: result.message };
		if (result.ok) pendingProfiles = pendingProfiles.filter(p => p.id !== id);
		processingId = null;
	}

	async function approveGame(id: number) {
		processingId = id;
		actionMessage = null;
		const result = await adminAction('/approve-game', { game_id: id });
		actionMessage = { type: result.ok ? 'success' : 'error', text: result.message };
		if (result.ok) pendingGames = pendingGames.filter(g => g.id !== id);
		processingId = null;
	}

	function fmtDate(d: string) {
		return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
	}

	let totalPending = $derived(pendingRuns.length + pendingProfiles.length + pendingGames.length);

	// Nav sections
	const navSections = [
		{ icon: '🏃', title: 'Pending Runs', desc: 'Review, approve, or reject submitted runs.', tab: 'runs' as Tab, count: () => pendingRuns.length },
		{ icon: '👥', title: 'Pending Profiles', desc: 'Review runner profile applications.', tab: 'profiles' as Tab, count: () => pendingProfiles.length },
		{ icon: '🎮', title: 'Pending Games', desc: 'Review new game submissions.', tab: 'games' as Tab, count: () => pendingGames.length },
		{ icon: '📝', title: 'Game Updates', desc: 'Review user-submitted corrections.', href: '/admin/game-updates' },
		{ icon: '💰', title: 'Financials', desc: 'Track site income and expenses.', href: '/admin/financials', adminOnly: true },
		{ icon: '💚', title: 'Site Health', desc: 'Performance, storage, and system status.', href: '/admin/health', adminOnly: true },
		{ icon: '👤', title: 'Users', desc: 'Manage user accounts and roles.', href: '/admin/users', adminOnly: true },
		{ icon: '🔧', title: 'Debug Tools', desc: 'Role simulation, diagnostics.', href: '/admin/debug', adminOnly: true },
	];

	const visibleSections = $derived(
		navSections.filter(s => !s.adminOnly || role?.admin)
	);
</script>

<svelte:head><title>Admin Dashboard | Challenge Run Community</title></svelte:head>

<div class="page-width">
	{#if checking || $isLoading}
		<div class="center-state">
			<div class="spinner"></div>
			<p class="muted">Checking permissions...</p>
		</div>
	{:else if !role?.admin && !role?.verifier}
		<div class="center-state">
			<h1>🔒 Access Denied</h1>
			<p class="muted">You need verifier or admin privileges to access the dashboard.</p>
			<a href="/" class="btn btn--outline">Go Home</a>
		</div>
	{:else}
		<div class="admin-page">
			<!-- Header -->
			<div class="admin-header">
				<div>
					<h1>Dashboard</h1>
					<p class="muted">{role.admin ? '🛡️ Admin' : '✅ Verifier'}</p>
				</div>
				<div class="admin-header__right">
					{#if totalPending > 0}
						<span class="badge badge--alert">{totalPending} pending</span>
					{/if}
					<button class="btn btn--outline btn--sm" onclick={loadPendingData} disabled={loadingData}>
						{loadingData ? '⏳' : '🔄'} Refresh
					</button>
				</div>
			</div>

			{#if actionMessage}
				<div class="alert alert--{actionMessage.type}">{actionMessage.text}</div>
			{/if}

			<!-- Stats Row -->
			<div class="dash-stats">
				<div class="dash-stat" class:dash-stat--alert={pendingRuns.length > 0}>
					<span class="dash-stat__value">{pendingRuns.length}</span>
					<span class="dash-stat__label">Pending Runs</span>
				</div>
				<div class="dash-stat" class:dash-stat--alert={pendingProfiles.length > 0}>
					<span class="dash-stat__value">{pendingProfiles.length}</span>
					<span class="dash-stat__label">Pending Profiles</span>
				</div>
				<div class="dash-stat" class:dash-stat--alert={pendingGames.length > 0}>
					<span class="dash-stat__value">{pendingGames.length}</span>
					<span class="dash-stat__label">Pending Games</span>
				</div>
			</div>

			<!-- Tabs -->
			<div class="tabs">
				<button class="tab" class:tab--active={activeTab === 'overview'} onclick={() => activeTab = 'overview'}>
					Overview
				</button>
				<button class="tab" class:tab--active={activeTab === 'runs'} onclick={() => activeTab = 'runs'}>
					Runs <span class="tab-badge">{pendingRuns.length}</span>
				</button>
				<button class="tab" class:tab--active={activeTab === 'profiles'} onclick={() => activeTab = 'profiles'}>
					Profiles <span class="tab-badge">{pendingProfiles.length}</span>
				</button>
				<button class="tab" class:tab--active={activeTab === 'games'} onclick={() => activeTab = 'games'}>
					Games <span class="tab-badge">{pendingGames.length}</span>
				</button>
			</div>

			<!-- ═══ Overview Tab ══════════════════════════════ -->
			{#if activeTab === 'overview'}
				<div class="dash-nav">
					{#each visibleSections as sec}
						{#if sec.tab}
							<button class="dash-nav-card" onclick={() => activeTab = sec.tab}>
								<span class="dash-nav-card__icon">{sec.icon}</span>
								<span class="dash-nav-card__title">
									{sec.title}
									{#if sec.count && sec.count() > 0}
										<span class="dash-nav-card__badge">{sec.count()}</span>
									{/if}
								</span>
								<p class="dash-nav-card__desc">{sec.desc}</p>
							</button>
						{:else}
							<a class="dash-nav-card" href={sec.href}>
								<span class="dash-nav-card__icon">{sec.icon}</span>
								<span class="dash-nav-card__title">{sec.title}</span>
								<p class="dash-nav-card__desc">{sec.desc}</p>
							</a>
						{/if}
					{/each}
				</div>
			{/if}

			<!-- ═══ Pending Runs ══════════════════════════════ -->
			{#if activeTab === 'runs'}
				<div class="panel">
					{#if pendingRuns.length === 0}
						<p class="empty">No pending runs. All caught up! 🎉</p>
					{:else}
						{#each pendingRuns as run}
							<div class="item-card">
								<div class="item-card__header">
									<strong>{run.game_id}</strong> — {run.category_slug}
									<span class="item-card__date">{fmtDate(run.submitted_at)}</span>
								</div>
								<div class="item-card__details">
									<span>🏃 {run.runner_id}</span>
									{#if run.character}<span>🎮 {run.character}</span>{/if}
									{#if run.run_time}<span>⏱️ {run.run_time}</span>{/if}
								</div>
								{#if run.video_url}
									<a href={run.video_url} target="_blank" rel="noopener" class="item-card__video">
										🎬 {run.video_url}
									</a>
								{/if}
								<div class="item-card__actions">
									<button class="btn btn--approve" onclick={() => approveRun(run.id)} disabled={processingId === run.id}>
										{processingId === run.id ? '...' : '✅ Approve'}
									</button>
									<button class="btn btn--reject" onclick={() => rejectRun(run.id)} disabled={processingId === run.id}>
										❌ Reject
									</button>
								</div>
							</div>
						{/each}
					{/if}
				</div>
			{/if}

			<!-- ═══ Pending Profiles ══════════════════════════ -->
			{#if activeTab === 'profiles'}
				<div class="panel">
					{#if pendingProfiles.length === 0}
						<p class="empty">No pending profiles.</p>
					{:else}
						{#each pendingProfiles as profile}
							<div class="item-card">
								<div class="item-card__header">
									<strong>{profile.runner_id || profile.display_name || 'Unknown'}</strong>
									<span class="item-card__date">{fmtDate(profile.submitted_at || profile.created_at)}</span>
								</div>
								<div class="item-card__details">
									{#if profile.email}<span>📧 {profile.email}</span>{/if}
									{#if profile.pronouns}<span>{profile.pronouns}</span>{/if}
								</div>
								<div class="item-card__actions">
									<button class="btn btn--approve" onclick={() => approveProfile(profile.id)} disabled={processingId === profile.id}>
										{processingId === profile.id ? '...' : '✅ Approve'}
									</button>
								</div>
							</div>
						{/each}
					{/if}
				</div>
			{/if}

			<!-- ═══ Pending Games ═════════════════════════════ -->
			{#if activeTab === 'games'}
				<div class="panel">
					{#if pendingGames.length === 0}
						<p class="empty">No pending game requests.</p>
					{:else}
						{#each pendingGames as game}
							<div class="item-card">
								<div class="item-card__header">
									<strong>{game.game_name || game.game_id}</strong>
									<span class="item-card__date">{fmtDate(game.submitted_at)}</span>
								</div>
								<div class="item-card__details">
									{#if game.submitter_handle}<span>👤 {game.submitter_handle}</span>{/if}
									{#if game.game_data?.full_runs?.length}<span>📂 {game.game_data.full_runs.length} categories</span>{/if}
								</div>
								{#if game.game_data?.description}
									<p class="item-card__desc">{game.game_data.description}</p>
								{/if}
								<div class="item-card__actions">
									{#if role?.admin}
										<button class="btn btn--approve" onclick={() => approveGame(game.id)} disabled={processingId === game.id}>
											{processingId === game.id ? '...' : '✅ Approve'}
										</button>
									{:else}
										<span class="muted">Admin required to approve games</span>
									{/if}
								</div>
							</div>
						{/each}
					{/if}
				</div>
			{/if}
		</div>
	{/if}
</div>

<style>
	/* ── States ────────────────────────────────────────────── */
	.center-state { text-align: center; padding: 4rem 0; }
	.center-state h1 { margin-bottom: 0.5rem; }
	.spinner { width: 36px; height: 36px; border: 3px solid var(--border); border-top-color: var(--accent); border-radius: 50%; margin: 0 auto 1rem; animation: spin 0.8s linear infinite; }
	@keyframes spin { to { transform: rotate(360deg); } }

	/* ── Layout ────────────────────────────────────────────── */
	.admin-page { max-width: 960px; margin: 1.5rem auto; }
	.admin-header {
		display: flex; justify-content: space-between; align-items: flex-start;
		margin-bottom: 1.5rem; flex-wrap: wrap; gap: 0.75rem;
	}
	.admin-header h1 { margin: 0; font-size: 1.5rem; }
	.admin-header p { margin: 0.15rem 0 0; }
	.admin-header__right { display: flex; align-items: center; gap: 0.5rem; }

	.badge { padding: 0.25rem 0.65rem; border-radius: 20px; font-size: 0.8rem; font-weight: 600; background: var(--surface); border: 1px solid var(--border); }
	.badge--alert { background: rgba(239, 68, 68, 0.1); border-color: rgba(239, 68, 68, 0.3); color: #ef4444; }
	.btn--outline { padding: 0.35rem 0.75rem; border: 1px solid var(--border); border-radius: 6px; background: none; color: var(--fg); cursor: pointer; font-family: inherit; font-size: 0.85rem; }
	.btn--outline:hover { border-color: var(--accent); color: var(--accent); }
	.btn--outline:disabled { opacity: 0.4; cursor: not-allowed; }
	.btn--sm { font-size: 0.8rem; padding: 0.3rem 0.6rem; }

	/* ── Stats Row ────────────────────────────────────────── */
	.dash-stats {
		display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
		gap: 0.75rem; margin-bottom: 1.5rem;
	}
	.dash-stat {
		background: var(--surface); border: 1px solid var(--border);
		border-radius: 10px; padding: 1rem; text-align: center;
	}
	.dash-stat__value { display: block; font-size: 1.75rem; font-weight: 700; color: var(--accent); }
	.dash-stat__label { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.03em; color: var(--muted); }
	.dash-stat--alert .dash-stat__value { color: #f59e0b; }

	/* ── Tabs ─────────────────────────────────────────────── */
	.tabs { display: flex; gap: 0; border-bottom: 2px solid var(--border); margin-bottom: 1.5rem; }
	.tab {
		padding: 0.6rem 1.15rem; background: none; border: none;
		border-bottom: 2px solid transparent; margin-bottom: -2px;
		cursor: pointer; font-size: 0.9rem; font-weight: 600;
		color: var(--muted); display: flex; align-items: center; gap: 0.4rem;
		font-family: inherit;
	}
	.tab:hover { color: var(--fg); }
	.tab--active { color: var(--accent); border-bottom-color: var(--accent); }
	.tab-badge {
		background: var(--surface); border: 1px solid var(--border);
		padding: 0.1rem 0.45rem; border-radius: 10px; font-size: 0.7rem;
	}

	/* ── Nav Grid ─────────────────────────────────────────── */
	.dash-nav {
		display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
		gap: 0.75rem;
	}
	.dash-nav-card {
		display: flex; flex-direction: column; gap: 0.35rem;
		background: var(--surface); border: 1px solid var(--border);
		border-radius: 10px; padding: 1.25rem; text-decoration: none;
		color: var(--fg); cursor: pointer; font-family: inherit; text-align: left;
		transition: border-color 0.15s, transform 0.1s;
	}
	.dash-nav-card:hover { border-color: var(--accent); transform: translateY(-2px); }
	.dash-nav-card__icon { font-size: 1.35rem; }
	.dash-nav-card__title { font-weight: 600; font-size: 0.95rem; }
	.dash-nav-card__desc { font-size: 0.8rem; color: var(--muted); margin: 0; }
	.dash-nav-card__badge {
		display: inline-block; background: #f59e0b; color: #000;
		font-size: 0.7rem; font-weight: 700; padding: 1px 7px; border-radius: 10px;
		margin-left: 0.35rem;
	}

	/* ── Panels ────────────────────────────────────────────── */
	.panel { min-height: 200px; }
	.empty { text-align: center; padding: 3rem 0; color: var(--muted); }
	.item-card {
		border: 1px solid var(--border); border-radius: 8px;
		padding: 1rem 1.15rem; margin-bottom: 0.75rem; background: var(--surface);
	}
	.item-card__header {
		display: flex; justify-content: space-between; align-items: center;
		margin-bottom: 0.5rem; flex-wrap: wrap; gap: 0.5rem;
	}
	.item-card__date { font-size: 0.8rem; color: var(--muted); }
	.item-card__details { display: flex; gap: 1rem; flex-wrap: wrap; font-size: 0.85rem; margin-bottom: 0.5rem; }
	.item-card__video { display: block; font-size: 0.8rem; color: var(--accent); word-break: break-all; margin-bottom: 0.5rem; }
	.item-card__desc { font-size: 0.85rem; color: var(--muted); margin: 0.5rem 0; }
	.item-card__actions {
		display: flex; gap: 0.5rem; margin-top: 0.75rem;
		padding-top: 0.75rem; border-top: 1px solid var(--border);
	}
	.btn--approve {
		padding: 0.35rem 0.75rem; border-radius: 6px; border: 1px solid #22c55e;
		background: none; color: #22c55e; cursor: pointer; font-size: 0.85rem; font-weight: 600;
		font-family: inherit;
	}
	.btn--approve:hover { background: #22c55e; color: #fff; }
	.btn--approve:disabled { opacity: 0.4; cursor: not-allowed; }
	.btn--reject {
		padding: 0.35rem 0.75rem; border-radius: 6px; border: 1px solid #ef4444;
		background: none; color: #ef4444; cursor: pointer; font-size: 0.85rem;
		font-family: inherit;
	}
	.btn--reject:hover { background: #ef4444; color: #fff; }
	.btn--reject:disabled { opacity: 0.4; cursor: not-allowed; }

	.alert { padding: 0.75rem 1rem; border-radius: 6px; margin-bottom: 1rem; font-size: 0.9rem; }
	.alert--success { background: rgba(34, 197, 94, 0.1); border: 1px solid rgba(34, 197, 94, 0.3); color: #22c55e; }
	.alert--error { background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); color: #ef4444; }

	@media (max-width: 600px) {
		.tabs { overflow-x: auto; }
		.tab { padding: 0.5rem 0.75rem; font-size: 0.8rem; white-space: nowrap; }
		.dash-nav { grid-template-columns: 1fr; }
	}
</style>
