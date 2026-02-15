<script lang="ts">
	import { onMount } from 'svelte';
	import { session, isLoading } from '$stores/auth';
	import { goto } from '$app/navigation';
	import { checkAdminRole } from '$lib/admin';

	let checking = $state(true);
	let authorized = $state(false);

	onMount(async () => {
		const unsub = isLoading.subscribe(async (loading) => {
			if (!loading) {
				let sess: any;
				session.subscribe(s => sess = s)();
				if (!sess) { goto('/sign-in?redirect=/admin/health'); return; }
				const role = await checkAdminRole();
				authorized = !!(role?.admin || role?.verifier);
				checking = false;
			}
		});
		return unsub;
	});
</script>

<svelte:head><title>💚 Site Health | Admin | CRC</title></svelte:head>

<div class="page-width">
	<p class="back"><a href="/admin">← Dashboard</a></p>

	{#if checking || $isLoading}
		<div class="center"><div class="spinner"></div><p class="muted">Checking access...</p></div>
	{:else if !authorized}
		<div class="center"><h2>🔒 Access Denied</h2><a href="/" class="btn">Go Home</a></div>
	{:else}
		<h1>💚 Site Health</h1>
		<p class="muted mb-2">Performance metrics, storage usage, and system diagnostics.</p>
		<div class="card">
			<div class="placeholder">
				<span class="placeholder__icon">💚</span>
				<h3>Coming Soon</h3>
				<p class="muted">This section requires the Supabase backend integration and will be available in the dynamic features phase.</p>
			</div>
		</div>
	{/if}
</div>

<style>
	.back { margin: 1rem 0 0.5rem; }
	.back a { color: var(--muted); text-decoration: none; }
	.back a:hover { color: var(--fg); }
	h1 { margin: 0 0 0.25rem; }
	.mb-2 { margin-bottom: 1rem; }
	.center { text-align: center; padding: 4rem 0; }
	.spinner { width: 36px; height: 36px; border: 3px solid var(--border); border-top-color: var(--accent); border-radius: 50%; margin: 0 auto 1rem; animation: spin 0.8s linear infinite; }
	@keyframes spin { to { transform: rotate(360deg); } }
	.btn { display: inline-block; padding: 0.5rem 1rem; border: 1px solid var(--border); border-radius: 6px; color: var(--fg); text-decoration: none; }
	.placeholder { text-align: center; padding: 3rem 1rem; }
	.placeholder__icon { display: block; font-size: 3rem; margin-bottom: 0.75rem; opacity: 0.4; }
	.placeholder h3 { margin: 0 0 0.5rem; }
	.placeholder p { max-width: 400px; margin-inline: auto; }
</style>
