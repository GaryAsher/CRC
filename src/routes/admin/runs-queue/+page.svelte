<script lang="ts">
	import { onMount } from 'svelte';
	import { session, isLoading } from '$stores/auth';
	import { goto } from '$app/navigation';
	import { checkAdminRole } from '$lib/admin';

	let checking = $state(true);
	let authorized = $state(false);

	onMount(async () => {
		const unsub = isLoading.subscribe(async (l) => {
			if (!l) {
				let sess: any; session.subscribe(s => sess = s)();
				if (!sess) { goto('/sign-in?redirect=/admin/runs-queue'); return; }
				const role = await checkAdminRole();
				authorized = !!(role?.admin || role?.verifier);
				checking = false;
			}
		});
		return unsub;
	});
</script>

<svelte:head><title>✅ Runs in Queue | Admin | CRC</title></svelte:head>

<div class="page-width">
	<p class="back"><a href="/admin">← Dashboard</a></p>

	{#if checking || $isLoading}
		<div class="center"><div class="spinner"></div><p class="muted">Checking access...</p></div>
	{:else if !authorized}
		<div class="center"><h2>🔒 Access Denied</h2><a href="/" class="btn">Go Home</a></div>
	{:else}
		<h1>✅ Runs in Queue</h1>
		<p class="muted mb-3">Submitted runs awaiting verification, grouped by game.</p>

		<div class="card">
			<div class="wip">
				<span class="wip__icon">🚧</span>
				<div class="wip__content">
					<h2>Verification System — In Progress</h2>
					<p class="muted">A dedicated run verification workflow is being built. This page will show runs awaiting verification, sorted by game, with tools to approve, reject, and leave feedback.</p>
					<p class="muted mt-2">In the meantime, you can review pending runs from the existing admin panel:</p>
					<a href="/admin/runs" class="btn btn--primary mt-3">Go to Pending Runs →</a>
				</div>
			</div>
		</div>

		<div class="card mt-3">
			<h3 class="mb-2">What's Coming</h3>
			<div class="roadmap">
				<div class="roadmap__item"><span class="roadmap__status roadmap__status--planned">Planned</span><span>Per-game verification queues with badge counts</span></div>
				<div class="roadmap__item"><span class="roadmap__status roadmap__status--planned">Planned</span><span>Verifier assignment and game-specific permissions</span></div>
				<div class="roadmap__item"><span class="roadmap__status roadmap__status--planned">Planned</span><span>Inline video review with timestamps</span></div>
				<div class="roadmap__item"><span class="roadmap__status roadmap__status--planned">Planned</span><span>Bulk approve/reject actions</span></div>
				<div class="roadmap__item"><span class="roadmap__status roadmap__status--done">Done</span><span>Basic approve/reject from admin dashboard</span></div>
			</div>
		</div>
	{/if}
</div>

<style>
	.back { margin: 1rem 0 0.5rem; } .back a { color: var(--muted); text-decoration: none; } .back a:hover { color: var(--fg); }
	h1 { margin: 0 0 0.25rem; } .mb-2 { margin-bottom: 1rem; } .mb-3 { margin-bottom: 1.25rem; } .mt-2 { margin-top: 0.75rem; } .mt-3 { margin-top: 1.5rem; }
	.center { text-align: center; padding: 4rem 0; }
	.spinner { width: 36px; height: 36px; border: 3px solid var(--border); border-top-color: var(--accent); border-radius: 50%; margin: 0 auto 1rem; animation: spin 0.8s linear infinite; }
	@keyframes spin { to { transform: rotate(360deg); } }
	.btn { display: inline-flex; align-items: center; padding: 0.5rem 1rem; border: 1px solid var(--border); border-radius: 8px; background: none; color: var(--fg); cursor: pointer; font-size: 0.9rem; text-decoration: none; }
	.btn--primary { background: var(--accent); color: white; border-color: var(--accent); }
	.wip { display: flex; gap: 1.5rem; align-items: flex-start; padding: 1rem; }
	.wip__icon { font-size: 2.5rem; flex-shrink: 0; }
	.wip__content h2 { margin: 0 0 0.5rem; }
	.roadmap { display: flex; flex-direction: column; gap: 0.5rem; }
	.roadmap__item { display: flex; align-items: center; gap: 0.75rem; font-size: 0.9rem; }
	.roadmap__status { padding: 0.15rem 0.5rem; border-radius: 6px; font-size: 0.75rem; font-weight: 600; min-width: 65px; text-align: center; }
	.roadmap__status--planned { background: rgba(99, 102, 241, 0.15); color: #818cf8; }
	.roadmap__status--done { background: rgba(16, 185, 129, 0.15); color: #10b981; }
	@media (max-width: 640px) { .wip { flex-direction: column; } }
</style>
