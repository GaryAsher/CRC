<script lang="ts">
	import { onMount } from 'svelte';
	import { session, user, isLoading } from '$stores/auth';
	import { goto } from '$app/navigation';
	import { checkAdminRole, fetchPending, adminAction } from '$lib/admin';

	type Tab = 'runs' | 'profiles' | 'games';

	let activeTab = $state<Tab>('runs');
	let role = $state<{ admin: boolean; verifier: boolean; runnerId: string | null } | null>(null);
	let checking = $state(true);
	let pendingRuns = $state<any[]>([]);
	let pendingProfiles = $state<any[]>([]);
	let pendingGames = $state<any[]>([]);
	let loadingData = $state(false);
	let actionMessage = $state<{ type: 'success' | 'error'; text: string } | null>(null);
	let processingId = $state<number | null>(null);

	onMount(() => {
		// Wait for auth to load
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
		if (result.ok) {
			pendingRuns = pendingRuns.filter(r => r.id !== id);
		}
		processingId = null;
	}

	async function rejectRun(id: number) {
		if (!confirm('Reject this run? This cannot be undone.')) return;
		processingId = id;
		actionMessage = null;
		const result = await adminAction('/approve', { run_id: id, action: 'reject' });
		actionMessage = { type: result.ok ? 'success' : 'error', text: result.message };
		if (result.ok) {
			pendingRuns = pendingRuns.filter(r => r.id !== id);
		}
		processingId = null;
	}

	async function approveProfile(id: number) {
		processingId = id;
		actionMessage = null;
		const result = await adminAction('/approve-profile', { profile_id: id });
		actionMessage = { type: result.ok ? 'success' : 'error', text: result.message };
		if (result.ok) {
			pendingProfiles = pendingProfiles.filter(p => p.id !== id);
		}
		processingId = null;
	}

	async function approveGame(id: number) {
		processingId = id;
		actionMessage = null;
		const result = await adminAction('/approve-game', { game_id: id });
		actionMessage = { type: result.ok ? 'success' : 'error', text: result.message };
		if (result.ok) {
			pendingGames = pendingGames.filter(g => g.id !== id);
		}
		processingId = null;
	}

	function formatDate(d: string) {
		return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
	}

	let totalPending = $derived(pendingRuns.length + pendingProfiles.length + pendingGames.length);
</script>

<svelte:head><title>Admin Dashboard | Challenge Run Community</title></svelte:head>

<div class="page-width">
	{#if checking || $isLoading}
		<div class="admin-loading">
			<div class="spinner"></div>
			<p>Checking permissions...</p>
		</div>
	{:else if !role?.admin && !role?.verifier}
		<div class="admin-denied">
			<h1>Access Denied</h1>
			<p>You don't have admin or verifier permissions.</p>
			<a href="/" class="btn btn--outline">Go Home</a>
		</div>
	{:else}
		<div class="admin-page">
			<div class="admin-header">
				<h1>Admin Dashboard</h1>
				<div class="admin-stats">
					<span class="stat" class:stat--active={totalPending > 0}>
						{totalPending} pending
					</span>
					<span class="stat stat--role">
						{role.admin ? '🛡️ Admin' : '✅ Verifier'}
					</span>
				</div>
			</div>

			{#if actionMessage}
				<div class="alert alert--{actionMessage.type}">{actionMessage.text}</div>
			{/if}

			<!-- Tabs -->
			<div class="tabs">
				<button class="tab" class:tab--active={activeTab === 'runs'} onclick={() => activeTab = 'runs'}>
					Runs <span class="badge">{pendingRuns.length}</span>
				</button>
				<button class="tab" class:tab--active={activeTab === 'profiles'} onclick={() => activeTab = 'profiles'}>
					Profiles <span class="badge">{pendingProfiles.length}</span>
				</button>
				<button class="tab" class:tab--active={activeTab === 'games'} onclick={() => activeTab = 'games'}>
					Games <span class="badge">{pendingGames.length}</span>
				</button>
				<button class="tab tab--refresh" onclick={loadPendingData} disabled={loadingData}>
					{loadingData ? '⏳' : '🔄'} Refresh
				</button>
			</div>

			<!-- Pending Runs -->
			{#if activeTab === 'runs'}
				<div class="panel">
					{#if pendingRuns.length === 0}
						<p class="empty">No pending runs. All caught up! 🎉</p>
					{:else}
						{#each pendingRuns as run}
							<div class="item-card">
								<div class="item-card__header">
									<strong>{run.game_id}</strong> — {run.category_slug}
									<span class="item-card__date">{formatDate(run.submitted_at)}</span>
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
									<button
										class="btn btn--approve"
										onclick={() => approveRun(run.id)}
										disabled={processingId === run.id}
									>
										{processingId === run.id ? '...' : '✅ Approve'}
									</button>
									<button
										class="btn btn--reject"
										onclick={() => rejectRun(run.id)}
										disabled={processingId === run.id}
									>
										❌ Reject
									</button>
								</div>
							</div>
						{/each}
					{/if}
				</div>
			{/if}

			<!-- Pending Profiles -->
			{#if activeTab === 'profiles'}
				<div class="panel">
					{#if pendingProfiles.length === 0}
						<p class="empty">No pending profiles.</p>
					{:else}
						{#each pendingProfiles as profile}
							<div class="item-card">
								<div class="item-card__header">
									<strong>{profile.runner_id || profile.display_name || 'Unknown'}</strong>
									<span class="item-card__date">{formatDate(profile.submitted_at || profile.created_at)}</span>
								</div>
								<div class="item-card__details">
									{#if profile.email}<span>📧 {profile.email}</span>{/if}
									{#if profile.pronouns}<span>{profile.pronouns}</span>{/if}
								</div>
								<div class="item-card__actions">
									<button
										class="btn btn--approve"
										onclick={() => approveProfile(profile.id)}
										disabled={processingId === profile.id}
									>
										{processingId === profile.id ? '...' : '✅ Approve'}
									</button>
								</div>
							</div>
						{/each}
					{/if}
				</div>
			{/if}

			<!-- Pending Games -->
			{#if activeTab === 'games'}
				<div class="panel">
					{#if pendingGames.length === 0}
						<p class="empty">No pending game requests.</p>
					{:else}
						{#each pendingGames as game}
							<div class="item-card">
								<div class="item-card__header">
									<strong>{game.game_name || game.game_id}</strong>
									<span class="item-card__date">{formatDate(game.submitted_at)}</span>
								</div>
								<div class="item-card__details">
									{#if game.submitter_handle}<span>👤 {game.submitter_handle}</span>{/if}
									{#if game.game_data?.full_runs?.length}
										<span>📂 {game.game_data.full_runs.length} categories</span>
									{/if}
								</div>
								{#if game.game_data?.description}
									<p class="item-card__desc">{game.game_data.description}</p>
								{/if}
								<div class="item-card__actions">
									{#if role.admin}
										<button
											class="btn btn--approve"
											onclick={() => approveGame(game.id)}
											disabled={processingId === game.id}
										>
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
	.admin-loading, .admin-denied { text-align: center; padding: 4rem 0; }
	.spinner { width: 36px; height: 36px; border: 3px solid var(--border); border-top-color: var(--accent); border-radius: 50%; margin: 0 auto 1rem; animation: spin 0.8s linear infinite; }
	@keyframes spin { to { transform: rotate(360deg); } }
	.btn--outline { display: inline-block; padding: 0.5rem 1.25rem; border: 1px solid var(--border); border-radius: 6px; color: var(--fg); text-decoration: none; }

	.admin-page { max-width: 900px; margin: 1.5rem auto; }
	.admin-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 0.75rem; }
	.admin-header h1 { margin: 0; font-size: 1.5rem; }
	.admin-stats { display: flex; gap: 0.75rem; }
	.stat { padding: 0.3rem 0.75rem; border-radius: 20px; font-size: 0.8rem; font-weight: 600; background: var(--surface); border: 1px solid var(--border); }
	.stat--active { background: rgba(239, 68, 68, 0.1); border-color: rgba(239, 68, 68, 0.3); color: #ef4444; }
	.stat--role { background: rgba(99, 102, 241, 0.1); border-color: rgba(99, 102, 241, 0.3); color: var(--accent); }

	.tabs { display: flex; gap: 0; border-bottom: 2px solid var(--border); margin-bottom: 1.5rem; }
	.tab { padding: 0.6rem 1.25rem; background: none; border: none; border-bottom: 2px solid transparent; margin-bottom: -2px; cursor: pointer; font-size: 0.9rem; font-weight: 600; color: var(--muted); display: flex; align-items: center; gap: 0.4rem; }
	.tab:hover { color: var(--fg); }
	.tab--active { color: var(--accent); border-bottom-color: var(--accent); }
	.tab--refresh { margin-left: auto; font-size: 0.85rem; }
	.tab--refresh:disabled { opacity: 0.5; }
	.badge { background: var(--surface); border: 1px solid var(--border); padding: 0.1rem 0.5rem; border-radius: 10px; font-size: 0.75rem; }

	.panel { min-height: 200px; }
	.empty { text-align: center; padding: 3rem 0; color: var(--muted); font-size: 1rem; }

	.item-card { border: 1px solid var(--border); border-radius: 8px; padding: 1rem 1.25rem; margin-bottom: 0.75rem; background: var(--surface); }
	.item-card__header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; flex-wrap: wrap; gap: 0.5rem; }
	.item-card__date { font-size: 0.8rem; color: var(--muted); }
	.item-card__details { display: flex; gap: 1rem; flex-wrap: wrap; font-size: 0.85rem; margin-bottom: 0.5rem; }
	.item-card__video { display: block; font-size: 0.8rem; color: var(--accent); word-break: break-all; margin-bottom: 0.5rem; }
	.item-card__desc { font-size: 0.85rem; color: var(--muted); margin: 0.5rem 0; }
	.item-card__actions { display: flex; gap: 0.5rem; margin-top: 0.75rem; padding-top: 0.75rem; border-top: 1px solid var(--border); }

	.btn--approve { padding: 0.35rem 0.75rem; border-radius: 6px; border: 1px solid #22c55e; background: none; color: #22c55e; cursor: pointer; font-size: 0.85rem; font-weight: 600; }
	.btn--approve:hover { background: #22c55e; color: #fff; }
	.btn--approve:disabled { opacity: 0.4; cursor: not-allowed; }
	.btn--reject { padding: 0.35rem 0.75rem; border-radius: 6px; border: 1px solid #ef4444; background: none; color: #ef4444; cursor: pointer; font-size: 0.85rem; }
	.btn--reject:hover { background: #ef4444; color: #fff; }
	.btn--reject:disabled { opacity: 0.4; cursor: not-allowed; }

	.alert { padding: 0.75rem 1rem; border-radius: 6px; margin-bottom: 1rem; font-size: 0.9rem; }
	.alert--success { background: rgba(34, 197, 94, 0.1); border: 1px solid rgba(34, 197, 94, 0.3); color: #22c55e; }
	.alert--error { background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); color: #ef4444; }

	@media (max-width: 600px) {
		.tabs { overflow-x: auto; }
		.tab { padding: 0.5rem 0.75rem; font-size: 0.8rem; white-space: nowrap; }
	}
</style>
